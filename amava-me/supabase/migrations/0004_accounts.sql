alter table facilitator add column if not exists username text unique;
alter table facilitator add column if not exists active boolean not null default true;

-- Is the current request from an active coordinator?
create or replace function public.is_active_coordinator() returns boolean
language sql security definer set search_path = '' as $$
  select exists (
    select 1 from public.facilitator f
    where f.id = auth.uid() and f.role = 'coordinator' and f.active
  );
$$;

-- Create a username/password account + facilitator profile (coordinator-only).
create or replace function public.admin_create_user(
  p_username text, p_password text, p_name text, p_role text, p_class_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
  v_username text := lower(trim(p_username));
  v_email text;
begin
  if not public.is_active_coordinator() then raise exception 'Only coordinators may create accounts'; end if;
  if p_role not in ('facilitator','coordinator') then raise exception 'Invalid role'; end if;
  if v_username !~ '^[a-z0-9._-]{3,30}$' then raise exception 'Invalid username'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  if exists (select 1 from public.facilitator where username = v_username) then raise exception 'Username already taken'; end if;
  v_email := v_username || '@amava.local';
  if exists (select 1 from auth.users where email = v_email) then raise exception 'Username already taken'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now());

  insert into public.facilitator (id, name, role, class_ids, username, active)
  values (v_id, p_name, p_role, coalesce(p_class_ids, '{}'::uuid[]), v_username, true);

  return v_id;
end;
$$;

-- Reset a password (coordinator-only).
create or replace function public.admin_set_password(p_user_id uuid, p_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_coordinator() then raise exception 'Only coordinators may reset passwords'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  update auth.users
    set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
    where id = p_user_id;
end;
$$;

-- Update name/role/classes (coordinator-only; guards the last coordinator).
create or replace function public.admin_update_facilitator(
  p_user_id uuid, p_name text, p_role text, p_class_ids uuid[]
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_coordinator() then raise exception 'Only coordinators may edit accounts'; end if;
  if p_role not in ('facilitator','coordinator') then raise exception 'Invalid role'; end if;
  if p_role <> 'coordinator'
     and (select count(*) from public.facilitator where role = 'coordinator' and active and id <> p_user_id) = 0 then
    raise exception 'Cannot demote the last active coordinator';
  end if;
  update public.facilitator
    set name = p_name, role = p_role, class_ids = coalesce(p_class_ids, '{}'::uuid[])
    where id = p_user_id;
end;
$$;

-- Activate/deactivate (coordinator-only; guards the last coordinator). Deactivation bans login.
create or replace function public.admin_set_active(p_user_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_coordinator() then raise exception 'Only coordinators may change account status'; end if;
  if not p_active
     and exists (select 1 from public.facilitator where id = p_user_id and role = 'coordinator')
     and (select count(*) from public.facilitator where role = 'coordinator' and active and id <> p_user_id) = 0 then
    raise exception 'Cannot deactivate the last active coordinator';
  end if;
  update public.facilitator set active = p_active where id = p_user_id;
  update auth.users
    set banned_until = case when p_active then null else 'infinity'::timestamptz end, updated_at = now()
    where id = p_user_id;
end;
$$;

grant execute on function public.admin_create_user(text,text,text,text,uuid[]) to authenticated;
grant execute on function public.admin_set_password(uuid,text) to authenticated;
grant execute on function public.admin_update_facilitator(uuid,text,text,uuid[]) to authenticated;
grant execute on function public.admin_set_active(uuid,boolean) to authenticated;
