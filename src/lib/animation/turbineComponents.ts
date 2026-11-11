export type ComponentId =
  | 'blades'
  | 'hub'
  | 'mount'
  | 'shaft'
  | 'bearings'
  | 'gearbox'
  | 'generator'
  | 'nacelle'
  | 'tower'
  | 'electrical';

export interface TurbineComponentMeta {
  id: ComponentId;
  name: string;
  purpose: string;
  specStatus: string;
  explodeOffset: [number, number, number];
  restOrigin: [number, number, number];
}

export const TURBINE_COMPONENTS: TurbineComponentMeta[] = [
  {
    id: 'blades',
    name: 'Rotor Blades (S1223 Concept)',
    purpose: 'Captures kinetic energy from low-speed 2–8 m/s wind streams via high-camber low-Re lift.',
    specStatus: 'Conceptual ~1 m² layout (working estimate; authentic STL/3MF meshes live in CAD Vault)',
    explodeOffset: [0, 0, 2.5],
    restOrigin: [0, 2.2, 1.35],
  },
  {
    id: 'hub',
    name: 'Central Rotor Hub & Spinner',
    purpose: 'Collects aerodynamic blade torque and shields the blade root pitch collar.',
    specStatus: 'TRL 4 Prototype Architecture',
    explodeOffset: [0, 0, 1.65],
    restOrigin: [0, 2.2, 1.45],
  },
  {
    id: 'mount',
    name: 'Blade Mounting Spider & Collar',
    purpose: 'Transfers bending and root shear loads cleanly into the main input shaft.',
    specStatus: 'Modular 3/4-bolt flange direction (Machined 6061/5052 candidate)',
    explodeOffset: [0, 0.7, 1.05],
    restOrigin: [0, 2.2, 1.2],
  },
  {
    id: 'shaft',
    name: 'Low-Speed Input Shaft',
    purpose: 'Delivers high torque at low rotor RPM into the step-up transmission.',
    specStatus: 'Dial runout <= 0.1 mm target under load',
    explodeOffset: [0, 0.85, 0.45],
    restOrigin: [0, 2.2, 0.72],
  },
  {
    id: 'bearings',
    name: 'Twin Bearing Block Assembly',
    purpose: 'Supports radial rotor mass and axial wind thrust while minimizing parasitic drag.',
    specStatus: 'Low-friction sealed cartridge bearing spec',
    explodeOffset: [0, 1.2, -0.05],
    restOrigin: [0, 2.2, 0.42],
  },
  {
    id: 'gearbox',
    name: 'Step-Up Gearbox (Option A/B)',
    purpose: 'Multiplies slow rotor RPM (1:10 planetary or ~1:5.5/1:10 magnetic concept) for alternator efficiency.',
    specStatus: 'Open comparative dyno evaluation — Option A Magnetic vs Option B Planetary',
    explodeOffset: [0, 1.4, -0.55],
    restOrigin: [0, 2.2, 0.0],
  },
  {
    id: 'generator',
    name: 'Coreless PMA Generator Housing',
    purpose: 'Converts multiplied mechanical shaft power into 3-phase AC with minimal static cogging torque.',
    specStatus: '300–500 W Coreless PMA target @ 300–600 RPM (Unvalidated design class)',
    explodeOffset: [0, 1.1, -1.25],
    restOrigin: [0, 2.2, -0.68],
  },
  {
    id: 'nacelle',
    name: 'Structural Nacelle Shroud',
    purpose: 'Weather-protects bearings, transmission, and stator windings against monsoon ingress.',
    specStatus: 'Aluminum extrusion / enclosure concept (IP rating not yet certified)',
    explodeOffset: [0, 1.85, -0.35],
    restOrigin: [0, 2.2, -0.25],
  },
  {
    id: 'tower',
    name: 'Supporting Mast & Yaw Pivot',
    purpose: 'Elevates swept rotor above ground boundary-layer shear into cleaner inflow.',
    specStatus: 'Test rig mast height configurable per site survey (3–6 m bench/campus range)',
    explodeOffset: [0, -1.1, 0],
    restOrigin: [0, 0.9, -0.25],
  },
  {
    id: 'electrical',
    name: 'Rectifier, Bus Conduit & Load Node',
    purpose: 'Rectifies 3-phase output with Schottky/MPPT regulation and INA226 V-I shunt telemetry.',
    specStatus: 'Monitoring-only telemetry bus (Hardware E-stop & dump load remain independent)',
    explodeOffset: [1.35, -0.3, -0.5],
    restOrigin: [0.22, 0.9, -0.25],
  },
];
