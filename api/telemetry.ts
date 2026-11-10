import { z } from 'zod';
import {
  createSupabaseDbAdapter,
  getHeaderValue,
  recordAuditLog,
  requirePermission,
  verifyDeviceHmacSignature,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';
import { evaluateBetzPhysics } from '../src/lib/physics.ts';

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
      if (actor && requirePermission(actor, 'view_engineering_dashboard').ok) {
        const tRes = await db.selectRows('telemetry', {}, 500);
        telemetry = tRes.data;
      }

      return res.status(200).json({
        turbines: turbinesRes.data,
        testRuns: runsRes.data,
        telemetry,
        liveConnected: telemetry.length > 0,
      });
    }

    if (req.method === 'POST') {
      const deviceUid = getHeaderValue(req.headers, 'x-device-id');
      const rawBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const parsedJson = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Path A: Hardware Device Ingestion (ESP32 / STM32 via HMAC-SHA256)
      if (deviceUid) {
        const device = await db.getDeviceSecretHash(deviceUid);
        if (!device) {
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
          return res.status(401).json({ error: hmacCheck.reason });
        }

        const validPayload = deviceTelemetrySchema.safeParse(parsedJson);
        if (!validPayload.success) {
          return res.status(400).json({
            error: 'Invalid telemetry schema or physical range.',
            issues: validPayload.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
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

        // Note: strictly monitoring-only; never trigger hardware commands from response
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
          { last_heartbeat_at: new Date().toISOString(), device_health: t.device_health || 'online' }
        );

        return res.status(201).json({
          ingested: true,
          id: inserted?.id,
          powerW: betz.measuredPowerW,
          qualityStatus,
        });
      }

      // Path B: Authenticated Engineer CSV / Test-Run Upload
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'ingest_telemetry');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      if (parsedJson?.action === 'create_test_run') {
        const { data: run, error } = await db.insertRow('test_runs', {
          test_code: String(parsedJson.testId || `TR-${Date.now()}`),
          turbine_id: parsedJson.turbineUuid || null,
          objective: String(parsedJson.objective || ''),
          configuration: String(parsedJson.configuration || ''),
          location: String(parsedJson.location || ''),
          sensors_used: String(parsedJson.sensorsUsed || ''),
          calibration_details: String(parsedJson.calibrationStatus || ''),
          operator_name: String(parsedJson.operator || actor!.email),
          safety_checklist_passed: Boolean(parsedJson.safetyChecklistCompleted),
          state: String(parsedJson.state || 'draft'),
          evidence_tier: 'PROTOTYPE_OBSERVATION',
        });
        if (error) return res.status(500).json({ error });
        await recordAuditLog(db, actor!, 'create_test_run', 'test_run', run?.id ?? null);
        return res.status(201).json({ testRun: run });
      }

      return res.status(400).json({ error: 'Missing X-Device-Id HMAC headers or valid engineer test-run action.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createTelemetryHandler();
