import React, { useEffect, useState } from 'react';
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

export const CrmPipelineTab: React.FC<{ canView: boolean; canEdit: boolean; accessToken?: string | null }> = ({
  canView,
  canEdit,
  accessToken,
}) => {
  // Strictly starts at 0 verified leads / 0 surveys / 0 LOIs until real CRM records are added or fetched from DB
  const [leads, setLeads] = useState<CrmLeadRecord[]>([]);
  const [newOrg, setNewOrg] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSegment, setNewSegment] = useState('Telecom Infrastructure');
  const [statusNotice, setStatusNotice] = useState('0 verified CRM leads loaded locally. Never displays synthetic interview or LOI metrics.');

  useEffect(() => {
    if (!canView || !accessToken) return;
    let active = true;
    (async () => {
      try {
        const resp = await fetch('/api/inquiries', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!active || !resp.ok) return;
        const data = await resp.json();
        const orgMap = new Map((data.organizations || []).map((o: any) => [o.id, o]));
        const contactMap = new Map((data.contacts || []).map((c: any) => [c.id, c]));
        const loaded: CrmLeadRecord[] = (data.leads || []).map((l: any) => {
          const org: any = orgMap.get(l.organization_id);
          const contact: any = contactMap.get(l.contact_id);
          return {
            id: l.id,
            referenceCode: l.pilot_application_id || String(l.id).slice(0, 8),
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            stage: l.stage || 'New inquiry',
            owner: l.owner_email || 'Koyaneni Yaswanth',
            customerSegment: l.customer_segment || 'General',
            organizationName: org?.name || 'Organization',
            contactName: contact?.full_name || 'Contact',
            email: contact?.email || '',
            siteLocation: org?.city || 'TBD',
            applicationType: l.customer_segment || 'General',
            roofOrLandType: 'TBD',
            hasExistingSolar: false,
            hasExistingBatteryOrInverter: false,
            desiredTimeline: 'TBD',
            consentToContact: Boolean(contact?.consent_to_contact ?? true),
            discoveryNotes: '',
            painPoints: l.pain_points || '',
            currentEnergyCostInrKwh: l.current_energy_cost_inr_kwh ?? null,
            followUpDate: l.follow_up_date || null,
            nextAction: l.next_action || '',
            surveyScheduledAt: null,
            proposalRef: null,
            loiRef: null,
            linkedTurbineId: null,
            notificationStatus: 'queued_provider_unconfigured',
          };
        });
        setLeads(loaded);
        setStatusNotice(`Loaded ${loaded.length} verified CRM leads from Supabase.`);
      } catch {
        if (active) setStatusNotice('Unable to reach /api/inquiries in current environment.');
      }
    })();
    return () => {
      active = false;
    };
  }, [canView, accessToken]);

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

    if (accessToken) {
      const resp = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          type: 'pilot_application',
          organizationName: newOrg.trim(),
          contactName: newContact.trim(),
          email: newEmail.trim(),
          siteLocation: 'Discovery Logged',
          applicationType: newSegment,
          roofOrLandType: 'Pending Survey',
          consentToContact: true,
        }),
      });
      const resJson = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatusNotice(resJson.error || `Failed to save lead (HTTP ${resp.status}).`);
        return;
      }
      setStatusNotice(`Saved real CRM lead under ${resJson.referenceCode}.`);
    }

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
  };

  const updateStage = async (id: string, nextStage: PipelineStage) => {
    if (!canEdit) return;
    if (accessToken) {
      try {
        const resp = await fetch('/api/inquiries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ leadId: id, toStage: nextStage }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setStatusNotice(`Stage update failed: ${err.error || `HTTP ${resp.status}`}`);
          return;
        }
        setStatusNotice(`Updated CRM stage cleanly to "${nextStage}".`);
      } catch {
        setStatusNotice('Network error updating CRM stage in Supabase.');
        return;
      }
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: nextStage, updatedAt: new Date().toISOString() } : l))
    );
  };

  const interviewCount = leads.filter((l) => l.stage !== 'New inquiry' && l.stage !== 'Qualified').length;
  const surveyCount = leads.filter((l) => l.stage.includes('survey')).length;
  const proposalCount = leads.filter((l) => l.stage.includes('Proposal')).length;
  const loiSignedCount = leads.filter((l) => l.stage === 'LOI signed').length;
  const activePilotsCount = leads.filter((l) => l.stage === 'Pilot active' || l.stage === 'Pilot installed').length;
  const wonCount = leads.filter((l) => l.stage === 'Won').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-xs">
        {[
          ['Prospects', String(leads.length)],
          ['Interviews', String(interviewCount)],
          ['Site Surveys', String(surveyCount)],
          ['Proposals', String(proposalCount)],
          ['LOIs Signed', String(loiSignedCount)],
          ['Active Pilots', String(activePilotsCount)],
          ['Orders Won', String(wonCount)],
          ['Revenue', '₹0'],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl border border-[#DDE2DC] bg-white p-3">
            <div className="text-[#434E4A]">{label}</div>
            <div className="mt-1 font-mono text-lg font-bold text-[#141A18]">{val}</div>
          </div>
        ))}
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
