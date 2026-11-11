import React, { useEffect, useRef, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { getSupabaseClient, isSupabaseClientConfigured } from '../lib/supabase.ts';
import { ROLE_LABELS, canAccessAdminRoute, hasPermission } from '../lib/authAndRbac.ts';
import type { UserRole } from '../types/index.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EngineeringWorkbenchTab } from '../components/admin/EngineeringWorkbenchTab.tsx';
import { CrmPipelineTab } from '../components/admin/CrmPipelineTab.tsx';
import { FounderOperatingTab } from '../components/admin/FounderOperatingTab.tsx';
import { GrantsDataRoomTab } from '../components/admin/GrantsDataRoomTab.tsx';

type AdminTab = 'engineering' | 'crm' | 'founder_os' | 'grants_dataroom';
type AuthMode = 'signin' | 'signup' | 'reset' | 'recovery';

export const AdminPortalPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole>('public_visitor');
  const [localPreviewMode, setLocalPreviewMode] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole>('founder_super_admin');
  const [activeTab, setActiveTab] = useState<AdminTab>('engineering');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const manualSignOutRef = useRef(false);
  const activeEmailRef = useRef<string | null>(null);

  const supabaseConfigured = isSupabaseClientConfigured();
  const effectiveRole: UserRole = userEmail ? authenticatedRole : localPreviewMode ? previewRole : 'public_visitor';

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Internal Workbench (Restricted) — PAWAN SHAKTI',
        description: 'Authenticated Pawan Shakti engineering, CRM, KPI, financial, and data room workbench.',
      },
      '/admin'
    );

    const client = getSupabaseClient();
    if (!client) return;

    const syncSession = async (
      session: { access_token: string; user?: { id: string; email?: string } } | null,
      event?: string
    ) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('recovery');
        setAuthNotice('Password recovery verified. Enter your new password below.');
      }
      if (session?.user?.email) {
        activeEmailRef.current = session.user.email;
        manualSignOutRef.current = false;
        setUserEmail(session.user.email);
        setAccessToken(session.access_token);
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        // Fail closed to least-privilege public_visitor when profile row is absent
        setAuthenticatedRole((profile?.role as UserRole) || 'public_visitor');
      } else {
        const droppedSession = Boolean(activeEmailRef.current) && !manualSignOutRef.current;
        activeEmailRef.current = null;
        setUserEmail(null);
        setAccessToken(null);
        setAuthenticatedRole('public_visitor');
        if (droppedSession || event === 'TOKEN_REFRESHED_FAILED') {
          setAuthNotice('Session expired or signed out — please authenticate again.');
        }
      }
    };

    client.auth.getSession().then(({ data }) => syncSession(data.session));
    const { data: listener } = client.auth.onAuthStateChange((evt, session) => {
      syncSession(session, evt);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    const client = getSupabaseClient();
    if (!client) {
      setAuthError('Supabase Auth is not configured locally. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setAuthError(error.message);
          return;
        }
        setUserEmail(data.user?.email || null);
        setAccessToken(data.session?.access_token || null);
        if (data.user?.id) {
          const { data: profile } = await client.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
          setAuthenticatedRole((profile?.role as UserRole) || 'public_visitor');
        }
      } else if (authMode === 'signup') {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data.session) {
          setAuthNotice('Account registered with fail-closed public_visitor role until founder role assignment.');
        } else {
          setAuthNotice('Verification email sent. Confirm your email address before signing in.');
          setAuthMode('signin');
        }
      } else if (authMode === 'reset') {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
          setAuthError(error.message);
          return;
        }
        setAuthNotice('Password reset instructions sent if this email exists in Supabase Auth.');
      } else if (authMode === 'recovery') {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
          setAuthError(error.message);
          return;
        }
        setNewPassword('');
        setAuthMode('signin');
        setAuthNotice('Password updated cleanly. You may continue with your session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    manualSignOutRef.current = true;
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    activeEmailRef.current = null;
    setUserEmail(null);
    setAccessToken(null);
    setAuthenticatedRole('public_visitor');
    setLocalPreviewMode(false);
    setAuthNotice('Signed out cleanly.');
  };

  const isAuthorizedAuthenticated = Boolean(userEmail) && canAccessAdminRoute(authenticatedRole);
  const showWorkbench = isAuthorizedAuthenticated || (!userEmail && localPreviewMode);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Auth Control */}
      <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-5 no-print">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#0B2B22] p-2.5 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#141A18]">Pawan Shakti Internal Workbench</h1>
              <p className="text-xs text-[#434E4A]">
                Role-gated platform for Engineering Telemetry, 17-Stage CRM, North Star KPIs, BOM/LCOE &amp; Private Data Room.
              </p>
            </div>
          </div>

          {(Boolean(userEmail) || showWorkbench) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg border border-[#DDE2DC] bg-[#F6F7F4] px-2.5 py-1 font-mono">
                Role: {ROLE_LABELS[effectiveRole]}
              </span>
              {!userEmail && localPreviewMode && (
                <select
                  value={previewRole}
                  onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                  aria-label="Inspect RBAC visibility by role"
                  className="rounded-lg border border-[#DDE2DC] bg-white px-2.5 py-1 font-mono text-xs"
                >
                  <option value="founder_super_admin">Preview: Founder / Super Admin</option>
                  <option value="engineering_admin">Preview: Engineering Admin</option>
                  <option value="crm_admin">Preview: CRM Admin</option>
                  <option value="team_member">Preview: Team Member (Restricted)</option>
                  <option value="external_reviewer">Preview: External V3F Reviewer</option>
                </select>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-[#DDE2DC] px-2.5 py-1 font-semibold text-[#141A18] hover:bg-[#F6F7F4]"
              >
                {userEmail ? 'Sign Out' : 'Exit Local Inspector'}
              </button>
            </div>
          )}
        </div>

        {!supabaseConfigured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 max-w-3xl">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <strong>Unconfigured Cloud Auth / DB State:</strong> `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are
                not configured in this environment. Server writes to `/api/admin` &amp; `/api/inquiries` enforce strict HTTP
                `401`/`503` rejection—zero login bypasses or fake DB saves exist.
              </div>
            </div>
            {!showWorkbench && (
              <button
                type="button"
                onClick={() => setLocalPreviewMode(true)}
                className="rounded-xl border border-amber-800/30 bg-white px-3 py-1.5 font-semibold text-amber-950 hover:bg-amber-100"
              >
                Inspect Offline UI &amp; RBAC Views
              </button>
            )}
          </div>
        )}

        {Boolean(userEmail) && !isAuthorizedAuthenticated && authMode !== 'recovery' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-950 space-y-1.5">
            <div className="font-semibold">Unauthorized / Role Pending Assignment ({userEmail})</div>
            <p>
              Your account currently holds the default least-privilege role <code>public_visitor</code>. Internal
              workbench routes require explicit <code>founder_super_admin</code> role elevation in{' '}
              <code>public.profiles</code>. Client browser overrides are blocked at both PostgreSQL RLS and serverless API layers.
            </p>
          </div>
        )}

        {(!userEmail || authMode === 'recovery') && !localPreviewMode && (
          <div className="max-w-md space-y-4">
            {authMode !== 'recovery' && (
              <div className="flex gap-1.5 text-xs" role="tablist" aria-label="Authentication mode">
                {(
                  [
                    ['signin', 'Sign In'],
                    ['signup', 'Sign Up'],
                    ['reset', 'Reset Password'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={authMode === mode}
                    onClick={() => {
                      setAuthMode(mode);
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                      authMode === mode
                        ? 'bg-[#0B2B22] text-white'
                        : 'border border-[#DDE2DC] bg-white text-[#141A18] hover:bg-[#F6F7F4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-sm">
              {authMode === 'signup' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#141A18]">Full Name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2"
                  />
                </label>
              )}

              {authMode !== 'recovery' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#141A18]">Authorized Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2"
                  />
                </label>
              )}

              {(authMode === 'signin' || authMode === 'signup') && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#141A18]">Password</span>
                  <input
                    type="password"
                    required
                    minLength={authMode === 'signup' ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2"
                  />
                </label>
              )}

              {authMode === 'recovery' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#141A18]">New Password (min 8 chars)</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2"
                  />
                </label>
              )}

              {authError && <p className="text-xs text-red-700">{authError}</p>}
              {authNotice && <p className="text-xs text-emerald-800">{authNotice}</p>}

              <button
                type="submit"
                disabled={loading || !supabaseConfigured}
                className="rounded-xl bg-[#0B2B22] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? 'Processing...'
                  : authMode === 'signup'
                  ? 'Register Account (Fail-Closed)'
                  : authMode === 'reset'
                  ? 'Send Password Reset Email'
                  : authMode === 'recovery'
                  ? 'Update Password'
                  : 'Sign In via Supabase Auth'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Role-Scoped Workbench Tabs */}
      {showWorkbench && (
        <>
          <div className="flex flex-wrap gap-2 no-print" role="tablist" aria-label="Internal workbench sections">
            {[
              { id: 'engineering' as const, label: 'Engineering & Telemetry' },
              { id: 'crm' as const, label: 'CRM & Pilot Pipeline' },
              { id: 'founder_os' as const, label: 'KPIs, Monthly PDF, BOM & Roadmap' },
              { id: 'grants_dataroom' as const, label: 'Grants, Data Room & RBAC' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === t.id
                    ? 'bg-[#0B2B22] text-white'
                    : 'border border-[#DDE2DC] bg-white text-[#141A18] hover:bg-[#F6F7F4]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'engineering' && (
            <EngineeringWorkbenchTab
              canEdit={isAuthorizedAuthenticated ? hasPermission(effectiveRole, 'edit_engineering_records') : false}
              accessToken={accessToken}
            />
          )}
          {activeTab === 'crm' && (
            <CrmPipelineTab
              canView={hasPermission(effectiveRole, 'view_crm')}
              canEdit={isAuthorizedAuthenticated ? hasPermission(effectiveRole, 'edit_crm') : false}
              accessToken={accessToken}
            />
          )}
          {activeTab === 'founder_os' && (
            <FounderOperatingTab
              canViewFinancials={hasPermission(effectiveRole, 'view_financials_bom')}
              canEditFinancials={isAuthorizedAuthenticated ? hasPermission(effectiveRole, 'edit_financials_bom') : false}
              canManageReports={isAuthorizedAuthenticated ? hasPermission(effectiveRole, 'manage_cms_and_roles') : false}
              accessToken={accessToken}
            />
          )}
          {activeTab === 'grants_dataroom' && (
            <GrantsDataRoomTab
              canViewDataRoom={hasPermission(effectiveRole, 'view_grants_dataroom')}
              canManageCms={isAuthorizedAuthenticated ? hasPermission(effectiveRole, 'manage_cms_and_roles') : false}
              canViewAudit={hasPermission(effectiveRole, 'view_audit_logs')}
              canViewPrivateDocs={hasPermission(effectiveRole, 'view_private_documents')}
              accessToken={accessToken}
            />
          )}
        </>
      )}
    </div>
  );
};
