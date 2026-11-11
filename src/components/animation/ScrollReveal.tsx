import React, { useEffect, useRef, useState } from 'react';
import { useAnimationContext } from './animationContext.ts';

export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}> = ({ children, className = '', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useAnimationContext();
  const [intersected, setIntersected] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (reducedMotion || intersected) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIntersected(true);
          obs.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '300px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion, intersected]);

  const visible = reducedMotion || intersected;

  return (
    <div
      ref={ref}
      style={reducedMotion ? undefined : { transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
};
