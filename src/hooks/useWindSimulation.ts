import { useMemo, useState } from 'react';
import { computeSimulatedTurbineOutput, type AirflowMode } from '../lib/animation/turbinePhysics.ts';

export function useWindSimulation(initialSpeedMs = 5) {
  const [windSpeedMs, setWindSpeedMs] = useState<number>(initialSpeedMs);
  const [windDirectionDeg, setWindDirectionDeg] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [exploded, setExploded] = useState<boolean>(false);
  const [blueprintMode, setBlueprintMode] = useState<boolean>(false);
  const [xrayNacelle, setXrayNacelle] = useState<boolean>(false);
  const [showBlades, setShowBlades] = useState<boolean>(true);
  const [showAirflow, setShowAirflow] = useState<boolean>(true);
  const [showGenerator, setShowGenerator] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [airflowMode, setAirflowMode] = useState<AirflowMode>('particles');

  const simulation = useMemo(
    () =>
      computeSimulatedTurbineOutput({
        windSpeedMs,
        sweptAreaM2: 1.0,
        gearRatio: 10,
      }),
    [windSpeedMs]
  );

  const resetSimulation = () => {
    setWindSpeedMs(5);
    setWindDirectionDeg(0);
    setPaused(false);
    setExploded(false);
    setBlueprintMode(false);
    setXrayNacelle(false);
    setShowBlades(true);
    setShowAirflow(true);
    setShowGenerator(true);
    setShowLabels(true);
    setAirflowMode('particles');
  };

  return {
    windSpeedMs,
    setWindSpeedMs,
    windDirectionDeg,
    setWindDirectionDeg,
    paused,
    setPaused,
    exploded,
    setExploded,
    blueprintMode,
    setBlueprintMode,
    xrayNacelle,
    setXrayNacelle,
    showBlades,
    setShowBlades,
    showAirflow,
    setShowAirflow,
    showGenerator,
    setShowGenerator,
    showLabels,
    setShowLabels,
    airflowMode,
    setAirflowMode,
    simulation,
    resetSimulation,
  };
}
