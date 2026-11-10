import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../../lib/analytics.ts';

export const Footer: React.FC = () => {
  const [consent, setConsent] = useState(() => hasAnalyticsConsent());

  const toggleConsent = () => {
    const next = !consent;
    setAnalyticsConsent(next);
    setConsent(next);
  };

  return (
    <footer className="border-t border-[#DDE2DC] bg-white no-print">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/repo-assets/media/hero/pawan-shakti-logo.jpeg"
                alt="Pawan Shakti crest"
                className="h-9 w-auto rounded object-contain"
              />
              <div>
                <div className="font-display text-base font-bold text-[#0B2B22]">PAWAN SHAKTI</div>
                <div className="text-xs text-[#434E4A]">Engineering practical wind energy for low-speed environments.</div>
              </div>
            </div>
            <p className="max-w-lg text-xs leading-relaxed text-[#434E4A]">
              TRL 4 hardware development platform led by Koyaneni Yaswanth at VNIT Nagpur (Pre-incubated at VNIT Ventures
              Vault Foundation). All metrics distinguish prototype observations and design targets from calibrated field validation.
              Published Indian Patent Application (2025): <em>Compact Wind Turbine with Planetary Gears</em> (under examination; not yet granted).
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[#141A18]">Platform Sections</div>
            <ul className="space-y-1.5 text-[#434E4A]">
              <li><Link to="/technology" className="hover:text-[#0B2B22]">Technology &amp; CAD Vault</Link></li>
              <li><Link to="/products" className="hover:text-[#0B2B22]">Architectures Under Evaluation</Link></li>
              <li><Link to="/performance" className="hover:text-[#0B2B22]">Performance, Calculators &amp; Telemetry</Link></li>
              <li><Link to="/pilot" className="hover:text-[#0B2B22]">Apply for Pilot Assessment</Link></li>
              <li><Link to="/resources" className="hover:text-[#0B2B22]">Research, IP &amp; Resources</Link></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[#141A18]">Governance &amp; Privacy</div>
            <p className="text-[#434E4A]">
              Zero personal tracking without consent. Repository files under MIT License; third-party CC-BY assets attributed separately.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleConsent}
                className="rounded-lg border border-[#DDE2DC] px-2.5 py-1 text-[11px] font-medium text-[#141A18] hover:bg-[#F6F7F4]"
              >
                Analytics Telemetry: {consent ? 'Enabled' : 'Disabled'}
              </button>
              <Link
                to="/admin"
                className="rounded-lg border border-transparent px-2 py-1 text-[11px] text-[#434E4A] hover:border-[#DDE2DC] hover:text-[#0B2B22]"
              >
                Internal Workbench
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
