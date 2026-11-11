import { useEffect, useState } from 'react';

export function useReducedMotion(): [boolean, (override: boolean | null) => void] {
  const [systemPrefers, setSystemPrefers] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [userOverride, setUserOverride] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('ps_reduced_motion');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefers(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setOverride = (val: boolean | null) => {
    setUserOverride(val);
    if (typeof window !== 'undefined') {
      if (val === null) localStorage.removeItem('ps_reduced_motion');
      else localStorage.setItem('ps_reduced_motion', String(val));
    }
  };

  return [userOverride ?? systemPrefers, setOverride];
}
