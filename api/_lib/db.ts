import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../../src/types/index.ts';
import { hasPermission, type PermissionScope } from '../../src/lib/authAndRbac.ts';

export interface ServerRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface ServerResponse {
  status: (code: number) => ServerResponse;
  json: (data: unknown) => void;
  setHeader?: (name: string, value: string) => void;
}

export function isServerDbConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return Boolean(
    url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('your-project-ref') &&
      !key.includes('your-supabase-service-role')
  );
}

export function getServiceSupabase(): SupabaseClient | null {
  if (!isServerDbConfigured()) return null;
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getHeaderValue(headers: Record<string, string | string[] | undefined>, key: string): string {
  const raw = headers[key.toLowerCase()] ?? headers[key];
  if (Array.isArray(raw)) return raw[0] || '';
  return typeof raw === 'string' ? raw : '';
}

export function getClientIp(req: ServerRequest): string {
  const forwarded = getHeaderValue(req.headers, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return getHeaderValue(req.headers, 'x-real-ip') || 'local';
}

export function getOrCreateRequestId(req: ServerRequest): string {
  const existing = getHeaderValue(req.headers, 'x-request-id').trim();
  return existing || `req_${crypto.randomBytes(6).toString('hex')}`;
}

export function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>([
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
  ]);
  const appUrl = process.env.VITE_APP_URL?.trim();
  if (appUrl && appUrl.startsWith('http')) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {
      // ignore malformed env URL
    }
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    allowed.add(`https://${vercelUrl.replace(/^https?:\/\//, '')}`);
  }
  return allowed;
}

export function applyCors(req: ServerRequest, res: ServerResponse, requestId: string): { handled: boolean; rejected: boolean } {
  res.setHeader?.('Vary', 'Origin');
  res.setHeader?.('X-Request-Id', requestId);
  const origin = getHeaderValue(req.headers, 'origin').trim();
  if (origin) {
    const allowed = getAllowedOrigins();
    const isPreviewBranchOrigin = /^https:\/\/pawan-shakti-[a-z0-9-]+\.vercel\.app$/i.test(origin);
    if (!allowed.has(origin) && !isPreviewBranchOrigin) {
      res.status(403).json({ error: 'Cross-origin request rejected by CORS policy.', requestId });
      return { handled: true, rejected: true };
    }
    res.setHeader?.('Access-Control-Allow-Origin', origin);
    res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id, X-Device-Timestamp, X-Device-Nonce, X-Device-Signature, X-Request-Id');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).json({ ok: true });
    return { handled: true, rejected: false };
  }
  return { handled: false, rejected: false };
}

export function parseJsonBody(
  req: ServerRequest,
  maxBytes = 131_072
): { ok: true; data: Record<string, any> } | { ok: false; status: number; error: string } {
  if (req.body === undefined || req.body === null || req.body === '') {
    return { ok: true, data: {} };
  }
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
      return { ok: false, status: 413, error: `Request payload exceeds ${maxBytes} byte limit.` };
    }
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ok: true, data: parsed as Record<string, any> };
      }
      return { ok: false, status: 400, error: 'JSON request body must be an object.' };
    } catch {
      return { ok: false, status: 400, error: 'Malformed JSON in request body.' };
    }
  }
  if (typeof req.body === 'object' && !Array.isArray(req.body)) {
    const serializedBytes = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (serializedBytes > maxBytes) {
      return { ok: false, status: 413, error: `Request payload exceeds ${maxBytes} byte limit.` };
    }
    return { ok: true, data: req.body as Record<string, any> };
  }
  return { ok: false, status: 400, error: 'Unsupported request body format.' };
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number,
  nowMs = Date.now()
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const existing = RATE_BUCKETS.get(bucketKey);
  if (!existing || nowMs >= existing.resetAt) {
    RATE_BUCKETS.set(bucketKey, { count: 1, resetAt: nowMs + windowMs });
    return { allowed: true, remaining: Math.max(0, maxRequests - 1), retryAfterSec: 0 };
  }
  if (existing.count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, maxRequests - existing.count), retryAfterSec: 0 };
}

export interface AuthenticatedActor {
  userId: string;
  email: string;
  role: UserRole;
}

export interface DbAdapter {
  isConfigured: () => boolean;
  resolveActor: (req: ServerRequest) => Promise<AuthenticatedActor | null>;
  insertRow: (table: string, row: Record<string, unknown>) => Promise<{ data: any; error: string | null }>;
  selectRows: (table: string, filters?: Record<string, unknown>, limit?: number) => Promise<{ data: any[]; error: string | null }>;
  updateRows: (table: string, match: Record<string, unknown>, patch: Record<string, unknown>) => Promise<{ data: any[]; error: string | null }>;
  getDeviceSecretHash: (deviceUid: string) => Promise<{ id: string; turbineId: string | null; hmacSecretHash: string; revoked: boolean } | null>;
}

export function createSupabaseDbAdapter(): DbAdapter {
  const client = getServiceSupabase();

  return {
    isConfigured: () => Boolean(client),
    async resolveActor(req: ServerRequest): Promise<AuthenticatedActor | null> {
      if (!client) return null;
      const authHeader = getHeaderValue(req.headers, 'authorization');
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) return null;

      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return null;

      const { data: profile } = await client
        .from('profiles')
        .select('role, email')
        .eq('id', data.user.id)
        .maybeSingle();

      const role = (profile?.role as UserRole | undefined) || 'public_visitor';
      return {
        userId: data.user.id,
        email: profile?.email || data.user.email || 'unknown',
        role,
      };
    },
    async insertRow(table, row) {
      if (!client) return { data: null, error: 'Supabase not configured' };
      const { data, error } = await client.from(table).insert(row).select().single();
      return { data, error: error ? error.message : null };
    },
    async selectRows(table, filters = {}, limit = 200) {
      if (!client) return { data: [], error: 'Supabase not configured' };
      let q = client.from(table).select('*').limit(limit);
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined) q = q.eq(k, v);
      }
      const { data, error } = await q;
      return { data: data || [], error: error ? error.message : null };
    },
    async updateRows(table, match, patch) {
      if (!client) return { data: [], error: 'Supabase not configured' };
      let q = client.from(table).update(patch);
      for (const [k, v] of Object.entries(match)) {
        q = q.eq(k, v);
      }
      const { data, error } = await q.select();
      return { data: data || [], error: error ? error.message : null };
    },
    async getDeviceSecretHash(deviceUid: string) {
      if (!client) return null;
      const { data, error } = await client
        .from('devices')
        .select('id, turbine_id, hmac_secret_hash, revoked')
        .eq('device_uid', deviceUid)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        turbineId: data.turbine_id,
        hmacSecretHash: data.hmac_secret_hash,
        revoked: Boolean(data.revoked),
      };
    },
  };
}

export async function recordAuditLog(
  db: DbAdapter,
  actor: AuthenticatedActor,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  await db
    .insertRow('audit_logs', {
      actor_email: actor.email,
      actor_role: actor.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
    })
    .catch(() => {});
}

export function verifyDeviceHmacSignature(params: {
  rawBody: string;
  timestampSec: string;
  nonceOrSeq: string;
  providedSignature: string;
  deviceSecretHash: string;
  nowMs?: number;
}): { valid: boolean; reason?: string } {
  const ts = Number(params.timestampSec);
  const nowSec = Math.floor((params.nowMs ?? Date.now()) / 1000);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > 300) {
    return { valid: false, reason: 'Stale or invalid X-Device-Timestamp (replay guard +/- 300s).' };
  }
  if (!params.nonceOrSeq) {
    return { valid: false, reason: 'Missing sequence / nonce identifier.' };
  }
  const cleanSig = params.providedSignature.replace(/^sha256=/i, '').trim();
  const expected = crypto
    .createHmac('sha256', params.deviceSecretHash)
    .update(`${params.timestampSec}.${params.nonceOrSeq}.${params.rawBody}`)
    .digest('hex');

  const bufA = Buffer.from(cleanSig, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return { valid: false, reason: 'Invalid device HMAC signature.' };
  }
  return { valid: true };
}

export function safeServerError(res: ServerResponse, context: string, rawError: unknown, status = 500, requestId?: string): void {
  const detail = rawError instanceof Error ? rawError.message : String(rawError || 'unknown');
  console.error(`[pawan-shakti][${context}]${requestId ? `[${requestId}]` : ''}`, detail);
  res.status(status).json({ error: 'Internal server database operation failed.', ...(requestId ? { requestId } : {}) });
}

export function requirePermission(actor: AuthenticatedActor | null, scope: PermissionScope): { ok: true } | { ok: false; status: number; error: string } {
  if (!actor) {
    return { ok: false, status: 401, error: 'Authentication required (missing or invalid Supabase JWT).' };
  }
  if (!hasPermission(actor.role, scope)) {
    return { ok: false, status: 403, error: `Forbidden: role "${actor.role}" lacks "${scope}" permission.` };
  }
  return { ok: true };
}
