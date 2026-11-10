import { isServerDbConfigured, getServiceSupabase, type ServerRequest, type ServerResponse } from './_lib/db.ts';

export default async function handler(_req: ServerRequest, res: ServerResponse) {
  const configured = isServerDbConfigured();
  let dbReachable = false;
  let dbError: string | null = null;

  if (configured) {
    try {
      const client = getServiceSupabase();
      if (client) {
        const { error } = await client.from('roles').select('code').limit(1);
        if (error) dbError = error.message;
        else dbReachable = true;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : 'Database check error';
    }
  }

  const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL);

  res.status(configured && dbReachable ? 200 : 503).json({
    ok: configured && dbReachable,
    supabaseConfigured: configured,
    dbReachable,
    emailProviderConfigured,
    trlStage: 'TRL 4',
    message: configured
      ? dbReachable
        ? 'Backend connected cleanly.'
        : `Supabase configured but schema check returned: ${dbError}`
      : 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured on this server.',
  });
}
