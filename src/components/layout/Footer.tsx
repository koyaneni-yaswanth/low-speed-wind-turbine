import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../../lib/analytics.ts';
import { useAnimationContext } from '../animation/animationContext.ts';

export const Footer: React.FC = () => {
  const [consent, setConsent] = useState(() => hasAnalyticsConsent());
  const { theme } = useAnimationContext();
  const isDark = theme === 'dark';

  const toggleConsent = () => {
    const next = !consent;
    setAnalyticsConsent(next);
    setConsent(next);
  };

  return (
    <footer
      className={`border-t no-print ${
        isDark ? 'border-cyan-500/20 bg-[#0B1528] text-slate-200' : 'border-[#DDE2DC] bg-white text-[#141A18]'
      }`}
    >
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
                <div className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#0B2B22]'}`}>
                  PAWAN SHAKTI
                </div>
                <div className={`text-xs ${isDark ? 'text-cyan-300' : 'text-[#434E4A]'}`}>
                  Engineering practical wind energy for low-speed environments.
                </div>
              </div>
            </div>
            <p className={`max-w-lg text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#434E4A]'}`}>
              TRL 4 hardware development platform led by Koyaneni Yaswanth at VNIT Nagpur (Pre-incubated at VNIT Ventures
              Vault Foundation). All metrics distinguish prototype observations and design targets from calibrated field validation.
              Published Indian Patent Application (2025): <em>Compact Wind Turbine with Planetary Gears</em> (under examination; not yet granted).
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-[#141A18]'}`}>Platform Sections</div>
            <ul className={`space-y-1.5 ${isDark ? 'text-slate-300' : 'text-[#434E4A]'}`}>
              <li><Link to="/technology" className="hover:text-cyan-400">Technology &amp; CAD Vault</Link></li>
              <li><Link to="/products" className="hover:text-cyan-400">Architectures Under Evaluation</Link></li>
              <li><Link to="/performance" className="hover:text-cyan-400">Performance, Calculators &amp; Telemetry</Link></li>
              <li><Link to="/pilot" className="hover:text-cyan-400">Apply for Pilot Assessment</Link></li>
              <li><Link to="/resources" className="hover:text-cyan-400">Research, IP &amp; Resources</Link></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`font-semibold ${isDark ? 'text-white' : 'text-[#141A18]'}`}>Governance &amp; Privacy</div>
            <p className={isDark ? 'text-slate-400' : 'text-[#434E4A]'}>
              Zero personal tracking without consent. Repository files under MIT License; third-party CC-BY assets attributed separately.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleConsent}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
                  isDark
                    ? 'border-slate-700 bg-[#101A2C] text-slate-200 hover:border-cyan-400'
                    : 'border-[#DDE2DC] text-[#141A18] hover:bg-[#F6F7F4]'
                }`}
              >
                Analytics Telemetry: {consent ? 'Enabled' : 'Disabled'}
              </button>
              <Link
                to="/admin"
                className={`rounded-lg border border-transparent px-2 py-1 text-[11px] ${
                  isDark ? 'text-slate-400 hover:text-cyan-300' : 'text-[#434E4A] hover:text-[#0B2B22]'
                }`}
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
