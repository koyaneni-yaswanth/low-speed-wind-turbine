import { z } from 'zod';
import {
  createSupabaseDbAdapter,
  parseJsonBody,
  requirePermission,
  safeServerError,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';

const FORBIDDEN_PII_KEYS = new Set(['email', 'phone', 'name', 'fullname', 'address', 'password', 'token', 'aadhaar', 'pan']);

const eventSchema = z.object({
  event: z.string().trim().min(2).max(60),
  path: z.string().trim().min(1).max(200),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export function createAnalyticsHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Analytics persistence unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set.',
      });
    }

    if (req.method === 'POST') {
      const bodyParse = parseJsonBody(req);
      if (!bodyParse.ok) return res.status(400).json({ error: bodyParse.error });
      const parsed = eventSchema.safeParse(bodyParse.data);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid analytics event payload.' });
      }
      const metaKeys = Object.keys(parsed.data.meta || {});
      if (metaKeys.some((k) => FORBIDDEN_PII_KEYS.has(k.toLowerCase()))) {
        return res.status(400).json({ error: 'Analytics metadata must remain strictly zero-PII.' });
      }
      const { error } = await db.insertRow('analytics_events', {
        event_name: parsed.data.event,
        path: parsed.data.path,
        meta: parsed.data.meta || {},
      });
      if (error) {
        safeServerError(res, 'analytics:post', error);
        return;
      }
      return res.status(201).json({ recorded: true });
    }

    if (req.method === 'GET') {
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'view_crm');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const { data, error } = await db.selectRows('analytics_events', {}, 500);
      if (error) {
        safeServerError(res, 'analytics:get', error);
        return;
      }
      return res.status(200).json({ events: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createAnalyticsHandler();
