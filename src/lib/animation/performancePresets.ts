import type { QualityPreset } from './turbinePhysics.ts';

export interface PerformancePresetConfig {
  preset: QualityPreset;
  label: string;
  particleCount: number;
  streamlineCount: number;
  maxPixelRatio: number;
  shadowsEnabled: boolean;
  geometrySegments: number;
}

export const PERFORMANCE_PRESETS: Record<QualityPreset, PerformancePresetConfig> = {
  high: {
    preset: 'high',
    label: 'High Quality (Desktop GPU)',
    particleCount: 900,
    streamlineCount: 16,
    maxPixelRatio: 2,
    shadowsEnabled: true,
    geometrySegments: 48,
  },
  balanced: {
    preset: 'balanced',
    label: 'Balanced (Laptop)',
    particleCount: 500,
    streamlineCount: 10,
    maxPixelRatio: 1.5,
    shadowsEnabled: true,
    geometrySegments: 32,
  },
  low: {
    preset: 'low',
    label: 'Low Power (Mobile / Battery)',
    particleCount: 180,
    streamlineCount: 5,
    maxPixelRatio: 1,
    shadowsEnabled: false,
    geometrySegments: 18,
  },
};

export function detectDefaultQualityPreset(): QualityPreset {
  if (typeof window === 'undefined') return 'balanced';
  const isSmallScreen = window.innerWidth < 768;
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  if (isSmallScreen || cores <= 2) return 'low';
  if (cores >= 8 && window.innerWidth >= 1200) return 'high';
  return 'balanced';
}
