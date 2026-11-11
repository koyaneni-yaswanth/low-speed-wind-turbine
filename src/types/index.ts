export type EvidenceTier =
  | 'VERIFIED_MEASURED'
  | 'PROTOTYPE_OBSERVATION'
  | 'ENGINEERING_ESTIMATE'
  | 'DESIGN_TARGET'
  | 'COMMERCIAL_ASSUMPTION'
  | 'FUTURE_ROADMAP';

export type UserRole =
  | 'founder_super_admin'
  | 'engineering_admin'
  | 'crm_admin'
  | 'team_member'
  | 'external_reviewer'
  | 'public_visitor';

export type PipelineStage =
  | 'New inquiry'
  | 'Qualified'
  | 'Discovery scheduled'
  | 'Site survey pending'
  | 'Site survey completed'
  | 'Technical evaluation'
  | 'Proposal sent'
  | 'LOI under review'
  | 'LOI signed'
  | 'Pilot approved'
  | 'Pilot installed'
  | 'Pilot active'
  | 'Pilot completed'
  | 'Commercial negotiation'
  | 'Won'
  | 'Lost'
  | 'On hold';

export interface PrototypeRecord {
  id: 'mark-3' | 'mark-4' | 'mark-5' | 'working-1m2';
  name: string;
  configCode: string;
  status: string;
  evidenceTier: EvidenceTier;
  rotorLayout: string;
  rotorDiameterM?: number | null;
  sweptAreaM2: number | null;
  bladeGeometry?: string;
  gearArchitecture?: string;
  gearRatio?: string;
  generatorType?: string;
  generatorRating?: string;
  frameMaterial: string;
  bladeMaterial: string;
  bearingConfig?: string;
  transmission: string;
  buildDate?: string;
  modificationHistory?: string;
  photoUrl: string | null;
  cadFiles?: string[];
  observedCutInMs: string;
  historicalPowerNote: string;
  keyFinding: string;
  auditWarning?: string;
}

export interface OptionComparisonCriterion {
  id: string;
  criterion: string;
  optionANotes: string;
  optionBNotes: string;
  optionAScore: number | null; // 1-5 once tested; null = awaiting dyno test
  optionBScore: number | null;
  measurementBasis: string;
  evidenceTier: EvidenceTier;
}

export interface CadAssetItem {
  id: string;
  name: string;
  sourcePath: string;
  publicUrl: string | null;
  format: string;
  bytes: number;
  viewerSupported: boolean;
  triangles: number | null;
  architecture: string;
  role: string;
  license: string;
  duplicateNote: string | null;
}

export interface TelemetryReading {
  id: string;
  timestamp: string;
  ingestedAt?: string;
  siteId: string;
  turbineId: string;
  windSpeedMs: number;
  windDirection?: string;
  rotorRpm: number;
  generatorRpm?: number;
  dcVoltageV: number;
  dcCurrentA: number;
  powerW: number;
  cumulativeEnergyWh?: number;
  temperatureC?: number;
  vibrationG?: string;
  brakeState?: 'released' | 'engaged' | 'fault' | 'unknown';
  batterySocPct?: number;
  deviceHealth?: string;
  sensorHealth?: string;
  dataQualityStatus: 'valid' | 'betz_anomaly' | 'missing_fields' | 'uncalibrated_template' | 'out_of_range';
  faultCode?: string;
  configId?: string;
  notes?: string;
}

export type TestRunState = 'draft' | 'running' | 'completed' | 'reviewed' | 'rejected';

export interface TestRunRecord {
  id: string;
  testId: string;
  turbineId: string;
  objective: string;
  configuration: string;
  location: string;
  startTime: string;
  endTime: string;
  sensorsUsed: string;
  calibrationStatus: string;
  operator: string;
  weatherConditions: string;
  safetyChecklistCompleted: boolean;
  resultSummary: string;
  failureNotes: string;
  reviewedBy: string;
  state: TestRunState;
  evidenceTier: EvidenceTier;
}

export interface TurbineDevice {
  id: string;
  turbineId: string;
  configurationName: string;
  prototypeVersion: string;
  rotorArchitecture: string;
  transmissionType: string;
  gearRatio: string;
  generatorDetails: string;
  controllerDetails: string;
  siteName: string;
  commissioningDate: string;
  firmwareVersion: string;
  sensorConfig: string;
  safetyStatus: 'monitoring_only_no_remote_actuation' | 'fault_lockout' | 'offline';
  operationalState: 'offline' | 'bench_idle' | 'test_active' | 'maintenance';
  lastTelemetryAt: string | null;
}

export interface PilotInquiryInput {
  organizationName: string;
  contactName: string;
  email: string;
  phone?: string;
  siteLocation: string;
  applicationType: string;
  roofOrLandType: string;
  availableMountingAreaSqM?: number;
  hasExistingSolar: boolean;
  hasExistingBatteryOrInverter: boolean;
  approximateWindInfo?: string;
  energyRequirementKwhDay?: number;
  desiredTimeline: string;
  additionalComments?: string;
  consentToContact: boolean;
  honeypot?: string;
}

export interface CrmLeadRecord extends PilotInquiryInput {
  id: string;
  referenceCode: string;
  createdAt: string;
  updatedAt: string;
  stage: PipelineStage;
  owner: string;
  customerSegment: string;
  discoveryNotes: string;
  painPoints: string;
  currentEnergyCostInrKwh: number | null;
  followUpDate: string | null;
  nextAction: string;
  surveyScheduledAt: string | null;
  proposalRef: string | null;
  loiRef: string | null;
  linkedTurbineId: string | null;
  notificationStatus: 'pending' | 'sent' | 'failed' | 'retrying' | 'queued_provider_unconfigured';
}

export interface BomItem {
  id: string;
  component: string;
  subsystem: string;
  prototypeCostInr: number;
  targetCostInr: number;
  basis: EvidenceTier;
  vendorQuoteCount: number;
  notes: string;
}

export interface ProjectTaskItem {
  id: string;
  taskCode?: string;
  workstream?: string;
  title: string;
  description: string;
  track: string;
  owner: string;
  supportingMembers?: string[];
  priority: 'P0' | 'P1' | 'P2';
  offsetStartDay: number;
  durationDays: number;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  dependencies: string[];
  acceptanceCriteria: string;
  evidenceAttachment?: string;
  reviewer: string;
  completionDate?: string;
}

export interface GrantSchemeItem {
  id: string;
  name: string;
  agency: string;
  grantType: string;
  fundingRange: string;
  eligibilityStatus: string;
  applicationStatus: 'Researching / Eligibility Check' | 'Preparing Dossier' | 'Submitted' | 'Under Review' | 'Decision Pending';
  deadline: string;
  amountRequestedInr: number | null;
  amountApprovedInr: number | null;
  conditions: string;
  evidenceNote: string;
}

export interface ResourceDocumentItem {
  id: string;
  title: string;
  category:
    | 'Technical Overview'
    | 'CAD & Drawings'
    | 'Research & IP'
    | 'Testing Protocols'
    | 'Pilot Program'
    | 'Institutional / V3F';
  version: string;
  visibility: 'public' | 'private';
  url: string | null;
  sourcePath: string;
  publishedAt: string;
  summary: string;
  evidenceTier: EvidenceTier;
}
