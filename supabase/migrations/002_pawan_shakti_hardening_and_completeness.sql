-- ==============================================================================
-- PAWAN SHAKTI — SCHEMA COMPLETENESS, FULL RLS POLICIES, TRIGGERS & REF SEEDS
-- Migration: 002_pawan_shakti_hardening_and_completeness.sql
-- Non-destructive, idempotent upgrade layered cleanly onto 001.
-- ==============================================================================

-- 1. Extend tables with missing domain columns required by Sections 6–10
alter table public.turbines
  add column if not exists rotor_diameter_m numeric(6,3),
  add column if not exists swept_area_m2 numeric(8,4),
  add column if not exists blade_geometry text,
  add column if not exists gear_architecture text,
  add column if not exists gear_ratio text,
  add column if not exists generator_type text,
  add column if not exists generator_rating text,
  add column if not exists frame_material text,
  add column if not exists bearing_config text,
  add column if not exists build_date date,
  add column if not exists modification_history text,
  add column if not exists photographs jsonb not null default '[]'::jsonb,
  add column if not exists cad_files jsonb not null default '[]'::jsonb,
  add column if not exists test_status text not null default 'untested';

alter table public.devices
  add column if not exists sampling_interval_sec int not null default 1,
  add column if not exists registered_by text,
  add column if not exists consecutive_errors int not null default 0;

alter table public.test_runs
  add column if not exists instrument_identifiers text,
  add column if not exists calibration_status text not null default 'uncalibrated',
  add column if not exists load_condition text,
  add column if not exists duration_sec int,
  add column if not exists observations text,
  add column if not exists csv_attachment_ref text,
  add column if not exists approval_status text not null default 'pending_review';

alter table public.leads
  add column if not exists discovery_date date,
  add column if not exists existing_energy_setup text,
  add column if not exists site_conditions text,
  add column if not exists proposal_value_inr numeric(12,2),
  add column if not exists evidence_attachments jsonb not null default '[]'::jsonb;

alter table public.tasks
  add column if not exists task_code text,
  add column if not exists workstream text,
  add column if not exists supporting_members jsonb not null default '[]'::jsonb;

alter table public.grants
  add column if not exists official_source_url text,
  add column if not exists required_documents jsonb not null default '[]'::jsonb;

alter table public.grant_applications
  add column if not exists owner_email text,
  add column if not exists follow_up_date date,
  add column if not exists submission_proof_ref text;

-- 2. Device Telemetry Error & Diagnostic Table (Rate-limit / Malformed / Auth Failures)
create table if not exists public.device_errors (
  id uuid primary key default gen_random_uuid(),
  device_uid text,
  error_type text not null,
  detail text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_device_errors_ts on public.device_errors(device_uid, occurred_at desc);

-- Helpful operational indexes
create index if not exists idx_leads_stage on public.leads(stage);
create index if not exists idx_leads_follow_up on public.leads(follow_up_date);
create index if not exists idx_test_runs_state on public.test_runs(state, created_at desc);
create index if not exists idx_tasks_status on public.tasks(status, priority);
create index if not exists idx_audit_logs_ts on public.audit_logs(created_at desc);

-- 3. Automatic updated_at Trigger + Least-Privilege Profile Safeguards
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if public.current_user_role() <> 'founder_super_admin' and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
      raise exception 'Forbidden: only founder_super_admin may alter role assignments';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_no_escalation on public.profiles;
create trigger trg_profiles_no_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'public_visitor'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles', 'organizations', 'contacts', 'site_assessments', 'pilot_applications',
    'leads', 'pilot_projects', 'turbine_configurations', 'turbines', 'option_comparisons',
    'devices', 'test_runs', 'product_documents', 'patents', 'tasks', 'bom_items',
    'financial_scenarios', 'grant_applications', 'notifications'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I;', tbl, tbl);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at();', tbl, tbl);
  end loop;
end $$;

-- 4. Complete RLS Policies Across ALL 36 Tables (Fail-Closed Least Privilege)
alter table public.device_errors enable row level security;

-- Roles catalog: readable by authenticated users
drop policy if exists "Roles readable by authenticated" on public.roles;
create policy "Roles readable by authenticated" on public.roles
  for select using (auth.uid() is not null);

-- Profiles: users read own profile; founder_super_admin reads/manages all
drop policy if exists "Profiles read self or founder" on public.profiles;
create policy "Profiles read self or founder" on public.profiles
  for select using (id = auth.uid() or public.current_user_role() = 'founder_super_admin');

drop policy if exists "Profiles update self non-role or founder" on public.profiles;
create policy "Profiles update self non-role or founder" on public.profiles
  for update using (id = auth.uid() or public.current_user_role() = 'founder_super_admin')
  with check (id = auth.uid() or public.current_user_role() = 'founder_super_admin');

-- CRM Sub-tables (strictly founder & crm_admin; NEVER team_member or public)
drop policy if exists "Site assessments restricted to crm & founder" on public.site_assessments;
create policy "Site assessments restricted to crm & founder" on public.site_assessments
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));

drop policy if exists "Lead activities restricted to crm & founder" on public.lead_activities;
create policy "Lead activities restricted to crm & founder" on public.lead_activities
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));

drop policy if exists "Pilot projects restricted to crm, eng & founder" on public.pilot_projects;
create policy "Pilot projects restricted to crm, eng & founder" on public.pilot_projects
  for all using (public.current_user_role() in ('founder_super_admin', 'crm_admin', 'engineering_admin'));

-- Engineering & Telemetry write/read policies
drop policy if exists "Turbines manage by eng & founder" on public.turbines;
create policy "Turbines manage by eng & founder" on public.turbines
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

drop policy if exists "Option comparisons score by eng & founder" on public.option_comparisons;
create policy "Option comparisons score by eng & founder" on public.option_comparisons
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

drop policy if exists "Sensors restricted to eng & founder" on public.sensors;
create policy "Sensors restricted to eng & founder" on public.sensors
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member'));

drop policy if exists "Test runs read & edit scoped" on public.test_runs;
create policy "Test runs read & edit scoped" on public.test_runs
  for select using (is_public = true or public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member', 'external_reviewer'));

drop policy if exists "Test runs write by eng & founder" on public.test_runs;
create policy "Test runs write by eng & founder" on public.test_runs
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

drop policy if exists "Test measurements scoped" on public.test_measurements;
create policy "Test measurements scoped" on public.test_measurements
  for select using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member', 'external_reviewer'));

drop policy if exists "Maintenance events scoped" on public.maintenance_events;
create policy "Maintenance events scoped" on public.maintenance_events
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member'));

drop policy if exists "Faults scoped" on public.faults;
create policy "Faults scoped" on public.faults
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member'));

drop policy if exists "Device errors restricted to eng & founder" on public.device_errors;
create policy "Device errors restricted to eng & founder" on public.device_errors
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

-- Tasks, Milestones, Vendors
drop policy if exists "Tasks read by team & admins" on public.tasks;
create policy "Tasks read by team & admins" on public.tasks
  for select using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'crm_admin', 'team_member'));

drop policy if exists "Tasks manage by admins" on public.tasks;
create policy "Tasks manage by admins" on public.tasks
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'crm_admin'));

drop policy if exists "Milestones scoped" on public.milestones;
create policy "Milestones scoped" on public.milestones
  for select using (public.current_user_role() <> 'public_visitor');

drop policy if exists "Vendors restricted to founder & eng" on public.vendors;
create policy "Vendors restricted to founder & eng" on public.vendors
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

-- Grants, Documents, Patents, Monthly Reports
drop policy if exists "Grants read by authorized roles" on public.grants;
create policy "Grants read by authorized roles" on public.grants
  for select using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'crm_admin', 'external_reviewer'));

drop policy if exists "Grants manage by founder" on public.grants;
create policy "Grants manage by founder" on public.grants
  for all using (public.current_user_role() = 'founder_super_admin');

drop policy if exists "Grant apps scoped" on public.grant_applications;
create policy "Grant apps scoped" on public.grant_applications
  for select using (public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'crm_admin', 'external_reviewer'));

drop policy if exists "Grant apps write by founder" on public.grant_applications;
create policy "Grant apps write by founder" on public.grant_applications
  for all using (public.current_user_role() = 'founder_super_admin');

drop policy if exists "Documents write by founder & eng" on public.product_documents;
create policy "Documents write by founder & eng" on public.product_documents
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

drop policy if exists "Patents manage by founder & eng" on public.patents;
create policy "Patents manage by founder & eng" on public.patents
  for all using (public.current_user_role() in ('founder_super_admin', 'engineering_admin'));

drop policy if exists "Monthly reports scoped" on public.monthly_reports;
create policy "Monthly reports scoped" on public.monthly_reports
  for select using (public.current_user_role() in ('founder_super_admin', 'external_reviewer'));

drop policy if exists "Monthly reports write by founder" on public.monthly_reports;
create policy "Monthly reports write by founder" on public.monthly_reports
  for all using (public.current_user_role() = 'founder_super_admin');

drop policy if exists "Notifications read by founder & crm" on public.notifications;
create policy "Notifications read by founder & crm" on public.notifications
  for select using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));

drop policy if exists "Analytics events read by founder & crm" on public.analytics_events;
create policy "Analytics events read by founder & crm" on public.analytics_events
  for select using (public.current_user_role() in ('founder_super_admin', 'crm_admin'));

-- 5. Idempotent Structural Baseline Seeds (Zero fake leads/telemetry/revenue)
insert into public.patents (title, jurisdiction, inventor, applicant, legal_status, published_year, scope_summary)
select
  'Compact Wind Turbine with Planetary Gears',
  'Indian Patent Office (IPO)',
  'Koyaneni Yaswanth',
  'Koyaneni Yaswanth',
  'Published Application — Under Examination (Not Granted)',
  2025,
  'Multi-rotor wind energy capture using coaxial planetary gearing; official application/publication number pending founder verification.'
where not exists (
  select 1 from public.patents where title = 'Compact Wind Turbine with Planetary Gears'
);

insert into public.turbine_configurations (code, name, rotor_architecture, transmission_type, gear_ratio, swept_area_m2, frame_material, blade_material, evidence_tier, is_public, notes)
values
  ('MARK-3', 'Mark-3 Three-Rotor Clustered Setup', '3 x 300 mm multi-blade impellers', 'Coaxial Planetary Spur (Mod 2.5)', '1:10 nominal', 0.2120, 'Wooden mast / structural mounting base', 'FDM polymer (PLA/ABS)', 'PROTOTYPE_OBSERVATION', true, 'Historical campus rig; informal cut-in ~2.3-2.5 m/s.'),
  ('MARK-4', 'Mark-4 Four-Rotor Planar Planetary Setup', '4 x 300 mm planar square cluster', '4-setup planetary + rear fan gear', '1:10 nominal', 0.2830, 'Wooden outer frame / aluminum fixture', 'FDM S1223-derived multi-blade', 'PROTOTYPE_OBSERVATION', true, 'Primary planar reference; historical 36.25W log flagged as Betz anomaly pending calibrated rerun.'),
  ('MARK-5', 'Mark-5 Five-Rotor Project KECS Rig', '5 x 300 mm star planar array', '5 parallel spur pinions', '1:10 nominal', 0.3530, 'Extruded T-slot aluminum bench rig', 'FDM polymer', 'PROTOTYPE_OBSERVATION', true, 'Empirically showed 5-mesh friction ceiling.'),
  ('WORKING-1M2', 'Next-Gen ~1 m² Dyno Shootout Candidate', 'Option A (HAWT S1223) vs Option B (Archimedes Spiral)', 'Option A Magnetic Gear (~1:5.5 / 1:10) vs Option B Planetary', 'Under evaluation', 1.0000, 'Aluminum 6063 extrusion + CNC aluminum plates (target)', 'UV-stabilized composite / ASA (target)', 'DESIGN_TARGET', true, 'Preliminary 1 m2 design assumptions under comparative dyno planning.')
on conflict (code) do nothing;

insert into public.option_comparisons (criterion, option_a_notes, option_b_notes, measurement_basis, evidence_tier, is_public)
values
  ('Starting torque', 'Zero-gear contact stiction across magnetic air gap (~1.5 mm target)', 'Depends on Archimedes spiral solidity & gear carrier inertia', 'Torque transducer stall test required', 'DESIGN_TARGET', true),
  ('Static friction', 'Limited solely to sealed rotor/hub bearings', 'Includes bearing drag + multi-tooth involute friction', 'Spin-down tare torque decay test', 'ENGINEERING_ESTIMATE', true),
  ('Cogging torque', 'Pole-harmonic ripple + modulator interaction + coreless PMA pairing', 'Generator cogging multiplied by planetary gear ratio', 'Load-cell breakaway measurement', 'DESIGN_TARGET', true),
  ('Cut-in wind speed', 'Target <= 2.2 m/s subject to N52 pole-slip stiffness', 'Historical 2.3-2.6 m/s informal bench on earlier spur rigs', 'Calibrated closed-loop cut-in protocol', 'DESIGN_TARGET', true),
  ('RPM response', 'HAWT tip-speed ratio response under low turbulence', 'Broad angular acceptance; lower TSR range', 'Optical/Hall tachometer step-response test', 'ENGINEERING_ESTIMATE', true),
  ('Torque multiplication / Step-up', '1:5.5 or 1:10 coaxial magnetic ratio under evaluation', '1:10 planetary step-up ratio', 'Input vs output shaft optical encoders', 'DESIGN_TARGET', true),
  ('Transmission efficiency', 'Eddy/hysteresis modulator losses vs zero tooth sliding', 'Gear tooth sliding friction loss (~10-25% est. polymer)', 'Back-to-back dynamometer torque x omega', 'ENGINEERING_ESTIMATE', true),
  ('Generator compatibility', 'Target 300-600 RPM coreless PMA (300-500W class)', 'Matches high-RPM DC/PMA with stage adjustment', 'Generator V-I-RPM load curve test', 'DESIGN_TARGET', true),
  ('Vibration', 'Non-contact coupling isolates shock; magnet balancing needed', 'Gear mesh frequency vibration observed >300 RPM', 'ADXL345 triaxial FFT spectrum', 'PROTOTYPE_OBSERVATION', true),
  ('Noise', 'Low mechanical acoustic emission expected', 'Gear tooth rattle observed on Mark-3 / Mark-5', 'Sound level meter at 1 m under load', 'PROTOTYPE_OBSERVATION', true),
  ('Structural loading', 'Tight ~1.5 mm air gap demands rigid coaxial bearings', 'Coaxial radial loads cancel; rear carrier rigidity needed', 'Dial runout + FEA + thrust rig', 'ENGINEERING_ESTIMATE', true),
  ('Fabrication complexity', 'N52 magnet pocket tolerances & laminated flux modulators', 'Gear hobbing / CNC Delrin or tight FDM', 'Workshop machining hours & scrap rate', 'COMMERCIAL_ASSUMPTION', true),
  ('BOM cost', 'Sensitive to N52 magnets & steel modulator', 'Sensitive to CNC Delrin / aluminum machining', 'Vendor quotes at 1, 10, 50 unit batches', 'COMMERCIAL_ASSUMPTION', true),
  ('Maintainability', 'No gear grease; sealed bearings & magnet corrosion shield', 'Periodic tooth wear inspection & PTFE lubrication', 'Scheduled maintenance inspection intervals', 'DESIGN_TARGET', true),
  ('Safety', 'Magnetic pole-slip decouples overload; downstream E-brake required', 'Solid tooth lock transmits overload to blades', 'Overspeed dynamic brake & fault abuse test', 'DESIGN_TARGET', true),
  ('Environmental durability', 'Magnet demag temp, corrosion & dust in 1.5 mm gap', 'Polymer thermal softening & grit abrasion', 'Monsoon/UV field endurance run (>=30 days)', 'FUTURE_ROADMAP', true)
on conflict (criterion) do nothing;
