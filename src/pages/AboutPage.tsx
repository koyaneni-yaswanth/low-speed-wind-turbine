import React, { useEffect } from 'react';
import { applyRouteSeo } from '../lib/seo.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    applyRouteSeo(
      {
        title: 'About, Founder & VNIT Ecosystem — PAWAN SHAKTI',
        description:
          'Mission, founder Koyaneni Yaswanth, academic mentorship by Dr. Jawahar Bhukya, and VNIT Ventures Vault Foundation (V3F) pre-incubation record.',
      },
      '/about'
    );
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <EvidenceBadge tier="VERIFIED_MEASURED" />
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">About Pawan Shakti</h1>
        <p className="text-sm text-[#434E4A]">
          Engineering practical, small-scale wind energy for low-speed inland environments — built on hardware evidence,
          honest scientific reporting, and systematic engineering iteration.
        </p>
      </header>

      <section className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-3">
        <h2 className="font-display text-xl font-bold text-[#141A18]">Founder &amp; Academic Mentorship</h2>
        <div className="grid gap-6 md:grid-cols-2 text-xs leading-relaxed text-[#434E4A]">
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4 space-y-1.5">
            <div className="font-display text-base font-bold text-[#141A18]">Koyaneni Yaswanth</div>
            <div className="font-mono text-[#0B2B22]">Founder &amp; Technical Lead</div>
            <p>
              Undergraduate student, B.Tech. Metallurgical and Materials Engineering, Visvesvaraya National Institute of
              Technology (VNIT), Nagpur. Initiated Pawan Shakti to explore mechanical speed step-up (planetary &amp; magnetic
              gearing) and low-Reynolds airfoil clusters in Fusion 360, ANSYS, additive prototyping, and bench instrumentation.
            </p>
            <p className="font-mono text-[11px]">Email: koyaneniyaswanth@gmail.com</p>
          </div>
          <div className="rounded-xl border border-[#DDE2DC] bg-[#F6F7F4] p-4 space-y-1.5">
            <div className="font-display text-base font-bold text-[#141A18]">Dr. Jawahar Bhukya</div>
            <div className="font-mono text-[#0B2B22]">Academic Mentor &amp; Research Advisor</div>
            <p>
              Assistant Professor, Department of Electrical and Electronics Engineering, VNIT Nagpur. Guides wind energy
              conversion topology matching, power electronics guidance, departmental lab testing access, and academic paper
              collaboration.
            </p>
          </div>
        </div>
      </section>

      <section id="institutional" className="rounded-2xl border border-[#DDE2DC] bg-white p-6 space-y-3">
        <h2 className="font-display text-xl font-bold text-[#141A18]">Institutional Incubation &amp; Ecosystem</h2>
        <div className="text-xs leading-relaxed text-[#434E4A] space-y-2">
          <p>
            <strong>VNIT Ventures Vault Foundation (V3F):</strong> Section 8 Technology Business Incubator at VNIT Campus,
            Nagpur. Pre-Incubation Agreement effective <strong>21 September 2026</strong> (signed 23 September 2026 by Mr. Anil
            Kumar Singh, COO V3F, and Koyaneni Yaswanth), 6-month term (extendable to 9 months), 2.5% incorporation equity terms.
          </p>
          <p>
            <strong>Core Engineering Pods (Open / Recruiting Collaborators):</strong> Mechanical CAD &amp; Manufacturing,
            Coaxial Magnetic &amp; Planetary Drivetrain Testing, Generator &amp; Power Electronics (TCCB), Embedded ESP32/STM32
            Telemetry, and Field Deployment Operations.
          </p>
        </div>
      </section>
    </div>
  );
};
