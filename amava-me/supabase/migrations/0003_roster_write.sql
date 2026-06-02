-- Coordinators create programmes (0002 already added programme UPDATE).
create policy programme_cfg_insert on programme for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

-- Coordinators create/edit classes.
create policy class_cfg_insert on class_group for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
create policy class_cfg_update on class_group for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

-- Children: coordinator (any) OR a facilitator who owns the row's class.
create policy child_write_insert on child for insert to authenticated with check (
  exists (select 1 from facilitator f where f.id = auth.uid()
    and (f.role = 'coordinator' or child.class_id = any (f.class_ids))));
create policy child_write_update on child for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid()
    and (f.role = 'coordinator' or child.class_id = any (f.class_ids))))
  with check (exists (select 1 from facilitator f where f.id = auth.uid()
    and (f.role = 'coordinator' or child.class_id = any (f.class_ids))));
