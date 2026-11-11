import crypto from 'node:crypto';
import { z } from 'zod';
import {
  checkRateLimit,
  createSupabaseDbAdapter,
  getHeaderValue,
  parseJsonBody,
  recordAuditLog,
  requirePermission,
  verifyDeviceHmacSignature,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';
import { evaluateBetzPhysics } from '../src/lib/physics.ts';

const VALID_TEST_STATES = new Set(['draft', 'running', 'completed', 'reviewed', 'rejected']);

const deviceTelemetrySchema = z.object({
  site_id: z.string().trim().min(1).max(64),
  turbine_id: z.string().trim().min(1).max(64).optional(),
  sequence_no: z.number().int().nonnegative(),
  device_timestamp: z.string().datetime(),
  wind_speed_ms: z.number().min(0).max(80),
  wind_direction: z.string().trim().max(16).optional(),
  rotor_rpm: z.number().min(0).max(20000),
  generator_rpm: z.number().min(0).max(50000).optional(),
  dc_voltage_v: z.number().min(0).max(1000),
  dc_current_a: z.number().min(0).max(500),
  cumulative_energy_wh: z.number().min(0).optional(),
  temperature_c: z.number().min(-40).max(200).optional(),
  vibration_g: z.string().trim().max(64).optional(),
  brake_state: z.enum(['released', 'engaged', 'fault', 'unknown']).default('unknown'),
  battery_soc_pct: z.number().min(0).max(100).optional(),
  device_health: z.string().trim().max(64).optional(),
  sensor_health: z.string().trim().max(64).optional(),
  fault_code: z.string().trim().max(64).optional(),
  swept_area_m2: z.number().positive().max(20).default(1.0),
});

const registerDeviceSchema = z.object({
  action: z.literal('register_device'),
  deviceUid: z.string().trim().min(3).max(64),
  turbineId: z.string().trim().optional(),
  firmwareVersion: z.string().trim().max(64).default('v1.0-pending'),
  samplingIntervalSec: z.number().int().min(1).max(3600).default(1),
});

export function createTelemetryHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Database unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live telemetry.',
      });
    }

    if (req.method === 'GET') {
      const actor = await db.resolveActor(req);
      const [turbinesRes, runsRes] = await Promise.all([
        db.selectRows('turbines', actor ? {} : { is_public: true }, 100),
        db.selectRows('test_runs', actor ? {} : { is_public: true }, 100),
      ]);

      let telemetry: any[] = [];
      let devices: any[] = [];
      let deviceErrors: any[] = [];
      if (actor && requirePermission(actor, 'view_engineering_dashboard').ok) {
        const [tRes, dRes, eRes] = await Promise.all([
          db.selectRows('telemetry', {}, 500),
          db.selectRows('devices', {}, 50),
          db.selectRows('device_errors', {}, 100),
        ]);
        telemetry = tRes.data;
        // Strip server HMAC secrets from read responses!
        devices = dRes.data.map(({ hmac_secret_hash: _secret, ...safe }) => safe);
        deviceErrors = eRes.data;
      }

      return res.status(200).json({
        turbines: turbinesRes.data,
        testRuns: runsRes.data,
        telemetry,
        devices,
        deviceErrors,
        liveConnected: telemetry.length > 0,
      });
    }

    if (req.method === 'POST') {
      const deviceUid = getHeaderValue(req.headers, 'x-device-id');
      const bodyParse = parseJsonBody(req);
      if (!bodyParse.ok) {
        if (deviceUid) {
          await db.insertRow('device_errors', {
            device_uid: deviceUid,
            error_type: 'malformed_json',
            detail: bodyParse.error,
          }).catch(() => {});
        }
        return res.status(400).json({ error: bodyParse.error });
      }
      const rawBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(bodyParse.data);
      const parsedJson = bodyParse.data;

      // Path A: Hardware Device Ingestion (ESP32 / STM32 via HMAC-SHA256)
      if (deviceUid) {
        const rate = checkRateLimit(`dev:${deviceUid}`, 180, 60_000);
        if (!rate.allowed) {
          await db.insertRow('device_errors', {
            device_uid: deviceUid,
            error_type: 'rate_limited',
            detail: `Exceeded device rate limit; retry in ${rate.retryAfterSec}s`,
          }).catch(() => {});
          return res.status(429).json({ error: `Telemetry rate limit exceeded. Retry in ${rate.retryAfterSec}s.` });
        }

        const device = await db.getDeviceSecretHash(deviceUid);
        if (!device) {
          await db.insertRow('device_errors', {
            device_uid: deviceUid,
            error_type: 'unknown_device',
            detail: 'Unregistered X-Device-Id rejected.',
          }).catch(() => {});
          return res.status(401).json({ error: 'Unknown X-Device-Id.' });
        }
        if (device.revoked) {
          return res.status(403).json({ error: 'Device credential has been revoked.' });
        }

        const hmacCheck = verifyDeviceHmacSignature({
          rawBody: rawBodyStr,
          timestampSec: getHeaderValue(req.headers, 'x-device-timestamp'),
          nonceOrSeq: getHeaderValue(req.headers, 'x-device-nonce') || String(parsedJson?.sequence_no ?? ''),
          providedSignature: getHeaderValue(req.headers, 'x-device-signature'),
          deviceSecretHash: device.hmacSecretHash,
        });
        if (!hmacCheck.valid) {
          await db.insertRow('device_errors', {
            device_uid: deviceUid,
            error_type: 'hmac_or_timestamp_invalid',
            detail: hmacCheck.reason || 'HMAC check failed',
          }).catch(() => {});
          return res.status(401).json({ error: hmacCheck.reason });
        }

        const validPayload = deviceTelemetrySchema.safeParse(parsedJson);
        if (!validPayload.success) {
          const issues = validPayload.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
          await db.insertRow('device_errors', {
            device_uid: deviceUid,
            error_type: 'schema_validation_failed',
            detail: issues.join('; ').slice(0, 500),
          }).catch(() => {});
          return res.status(400).json({
            error: 'Invalid telemetry schema or physical range.',
            issues,
          });
        }

        const t = validPayload.data;
        const betz = evaluateBetzPhysics({
          windSpeedMs: t.wind_speed_ms,
          sweptAreaM2: t.swept_area_m2,
          voltageV: t.dc_voltage_v,
          currentA: t.dc_current_a,
        });

        const qualityStatus =
          t.wind_speed_ms > 0.5 && betz.exceedsBetzLimit && betz.measuredPowerW > 0.5
            ? 'betz_anomaly'
            : 'valid';

        // Strictly monitoring-only: never return hardware control commands in API responses
        const { data: inserted, error } = await db.insertRow('telemetry', {
          device_id: device.id,
          turbine_id: device.turbineId,
          site_id: t.site_id,
          sequence_no: t.sequence_no,
          device_timestamp: t.device_timestamp,
          ingested_at: new Date().toISOString(),
          wind_speed_ms: t.wind_speed_ms,
          wind_direction: t.wind_direction || null,
          rotor_rpm: t.rotor_rpm,
          generator_rpm: t.generator_rpm ?? null,
          dc_voltage_v: t.dc_voltage_v,
          dc_current_a: t.dc_current_a,
          power_w: betz.measuredPowerW,
          cumulative_energy_wh: t.cumulative_energy_wh ?? null,
          temperature_c: t.temperature_c ?? null,
          vibration_g: t.vibration_g || null,
          brake_state: t.brake_state,
          battery_soc_pct: t.battery_soc_pct ?? null,
          device_health: t.device_health || 'online',
          sensor_health: t.sensor_health || 'nominal',
          data_quality_status: qualityStatus,
          fault_code: t.fault_code || null,
        });

        if (error) {
          if (error.toLowerCase().includes('duplicate') || error.toLowerCase().includes('unique')) {
            return res.status(200).json({ deduplicated: true, sequenceNo: t.sequence_no });
          }
          return res.status(500).json({ error });
        }

        await db.updateRows(
          'devices',
          { id: device.id },
          { last_heartbeat_at: new Date().toISOString(), device_health: t.device_health || 'online', consecutive_errors: 0 }
        );

        return res.status(201).json({
          ingested: true,
          id: inserted?.id,
          powerW: betz.measuredPowerW,
          qualityStatus,
        });
      }

      // Path B: Authenticated Engineer Actions (Device Registry, Test Runs & Lifecycle)
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'ingest_telemetry');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      if (parsedJson?.action === 'register_device') {
        const reg = registerDeviceSchema.safeParse(parsedJson);
        if (!reg.success) {
          return res.status(400).json({ error: 'Invalid device registration payload.' });
        }
        const oneTimeKey = `ps_dev_${crypto.randomBytes(24).toString('hex')}`;
        const { data: created, error } = await db.insertRow('devices', {
          device_uid: reg.data.deviceUid,
          turbine_id: reg.data.turbineId || null,
          hmac_secret_hash: oneTimeKey,
          firmware_version: reg.data.firmwareVersion,
          sampling_interval_sec: reg.data.samplingIntervalSec,
          registered_by: actor!.email,
          device_health: 'registered_offline',
          revoked: false,
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor!, 'register_device', 'device', created?.id ?? null, { deviceUid: reg.data.deviceUid });
        return res.status(201).json({
          device: { id: created?.id, deviceUid: reg.data.deviceUid, samplingIntervalSec: reg.data.samplingIntervalSec },
          oneTimeDeviceKey: oneTimeKey,
          notice: 'Store this key securely on your ESP32/STM32 firmware now — it is never shown again.',
        });
      }

      if (parsedJson?.action === 'revoke_device') {
        if (!parsedJson.deviceUid) return res.status(400).json({ error: 'deviceUid is required.' });
        const { data } = await db.updateRows('devices', { device_uid: String(parsedJson.deviceUid) }, { revoked: true });
        await recordAuditLog(db, actor!, 'revoke_device', 'device', String(parsedJson.deviceUid));
        return res.status(200).json({ revoked: data.length > 0 });
      }

      if (parsedJson?.action === 'create_test_run') {
        const { data: run, error } = await db.insertRow('test_runs', {
          test_code: String(parsedJson.testId || `TR-${Date.now()}`),
          turbine_id: parsedJson.turbineUuid || null,
          objective: String(parsedJson.objective || ''),
          configuration: String(parsedJson.configuration || ''),
          location: String(parsedJson.location || ''),
          sensors_used: String(parsedJson.sensorsUsed || ''),
          instrument_identifiers: String(parsedJson.instrumentIdentifiers || ''),
          calibration_status: String(parsedJson.calibrationStatus || 'uncalibrated'),
          load_condition: String(parsedJson.loadCondition || ''),
          duration_sec: parsedJson.durationSec ? Number(parsedJson.durationSec) : null,
          observations: String(parsedJson.observations || ''),
          csv_attachment_ref: String(parsedJson.csvAttachmentRef || ''),
          operator_name: String(parsedJson.operator || actor!.email),
          safety_checklist_passed: Boolean(parsedJson.safetyChecklistCompleted),
          state: 'draft',
          approval_status: 'pending_review',
          evidence_tier: 'PROTOTYPE_OBSERVATION',
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor!, 'create_test_run', 'test_run', run?.id ?? null);
        return res.status(201).json({ testRun: run });
      }

      if (parsedJson?.action === 'transition_test_run') {
        const runId = String(parsedJson.id || '');
        const nextState = String(parsedJson.nextState || '');
        if (!runId || !VALID_TEST_STATES.has(nextState)) {
          return res.status(400).json({ error: 'Valid test run id and nextState required.' });
        }
        const { data: rows } = await db.selectRows('test_runs', { id: runId }, 1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Test run not found.' });

        // Completed runs must never auto-approve as reviewed without explicit reviewer sign-off
        if (nextState === 'reviewed' && existing.state !== 'completed') {
          return res.status(400).json({ error: 'Test run must reach completed state before formal engineering review.' });
        }
        const patch: Record<string, unknown> = {
          state: nextState,
          updated_at: new Date().toISOString(),
        };
        if (nextState === 'reviewed') {
          patch.reviewed_by = String(parsedJson.reviewedBy || actor!.email);
          patch.approval_status = 'approved';
        } else if (nextState === 'rejected') {
          patch.reviewed_by = String(parsedJson.reviewedBy || actor!.email);
          patch.approval_status = 'rejected';
        }
        if (parsedJson.resultSummary !== undefined) patch.result_summary = String(parsedJson.resultSummary);
        if (parsedJson.observations !== undefined) patch.observations = String(parsedJson.observations);
        if (parsedJson.csvAttachmentRef !== undefined) patch.csv_attachment_ref = String(parsedJson.csvAttachmentRef);

        const { data: updated } = await db.updateRows('test_runs', { id: runId }, patch);
        await recordAuditLog(db, actor!, 'transition_test_run', 'test_run', runId, { from: existing.state, to: nextState });
        return res.status(200).json({ testRun: updated[0] || existing });
      }

      return res.status(400).json({ error: 'Missing X-Device-Id HMAC headers or valid engineer action.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createTelemetryHandler();
