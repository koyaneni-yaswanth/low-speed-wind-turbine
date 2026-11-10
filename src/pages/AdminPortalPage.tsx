import React, { useEffect, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { getSupabaseClient, isSupabaseClientConfigured } from '../lib/supabase.ts';
import { ROLE_LABELS, hasPermission } from '../lib/authAndRbac.ts';
import type { UserRole } from '../types/index.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { EngineeringWorkbenchTab } from '../components/admin/EngineeringWorkbenchTab.tsx';
import { CrmPipelineTab } from '../components/admin/CrmPipelineTab.tsx';
import { FounderOperatingTab } from '../components/admin/FounderOperatingTab.tsx';
import { GrantsDataRoomTab } from '../components/admin/GrantsDataRoomTab.tsx';

type AdminTab = 'engineering' | 'crm' | 'founder_os' | 'grants_dataroom';

export const AdminPortalPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole>('public_visitor');
  const [localPreviewMode, setLocalPreviewMode] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole>('founder_super_admin');
  const [activeTab, setActiveTab] = useState<AdminTab>('engineering');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

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
    client.auth.getSession().then(async ({ data }) => {
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email);
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .maybeSingle();
        setAuthenticatedRole((profile?.role as UserRole) || 'team_member');
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const client = getSupabaseClient();
    if (!client) {
      setAuthError('Supabase Auth is not configured locally. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setUserEmail(data.user?.email || null);
    if (data.user?.id) {
      const { data: profile } = await client.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      setAuthenticatedRole((profile?.role as UserRole) || 'team_member');
    }
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setUserEmail(null);
    setAuthenticatedRole('public_visitor');
    setLocalPreviewMode(false);
  };

  const showWorkbench = Boolean(userEmail) || localPreviewMode;

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

          {showWorkbench && (
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

        {!userEmail && !localPreviewMode && (
          <form onSubmit={handleLogin} className="max-w-md space-y-3 text-sm">
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
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#141A18]">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2"
              />
            </label>
            {authError && <p className="text-xs text-red-700">{authError}</p>}
            <button
              type="submit"
              disabled={loading || !supabaseConfigured}
              className="rounded-xl bg-[#0B2B22] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In via Supabase Auth'}
            </button>
          </form>
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
              canEdit={userEmail ? hasPermission(effectiveRole, 'edit_engineering_records') : false}
            />
          )}
          {activeTab === 'crm' && (
            <CrmPipelineTab
              canView={hasPermission(effectiveRole, 'view_crm')}
              canEdit={userEmail ? hasPermission(effectiveRole, 'edit_crm') : false}
            />
          )}
          {activeTab === 'founder_os' && (
            <FounderOperatingTab canViewFinancials={hasPermission(effectiveRole, 'view_financials_bom')} />
          )}
          {activeTab === 'grants_dataroom' && (
            <GrantsDataRoomTab
              canViewDataRoom={hasPermission(effectiveRole, 'view_grants_dataroom')}
              canManageCms={userEmail ? hasPermission(effectiveRole, 'manage_cms_and_roles') : false}
              canViewAudit={hasPermission(effectiveRole, 'view_audit_logs')}
            />
          )}
        </>
      )}
    </div>
  );
};
