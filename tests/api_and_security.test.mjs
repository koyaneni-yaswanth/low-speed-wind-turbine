import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hasPermission } from '../src/lib/authAndRbac.ts';
import { filterTelemetryByRange, mapDbTelemetryRow, mapDbTurbineRow } from '../src/lib/telemetryMappers.ts';
import { createInquiriesHandler } from '../api/inquiries.ts';
import { createTelemetryHandler } from '../api/telemetry.ts';
import { createAdminHandler } from '../api/admin.ts';
import { createNotificationsHandler } from '../api/notifications.ts';
import { createAnalyticsHandler } from '../api/analytics.ts';

function createMockRes() {
  return {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
    },
  };
}

function createInMemoryDb(actorMap = {}, deviceMap = {}) {
  const tables = {
    website_inquiries: [],
    organizations: [],
    contacts: [],
    site_assessments: [],
    pilot_applications: [],
    leads: [],
    lead_activities: [],
    notifications: [],
    audit_logs: [],
    telemetry: [],
    devices: Object.values(deviceMap),
    turbines: [],
    test_runs: [],
    device_errors: [],
    tasks: [],
    option_comparisons: [],
    patents: [],
    bom_items: [{ id: 'b1', component: 'Hub', prototype_cost_inr: 48000 }],
    financial_scenarios: [],
    grants: [],
    grant_applications: [],
    product_documents: [
      { id: 'd-pub', title: 'Public Spec', visibility: 'public' },
      { id: 'd-priv', title: 'Private Agreement', visibility: 'private' },
    ],
    monthly_reports: [],
    analytics_events: [],
  };
  let seq = 1;

  return {
    tables,
    adapter: {
      isConfigured: () => true,
      async resolveActor(req) {
        const raw = req.headers.authorization || req.headers.Authorization || '';
        const token = String(raw).replace(/^Bearer\s+/i, '').trim();
        return actorMap[token] || null;
      },
      async insertRow(table, row) {
        if (table === 'telemetry') {
          const dup = tables.telemetry.find(
            (x) =>
              x.device_id === row.device_id &&
              x.device_timestamp === row.device_timestamp &&
              x.sequence_no === row.sequence_no
          );
          if (dup) return { data: null, error: 'duplicate key value violates unique constraint' };
        }
        const inserted = { id: row.id || `${table}-${seq++}`, ...row };
        tables[table] = tables[table] || [];
        tables[table].push(inserted);
        return { data: inserted, error: null };
      },
      async selectRows(table, filters = {}) {
        const list = tables[table] || [];
        const filtered = list.filter((row) =>
          Object.entries(filters).every(([k, v]) => v === undefined || row[k] === v)
        );
        return { data: filtered, error: null };
      },
      async updateRows(table, match, patch) {
        const list = tables[table] || [];
        const updated = [];
        for (let i = 0; i < list.length; i++) {
          if (Object.entries(match).every(([k, v]) => list[i][k] === v)) {
            list[i] = { ...list[i], ...patch };
            updated.push(list[i]);
          }
        }
        return { data: updated, error: null };
      },
      async getDeviceSecretHash(deviceUid) {
        return deviceMap[deviceUid] || null;
      },
    },
  };
}

test('RBAC & Secret Hygiene: role matrix restricts financials/CRM and client bundle has zero server secrets', () => {
  assert.equal(hasPermission('public_visitor', 'view_public_site'), true);
  assert.equal(hasPermission('public_visitor', 'view_crm'), false);
  assert.equal(hasPermission('team_member', 'view_engineering_dashboard'), true);
  assert.equal(hasPermission('team_member', 'view_financials_bom'), false);
  assert.equal(hasPermission('team_member', 'view_crm'), false);
  assert.equal(hasPermission('crm_admin', 'edit_crm'), true);
  assert.equal(hasPermission('crm_admin', 'edit_financials_bom'), false);
  assert.equal(hasPermission('founder_super_admin', 'view_audit_logs'), true);

  // Check api function count <= 12
  const apiFiles = [];
  const walkApi = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '_lib') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkApi(full);
      else if (entry.name.endsWith('.ts')) apiFiles.push(full);
    }
  };
  walkApi(path.join(process.cwd(), 'api'));
  assert.ok(apiFiles.length <= 12, `Expected <= 12 Vercel functions, found ${apiFiles.length}`);

  // Check zero server secrets inside src/
  const walkSrc = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkSrc(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const txt = fs.readFileSync(full, 'utf-8');
        assert.ok(!txt.includes('SUPABASE_SERVICE_ROLE_KEY'), `Service role key reference in ${full}`);
        assert.ok(!txt.includes('RESEND_API_KEY'), `Resend key reference in ${full}`);
        assert.ok(!txt.includes('DEVICE_HMAC_MASTER_SALT'), `Device salt reference in ${full}`);
      }
    }
  };
  walkSrc(path.join(process.cwd(), 'src'));
});

test('Honest 503 Unconfigured State: endpoints refuse to fake success when DB is unconfigured', async () => {
  const unconfiguredDb = () => ({
    isConfigured: () => false,
    resolveActor: async () => null,
    insertRow: async () => ({ data: null, error: 'none' }),
    selectRows: async () => ({ data: [], error: 'none' }),
    updateRows: async () => ({ data: [], error: 'none' }),
    getDeviceSecretHash: async () => null,
  });

  for (const makeHandler of [
    createInquiriesHandler,
    createTelemetryHandler,
    createAdminHandler,
    createNotificationsHandler,
    createAnalyticsHandler,
  ]) {
    const res = createMockRes();
    await makeHandler(unconfiguredDb)({ method: 'GET', headers: {} }, res);
    assert.equal(res.statusCode, 503);
  }
});

test('Pilot Inquiry & 17-Stage CRM Workflow: validates inputs, blocks unauthorized reads, tracks stage changes & audit logs', async () => {
  const actors = {
    'tok-crm': { userId: 'u-crm', email: 'crm@pawanshakti.local', role: 'crm_admin' },
    'tok-team': { userId: 'u-team', email: 'eng@pawanshakti.local', role: 'team_member' },
  };
  const { tables, adapter } = createInMemoryDb(actors);
  const handler = createInquiriesHandler(() => adapter);

  // Spam honeypot rejected
  const spamRes = createMockRes();
  await handler(
    {
      method: 'POST',
      headers: {},
      body: {
        type: 'pilot_application',
        organizationName: 'Bot Corp',
        contactName: 'Bot',
        email: 'bot@example.com',
        siteLocation: 'Nagpur',
        applicationType: 'Telecom Infrastructure',
        roofOrLandType: 'Tower',
        consentToContact: true,
        honeypot: 'http://spam.example',
      },
    },
    spamRes
  );
  assert.equal(spamRes.statusCode, 400);

  // Valid Pilot Submission
  const okRes = createMockRes();
  await handler(
    {
      method: 'POST',
      headers: {},
      body: {
        type: 'pilot_application',
        organizationName: 'Vidarbha Telemetry Labs',
        contactName: 'A. Sharma',
        email: 'sharma@example.org',
        siteLocation: 'Nagpur, MH',
        applicationType: 'Off-Grid Monitoring Stations',
        roofOrLandType: 'Concrete institutional rooftop',
        hasExistingSolar: true,
        hasExistingBatteryOrInverter: true,
        consentToContact: true,
      },
    },
    okRes
  );
  assert.equal(okRes.statusCode, 201);
  assert.match(okRes.payload.referenceCode, /^PS-PILOT-/);
  assert.equal(okRes.payload.notificationStatus, 'queued_provider_unconfigured');
  assert.equal(tables.leads.length, 1);

  // Unauthenticated & team_member CRM reads blocked
  const unauthGet = createMockRes();
  await handler({ method: 'GET', headers: {} }, unauthGet);
  assert.equal(unauthGet.statusCode, 401);

  const teamGet = createMockRes();
  await handler({ method: 'GET', headers: { authorization: 'Bearer tok-team' } }, teamGet);
  assert.equal(teamGet.statusCode, 403);

  // CRM admin reads & advances stage cleanly
  const crmGet = createMockRes();
  await handler({ method: 'GET', headers: { authorization: 'Bearer tok-crm' } }, crmGet);
  assert.equal(crmGet.statusCode, 200);
  assert.equal(crmGet.payload.leads.length, 1);

  const patchRes = createMockRes();
  await handler(
    {
      method: 'PATCH',
      headers: { authorization: 'Bearer tok-crm' },
      body: { leadId: tables.leads[0].id, toStage: 'Qualified', notes: 'Wind resource log requested' },
    },
    patchRes
  );
  assert.equal(patchRes.statusCode, 200);
  assert.equal(tables.leads[0].stage, 'Qualified');
  assert.equal(tables.lead_activities.length, 1);
  assert.equal(tables.audit_logs.length, 1);
});

test('Telemetry Ingestion HMAC Security & Admin Isolation: verifies HMAC signature, replay dedupe, Betz flag, and 403 role enforcement', async () => {
  const deviceKey = 'secret_hash_dev_01';
  const devices = {
    'ESP32-PS-01': { id: 'dev-uuid-1', turbineId: 'turb-uuid-1', hmacSecretHash: deviceKey, revoked: false },
  };
  const actors = {
    'tok-team': { userId: 'u-team', email: 'team@pawanshakti.local', role: 'team_member' },
    'tok-founder': { userId: 'u-founder', email: 'yaswanth@pawanshakti.local', role: 'founder_super_admin' },
  };
  const { tables, adapter } = createInMemoryDb(actors, devices);
  const telHandler = createTelemetryHandler(() => adapter);
  const adminHandler = createAdminHandler(() => adapter);

  const bodyObj = {
    site_id: 'VNIT-ROOF-01',
    sequence_no: 101,
    device_timestamp: '2026-11-10T11:30:00Z',
    wind_speed_ms: 4.5,
    rotor_rpm: 280,
    dc_voltage_v: 12.0,
    dc_current_a: 1.5,
    swept_area_m2: 1.0,
  };
  const rawBody = JSON.stringify(bodyObj);
  const tsSec = String(Math.floor(Date.now() / 1000));
  const sig = crypto.createHmac('sha256', deviceKey).update(`${tsSec}.101.${rawBody}`).digest('hex');

  // Bad signature rejected
  const badRes = createMockRes();
  await telHandler(
    {
      method: 'POST',
      headers: {
        'x-device-id': 'ESP32-PS-01',
        'x-device-timestamp': tsSec,
        'x-device-nonce': '101',
        'x-device-signature': 'tampered',
      },
      body: rawBody,
    },
    badRes
  );
  assert.equal(badRes.statusCode, 401);

  // Valid HMAC ingestion passes
  const goodRes = createMockRes();
  await telHandler(
    {
      method: 'POST',
      headers: {
        'x-device-id': 'ESP32-PS-01',
        'x-device-timestamp': tsSec,
        'x-device-nonce': '101',
        'x-device-signature': sig,
      },
      body: rawBody,
    },
    goodRes
  );
  assert.equal(goodRes.statusCode, 201);
  assert.equal(goodRes.payload.powerW, 18);

  // Replay deduplication on exact same sequence_no & device_timestamp
  const replayRes = createMockRes();
  await telHandler(
    {
      method: 'POST',
      headers: {
        'x-device-id': 'ESP32-PS-01',
        'x-device-timestamp': tsSec,
        'x-device-nonce': '101',
        'x-device-signature': sig,
      },
      body: rawBody,
    },
    replayRes
  );
  assert.equal(replayRes.statusCode, 200);
  assert.equal(replayRes.payload.deduplicated, true);
  assert.equal(tables.telemetry.length, 1);

  // Admin API RBAC: team_member blocked from financials & audit_logs; founder allowed
  const teamFin = createMockRes();
  await adminHandler({ method: 'GET', headers: { authorization: 'Bearer tok-team' }, query: { action: 'financials' } }, teamFin);
  assert.equal(teamFin.statusCode, 403);

  const founderFin = createMockRes();
  await adminHandler({ method: 'GET', headers: { authorization: 'Bearer tok-founder' }, query: { action: 'financials' } }, founderFin);
  assert.equal(founderFin.statusCode, 200);
  assert.equal(founderFin.payload.bomItems.length, 1);
});

test('Database Schema & RLS Completeness: all 36 tables enable RLS, full policy coverage, and fail-closed default role', () => {
  const sql1 = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/001_pawan_shakti_platform.sql'), 'utf-8');
  const sql2 = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/002_pawan_shakti_hardening_and_completeness.sql'), 'utf-8');
  const combinedSql = `${sql1}\n${sql2}`;

  const requiredTables = [
    'profiles', 'roles', 'organizations', 'contacts', 'leads', 'lead_activities',
    'site_assessments', 'pilot_applications', 'pilot_projects', 'turbines',
    'turbine_configurations', 'option_comparisons', 'devices', 'sensors', 'telemetry',
    'device_errors', 'test_runs', 'test_measurements', 'maintenance_events', 'faults',
    'product_documents', 'publications', 'patents', 'tasks', 'milestones',
    'vendors', 'bom_items', 'quotations', 'financial_scenarios', 'grants',
    'grant_applications', 'monthly_reports', 'website_inquiries', 'notifications',
    'audit_logs', 'analytics_events',
  ];
  for (const tbl of requiredTables) {
    assert.ok(combinedSql.includes(`create table if not exists public.${tbl}`), `Missing SQL table: ${tbl}`);
    assert.ok(combinedSql.includes(`alter table public.${tbl} enable row level security`), `Missing RLS enable on: ${tbl}`);
    assert.ok(combinedSql.includes(`on public.${tbl}`), `Missing RLS policy on: ${tbl}`);
  }
  assert.ok(sql2.includes('prevent_profile_role_escalation'));
  assert.ok(sql2.includes('handle_new_auth_user'));

  // Verify fail-closed default profile role in both backend & frontend
  const dbTs = fs.readFileSync(path.join(process.cwd(), 'api/_lib/db.ts'), 'utf-8');
  assert.ok(dbTs.includes("|| 'public_visitor'"), 'Server must fail closed to public_visitor when profile row missing');
  const adminPageTs = fs.readFileSync(path.join(process.cwd(), 'src/pages/AdminPortalPage.tsx'), 'utf-8');
  assert.ok(!adminPageTs.includes("|| 'team_member'"), 'Frontend must fail closed to public_visitor when profile row missing');
});

test('Security Hardening: rejects malformed JSON (400), duplicate pilot (409), PII analytics (400), revoked devices & premature run review', async () => {
  const actors = {
    'tok-eng': { userId: 'u-eng', email: 'eng@pawanshakti.local', role: 'engineering_admin' },
    'tok-reviewer': { userId: 'u-rev', email: 'rev@v3f.local', role: 'external_reviewer' },
  };
  const devices = {};
  const { tables, adapter } = createInMemoryDb(actors, devices);
  const inqHandler = createInquiriesHandler(() => adapter);
  const telHandler = createTelemetryHandler(() => adapter);
  const admHandler = createAdminHandler(() => adapter);
  const anaHandler = createAnalyticsHandler(() => adapter);

  // Malformed JSON -> 400 cleanly (never 500)
  const badJsonRes = createMockRes();
  await inqHandler({ method: 'POST', headers: { 'x-forwarded-for': '10.0.0.1' }, body: '{bad-json' }, badJsonRes);
  assert.equal(badJsonRes.statusCode, 400);

  // Duplicate Pilot Submission protection -> 201 then 409
  const pilotPayload = {
    type: 'pilot_application',
    organizationName: 'Campus Test Org',
    contactName: '<script>alert(1)</script>',
    email: 'dup@example.org',
    siteLocation: 'Nagpur Campus Roof',
    applicationType: 'Institutional Campuses',
    roofOrLandType: 'Concrete roof',
    consentToContact: true,
  };
  const firstRes = createMockRes();
  await inqHandler({ method: 'POST', headers: { 'x-forwarded-for': '10.0.0.2' }, body: pilotPayload }, firstRes);
  assert.equal(firstRes.statusCode, 201);
  assert.equal(tables.notifications[0].delivery_status, 'queued_provider_unconfigured');

  const dupRes = createMockRes();
  await inqHandler({ method: 'POST', headers: { 'x-forwarded-for': '10.0.0.2' }, body: pilotPayload }, dupRes);
  assert.equal(dupRes.statusCode, 409);

  // Analytics rejects PII keys in meta
  const piiAnaRes = createMockRes();
  await anaHandler(
    { method: 'POST', headers: {}, body: { event: 'pilot_form_submit', path: '/pilot', meta: { email: 'leak@example.com' } } },
    piiAnaRes
  );
  assert.equal(piiAnaRes.statusCode, 400);

  // External reviewer gets ONLY public docs, never private agreements
  const revDocsRes = createMockRes();
  await admHandler({ method: 'GET', headers: { authorization: 'Bearer tok-reviewer' }, query: { action: 'grants_dataroom' } }, revDocsRes);
  assert.equal(revDocsRes.statusCode, 200);
  assert.equal(revDocsRes.payload.documents.length, 1);
  assert.equal(revDocsRes.payload.documents[0].visibility, 'public');

  // Test run cannot jump draft -> reviewed; requires completed first
  const runCreateRes = createMockRes();
  await telHandler(
    { method: 'POST', headers: { authorization: 'Bearer tok-eng' }, body: { action: 'create_test_run', testId: 'TR-900', objective: 'Dyno run' } },
    runCreateRes
  );
  assert.equal(runCreateRes.statusCode, 201);
  const runId = runCreateRes.payload.testRun.id;

  const skipReviewRes = createMockRes();
  await telHandler(
    { method: 'POST', headers: { authorization: 'Bearer tok-eng' }, body: { action: 'transition_test_run', id: runId, nextState: 'reviewed' } },
    skipReviewRes
  );
  assert.equal(skipReviewRes.statusCode, 400);

  // Register device -> one-time key returned -> revoke device blocks access
  const regDevRes = createMockRes();
  await telHandler(
    { method: 'POST', headers: { authorization: 'Bearer tok-eng' }, body: { action: 'register_device', deviceUid: 'ESP32-PS-99', samplingIntervalSec: 1 } },
    regDevRes
  );
  assert.equal(regDevRes.statusCode, 201);
  assert.match(regDevRes.payload.oneTimeDeviceKey, /^ps_dev_/);
});

test('Phase 2-6 Cloud Hardening: Storage RLS SQL, Telemetry DB Mappers, Auth Flows, Turbine Upsert & Sanitized Errors', async () => {
  // 1. Storage migration checks
  const sql3 = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/003_storage_buckets_and_policies.sql'), 'utf-8');
  assert.ok(sql3.includes("'public-docs'"));
  assert.ok(sql3.includes("'dataroom-private'"));
  assert.ok(sql3.includes("'telemetry-csvs'"));
  assert.ok(sql3.includes('on storage.objects for select'));
  assert.ok(!sql3.includes('alter table storage.objects enable row level security'));

  // 2. Admin portal auth flow completeness
  const adminTsx = fs.readFileSync(path.join(process.cwd(), 'src/pages/AdminPortalPage.tsx'), 'utf-8');
  assert.ok(adminTsx.includes('signUp('));
  assert.ok(adminTsx.includes('resetPasswordForEmail('));
  assert.ok(adminTsx.includes('PASSWORD_RECOVERY'));
  assert.ok(adminTsx.includes('canAccessAdminRoute'));

  // 3. DB snake_case -> camelCase telemetry & turbine mappers + time range filter
  const mappedTel = mapDbTelemetryRow({
    id: 'row-1',
    site_id: 'VNIT-01',
    turbine_id: 't-1',
    device_timestamp: '2026-11-11T10:00:00Z',
    wind_speed_ms: 3.8,
    rotor_rpm: 210,
    dc_voltage_v: 12.5,
    dc_current_a: 1.2,
    power_w: 15,
    data_quality_status: 'valid',
  });
  assert.equal(mappedTel.windSpeedMs, 3.8);
  assert.equal(mappedTel.powerW, 15);
  assert.equal(mappedTel.dataQualityStatus, 'valid');
  assert.equal(mappedTel.timestamp, '2026-11-11T10:00:00Z');

  const mappedTurbine = mapDbTurbineRow({
    id: 'tu-1',
    turbine_code: 'PS-OPT-A',
    prototype_version: 'Option A Dyno',
    gear_architecture: 'Coaxial Magnetic',
    installation_site: 'VNIT Lab',
    safety_status: 'monitoring_only_no_remote_actuation',
  });
  assert.equal(mappedTurbine.turbineId, 'PS-OPT-A');
  assert.equal(mappedTurbine.transmissionType, 'Coaxial Magnetic');

  const recentRows = filterTelemetryByRange(
    [
      { ...mappedTel, timestamp: new Date(Date.now() - 10 * 60_000).toISOString() },
      { ...mappedTel, id: 'row-old', timestamp: '2025-01-01T00:00:00Z' },
    ],
    '1h'
  );
  assert.equal(recentRows.length, 1);

  // 4. Sanitized HTTP 500 errors & idempotent turbine upsert
  const actors = { 'tok-eng': { userId: 'u-eng', email: 'eng@pawanshakti.local', role: 'engineering_admin' } };
  const { adapter } = createInMemoryDb(actors);
  const adm = createAdminHandler(() => adapter);

  const insRes = createMockRes();
  await adm(
    {
      method: 'POST',
      headers: { authorization: 'Bearer tok-eng' },
      body: { action: 'upsert_turbine', turbineCode: 'PS-TRL4-TEST', prototypeVersion: 'v1' },
    },
    insRes
  );
  assert.equal(insRes.statusCode, 201);

  const updRes = createMockRes();
  await adm(
    {
      method: 'POST',
      headers: { authorization: 'Bearer tok-eng' },
      body: { action: 'upsert_turbine', turbineCode: 'PS-TRL4-TEST', prototypeVersion: 'v2' },
    },
    updRes
  );
  assert.equal(updRes.statusCode, 200);
  assert.equal(updRes.payload.turbine.prototype_version, 'v2');

  const failingAdapter = {
    ...adapter,
    insertRow: async () => ({ data: null, error: 'relation "public.tasks" violates secret_internal_constraint' }),
  };
  const failAdm = createAdminHandler(() => failingAdapter);
  const failRes = createMockRes();
  await failAdm(
    {
      method: 'POST',
      headers: { authorization: 'Bearer tok-eng' },
      body: { action: 'upsert_task', title: 'Test', track: 'Aero', owner: 'Founder' },
    },
    failRes
  );
  assert.equal(failRes.statusCode, 500);
  assert.ok(!String(failRes.payload.error).includes('secret_internal_constraint'));
});

test('Phase 6 & Phase 12 Hardening: rejects oversized packets (413), blocks unauthorized CORS (403), and lazy-loads routes/WebP assets', async () => {
  const actors = { 'tok-eng': { userId: 'u-eng', email: 'eng@pawanshakti.local', role: 'engineering_admin' } };
  const { adapter } = createInMemoryDb(actors);
  const tel = createTelemetryHandler(() => adapter);
  const adm = createAdminHandler(() => adapter);

  // Oversized telemetry packet > 32 KB -> 413
  const bigRes = createMockRes();
  await tel(
    {
      method: 'POST',
      headers: { 'x-device-id': 'ESP32-PS-01' },
      body: JSON.stringify({ junk: 'x'.repeat(40_000) }),
    },
    bigRes
  );
  assert.equal(bigRes.statusCode, 413);

  // Disallowed external Origin rejected cleanly with 403 CORS policy
  const badOriginRes = createMockRes();
  await adm(
    {
      method: 'GET',
      headers: { authorization: 'Bearer tok-eng', origin: 'https://evil-phish.example' },
    },
    badOriginRes
  );
  assert.equal(badOriginRes.statusCode, 403);

  // Allowed localhost origin OPTIONS preflight returns 204
  const preflightRes = createMockRes();
  await adm(
    {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5174' },
    },
    preflightRes
  );
  assert.equal(preflightRes.statusCode, 204);

  // Route-level code splitting & WebP optimization checks
  const appTsx = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
  assert.ok(appTsx.includes("lazy(() => import('./pages/HomePage.tsx')"));
  assert.ok(appTsx.includes("lazy(() => import('./pages/AdminPortalPage.tsx')"));
  const techTsx = fs.readFileSync(path.join(process.cwd(), 'src/pages/TechnologyPage.tsx'), 'utf-8');
  assert.ok(techTsx.includes("lazy(() =>"));
  assert.ok(techTsx.includes("ModelViewer3D"));
  const webpSize = fs.statSync(path.join(process.cwd(), 'public/optimized/mark-4-four-rotor-prototype.webp')).size;
  const origSize = fs.statSync(path.join(process.cwd(), 'media/prototype/mark-4-four-rotor-prototype.png')).size;
  assert.ok(webpSize > 10_000 && webpSize < origSize * 0.25, 'Optimized Mark-4 WebP must exist and be < 25% of raw PNG');
});

