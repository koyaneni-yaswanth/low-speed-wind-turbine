export interface RouteMeta {
  title: string;
  description: string;
}

const DEFAULT_META: RouteMeta = {
  title: 'PAWAN SHAKTI — Engineering Practical Wind Energy for Low-Speed Environments',
  description:
    'Pawan Shakti develops compact multi-rotor, planetary, and magnetic gear wind-energy hardware at TRL 4 for distributed, off-grid, and hybrid low-speed wind regimes.',
};

export function applyRouteSeo(meta: Partial<RouteMeta>, pathname: string): void {
  if (typeof document === 'undefined') return;
  document.title = meta.title || DEFAULT_META.title;
  const desc = meta.description || DEFAULT_META.description;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', desc);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  canonical.setAttribute('href', `${origin}${pathname}`);
}
