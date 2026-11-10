import { z } from 'zod';
import {
  createSupabaseDbAdapter,
  requirePermission,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';

const eventSchema = z.object({
  event: z.string().trim().min(2).max(60),
  path: z.string().trim().min(1).max(200),
  meta: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const parsed = eventSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid analytics event payload.' });
      }
      const { error } = await db.insertRow('analytics_events', {
        event_name: parsed.data.event,
        path: parsed.data.path,
        meta: parsed.data.meta || {},
      });
      if (error) return res.status(500).json({ error });
      return res.status(201).json({ recorded: true });
    }

    if (req.method === 'GET') {
      const actor = await db.resolveActor(req);
      const auth = requirePermission(actor, 'view_crm');
      if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

      const { data, error } = await db.selectRows('analytics_events', {}, 500);
      if (error) return res.status(500).json({ error });
      return res.status(200).json({ events: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createAnalyticsHandler();
