import { createContext, useContext } from 'react';
import type { PerformancePresetConfig } from '../../lib/animation/performancePresets.ts';
import type { LabTheme, QualityPreset } from '../../lib/animation/turbinePhysics.ts';

export interface AnimationContextValue {
  preset: QualityPreset;
  setPreset: (preset: QualityPreset) => void;
  qualityConfig: PerformancePresetConfig;
  reducedMotion: boolean;
  setReducedMotionOverride: (val: boolean | null) => void;
  theme: LabTheme;
  setTheme: (next: LabTheme) => void;
}

export const AnimationContext = createContext<AnimationContextValue | null>(null);

export function useAnimationContext(): AnimationContextValue {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error('useAnimationContext must be used inside AnimationProvider');
  }
  return ctx;
}
