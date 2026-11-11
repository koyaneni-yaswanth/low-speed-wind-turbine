-- ==============================================================================
-- PAWAN SHAKTI — SUPABASE STORAGE BUCKETS & LEAST-PRIVILEGE OBJECT POLICIES
-- Migration: 003_storage_buckets_and_policies.sql
-- Non-destructive, idempotent storage configuration separating public assets
-- from private Data Room documents & raw engineering CSV datasets.
-- ==============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'public-docs',
    'public-docs',
    true,
    15728640,
    array['application/pdf', 'text/plain', 'text/csv', 'image/png', 'image/jpeg', 'model/stl', 'model/3mf']
  ),
  (
    'dataroom-private',
    'dataroom-private',
    false,
    26214400,
    array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/markdown', 'image/png', 'image/jpeg']
  ),
  (
    'telemetry-csvs',
    'telemetry-csvs',
    false,
    26214400,
    array['text/csv', 'text/plain', 'application/json']
  )
on conflict (id) do nothing;

-- Note: storage.objects already has RLS enabled on Supabase. Avoid unnecessary broad
-- SELECT policy on public buckets so anonymous clients cannot enumerate public-docs
-- (resolves Advisor 0025_public_bucket_allows_listing while public URLs stay readable).

drop policy if exists "Public docs write by founder & eng" on storage.objects;
create policy "Public docs write by founder & eng"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-docs'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );

drop policy if exists "Public docs update by founder & eng" on storage.objects;
create policy "Public docs update by founder & eng"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-docs'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );

drop policy if exists "Public docs delete by founder & eng" on storage.objects;
create policy "Public docs delete by founder & eng"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-docs'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );

-- Confidential Data Room objects: readable only by founder, eng_admin, external_reviewer
drop policy if exists "Private dataroom read by authorized reviewers" on storage.objects;
create policy "Private dataroom read by authorized reviewers"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dataroom-private'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'external_reviewer')
  );

drop policy if exists "Private dataroom write by founder & eng" on storage.objects;
create policy "Private dataroom write by founder & eng"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dataroom-private'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );

drop policy if exists "Private dataroom update by founder & eng" on storage.objects;
create policy "Private dataroom update by founder & eng"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'dataroom-private'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );

drop policy if exists "Private dataroom delete by founder" on storage.objects;
create policy "Private dataroom delete by founder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dataroom-private'
    and public.current_user_role() = 'founder_super_admin'
  );

-- Raw ESP32 CSV Datasets: readable by engineering roles & team_member; NEVER public or crm_admin
drop policy if exists "Telemetry CSV read by engineering & team" on storage.objects;
create policy "Telemetry CSV read by engineering & team"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'telemetry-csvs'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin', 'team_member')
  );

drop policy if exists "Telemetry CSV upload by founder & eng" on storage.objects;
create policy "Telemetry CSV upload by founder & eng"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'telemetry-csvs'
    and public.current_user_role() in ('founder_super_admin', 'engineering_admin')
  );
