-- 0005_storage.sql — file storage for child photos, indemnity forms, assessment attachments.
-- Additive & safe: new nullable columns + private buckets + storage RLS + a coordinator-only usage RPC.

-- 1. schema columns (nullable / defaulted so existing rows are unaffected)
alter table child add column if not exists photo_path text;
alter table child add column if not exists indemnity_path text;
alter table assessment add column if not exists attachments jsonb not null default '[]';

-- 2. private storage buckets (5 MB cap, image/pdf only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('child-photos',     'child-photos',     false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('child-docs',       'child-docs',       false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('assessment-files', 'assessment-files', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- 3. storage RLS: authenticated staff may read/write these three buckets.
-- Internal staff-only tool; buckets are private (no public URLs) and access is via
-- short-lived signed URLs. Per-class scoping of files is intentionally NOT enforced at
-- the storage layer (see app-level gating); tighten here if the auth pool ever widens.
drop policy if exists amava_storage_read   on storage.objects;
drop policy if exists amava_storage_insert on storage.objects;
drop policy if exists amava_storage_update on storage.objects;
drop policy if exists amava_storage_delete on storage.objects;
create policy amava_storage_read   on storage.objects for select to authenticated
  using (bucket_id in ('child-photos','child-docs','assessment-files'));
create policy amava_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('child-photos','child-docs','assessment-files'));
create policy amava_storage_update on storage.objects for update to authenticated
  using (bucket_id in ('child-photos','child-docs','assessment-files'))
  with check (bucket_id in ('child-photos','child-docs','assessment-files'));
create policy amava_storage_delete on storage.objects for delete to authenticated
  using (bucket_id in ('child-photos','child-docs','assessment-files'));

-- 4. coordinator-only storage usage RPC (bytes used per bucket + total)
create or replace function admin_storage_usage()
returns json language plpgsql security definer set search_path = public, storage as $$
declare result json;
begin
  if not exists (select 1 from facilitator where id = auth.uid() and role = 'coordinator') then
    raise exception 'not authorized';
  end if;
  select json_build_object(
    'total',   coalesce(sum(bytes), 0),
    'buckets', coalesce(json_object_agg(bucket_id, bytes) filter (where bucket_id is not null), '{}'::json)
  ) into result
  from (
    select bucket_id, coalesce(sum((metadata->>'size')::bigint), 0) as bytes
    from storage.objects
    where bucket_id in ('child-photos','child-docs','assessment-files')
    group by bucket_id
  ) t;
  return result;
end$$;
grant execute on function admin_storage_usage() to authenticated;
