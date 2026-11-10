import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { APPLICATION_SEGMENTS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { trackAnalyticsEvent } from '../lib/analytics.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

const pilotFormSchema = z.object({
  organizationName: z.string().trim().min(2, 'Organization / site name is required.'),
  contactName: z.string().trim().min(2, 'Contact person name is required.'),
  email: z.string().trim().email('Valid email address is required.'),
  phone: z.string().trim().optional(),
  siteLocation: z.string().trim().min(2, 'Site city/region is required.'),
  applicationType: z.string().trim().min(2),
  roofOrLandType: z.string().trim().min(2),
  availableMountingAreaSqM: z.number().nonnegative().optional(),
  hasExistingSolar: z.boolean(),
  hasExistingBatteryOrInverter: z.boolean(),
  approximateWindInfo: z.string().trim().optional(),
  energyRequirementKwhDay: z.number().nonnegative().optional(),
  desiredTimeline: z.string().trim().min(2),
  additionalComments: z.string().trim().optional(),
  consentToContact: z.literal(true, {
    errorMap: () => ({ message: 'Explicit permission to contact is required before submitting.' }),
  }),
});

export const PilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSegment = searchParams.get('segment') || APPLICATION_SEGMENTS[2].title;

  const [form, setForm] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    siteLocation: '',
    applicationType: initialSegment,
    roofOrLandType: 'Open ground / tower structure',
    availableMountingAreaSqM: 4,
    hasExistingSolar: false,
    hasExistingBatteryOrInverter: false,
    approximateWindInfo: '',
    energyRequirementKwhDay: 1.5,
    desiredTimeline: 'Within 3–6 months (Post-TRL 5/6 readiness)',
    additionalComments: '',
    consentToContact: false,
    honeypot: '',
  });

  const [formStarted, setFormStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitOutcome, setSubmitOutcome] = useState<{
    status: 'saved' | 'unconfigured' | 'error';
    referenceCode?: string;
    message: string;
    emailStatus?: string;
  } | null>(null);

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Pilot Program & Site Suitability Assessment — PAWAN SHAKTI',
        description:
          'Apply for a Pawan Shakti engineering pilot assessment. Honest TRL 4/5 evaluation scope, site safety rules, and validated assessment workflow.',
      },
      '/pilot'
    );
  }, []);

  const markStarted = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackAnalyticsEvent('pilot_form_start', '/pilot');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSubmitOutcome(null);

    const parsed = pilotFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pilot_application', ...form }),
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.status === 201 && data.referenceCode) {
        trackAnalyticsEvent('pilot_form_submit', '/pilot', { status: 'saved' });
        setSubmitOutcome({
          status: 'saved',
          referenceCode: data.referenceCode,
          emailStatus: data.notificationStatus,
          message: `Application stored in Pawan Shakti CRM under reference ${data.referenceCode}. Note: final site suitability depends on verified on-site wind & structural survey.`,
        });
      } else if (resp.status === 503) {
        setSubmitOutcome({
          status: 'unconfigured',
          message:
            data.message ||
            'Backend Supabase database credentials are not configured on this server. Per strict non-simulation policy, no application was faked or silently discarded. Use direct founder email koyaneniyaswanth@gmail.com or configure server env vars.',
        });
      } else {
        setSubmitOutcome({
          status: 'error',
          message: data.error || `Submission rejected with HTTP ${resp.status}.`,
        });
      }
    } catch {
      setSubmitOutcome({
        status: 'unconfigured',
        message:
          'API server unreachable or database unconfigured in standalone preview. Please configure Vercel/Supabase environment variables or email koyaneniyaswanth@gmail.com.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge tier="DESIGN_TARGET" />
          <EvidenceBadge tier="FUTURE_ROADMAP" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">
          Pawan Shakti Engineering Pilot Program &amp; Site Assessment
        </h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          Structured collaboration framework evaluating pre-commercial installations. No free installations, guaranteed output,
          or commercial warranties are promised prior to joint technical scoping and signed LOI/MoU agreements.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Program Terms & Scope */}
        <aside className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-4 text-xs leading-relaxed text-[#434E4A]">
            <h2 className="font-display text-lg font-bold text-[#141A18]">How the Pilot Process Works</h2>
            <ul className="space-y-2">
              <li>
                <strong>Who Can Apply:</strong> Institutional campuses, telecom tower operators, industrial facilities,
                remote telemetry integrators, and R&amp;D solar-hybrid testbeds.
              </li>
              <li>
                <strong>Site Suitability Truth Rule:</strong> City name alone never determines suitability. Qualified sites
                undergo anemometer assessment, mounting clearance checks, and electrical isolation review.
              </li>
              <li>
                <strong>Shared Responsibilities:</strong> Host provides safe mounting access, isolated test load/battery bus,
                and permissions; Pawan Shakti leads hardware integration, instrumentation logging, and safety inspections.
              </li>
              <li>
                <strong>Duration &amp; Telemetry Criteria:</strong> Planned 30–90 day monitored evaluation capturing binned
                wind-speed power curves, vibration, downtime, and post-pilot wear teardown.
              </li>
            </ul>
          </div>
        </aside>

        {/* Application Form */}
        <section className="rounded-2xl border border-[#DDE2DC] bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-xl font-bold text-[#141A18]">Apply for a Pilot Assessment</h2>
          <p className="mt-1 text-xs text-[#434E4A]">
            All submissions undergo server-side validation and generate a tracked CRM pipeline reference when Supabase DB is active.
          </p>

          <form onSubmit={handleSubmit} onFocus={markStarted} className="mt-5 space-y-4 text-sm" noValidate>
            {/* Invisible anti-spam honeypot */}
            <input
              type="text"
              name="website_url"
              value={form.honeypot}
              onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Organization / Site Name *</span>
                <input
                  required
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Contact Person *</span>
                <input
                  required
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Email *</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Phone (Optional)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Site Location (City / State) *</span>
                <input
                  required
                  type="text"
                  value={form.siteLocation}
                  onChange={(e) => setForm({ ...form, siteLocation: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Application Segment</span>
                <select
                  value={form.applicationType}
                  onChange={(e) => setForm({ ...form, applicationType: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm bg-white"
                >
                  {APPLICATION_SEGMENTS.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Roof / Land Mounting Type</span>
                <select
                  value={form.roofOrLandType}
                  onChange={(e) => setForm({ ...form, roofOrLandType: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm bg-white"
                >
                  <option>Open ground / tower structure</option>
                  <option>Concrete institutional/commercial rooftop parapet</option>
                  <option>Agricultural pole / perimeter frame</option>
                  <option>Other custom test rig</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Available Area (m²)</span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.availableMountingAreaSqM}
                  onChange={(e) => setForm({ ...form, availableMountingAreaSqM: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Target Load Demand (kWh/day)</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.energyRequirementKwhDay}
                  onChange={(e) => setForm({ ...form, energyRequirementKwhDay: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-[#141A18]">Desired Pilot Timeline</span>
                <select
                  value={form.desiredTimeline}
                  onChange={(e) => setForm({ ...form, desiredTimeline: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm bg-white"
                >
                  <option>Immediate Discovery / Site Audit</option>
                  <option>Within 3–6 months (Post-TRL 5/6 readiness)</option>
                  <option>6–12 months exploratory</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-[#141A18]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hasExistingSolar}
                  onChange={(e) => setForm({ ...form, hasExistingSolar: e.target.checked })}
                />
                Existing Solar PV installed at site
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hasExistingBatteryOrInverter}
                  onChange={(e) => setForm({ ...form, hasExistingBatteryOrInverter: e.target.checked })}
                />
                Existing Battery / Inverter bus available
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#141A18]">Approximate Local Wind Data / Anemometer Notes</span>
              <input
                type="text"
                placeholder="e.g., Coastal corridor 4-5 m/s evenings or No anemometer data yet"
                value={form.approximateWindInfo}
                onChange={(e) => setForm({ ...form, approximateWindInfo: e.target.value })}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#141A18]">Additional Engineering Notes / Constraints</span>
              <textarea
                rows={3}
                value={form.additionalComments}
                onChange={(e) => setForm({ ...form, additionalComments: e.target.value })}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-start gap-2.5 text-xs text-[#434E4A]">
              <input
                type="checkbox"
                checked={form.consentToContact}
                onChange={(e) => setForm({ ...form, consentToContact: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                I grant Pawan Shakti permission to contact me regarding this technical pilot assessment and understand
                site suitability requires physical wind &amp; structural verification. *
              </span>
            </label>

            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
                {errors.map((err) => (
                  <p key={err}>• {err}</p>
                ))}
              </div>
            )}

            {submitOutcome && (
              <div
                role="status"
                className={`rounded-xl border p-4 text-xs flex items-start gap-2.5 ${
                  submitOutcome.status === 'saved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : submitOutcome.status === 'unconfigured'
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-red-200 bg-red-50 text-red-900'
                }`}
              >
                {submitOutcome.status === 'saved' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-semibold">
                    {submitOutcome.status === 'saved'
                      ? `Pilot Reference: ${submitOutcome.referenceCode}`
                      : submitOutcome.status === 'unconfigured'
                        ? 'Cloud Persistence Not Configured in This Environment (Honest HTTP 503)'
                        : 'Submission Error'}
                  </div>
                  <p>{submitOutcome.message}</p>
                  {submitOutcome.emailStatus && (
                    <p className="font-mono text-[11px]">Email dispatch status: {submitOutcome.emailStatus}</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#0B2B22] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#144537] disabled:opacity-60"
            >
              {submitting ? 'Validating & Submitting...' : 'Submit Pilot Site Assessment'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
