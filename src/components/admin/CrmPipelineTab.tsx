import React, { useState } from 'react';
import type { CrmLeadRecord, PipelineStage } from '../../types/index.ts';

const ALL_STAGES: PipelineStage[] = [
  'New inquiry',
  'Qualified',
  'Discovery scheduled',
  'Site survey pending',
  'Site survey completed',
  'Technical evaluation',
  'Proposal sent',
  'LOI under review',
  'LOI signed',
  'Pilot approved',
  'Pilot installed',
  'Pilot active',
  'Pilot completed',
  'Commercial negotiation',
  'Won',
  'Lost',
  'On hold',
];

export const CrmPipelineTab: React.FC<{ canView: boolean; canEdit: boolean }> = ({ canView, canEdit }) => {
  // Strictly starts at 0 verified leads / 0 surveys / 0 LOIs until real CRM records are added or fetched from DB
  const [leads, setLeads] = useState<CrmLeadRecord[]>([]);
  const [newOrg, setNewOrg] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSegment, setNewSegment] = useState('Telecom Infrastructure');
  const [statusNotice, setStatusNotice] = useState('0 verified CRM leads loaded locally. Never displays synthetic interview or LOI metrics.');

  if (!canView) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-900">
        Access Restricted: Your current role does not hold <code>view_crm</code> permission. Customer PII and CRM
        records are hidden under least-privilege RBAC.
      </div>
    );
  }

  const handleAddVerifiedRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newOrg.trim() || !newContact.trim() || !newEmail.trim()) return;

    const record: CrmLeadRecord = {
      id: `crm-${Date.now()}`,
      referenceCode: `PS-CRM-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stage: 'New inquiry',
      owner: 'Koyaneni Yaswanth',
      customerSegment: newSegment,
      organizationName: newOrg.trim(),
      contactName: newContact.trim(),
      email: newEmail.trim(),
      siteLocation: 'TBD',
      applicationType: newSegment,
      roofOrLandType: 'TBD',
      hasExistingSolar: false,
      hasExistingBatteryOrInverter: false,
      desiredTimeline: 'TBD',
      consentToContact: true,
      discoveryNotes: '',
      painPoints: '',
      currentEnergyCostInrKwh: null,
      followUpDate: null,
      nextAction: 'Schedule initial discovery interview',
      surveyScheduledAt: null,
      proposalRef: null,
      loiRef: null,
      linkedTurbineId: null,
      notificationStatus: 'queued_provider_unconfigured',
    };
    setLeads((prev) => [record, ...prev]);
    setNewOrg('');
    setNewContact('');
    setNewEmail('');
    setStatusNotice(`Added lead ${record.referenceCode} in session state (requires authenticated Supabase sync for persistence).`);
  };

  const updateStage = (id: string, nextStage: PipelineStage) => {
    if (!canEdit) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: nextStage, updatedAt: new Date().toISOString() } : l))
    );
  };

  const surveyCount = leads.filter((l) => l.stage.includes('survey')).length;
  const loiSignedCount = leads.filter((l) => l.stage === 'LOI signed').length;
  const wonCount = leads.filter((l) => l.stage === 'Won').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
          <div className="text-[#434E4A]">Verified Discovery / Leads</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#141A18]">{leads.length}</div>
        </div>
        <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
          <div className="text-[#434E4A]">Site Surveys</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#141A18]">{surveyCount}</div>
        </div>
        <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
          <div className="text-[#434E4A]">LOIs Signed</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#141A18]">{loiSignedCount}</div>
        </div>
        <div className="rounded-xl border border-[#DDE2DC] bg-white p-4">
          <div className="text-[#434E4A]">Commercial Orders Won</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#141A18]">{wonCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
        <h3 className="font-display text-base font-bold text-[#141A18]">Customer Acquisition Pipeline (17 Stages)</h3>
        <p className="text-xs text-[#434E4A]">{statusNotice}</p>

        {canEdit && (
          <form onSubmit={handleAddVerifiedRecord} className="grid gap-2 sm:grid-cols-5 text-xs">
            <input
              type="text"
              placeholder="Organization"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              className="rounded-lg border border-[#DDE2DC] px-2.5 py-1.5"
            />
            <input
              type="text"
              placeholder="Contact Name"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className="rounded-lg border border-[#DDE2DC] px-2.5 py-1.5"
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-lg border border-[#DDE2DC] px-2.5 py-1.5"
            />
            <select
              value={newSegment}
              onChange={(e) => setNewSegment(e.target.value)}
              className="rounded-lg border border-[#DDE2DC] px-2 py-1.5 bg-white"
            >
              <option>Telecom Infrastructure</option>
              <option>Institutional Campuses</option>
              <option>Off-Grid Monitoring Stations</option>
              <option>Commercial &amp; Industrial Facilities</option>
            </select>
            <button type="submit" className="rounded-lg bg-[#0B2B22] px-3 py-1.5 font-semibold text-white">
              Log Real Lead
            </button>
          </form>
        )}

        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DDE2DC] bg-[#F6F7F4] p-6 text-center text-xs text-[#434E4A]">
            No verified customer discovery leads recorded yet. Submit a Pilot Application or log a completed customer discovery interview above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DDE2DC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F7F4]">
                <tr>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Pipeline Stage</th>
                  <th className="px-3 py-2">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE2DC]">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-3 py-2 font-mono">{l.referenceCode}</td>
                    <td className="px-3 py-2 font-semibold">{l.organizationName}</td>
                    <td className="px-3 py-2">
                      {l.contactName} ({l.email})
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={l.stage}
                        disabled={!canEdit}
                        onChange={(e) => updateStage(l.id, e.target.value as PipelineStage)}
                        className="rounded border border-[#DDE2DC] px-2 py-1 text-xs bg-white"
                      >
                        {ALL_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-[#434E4A]">{l.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
