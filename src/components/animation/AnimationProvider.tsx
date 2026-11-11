import React from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { AnimationContext } from './animationContext.ts';

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preset, setPreset, config, theme, setTheme } = usePerformanceMode();
  const [reducedMotion, setReducedMotionOverride] = useReducedMotion();

  return (
    <AnimationContext.Provider
      value={{
        preset,
        setPreset,
        qualityConfig: config,
        reducedMotion,
        setReducedMotionOverride,
        theme,
        setTheme,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};
