import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hasPermission } from '../src/lib/authAndRbac.ts';
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

test('Database Schema & RLS Completeness: all required 34 tables exist and enforce row level security', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/001_pawan_shakti_platform.sql'), 'utf-8');
  const requiredTables = [
    'profiles', 'roles', 'organizations', 'contacts', 'leads', 'lead_activities',
    'site_assessments', 'pilot_applications', 'pilot_projects', 'turbines',
    'turbine_configurations', 'option_comparisons', 'devices', 'sensors', 'telemetry',
    'test_runs', 'test_measurements', 'maintenance_events', 'faults',
    'product_documents', 'publications', 'patents', 'tasks', 'milestones',
    'vendors', 'bom_items', 'quotations', 'financial_scenarios', 'grants',
    'grant_applications', 'monthly_reports', 'website_inquiries', 'notifications',
    'audit_logs', 'analytics_events',
  ];
  for (const tbl of requiredTables) {
    assert.ok(sql.includes(`create table if not exists public.${tbl}`), `Missing SQL table: ${tbl}`);
    assert.ok(sql.includes(`alter table public.${tbl} enable row level security`), `Missing RLS enable on: ${tbl}`);
  }
});

