import React from 'react';

interface BoundaryProps {
  fallbackTitle?: string;
  children: React.ReactNode;
}

interface BoundaryState {
  hasError: boolean;
  errorMsg: string;
}

export const WebGLFallbackCard: React.FC<{ title?: string; reason?: string }> = ({ title, reason }) => (
  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0B1528] text-white">
    <picture>
      <source srcSet="/optimized/mark-4-four-rotor-prototype.webp" type="image/webp" />
      <img
        src="/repo-assets/media/prototype/mark-4-four-rotor-prototype.png"
        alt="Pawan Shakti Mark-4 physical prototype fallback view"
        loading="lazy"
        decoding="async"
        className="h-72 w-full object-cover opacity-65 sm:h-96"
      />
    </picture>
    <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A] via-[#060D1A]/60 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-5 space-y-1">
      <div className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
        {title || '3D Engineering Hardware Fallback View'}
      </div>
      <p className="text-xs text-slate-200 max-w-xl">
        {reason ||
          'Hardware WebGL rendering is paused or unsupported in this browser context. Displaying authentic Mark-4 prototype imagery and full engineering specifications below.'}
      </p>
    </div>
  </div>
);

export class AnimationBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, errorMsg: error.message };
  }

  override render() {
    if (this.state.hasError) {
      return <WebGLFallbackCard title={this.props.fallbackTitle} reason={this.state.errorMsg} />;
    }
    return this.props.children;
  }
}
