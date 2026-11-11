import { useEffect, useState } from 'react';
import { PERFORMANCE_PRESETS, detectDefaultQualityPreset } from '../lib/animation/performancePresets.ts';
import type { LabTheme, QualityPreset } from '../lib/animation/turbinePhysics.ts';

export function usePerformanceMode() {
  const [preset, setPreset] = useState<QualityPreset>(() => detectDefaultQualityPreset());
  const [theme, setThemeState] = useState<LabTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('ps_lab_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const setTheme = (next: LabTheme) => {
    setThemeState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ps_lab_theme', next);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.psTheme = theme;
    }
  }, [theme]);

  return {
    preset,
    setPreset,
    config: PERFORMANCE_PRESETS[preset],
    theme,
    setTheme,
  };
}
