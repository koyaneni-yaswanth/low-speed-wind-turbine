import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { DATA_ROOM_CHECKLIST, INITIAL_GRANT_SCHEMES, RESOURCE_DOCUMENTS } from '../../data/pawanShaktiData.ts';
import type { ResourceDocumentItem } from '../../types/index.ts';
import { getTrackedEvents } from '../../lib/analytics.ts';
import { ROLE_LABELS, hasPermission } from '../../lib/authAndRbac.ts';
import type { UserRole } from '../../types/index.ts';

export const GrantsDataRoomTab: React.FC<{
  canViewDataRoom: boolean;
  canManageCms: boolean;
  canViewAudit: boolean;
}> = ({ canViewDataRoom, canManageCms, canViewAudit }) => {
  const [docs, setDocs] = useState<ResourceDocumentItem[]>(RESOURCE_DOCUMENTS);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'Published Indian Patent Documents (+ Official Application No.)': true,
    'Real Prototype Photographs (Mark-3 / Mark-4 / Mark-5)': true,
  });

  const analyticsEvents = getTrackedEvents();

  if (!canViewDataRoom) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-900">
        Access Denied: Your role lacks Data Room permissions.
      </div>
    );
  }

  const toggleDocVisibility = (id: string) => {
    if (!canManageCms) return;
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, visibility: d.visibility === 'public' ? 'private' : 'public' } : d))
    );
  };

  return (
    <div className="space-y-8">
      {/* Grant Tracker */}
      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-[#141A18]">Grant Pipeline &amp; Eligibility Verification</h3>
          <p className="text-xs text-[#434E4A]">
            Listing a scheme never implies eligibility or approval. Confirm open calls and sanction orders directly against official agency portals.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F7F4]">
              <tr>
                <th className="px-3 py-2">Scheme</th>
                <th className="px-3 py-2">Agency</th>
                <th className="px-3 py-2">Eligibility / Gap Check</th>
                <th className="px-3 py-2">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE2DC]">
              {INITIAL_GRANT_SCHEMES.map((g) => (
                <tr key={g.id}>
                  <td className="px-3 py-2 font-semibold text-[#141A18]">{g.name}</td>
                  <td className="px-3 py-2 text-[#434E4A]">{g.agency}</td>
                  <td className="px-3 py-2 text-[#434E4A]">{g.eligibilityStatus}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{g.applicationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 15-Item Data Room Checklist + CMS Visibility Controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#141A18]">
            15-Item Incubator &amp; Grant Data Room Checklist
          </h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto text-xs">
            {DATA_ROOM_CHECKLIST.map((item) => (
              <label key={item} className="flex items-start gap-2 rounded-lg border border-[#DDE2DC] bg-[#F6F7F4] p-2">
                <input
                  type="checkbox"
                  checked={Boolean(checkedItems[item])}
                  onChange={(e) => setCheckedItems({ ...checkedItems, [item]: e.target.checked })}
                  className="mt-0.5"
                />
                <span className={checkedItems[item] ? 'text-[#141A18] font-medium' : 'text-[#434E4A]'}>{item}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#141A18]">Document Visibility &amp; Classification</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#DDE2DC] p-2.5">
                <div className="min-w-0">
                  <div className="font-semibold text-[#141A18] truncate">{doc.title}</div>
                  <div className="font-mono text-[10px] text-[#434E4A]">{doc.category} • {doc.version}</div>
                </div>
                <button
                  type="button"
                  disabled={!canManageCms}
                  onClick={() => toggleDocVisibility(doc.id)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] shrink-0 ${
                    doc.visibility === 'private'
                      ? 'bg-stone-100 text-stone-800 border border-stone-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {doc.visibility === 'private' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {doc.visibility}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RBAC Matrix & Privacy Analytics / Audit Log Readout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#141A18]">Least-Privilege RBAC Policy Matrix</h3>
          <div className="overflow-x-auto text-[11px] font-mono">
            <table className="w-full text-left border border-[#DDE2DC]">
              <thead className="bg-[#F6F7F4]">
                <tr>
                  <th className="p-2">Role</th>
                  <th className="p-2">Eng</th>
                  <th className="p-2">CRM</th>
                  <th className="p-2">Finance</th>
                  <th className="p-2">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE2DC]">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <tr key={role}>
                    <td className="p-2 font-sans font-semibold">{ROLE_LABELS[role]}</td>
                    <td className="p-2">{hasPermission(role, 'view_engineering_dashboard') ? 'YES' : 'NO'}</td>
                    <td className="p-2">{hasPermission(role, 'view_crm') ? 'YES' : 'NO'}</td>
                    <td className="p-2">{hasPermission(role, 'view_financials_bom') ? 'YES' : 'NO'}</td>
                    <td className="p-2">{hasPermission(role, 'view_audit_logs') ? 'YES' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-3 text-xs">
          <h3 className="font-display text-base font-bold text-[#141A18]">
            Analytics Funnel &amp; Audit Events
          </h3>
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-3">
            <strong>Opt-In Browser Events Captured:</strong> {analyticsEvents.length}{' '}
            <span className="text-[#434E4A]">(zero PII stored)</span>
          </div>
          {canViewAudit ? (
            <div className="rounded-xl border border-[#DDE2DC] p-3 text-[#434E4A]">
              Live database audit logs (`audit_logs`) require active authenticated Supabase JWT against <code>GET /api/admin?action=audit_logs</code>.
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Immutable audit logs restricted strictly to Founder / Super Admin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
