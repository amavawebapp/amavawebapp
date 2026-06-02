-- Editable "improved" threshold (was a frontend constant).
alter table programme add column if not exists improved_threshold int not null default 1;

-- Coordinators may insert/update config tables. Facilitators may not (no policy for them).
-- (Existing SELECT policies remain; RLS combines permissive policies with OR.)

create policy programme_cfg_update on programme for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

create policy area_cfg_insert on development_area for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
create policy area_cfg_update on development_area for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

create policy indicator_cfg_insert on indicator for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
create policy indicator_cfg_update on indicator for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
