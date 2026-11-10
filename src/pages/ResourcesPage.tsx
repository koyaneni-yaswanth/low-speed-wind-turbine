import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { RESOURCE_DOCUMENTS } from '../data/pawanShaktiData.ts';
import { applyRouteSeo } from '../lib/seo.ts';
import { trackAnalyticsEvent } from '../lib/analytics.ts';
import { EvidenceBadge } from '../components/common/EvidenceBadge.tsx';

export const ResourcesPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('ALL');

  useEffect(() => {
    applyRouteSeo(
      {
        title: 'Resources, Research & IP Evidence Library — PAWAN SHAKTI',
        description:
          'Searchable public evidence library for Pawan Shakti technical overviews, CAD drawings, S1223 airfoil coordinates, testing protocols, and IP disclosures.',
      },
      '/resources'
    );
  }, []);

  const categories = ['ALL', ...Array.from(new Set(RESOURCE_DOCUMENTS.map((d) => d.category)))];
  const filtered = RESOURCE_DOCUMENTS.filter((doc) => {
    const matchesCat = category === 'ALL' || doc.category === category;
    const matchesQ =
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.summary.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#DDE2DC] pb-6">
        <EvidenceBadge tier="VERIFIED_MEASURED" />
        <h1 className="font-display text-3xl font-extrabold text-[#141A18]">Research, IP &amp; Resource Library</h1>
        <p className="max-w-3xl text-sm text-[#434E4A]">
          Curated technical drawings, testing protocols, airfoil datasets, and public institutional disclosures. Confidential
          legal annexes and unverified financial worksheets remain locked inside the authenticated Private Data Room.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search technical documents, S1223, V3F, patent..."
            aria-label="Search Pawan Shakti resource library"
            className="w-full max-w-sm rounded-xl border border-[#DDE2DC] bg-white px-3 py-2 text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                  category === cat ? 'bg-[#0B2B22] text-white' : 'border border-[#DDE2DC] bg-white text-[#141A18]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <article key={doc.id} className="flex flex-col justify-between rounded-2xl border border-[#DDE2DC] bg-white p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#0B2B22]">{doc.category}</span>
                <EvidenceBadge tier={doc.evidenceTier} compact />
              </div>
              <h2 className="font-display text-base font-bold text-[#141A18]">{doc.title}</h2>
              <p className="text-xs leading-relaxed text-[#434E4A]">{doc.summary}</p>
            </div>

            <div className="border-t border-[#DDE2DC] pt-3 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-[#434E4A]">{doc.version}</span>
              {doc.visibility === 'private' ? (
                <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-1 font-mono text-[10px] text-stone-700">
                  <Lock className="h-3 w-3" /> Private Data Room
                </span>
              ) : doc.url?.startsWith('/') && !doc.url.includes('repo-assets') ? (
                <Link to={doc.url} className="font-semibold text-[#0B2B22] hover:underline">
                  View Record →
                </Link>
              ) : doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackAnalyticsEvent('resource_download', '/resources', { resourceId: doc.id })}
                  className="font-semibold text-[#0B2B22] hover:underline"
                >
                  Open File →
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
