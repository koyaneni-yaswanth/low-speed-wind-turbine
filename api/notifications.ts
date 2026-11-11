import {
  createSupabaseDbAdapter,
  parseJsonBody,
  recordAuditLog,
  requirePermission,
  safeServerError,
  type DbAdapter,
  type ServerRequest,
  type ServerResponse,
} from './_lib/db.ts';

export interface NotificationDispatchResult {
  deliveryStatus: 'sent' | 'failed' | 'queued_provider_unconfigured';
  providerResponse: string;
}

export async function dispatchEmailNotification(params: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<NotificationDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      deliveryStatus: 'queued_provider_unconfigured',
      providerResponse: 'RESEND_API_KEY / NOTIFICATION_FROM_EMAIL unset — never simulated as sent.',
    };
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.htmlBody,
      }),
    });
    const text = await resp.text();
    if (resp.ok) {
      return { deliveryStatus: 'sent', providerResponse: text.slice(0, 300) };
    }
    return { deliveryStatus: 'failed', providerResponse: `HTTP ${resp.status}: ${text.slice(0, 300)}` };
  } catch (err) {
    return {
      deliveryStatus: 'failed',
      providerResponse: err instanceof Error ? err.message : 'Email provider network error',
    };
  }
}

export function createNotificationsHandler(dbFactory: () => DbAdapter = createSupabaseDbAdapter) {
  return async function handler(req: ServerRequest, res: ServerResponse) {
    const db = dbFactory();
    if (!db.isConfigured()) {
      return res.status(503).json({
        error: 'Database unconfigured',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
      });
    }

    const actor = await db.resolveActor(req);
    const auth = requirePermission(actor, 'view_crm');
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    if (req.method === 'GET') {
      const { data, error } = await db.selectRows('notifications', {}, 200);
      if (error) {
        safeServerError(res, 'notifications:get', error);
        return;
      }
      return res.status(200).json({ notifications: data });
    }

    if (req.method === 'POST') {
      const writeAuth = requirePermission(actor, 'manage_cms_and_roles');
      if (!writeAuth.ok) return res.status(writeAuth.status).json({ error: writeAuth.error });

      const bodyParse = parseJsonBody(req);
      if (!bodyParse.ok) return res.status(400).json({ error: bodyParse.error });
      const body = bodyParse.data;
      if (!body.to || !body.subject || !body.htmlBody) {
        return res.status(400).json({ error: 'Fields to, subject, and htmlBody are required.' });
      }
      const dispatched = await dispatchEmailNotification({
        to: String(body.to),
        subject: String(body.subject),
        htmlBody: String(body.htmlBody),
      });
      const { data, error } = await db.insertRow('notifications', {
        template_key: String(body.templateKey || 'manual_admin_notice'),
        recipient: String(body.to),
        subject: String(body.subject),
        payload: { messagePreview: String(body.htmlBody).slice(0, 200) },
        delivery_status: dispatched.deliveryStatus,
        provider_response: dispatched.providerResponse,
      });
      if (error) {
        safeServerError(res, 'notifications:post', error);
        return;
      }
      await recordAuditLog(db, actor!, 'dispatch_notification', 'notification', data?.id ?? null, {
        status: dispatched.deliveryStatus,
      });
      return res.status(200).json({ notification: data, deliveryStatus: dispatched.deliveryStatus });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  };
}

export default createNotificationsHandler();
