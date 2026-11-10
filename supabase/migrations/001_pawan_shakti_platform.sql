-- ==============================================================================
-- PAWAN SHAKTI — PRODUCTION PLATFORM RELATIONAL SCHEMA & STRICT RLS
-- Migration: 001_pawan_shakti_platform.sql
-- Non-destructive, idempotent schema implementing Section 14 requirements.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- Custom enums for evidence discipline and workflow states
do $$ begin
  create type public.evidence_tier as enum (
    'VERIFIED_MEASURED',
    'PROTOTYPE_OBSERVATION',
    'ENGINEERING_ESTIMATE',
    'DESIGN_TARGET',
    'COMMERCIAL_ASSUMPTION',
    'FUTURE_ROADMAP'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role_type as enum (
    'founder_super_admin',
    'engineering_admin',
    'crm_admin',
    'team_member',
    'external_reviewer',
    'public_visitor'
  );
exception when duplicate_object then null; end $$;

-- Helper function for RLS role resolution
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role::text from public.profiles where id = auth.uid() and deleted_at is null limit 1),
    'public_visitor'
  );
$$;

-- 1. Roles & Profiles
create table if not exists public.roles (
  code text primary key,
  label text not null,
  description text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (code, label, description) values
  ('founder_super_admin', 'Founder / Super Admin', 'Full governance across engineering, CRM, financials, grants, CMS & RBAC'),
  ('engineering_admin', 'Engineering Admin', 'Manage turbines, test runs, telemetry uploads, CAD metadata & engineering tasks'),
  ('crm_admin', 'Business / CRM Admin', 'Manage pilot inquiries, organizations, contacts, deals & site surveys'),
  ('team_member', 'Team Member (Engineering)', 'View engineering tasks and test logs; restricted from financials & CRM PII'),
  ('external_reviewer', 'External / Incubator Reviewer', 'Read curated V3F Data Room & monthly executive KPI snapshots'),
  ('public_visitor', 'Public Visitor', 'Access public pages & verified public resources only')
on conflict (code) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role_type not null default 'team_member',
  affiliation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 2. CRM, Inquiries & Pilot Acquisition
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text,
  city text,
  state text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  designation text,
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.website_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  inquiry_type text not null,
  organization_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  subject text,
  message text,
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.site_assessments (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  organization_id uuid references public.organizations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  site_location text not null,
  application_type text not null,
  roof_or_land_type text not null,
  available_mounting_area_sqm numeric(8,2),
  has_existing_solar boolean not null default false,
  has_existing_battery_or_inverter boolean not null default false,
  approximate_wind_info text,
  energy_requirement_kwh_day numeric(8,2),
  desired_timeline text,
  additional_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  assessment_id uuid references public.site_assessments(id) on delete cascade,
  stage text not null default 'New inquiry',
  owner_email text,
  survey_scheduled_at timestamptz,
  proposal_ref text,
  loi_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  pilot_application_id uuid references public.pilot_applications(id) on delete set null,
  customer_segment text,
  pain_points text,
  current_energy_cost_inr_kwh numeric(8,2),
  estimated_demand_kwh_day numeric(8,2),
  stage text not null default 'New inquiry',
  follow_up_date date,
  next_action text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  actor_email text not null,
  activity_type text not null,
  from_stage text,
  to_stage text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.pilot_projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  turbine_uuid uuid,
  site_name text not null,
  status text not null default 'planned',
  start_date date,
  end_date date,
  evaluation_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. Turbines, Option Shootout, Devices, Sensors & Telemetry
create table if not exists public.turbine_configurations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  rotor_architecture text not null,
  transmission_type text not null,
  gear_ratio text,
  swept_area_m2 numeric(8,4),
  frame_material text,
  blade_material text,
  evidence_tier public.evidence_tier not null default 'PROTOTYPE_OBSERVATION',
  is_public boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.turbines (
  id uuid primary key default gen_random_uuid(),
  turbine_code text not null unique,
  configuration_id uuid references public.turbine_configurations(id) on delete set null,
  prototype_version text not null,
  generator_details text,
  controller_details text,
  installation_site text,
  commissioning_date date,
  firmware_version text,
  sensor_configuration text,
  safety_status text not null default 'monitoring_only_no_remote_actuation',
  operational_state text not null default 'offline',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.option_comparisons (
  id uuid primary key default gen_random_uuid(),
  criterion text not null unique,
  option_a_notes text not null,
  option_b_notes text not null,
  option_a_score numeric(3,1),
  option_b_score numeric(3,1),
  measurement_basis text not null,
  evidence_tier public.evidence_tier not null default 'DESIGN_TARGET',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_uid text not null unique,
  turbine_id uuid references public.turbines(id) on delete cascade,
  hmac_secret_hash text not null,
  firmware_version text,
  last_heartbeat_at timestamptz,
  device_health text default 'offline',
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sensors (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  sensor_type text not null,
  model_name text,
  calibration_offset numeric(10,4) default 0,
  calibration_scale numeric(10,4) default 1,
  last_calibrated_at timestamptz,
  calibration_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.telemetry (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  turbine_id uuid references public.turbines(id) on delete set null,
  site_id text not null,
  sequence_no bigint not null,
  device_timestamp timestamptz not null,
  ingested_at timestamptz not null default now(),
  wind_speed_ms numeric(8,3) not null,
  wind_direction text,
  rotor_rpm numeric(10,2) not null,
  generator_rpm numeric(10,2),
  dc_voltage_v numeric(10,3) not null,
  dc_current_a numeric(10,3) not null,
  power_w numeric(12,3) not null,
  cumulative_energy_wh numeric(14,4),
  temperature_c numeric(6,2),
  vibration_g text,
  brake_state text default 'unknown',
  battery_soc_pct numeric(5,2),
  device_health text,
  sensor_health text,
  data_quality_status text not null default 'valid',
  fault_code text,
  unique (device_id, device_timestamp, sequence_no)
);

create index if not exists idx_telemetry_turbine_ts on public.telemetry(turbine_id, device_timestamp desc);

create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  test_code text not null unique,
  turbine_id uuid references public.turbines(id) on delete set null,
  objective text not null,
  configuration text not null,
  location text not null,
  start_time timestamptz,
  end_time timestamptz,
  sensors_used text,
  calibration_details text,
  operator_name text,
  weather_conditions text,
  safety_checklist_passed boolean not null default false,
  result_summary text,
  failure_notes text,
  reviewed_by text,
  state text not null default 'draft',
  evidence_tier public.evidence_tier not null default 'PROTOTYPE_OBSERVATION',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_measurements (
  id uuid primary key default gen_random_uuid(),
  test_run_id uuid references public.test_runs(id) on delete cascade,
  recorded_at timestamptz not null,
  config_id text,
  wind_speed_ms numeric(8,3) not null,
  rotor_rpm numeric(10,2) not null,
  voltage_v numeric(10,3) not null,
  current_a numeric(10,3) not null,
  power_w numeric(12,3) not null,
  vibration_g text,
  data_quality_status text not null default 'valid',
  notes text
);

create table if not exists public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  turbine_id uuid references public.turbines(id) on delete cascade,
  event_date date not null default current_date,
  description text not null,
  downtime_hours numeric(8,2) default 0,
  performed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.faults (
  id uuid primary key default gen_random_uuid(),
  turbine_id uuid references public.turbines(id) on delete cascade,
  fault_code text not null,
  severity text not null default 'warning',
  description text not null,
  resolved boolean not null default false,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- 4. Resources, Publications, Patents
create table if not exists public.product_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  version text not null default 'v1.0',
  visibility text not null default 'private',
  storage_path text,
  external_url text,
  summary text,
  evidence_tier public.evidence_tier not null default 'ENGINEERING_ESTIMATE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text not null,
  venue text,
  publication_year int,
  document_url text,
  verified_citation boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.patents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  application_number text,
  publication_number text,
  jurisdiction text not null default 'Indian Patent Office (IPO)',
  inventor text not null,
  applicant text,
  legal_status text not null default 'Published Application — Under Examination (Not Granted)',
  published_year int not null,
  scope_summary text,
  updated_at timestamptz not null default now()
);

-- 5. Internal Project Management, BOM, Financials & Grants
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  track text not null,
  owner text not null,
  priority text not null default 'P1',
  start_date date,
  due_date date,
  status text not null default 'todo',
  dependencies jsonb default '[]'::jsonb,
  acceptance_criteria text,
  evidence_attachment text,
  reviewer text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_type text not null default 'active_recalculated',
  target_date date,
  status text not null default 'planned',
  evidence_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  capability text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.bom_items (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  subsystem text not null,
  prototype_cost_inr numeric(12,2) not null default 0,
  target_cost_inr numeric(12,2) not null default 0,
  basis public.evidence_tier not null default 'COMMERCIAL_ASSUMPTION',
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  bom_item_id uuid references public.bom_items(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  batch_qty int not null,
  unit_price_inr numeric(12,2) not null,
  quoted_date date not null default current_date,
  document_ref text
);

create table if not exists public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  batch_size int not null,
  unit_bom_inr numeric(12,2) not null,
  assembly_logistics_inr numeric(12,2) not null default 0,
  proposed_sale_price_inr numeric(12,2),
  monthly_burn_inr numeric(12,2) not null default 0,
  cash_balance_inr numeric(12,2) not null default 0,
  funding_received_inr numeric(12,2) not null default 0,
  assumptions_note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agency text not null,
  grant_type text,
  funding_range text,
  opening_date date,
  closing_date date,
  eligibility_notes text
);

create table if not exists public.grant_applications (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references public.grants(id) on delete cascade,
  status text not null default 'Researching / Eligibility Check',
  submission_date date,
  amount_requested_inr numeric(12,2),
  amount_approved_inr numeric(12,2),
  conditions text,
  evidence_doc_ref text,
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  report_month text not null,
  pillars_json jsonb not null,
  commentary text,
  next_30_day_priorities jsonb default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

-- 6. Notifications, Analytics & Immutable Audit Logs
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  recipient text not null,
  subject text not null,
  payload jsonb,
  delivery_status text not null default 'pending',
  provider_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (STRICT LEAST-PRIVILEGE ENFORCEMENT)
-- ==============================================================================

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.contacts enable row level security;
alter table public.website_inquiries enable row level security;
alter table public.site_assessments enable row level security;
alter table public.pilot_applications enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.pilot_projects enable row level security;
alter table public.turbine_configurations enable row level security;
alter table public.turbines enable row level security;
alter table public.option_comparisons enable row level security;
alter table public.devices enable row level security;
alter table public.sensors enable row level security;
alter table public.telemetry enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_measurements enable row level security;
alter table public.maintenance_events enable row level security;
alter table public.faults enable row level security;
alter table public.product_documents enable row level security;
alter table public.publications enable row level security;
alter table public.patents enable row level security;
alter table public.tasks enable row level security;
alter table public.milestones enable row level security;
alter table public.vendors enable row level security;
alter table public.bom_items enable row level security;
alter table public.quotations enable row level security;
alter table public.financial_scenarios enable row level security;
alter table public.grants enable row level security;
alter table public.grant_applications enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.analytics_events enable row level security;

-- Public curated read policies
create policy "Public read curated configs" on public.turbine_configurations
  for select using (is_public = true or public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member', 'external_reviewer'));

create policy "Public read curated option comparisons" on public.option_comparisons
  for select using (is_public = true or public.current_user_role() <> 'public_visitor');

create policy "Public read public documents only" on public.product_documents
  for select using (visibility = 'public' or public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'external_reviewer'));

create policy "Public read publications & patents" on public.publications
  for select using (true);
create policy "Public read patents" on public.patents
  for select using (true);

-- Strict private CRM & Inquiries (NEVER readable by public or generic team_member)
create policy "CRM access limited to founder & crm_admin" on public.website_inquiries
  for select using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));
create policy "CRM orgs limited to founder & crm_admin" on public.organizations
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));
create policy "CRM contacts limited to founder & crm_admin" on public.contacts
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));
create policy "CRM leads limited to founder & crm_admin" on public.leads
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));
create policy "CRM pilot apps limited to founder & crm_admin" on public.pilot_applications
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));

-- Financial & BOM isolation (NEVER accessible to team_member or public)
create policy "Financial scenarios restricted to founder" on public.financial_scenarios
  for all using (public.current_user_role() = 'founder_super_admin');
create policy "BOM items restricted to founder & engineering_admin" on public.bom_items
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));
create policy "Quotations restricted to founder" on public.quotations
  for all using (public.current_user_role() = 'founder_super_admin');

-- Engineering & Telemetry isolation
create policy "Engineering read for team & admins" on public.turbines
  for select using (is_public = true or public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member', 'external_reviewer'));
create policy "Telemetry read for team & admins" on public.telemetry
  for select using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member', 'external_reviewer'));
create policy "Devices secret table strictly restricted to engineering/founder" on public.devices
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

-- Audit Logs strictly read-only for founder_super_admin
create policy "Audit logs read strictly by founder" on public.audit_logs
  for select using (public.current_user_role() = 'founder_super_admin');
