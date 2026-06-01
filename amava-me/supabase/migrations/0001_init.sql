create table programme (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scale_max int not null default 4,
  scale_descriptors jsonb not null,
  active boolean not null default true
);

create table development_area (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programme(id),
  name text not null,
  sort_order int not null,
  garden_only boolean not null default false,
  active boolean not null default true
);

create table indicator (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references development_area(id),
  text text not null,
  hint text,
  sort_order int not null,
  active boolean not null default true
);

create table class_group (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programme(id),
  name text not null,
  has_garden_component boolean not null default true,
  active boolean not null default true
);

create table facilitator (
  id uuid primary key,                 -- matches auth.users.id
  name text not null,
  role text not null default 'facilitator',
  class_ids uuid[] not null default '{}'
);

create table child (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references class_group(id),
  first_name text not null,
  surname text not null,
  fields jsonb not null default '{}',
  date_started date not null,
  is_sample boolean not null default true,
  active boolean not null default true
);

create table assessment (
  id text primary key,                 -- client-generated for offline-first
  child_id uuid not null references child(id),
  type text not null,
  date date not null,
  assessed_by uuid not null references facilitator(id),
  co_assessors text not null default '',
  scale_max int not null,
  scores jsonb not null,               -- [{indicatorId, indicatorText, score}]
  observations jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table programme enable row level security;
alter table development_area enable row level security;
alter table indicator enable row level security;
alter table class_group enable row level security;
alter table facilitator enable row level security;
alter table child enable row level security;
alter table assessment enable row level security;

-- Any signed-in user may read reference data. NOTE: ref_read_facilitator is
-- intentionally open to all authenticated users — this is an internal staff-only
-- tool, and the app caches all facilitators to display co-assessor names. If the
-- auth pool is ever widened beyond staff, restrict facilitator reads by role.
create policy ref_read_programme on programme for select to authenticated using (true);
create policy ref_read_area on development_area for select to authenticated using (true);
create policy ref_read_indicator on indicator for select to authenticated using (true);
create policy ref_read_class on class_group for select to authenticated using (true);
create policy ref_read_facilitator on facilitator for select to authenticated using (true);

-- A facilitator sees children only in their assigned classes; coordinators see all.
create policy child_read on child for select to authenticated using (
  exists (
    select 1 from facilitator f
    where f.id = auth.uid()
      and (f.role = 'coordinator' or child.class_id = any (f.class_ids))
  )
);

-- A facilitator reads/writes assessments for children in their classes; coordinators all.
create policy assessment_rw on assessment for all to authenticated using (
  exists (
    select 1 from facilitator f join child c on c.id = assessment.child_id
    where f.id = auth.uid()
      and (f.role = 'coordinator' or c.class_id = any (f.class_ids))
  )
) with check (
  exists (
    select 1 from facilitator f join child c on c.id = assessment.child_id
    where f.id = auth.uid()
      and (f.role = 'coordinator' or c.class_id = any (f.class_ids))
  )
);

-- Grant the API roles access to the tables so the Data API can reach them.
-- RLS (above) still governs which rows each role actually sees/writes.
grant usage on schema public to anon, authenticated;
grant select on programme, development_area, indicator, class_group, facilitator, child to anon, authenticated;
grant select, insert, update on assessment to authenticated;
