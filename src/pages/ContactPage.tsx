import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { applyRouteSeo } from '../lib/seo.ts';
import { trackAnalyticsEvent } from '../lib/analytics.ts';

const contactSchema = z.object({
  organizationName: z.string().trim().min(2, 'Organization or affiliation is required.'),
  contactName: z.string().trim().min(2, 'Your name is required.'),
  email: z.string().trim().email('Valid email address is required.'),
  inquiryCategory: z.string().trim().min(2),
  message: z.string().trim().min(10, 'Please include brief technical or partnership details (min 10 chars).'),
});

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    inquiryCategory: 'Request Technical Details',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<{ status: 'saved' | 'unconfigured' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Contact & Partnerships — PAWAN SHAKTI',
        description: 'Contact founder Koyaneni Yaswanth at VNIT Nagpur for technical evaluations, R&D partnerships, or incubator evaluation.',
      },
      '/contact'
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setOutcome(null);

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }

    setSending(true);
    try {
      const resp = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          organizationName: form.organizationName,
          contactName: form.contactName,
          email: form.email,
          applicationType: form.inquiryCategory,
          siteLocation: 'Not specified (General Inquiry)',
          roofOrLandType: 'Not specified',
          hasExistingSolar: false,
          hasExistingBatteryOrInverter: false,
          desiredTimeline: 'Immediate inquiry',
          additionalComments: form.message,
          consentToContact: true,
          honeypot: form.honeypot,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 201) {
        trackAnalyticsEvent('contact_submit', '/contact');
        setOutcome({
          status: 'saved',
          msg: `Inquiry recorded (${data.referenceCode}). Notification state: ${data.notificationStatus}.`,
        });
      } else if (resp.status === 503) {
        setOutcome({
          status: 'unconfigured',
          msg: data.message || 'Database not configured locally. Direct email: koyaneniyaswanth@gmail.com.',
        });
      } else {
        setOutcome({ status: 'error', msg: data.error || 'Unable to process inquiry.' });
      }
    } catch {
      setOutcome({ status: 'unconfigured', msg: 'Backend offline; email directly: koyaneniyaswanth@gmail.com.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-[#DDE2DC] pb-6">
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">Contact &amp; Technical Discussions</h1>
        <p className="text-sm text-[#434E4A]">
          Direct founder engineering contact for research partners, fabrication vendors, incubator reviewers, and pilot prospects.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-[#DDE2DC] bg-white p-6 text-xs text-[#434E4A] md:col-span-5">
          <h2 className="font-display text-base font-bold text-[#141A18]">Direct Coordinates</h2>
          <p>
            <strong>Lead:</strong> Koyaneni Yaswanth<br />
            <strong>Email:</strong>{' '}
            <a href="mailto:koyaneniyaswanth@gmail.com" className="text-[#0B2B22] underline">
              koyaneniyaswanth@gmail.com
            </a>
          </p>
          <p>
            <strong>Pre-Incubator:</strong> VNIT Ventures Vault Foundation (V3F), 3rd Floor New Library Building, VNIT
            Campus, South Ambazari Road, Nagpur – 440010.
          </p>
          <p>
            <strong>GitHub Repository:</strong>{' '}
            <a
              href="https://github.com/koyaneni-yaswanth/low-speed-wind-turbine"
              target="_blank"
              rel="noreferrer"
              className="text-[#0B2B22] underline"
            >
              koyaneni-yaswanth/low-speed-wind-turbine
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#DDE2DC] bg-white p-6 md:col-span-7" noValidate>
          <input
            type="text"
            value={form.honeypot}
            onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-[#141A18]">Name *</span>
              <input
                required
                type="text"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-[#141A18]">Organization / Institution *</span>
              <input
                required
                type="text"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
              <span className="text-xs font-semibold text-[#141A18]">Topic</span>
              <select
                value={form.inquiryCategory}
                onChange={(e) => setForm({ ...form, inquiryCategory: e.target.value })}
                className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm bg-white"
              >
                <option>Request Technical Details</option>
                <option>Partner with Pawan Shakti</option>
                <option>Fabrication / Vendor Quotation</option>
                <option>Research / Academic Collaboration</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#141A18]">Message *</span>
            <textarea
              rows={4}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-[#DDE2DC] px-3 py-2 text-sm"
            />
          </label>

          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
              {errors.map((err) => (
                <p key={err}>• {err}</p>
              ))}
            </div>
          )}

          {outcome && (
            <div
              className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
                outcome.status === 'saved'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}
            >
              {outcome.status === 'saved' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{outcome.msg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[#0B2B22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#144537] disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send Technical Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
};
