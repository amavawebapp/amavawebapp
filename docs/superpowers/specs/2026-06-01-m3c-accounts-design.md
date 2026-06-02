# Amava M&E — Milestone 3c: Facilitator Accounts

**Design specification**
Date: 2026-06-01
Builds on: M1, M2, M3a, M3b.

---

## 1. Purpose

Let coordinators create and manage **logins** for their team without email — facilitators
who may not have email get a **username + password** set by the coordinator. Completes the
self-service admin so the team can run the tool independently, and is the last slice before
publishing.

## 2. Scope (confirmed)

Coordinator-only **Accounts** management:
- **Create** an account: name, username, password, role (facilitator **or** coordinator),
  assigned classes.
- **Update**: rename, change role, reassign classes.
- **Reset password**.
- **Deactivate / reactivate** (blocks login).
- **Username-based login** (no email).

**Out of scope:** email password-recovery (no email — coordinator resets); facilitators
changing their own password (coordinator resets for now); 3d field config; M4 PDF.

## 3. Username login (no email)

Supabase Auth is email-based, so each account is backed by a **synthetic, non-routable
email** `<username>@amava.local`. Users only ever see **username + password**.

- **Login input accepts username OR email:** a pure `loginIdentifierToEmail(input)` returns
  the input unchanged if it contains `@` (an actual email — e.g. the bootstrap coordinator),
  otherwise appends `@amava.local`. This preserves the existing email-based bootstrap account
  while letting all new accounts log in by username.
- **Username rules:** normalised to lowercase; `^[a-z0-9._-]{3,30}$`; unique.
- The login screen's field changes from "Email" to **"Username"** (with helper text that an
  email also works).

## 4. Architecture — Option A: SECURITY DEFINER database functions

Creating/modifying *other* users needs privileges that must not reach the browser. A
migration adds `SECURITY DEFINER` functions (run as the table owner) that each **verify the
caller is a coordinator** (`auth.uid()` → `facilitator.role = 'coordinator'`) before acting,
then write the `auth` tables + the `facilitator` profile. The browser calls them via
`supabase.rpc(...)` with the normal publishable key. No service-role key anywhere in the
client; nothing to deploy beyond the SQL migration.

**Trade-off (accepted):** the functions write GoTrue's internal `auth.users` /
`auth.identities` (bcrypt password via `extensions.crypt`). This is a stable but
not-officially-blessed area; a future Supabase auth-schema change would mean updating one
function. Chosen over a service-role Edge Function for far lower deploy/maintenance overhead.

## 5. Schema & functions (migration `0004_accounts.sql`)

- Add to `facilitator`: `username text unique`, `active boolean not null default true`.
- `SECURITY DEFINER` functions (search_path locked; objects fully schema-qualified), each
  raising an exception if `auth.uid()` is not an active coordinator, and `execute` granted to
  `authenticated`:
  - `admin_create_user(p_username, p_password, p_name, p_role, p_class_ids uuid[])` →
    validates role ∈ {facilitator, coordinator} and username uniqueness; creates
    `auth.users` (synthetic email, `email_confirmed_at = now()`, bcrypt password) +
    `auth.identities` (provider `email`, `provider_id = id::text`,
    `identity_data = {sub, email}`) + `facilitator` row (username, active true). Returns the
    new user id.
  - `admin_set_password(p_user_id, p_password)` → updates the bcrypt password.
  - `admin_update_facilitator(p_user_id, p_name, p_role, p_class_ids)` → updates the profile.
  - `admin_set_active(p_user_id, p_active)` → sets `facilitator.active` and
    `auth.users.banned_until` (`'infinity'` when deactivating, `null` when reactivating) so a
    deactivated user cannot sign in.
- **Last-coordinator guard:** `admin_update_facilitator` (demotion) and `admin_set_active`
  (deactivation) raise if the action would leave **zero active coordinators**.

These functions enforce authorization themselves (they bypass RLS by definition), so the
coordinator check inside each is the security boundary.

## 6. Data model & types

`Facilitator` gains `username?: string` and `active: boolean`. `SupabaseSyncClient`
maps `username` and `active` from facilitator rows. Existing role/class logic is unchanged;
deactivated facilitators still appear in reference data (so the manager can reactivate them)
but cannot log in (banned).

## 7. Screens

- **Accounts manager** (`/settings`, coordinator-only section): a table of accounts (name,
  username, role, assigned classes, active). A **create form** (name, username, password,
  role select, class checkboxes). Per row: **Edit** (name/role/classes), **Reset password**,
  **Deactivate/Reactivate**. Inline validation (username format, password min length 8,
  required fields). Errors from the functions (e.g. duplicate username, last-coordinator
  guard) surface to the coordinator.
- **Login screen:** field relabelled to **Username**; submit maps via
  `loginIdentifierToEmail` then calls `signInWithPassword`.

## 8. Architecture units

- **`domain/username.ts`** (pure, TDD'd): `loginIdentifierToEmail(input)`,
  `validateUsername(input)` (returns error string | null).
- **`data/accounts-client.ts`**: thin `rpc(...)` wrappers — `createUser`, `setPassword`,
  `updateFacilitator`, `setActive` — mapping args to the function params; throw on error.
  Used by the manager, which re-pulls reference data after each change.
- **Components:** `AccountManager` (list + create + per-row actions); modify `LoginScreen`.

## 9. Testing

- Pure: `loginIdentifierToEmail` (username → synthetic; email passthrough) and
  `validateUsername` (format/length/normalisation) — TDD.
- Component: `AccountManager` renders accounts and a create submits the right payload to a
  mocked client; `LoginScreen` maps a username to the synthetic email on submit.
- **Live verification** after `0004` applied: create a facilitator account; log in as it by
  username; deactivate → login blocked; reset password → new password works; last-coordinator
  guard blocks demoting/deactivating the only admin; the existing email-based bootstrap
  coordinator can still log in.

## 10. Success criteria

- A coordinator creates a username+password account (facilitator or coordinator), assigns
  classes, and that person logs in by username.
- Coordinator can reset a password and deactivate/reactivate an account; deactivated users
  cannot sign in.
- The only-admin guard prevents lock-out.
- No service-role key in the client; all account functions enforce coordinator-only.
- Existing email-based coordinator login still works; pure + component suites green; M1/M2/M3a/M3b unaffected.

## 11. Bootstrap note

The existing coordinator (created earlier via the Admin API, email
`facilitator@amavaoluntu.org.za`, no username) keeps working because login accepts an email.
When `0004` is applied, that row gets `active = true` (column default) and a null username;
it simply continues logging in by email. (Username is set at account creation and is not
editable afterwards — changing it would require rewriting the synthetic email + identity, out
of scope here; to "rename" a login, create a new account and deactivate the old one.)
