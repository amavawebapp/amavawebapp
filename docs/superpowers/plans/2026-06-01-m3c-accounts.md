# Milestone 3c — Facilitator Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinators create and manage username+password logins (facilitator or coordinator), assign classes, reset passwords, and deactivate accounts — all in-app, with no email — and users log in by username.

**Architecture:** A migration adds `username`/`active` to the facilitator profile and four `SECURITY DEFINER` Postgres functions (coordinator-gated) that create/manage Supabase Auth users with a synthetic `username@amava.local` email. A thin `accounts-client` calls them via `supabase.rpc`. Pure helpers map usernames↔emails. The login screen switches to a username field.

**Tech Stack:** Existing stack. No new runtime dependencies; no service-role key in the client.

---

## File Structure

```
amava-me/
  supabase/migrations/0004_accounts.sql      # username/active cols + admin_* functions
  src/
    domain/
      username.ts                            # loginIdentifierToEmail, validateUsername
      username.test.ts
      types.ts                               # Facilitator: + username?, active?
    data/
      supabase-sync-client.ts                # map username/active
      accounts-client.ts                     # rpc wrappers
    components/
      AccountManager.tsx
      AccountManager.test.tsx
    screens/
      LoginScreen.tsx                         # username field + mapping
      SettingsScreen.tsx                      # + AccountManager section
```

---

## Task 1: Migration — username/active columns + secure account functions

**Files:**
- Create: `amava-me/supabase/migrations/0004_accounts.sql`

- [ ] **Step 1: Write the migration**

Create `amava-me/supabase/migrations/0004_accounts.sql`:
```sql
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
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

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
```

- [ ] **Step 2: Apply to the live project**

Controller action (Management API `database/query`, or dashboard SQL Editor). If the `auth.users` insert fails on a NOT-NULL column without a default in this Supabase version, add that column with `''`/appropriate default to the insert and re-run — verify by creating one test account (Task 7 live check). Not needed for the unit tests in Tasks 2–6.

- [ ] **Step 3: Commit**

```bash
git add amava-me/supabase/migrations/0004_accounts.sql
git commit -m "feat: migration for account functions (username login, coordinator-gated)"
```

---

## Task 2: username helpers (TDD)

**Files:**
- Create: `amava-me/src/domain/username.ts`
- Test: `amava-me/src/domain/username.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/domain/username.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { loginIdentifierToEmail, validateUsername } from './username'

describe('loginIdentifierToEmail', () => {
  it('appends the synthetic domain to a bare username (lowercased)', () => {
    expect(loginIdentifierToEmail('Thabo')).toBe('thabo@amava.local')
  })
  it('passes through an actual email (lowercased)', () => {
    expect(loginIdentifierToEmail('Person@Example.com')).toBe('person@example.com')
  })
  it('trims surrounding whitespace', () => {
    expect(loginIdentifierToEmail('  thabo  ')).toBe('thabo@amava.local')
  })
})

describe('validateUsername', () => {
  it('accepts a valid username', () => {
    expect(validateUsername('thabo.m')).toBeNull()
    expect(validateUsername('lead-1')).toBeNull()
  })
  it('rejects too short, too long, or illegal characters', () => {
    expect(validateUsername('ab')).toMatch(/3/)
    expect(validateUsername('has space')).toMatch(/letters/i)
    expect(validateUsername('UPPER!')).toMatch(/letters/i)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- username`
Expected: FAIL — "Cannot find module './username'".

- [ ] **Step 3: Implement**

Create `amava-me/src/domain/username.ts`:
```ts
/** Map a login input to the auth email: bare username -> username@amava.local; an email passes through. */
export function loginIdentifierToEmail(input: string): string {
  const v = input.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@amava.local`
}

/** null if a valid username, else an error message. */
export function validateUsername(input: string): string | null {
  const v = input.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,30}$/.test(v)) {
    return 'Username must be 3–30 letters, numbers, dot, underscore or hyphen (no spaces).'
  }
  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- username`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/username.ts amava-me/src/domain/username.test.ts
git commit -m "feat: username helpers (login mapping + validation)"
```

---

## Task 3: Facilitator type + reference mapping

**Files:**
- Modify: `amava-me/src/domain/types.ts`, `amava-me/src/data/supabase-sync-client.ts`

- [ ] **Step 1: Extend the Facilitator type**

In `amava-me/src/domain/types.ts`, add two optional fields to the `Facilitator` interface (after `classIds`):
```ts
  username?: string
  active?: boolean
```
(Optional, so existing usages/fixtures are unaffected; consumers treat `active !== false` as active.)

- [ ] **Step 2: Map them in the adapter**

In `amava-me/src/data/supabase-sync-client.ts`, the `facilitators` map currently returns `{ id, name, role, classIds }`. Add the two fields:
```ts
      facilitators: (facilitators.data ?? []).map((f): Facilitator => ({
        id: f.id, name: f.name, role: f.role, classIds: f.class_ids,
        username: f.username ?? undefined, active: f.active ?? true,
      })),
```

- [ ] **Step 3: Verify**

Run: `npm run build` — clean.
Run: `npm run test` — all suites still pass.

- [ ] **Step 4: Commit**

```bash
git add amava-me/src/domain/types.ts amava-me/src/data/supabase-sync-client.ts
git commit -m "feat: Facilitator carries username + active"
```

---

## Task 4: accounts-client (rpc wrappers)

**Files:**
- Create: `amava-me/src/data/accounts-client.ts`

- [ ] **Step 1: Implement**

Create `amava-me/src/data/accounts-client.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AccountsClient {
  createUser(username: string, password: string, name: string, role: string, classIds: string[]): Promise<void>
  setPassword(userId: string, password: string): Promise<void>
  updateFacilitator(userId: string, name: string, role: string, classIds: string[]): Promise<void>
  setActive(userId: string, active: boolean): Promise<void>
}

export class SupabaseAccountsClient implements AccountsClient {
  constructor(private sb: SupabaseClient) {}
  private async rpc(fn: string, args: Record<string, unknown>) {
    const { error } = await this.sb.rpc(fn, args)
    if (error) throw error
  }
  async createUser(username: string, password: string, name: string, role: string, classIds: string[]) {
    await this.rpc('admin_create_user', { p_username: username, p_password: password, p_name: name, p_role: role, p_class_ids: classIds })
  }
  async setPassword(userId: string, password: string) {
    await this.rpc('admin_set_password', { p_user_id: userId, p_password: password })
  }
  async updateFacilitator(userId: string, name: string, role: string, classIds: string[]) {
    await this.rpc('admin_update_facilitator', { p_user_id: userId, p_name: name, p_role: role, p_class_ids: classIds })
  }
  async setActive(userId: string, active: boolean) {
    await this.rpc('admin_set_active', { p_user_id: userId, p_active: active })
  }
}

export const accountsClient: AccountsClient = new SupabaseAccountsClient(supabase)
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` — clean.
```bash
git add amava-me/src/data/accounts-client.ts
git commit -m "feat: accounts-client rpc wrappers"
```

---

## Task 5: Username login

**Files:**
- Modify: `amava-me/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Switch the login field to username**

Replace the contents of `amava-me/src/screens/LoginScreen.tsx` with:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { loginIdentifierToEmail } from '../domain/username'

export function LoginScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn(loginIdentifierToEmail(username), password)
    if (error) setError('Incorrect username or password.')
    else navigate('/')
  }

  return (
    <form className="container" onSubmit={submit}>
      <h1>Amava M&amp;E</h1>
      <label>Username
        <input aria-label="username" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%' }} />
      </label>
      <label>Password
        <input aria-label="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
      </label>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>Use the username your coordinator set (an email also works).</p>
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}
```
(Note: `signIn(email, password)` from the auth context is unchanged — we just feed it the mapped identifier. The error message is generic to avoid leaking which field was wrong.)

- [ ] **Step 2: Verify**

Run: `npm run build` — clean.
Run: `npm run test` — all suites pass.

- [ ] **Step 3: Commit**

```bash
git add amava-me/src/screens/LoginScreen.tsx
git commit -m "feat: username-based login (maps to synthetic email)"
```

---

## Task 6: AccountManager component (TDD)

**Files:**
- Create: `amava-me/src/components/AccountManager.tsx`
- Test: `amava-me/src/components/AccountManager.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/AccountManager.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountManager } from './AccountManager'
import type { Facilitator, ClassGroup } from '../domain/types'

const classes: ClassGroup[] = [
  { id: 'c1', programmeId: 'p', name: 'Class 1', hasGardenComponent: true, active: true },
]
const facilitators: Facilitator[] = [
  { id: 'u1', name: 'Coordinator', role: 'coordinator', classIds: [], username: 'admin', active: true },
]
const noop = () => {}
const base = { facilitators, classes, onCreate: noop, onSetPassword: noop, onUpdate: noop, onSetActive: noop }

describe('AccountManager', () => {
  it('lists existing accounts', () => {
    render(<AccountManager {...base} />)
    expect(screen.getByText(/Coordinator/)).toBeInTheDocument()
    expect(screen.getByText(/admin/)).toBeInTheDocument()
  })
  it('creates an account with the entered details', async () => {
    const onCreate = vi.fn()
    render(<AccountManager {...base} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('new name'), 'Thabo M')
    await userEvent.type(screen.getByLabelText('new username'), 'thabo')
    await userEvent.type(screen.getByLabelText('new password'), 'password123')
    await userEvent.click(screen.getByLabelText('assign Class 1'))
    await userEvent.click(screen.getByRole('button', { name: /Create account/ }))
    expect(onCreate).toHaveBeenCalledWith({ username: 'thabo', password: 'password123', name: 'Thabo M', role: 'facilitator', classIds: ['c1'] })
  })
  it('blocks creation with an invalid username', async () => {
    const onCreate = vi.fn()
    render(<AccountManager {...base} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('new name'), 'X')
    await userEvent.type(screen.getByLabelText('new username'), 'ab')
    await userEvent.type(screen.getByLabelText('new password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Create account/ }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/Username must be 3/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AccountManager`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `amava-me/src/components/AccountManager.tsx`:
```tsx
import { useState } from 'react'
import type { Facilitator, ClassGroup } from '../domain/types'
import { validateUsername } from '../domain/username'

interface CreateInput { username: string; password: string; name: string; role: string; classIds: string[] }
interface Props {
  facilitators: Facilitator[]
  classes: ClassGroup[]
  onCreate: (input: CreateInput) => void
  onSetPassword: (userId: string, password: string) => void
  onUpdate: (userId: string, name: string, role: string, classIds: string[]) => void
  onSetActive: (userId: string, active: boolean) => void
}

function ClassChecks({ classes, selected, onToggle, labelPrefix }: { classes: ClassGroup[]; selected: string[]; onToggle: (id: string) => void; labelPrefix: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {classes.map(c => (
        <label key={c.id} style={{ fontSize: 13 }}>
          <input aria-label={`${labelPrefix} ${c.name}`} type="checkbox" checked={selected.includes(c.id)} onChange={() => onToggle(c.id)} /> {c.name}
        </label>
      ))}
    </div>
  )
}

export function AccountManager({ facilitators, classes, onCreate, onSetPassword, onUpdate, onSetActive }: Props) {
  const activeClasses = classes.filter(c => c.active)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('facilitator')
  const [classIds, setClassIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [resetPwd, setResetPwd] = useState('')

  function create() {
    const uErr = validateUsername(username)
    if (!name.trim()) { setError('Name is required.'); return }
    if (uErr) { setError(uErr); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    onCreate({ username: username.trim().toLowerCase(), password, name: name.trim(), role, classIds })
    setName(''); setUsername(''); setPassword(''); setRole('facilitator'); setClassIds([])
  }
  const toggle = (set: (f: (s: string[]) => string[]) => void) => (id: string) =>
    set(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div>
      <h3>Add an account</h3>
      <div style={{ display: 'grid', gap: 8, maxWidth: 420, marginBottom: 12 }}>
        <input aria-label="new name" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
        <input aria-label="new username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input aria-label="new password" type="text" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} />
        <select aria-label="new role" value={role} onChange={e => setRole(e.target.value)}>
          <option value="facilitator">Facilitator</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <ClassChecks classes={activeClasses} selected={classIds} onToggle={toggle(setClassIds)} labelPrefix="assign" />
        {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
        <button className="primary" onClick={create}>Create account</button>
      </div>

      <h3>Accounts</h3>
      {facilitators.map(f => (
        <AccountRow key={f.id} f={f} classes={activeClasses}
          onUpdate={onUpdate} onSetActive={onSetActive}
          resetOpen={resetFor === f.id}
          onOpenReset={() => { setResetFor(f.id); setResetPwd('') }}
          onCancelReset={() => setResetFor(null)}
          resetPwd={resetPwd} setResetPwd={setResetPwd}
          onConfirmReset={() => { if (resetPwd.length >= 8) { onSetPassword(f.id, resetPwd); setResetFor(null) } }}
        />
      ))}
    </div>
  )
}

function AccountRow({ f, classes, onUpdate, onSetActive, resetOpen, onOpenReset, onCancelReset, resetPwd, setResetPwd, onConfirmReset }: {
  f: Facilitator; classes: ClassGroup[]
  onUpdate: (userId: string, name: string, role: string, classIds: string[]) => void
  onSetActive: (userId: string, active: boolean) => void
  resetOpen: boolean; onOpenReset: () => void; onCancelReset: () => void
  resetPwd: string; setResetPwd: (v: string) => void; onConfirmReset: () => void
}) {
  const [name, setName] = useState(f.name)
  const [role, setRole] = useState(f.role)
  const [classIds, setClassIds] = useState<string[]>(f.classIds)
  const active = f.active !== false
  const dirty = name !== f.name || role !== f.role || classIds.join() !== f.classIds.join()
  const toggle = (id: string) => setClassIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  return (
    <div style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 8, opacity: active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input aria-label={`name ${f.username ?? f.id}`} value={name} onChange={e => setName(e.target.value)} />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{f.username ?? '(email login)'}</span>
        <select aria-label={`role ${f.username ?? f.id}`} value={role} onChange={e => setRole(e.target.value as Facilitator['role'])}>
          <option value="facilitator">Facilitator</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <button onClick={() => onSetActive(f.id, !active)}>{active ? 'Deactivate' : 'Reactivate'}</button>
        <button onClick={onOpenReset}>Reset password</button>
        {dirty && <button className="primary" onClick={() => onUpdate(f.id, name.trim(), role, classIds)}>Save</button>}
      </div>
      <ClassChecks classes={classes} selected={classIds} onToggle={toggle} labelPrefix={`class ${f.username ?? f.id}`} />
      {resetOpen && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input aria-label="reset password" type="text" placeholder="New password (min 8)" value={resetPwd} onChange={e => setResetPwd(e.target.value)} />
          <button className="primary" disabled={resetPwd.length < 8} onClick={onConfirmReset}>Set password</button>
          <button onClick={onCancelReset}>Cancel</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AccountManager`
Expected: PASS (3 tests). Also `npm run build` clean.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/components/AccountManager.tsx amava-me/src/components/AccountManager.test.tsx
git commit -m "feat: AccountManager component"
```

---

## Task 7: Wire AccountManager into SettingsScreen + live verification

**Files:**
- Modify: `amava-me/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Add the Accounts section**

In `amava-me/src/screens/SettingsScreen.tsx`, add imports:
```tsx
import { AccountManager } from '../components/AccountManager'
import { accountsClient } from '../data/accounts-client'
```
Then in the returned JSX, after the existing `<h2>Programmes &amp; classes</h2>` ... `<ProgrammeClassManager ... />` block and before `<h2>Areas &amp; indicators</h2>`, insert:
```tsx
      <h2>Accounts</h2>
      <AccountManager
        facilitators={ref.facilitators}
        classes={ref.classes}
        onCreate={input => run(accountsClient.createUser(input.username, input.password, input.name, input.role, input.classIds))}
        onSetPassword={(userId, password) => run(accountsClient.setPassword(userId, password))}
        onUpdate={(userId, name, role, classIds) => run(accountsClient.updateFacilitator(userId, name, role, classIds))}
        onSetActive={(userId, active) => run(accountsClient.setActive(userId, active))}
      />
```
The existing `run` helper handles refresh + error display.

- [ ] **Step 2: Verify**

Run: `npm run test` — all suites pass.
Run: `npm run build` — clean.

- [ ] **Step 3: Commit**

```bash
git add amava-me/src/screens/SettingsScreen.tsx
git commit -m "feat: manage accounts from Settings"
```

- [ ] **Step 4: Live verification (after 0004 applied)**

As the coordinator: create a facilitator account (username `testfac`, password `password123`, assign Class 1). Sign out, sign in as `testfac` / `password123` — succeeds, sees only their class. Back as coordinator: reset that account's password → old password fails, new works. Deactivate it → login blocked. Try to deactivate/demote the only coordinator → blocked with the guard message. Confirm the existing email-based coordinator still logs in. Then deactivate/clean up the `testfac` test account.

---

## Self-Review

**Spec coverage:**
- Username+password account creation (no email), role choice, class assignment → Tasks 1 (`admin_create_user`), 6, 7 ✓
- Synthetic `username@amava.local`; login accepts username or email → Tasks 1, 2, 5 ✓
- Reset password → Tasks 1, 6, 7 ✓
- Deactivate/reactivate (blocks login via `banned_until`) → Task 1 (`admin_set_active`), 6, 7 ✓
- Update name/role/classes → Task 1 (`admin_update_facilitator`), 6, 7 ✓
- Last-coordinator guard → Task 1 ✓
- Coordinator-only enforced inside each function (SECURITY DEFINER) → Task 1 ✓
- Facilitator carries username/active → Task 3 ✓
- No service-role key in client → accounts-client uses `rpc` with the publishable key ✓
- Pure helpers TDD'd → Task 2 ✓; component tests → Task 6 ✓

**Placeholder scan:** No TBD/TODO; complete code in every step. ✓

**Type consistency:** `AccountsClient` methods (Task 4) match `SettingsScreen` wiring (Task 7) and the `AccountManager` callback shapes (Task 6). `loginIdentifierToEmail`/`validateUsername` (Task 2) used in Tasks 5/6. `Facilitator.username?/active?` (Task 3) consumed by AccountManager (Task 6). The `CreateInput` shape returned by AccountManager.onCreate matches Task 7's `onCreate` wiring (`{ username, password, name, role, classIds }`). ✓

**Risk note (flagged for execution):** Task 1 writes `auth.users`/`auth.identities` directly. The insert uses the columns known-required on current Supabase; if the live apply errors on another NOT-NULL column, add it (with its default) and re-run — this is the one step that may need a live tweak, which is why Task 7's live check exists.
