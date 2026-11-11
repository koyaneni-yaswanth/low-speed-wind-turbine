import React, { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { DATA_ROOM_CHECKLIST, INITIAL_GRANT_SCHEMES, RESOURCE_DOCUMENTS } from '../../data/pawanShaktiData.ts';
import type { ResourceDocumentItem } from '../../types/index.ts';
import { getTrackedEvents } from '../../lib/analytics.ts';
import { getSupabaseClient } from '../../lib/supabase.ts';
import { ROLE_LABELS, hasPermission } from '../../lib/authAndRbac.ts';
import type { UserRole } from '../../types/index.ts';

export const GrantsDataRoomTab: React.FC<{
  canViewDataRoom: boolean;
  canManageCms: boolean;
  canViewAudit: boolean;
  canViewPrivateDocs?: boolean;
  accessToken?: string | null;
}> = ({ canViewDataRoom, canManageCms, canViewAudit, canViewPrivateDocs = false, accessToken }) => {
  const [docs, setDocs] = useState<ResourceDocumentItem[]>(RESOURCE_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [privateFiles, setPrivateFiles] = useState<Array<{ name: string; id?: string | null }>>([]);
  const [storageNotice, setStorageNotice] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'Published Indian Patent Documents (+ Official Application No.)': true,
    'Real Prototype Photographs (Mark-3 / Mark-4 / Mark-5)': true,
  });

  const analyticsEvents = getTrackedEvents();

  useEffect(() => {
    if (!canViewDataRoom || !accessToken) return;
    let active = true;
    (async () => {
      try {
        const resp = await fetch('/api/admin?action=grants_dataroom', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (active && resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.documents) && data.documents.length > 0) {
            setDocs(
              data.documents.map((d: any) => ({
                id: d.id,
                title: d.title,
                category: d.category,
                version: d.version,
                visibility: d.visibility,
                url: d.external_url || null,
                sourcePath: d.storage_path || '',
                publishedAt: d.created_at || '',
                summary: d.summary || '',
                evidenceTier: d.evidence_tier || 'ENGINEERING_ESTIMATE',
              }))
            );
          }
        }
        if (canViewAudit) {
          const aResp = await fetch('/api/admin?action=audit_logs', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (active && aResp.ok) {
            const aData = await aResp.json();
            if (Array.isArray(aData.auditLogs)) setAuditLogs(aData.auditLogs);
          }
        }
        const client = getSupabaseClient();
        if (client && canViewPrivateDocs) {
          const { data: listed, error: listErr } = await client.storage.from('dataroom-private').list('', { limit: 50 });
          if (active && !listErr && Array.isArray(listed)) {
            setPrivateFiles(
              listed
                .filter((f) => f.name !== '.emptyFolderPlaceholder')
                .map((f) => ({ name: f.name, id: f.id }))
            );
          }
        }
      } catch {
        // offline gracefully handled
      }
    })();
    return () => {
      active = false;
    };
  }, [canViewDataRoom, canViewAudit, canViewPrivateDocs, accessToken]);

  const handleUploadPrivateFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const client = getSupabaseClient();
    if (!file || !client || !canManageCms) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { error } = await client.storage.from('dataroom-private').upload(safeName, file, { upsert: true });
    if (error) {
      setStorageNotice(`Upload denied or failed: ${error.message}`);
      return;
    }
    setStorageNotice(`Uploaded "${safeName}" securely to private bucket dataroom-private.`);
    setPrivateFiles((prev) => [{ name: safeName }, ...prev.filter((f) => f.name !== safeName)]);
  };

  const handleOpenSignedUrl = async (name: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    const { data, error } = await client.storage.from('dataroom-private').createSignedUrl(name, 120);
    if (error || !data?.signedUrl) {
      setStorageNotice(`Signed URL denied: ${error?.message || 'Unauthorized'}`);
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (!canViewDataRoom) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-900">
        Access Denied: Your role lacks Data Room permissions.
      </div>
    );
  }

  const toggleDocVisibility = async (id: string) => {
    if (!canManageCms) return;
    const current = docs.find((d) => d.id === id);
    const nextVis = current?.visibility === 'public' ? 'private' : 'public';
    if (accessToken) {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action: 'toggle_document_visibility', id, visibility: nextVis }),
      }).catch(() => {});
    }
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, visibility: nextVis } : d)));
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
          {canViewPrivateDocs && (
            <div className="border-t border-[#DDE2DC] pt-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#141A18]">Confidential Bucket (`dataroom-private`)</span>
                {canManageCms && accessToken && (
                  <label className="cursor-pointer rounded-lg border border-[#0B2B22] px-2.5 py-1 font-semibold text-[#0B2B22]">
                    Upload Confidential Doc
                    <input type="file" onChange={handleUploadPrivateFile} className="sr-only" />
                  </label>
                )}
              </div>
              {storageNotice && <p className="font-mono text-[11px] text-[#0B2B22]">{storageNotice}</p>}
              {privateFiles.length === 0 ? (
                <p className="text-[11px] text-[#434E4A]">0 private storage objects listed (or offline).</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {privateFiles.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleOpenSignedUrl(f.name)}
                      className="rounded border border-[#DDE2DC] bg-[#F6F7F4] px-2 py-1 font-mono text-[10px] text-[#141A18] hover:bg-emerald-50"
                    >
                      {f.name} (Signed URL)
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <div className="rounded-xl border border-[#DDE2DC] p-3 text-[#434E4A] space-y-1">
              <div>
                <strong>Database Audit Trail:</strong>{' '}
                {auditLogs.length > 0
                  ? `${auditLogs.length} immutable audit records fetched.`
                  : 'Connect Supabase Auth JWT to load persisted audit_logs from GET /api/admin?action=audit_logs.'}
              </div>
              <div className="font-mono text-[10px]">
                IPO Patent Record: &ldquo;Compact Wind Turbine with Planetary Gears&rdquo; (Published 2025 — Under Examination / NOT GRANTED)
              </div>
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
