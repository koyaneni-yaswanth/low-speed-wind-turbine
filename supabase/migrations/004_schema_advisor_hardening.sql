-- ==============================================================================
-- PAWAN SHAKTI — SCHEMA ADVISOR HARDENING, FK CONSTRAINTS & INDEXES
-- Migration: 004_schema_advisor_hardening.sql
-- Non-destructive, additive Phase 4 database hardening layered onto 001–003.
-- ==============================================================================

-- 1. Pin immutable search_path on set_updated_at() trigger helper (resolves Advisor 0011)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Add missing foreign key constraint on pilot_projects.turbine_uuid -> turbines(id)
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'pilot_projects'
      and constraint_name = 'fk_pilot_projects_turbine'
  ) then
    alter table public.pilot_projects
      add constraint fk_pilot_projects_turbine
      foreign key (turbine_uuid) references public.turbines(id) on delete set null;
  end if;
end $$;

-- 3. Add covering B-tree indexes for relational foreign keys (prevents seq scans / Advisor 0001)
create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_site_assessments_org on public.site_assessments(organization_id);
create index if not exists idx_site_assessments_contact on public.site_assessments(contact_id);
create index if not exists idx_pilot_apps_assessment on public.pilot_applications(assessment_id);
create index if not exists idx_leads_org on public.leads(organization_id);
create index if not exists idx_leads_contact on public.leads(contact_id);
create index if not exists idx_leads_pilot_app on public.leads(pilot_application_id);
create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id);
create index if not exists idx_pilot_projects_lead on public.pilot_projects(lead_id);
create index if not exists idx_pilot_projects_turbine on public.pilot_projects(turbine_uuid);
create index if not exists idx_turbines_config on public.turbines(configuration_id);
create index if not exists idx_devices_turbine on public.devices(turbine_id);
create index if not exists idx_sensors_device on public.sensors(device_id);
create index if not exists idx_test_runs_turbine on public.test_runs(turbine_id);
create index if not exists idx_test_measurements_run on public.test_measurements(test_run_id);
create index if not exists idx_maintenance_turbine on public.maintenance_events(turbine_id);
create index if not exists idx_faults_turbine on public.faults(turbine_id);
create index if not exists idx_quotations_bom on public.quotations(bom_item_id);
create index if not exists idx_quotations_vendor on public.quotations(vendor_id);
create index if not exists idx_grant_apps_grant on public.grant_applications(grant_id);

-- 4. Allow founder_super_admin to prune/manage raw telemetry-csvs objects cleanly
drop policy if exists "Telemetry CSV delete by founder" on storage.objects;
create policy "Telemetry CSV delete by founder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'telemetry-csvs'
    and public.current_user_role() = 'founder_super_admin'
  );
