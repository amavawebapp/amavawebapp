# Amava M&E — Milestone 3b: Roster Admin

**Design specification**
Date: 2026-06-01
Builds on: M1, M2, M3a. See master design `2026-06-01-amava-me-tool-design.md` §4.

---

## 1. Purpose

Let the team manage the **roster** — programmes, classes, and children — inside the app,
so they can onboard their real groups without SQL or a developer. Also fix organisation
reports to span multiple programmes (M2 assumed a single programme). This is the second
slice of Milestone 3 (after 3a content config) and a prerequisite for going live with real
data.

## 2. Scope

**In scope (online-only):**
- **Programmes:** create, rename, retire/restore (coordinator-only).
- **Classes:** create, rename, set garden-component flag, set parent programme,
  retire/restore (coordinator-only).
- **Children:** create, edit (core fields + demographic fields + start date + sample flag),
  retire/restore, reassign class — by coordinators (any class) and lead facilitators (their
  own classes only).
- **Multi-programme organisation report:** render one report section per active programme.

**Out of scope:** facilitator account creation/invites (3c); making the child field list
itself editable (3d); hard deletes (retire-only throughout).

## 3. Decisions (confirmed)

| Decision | Choice |
|---|---|
| Connectivity | **Online-only** (coordinator/facilitator desk task) |
| Programme & class admin | **Coordinator-only** |
| Child admin | **Coordinator (any) + facilitator (own classes)** |
| Child demographic fields | grade, gender, date of birth, guardian name, contact, home language, address |
| Delete model | **Retire (`active=false`), never delete** |
| Class reassignment of a child | Allowed, **coordinator-only** (crosses class ownership) |

## 4. Schema (migration `0003_roster_write.sql`)

Add the missing write RLS policies (DML privilege already exists for `authenticated`; only
policies were missing — confirmed in M3a). Coordinator check is
`exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator')`.

- **programme:** add an INSERT policy for coordinators. (M3a's migration already added the
  UPDATE policy.)
- **class_group:** add INSERT and UPDATE policies for coordinators.
- **child:** add INSERT and UPDATE policies allowing **coordinator OR a facilitator who owns
  the row's class**:
  ```sql
  create policy child_write_insert on child for insert to authenticated with check (
    exists (select 1 from facilitator f where f.id = auth.uid()
      and (f.role = 'coordinator' or child.class_id = any (f.class_ids))));
  create policy child_write_update on child for update to authenticated
    using  (exists (select 1 from facilitator f where f.id = auth.uid()
      and (f.role = 'coordinator' or child.class_id = any (f.class_ids))))
    with check (exists (select 1 from facilitator f where f.id = auth.uid()
      and (f.role = 'coordinator' or child.class_id = any (f.class_ids))));
  ```
  (`child.class_id` in the INSERT `with check` refers to the new row, so a facilitator can
  only create a child in a class they own; reassignment to a class they do not own is
  blocked. Coordinators are unrestricted, so coordinator-only reassignment is enforced by
  RLS for facilitators and by the UI for the affordance.)

Applied to the live project the same way as `0001`/`0002`; the file is the source of truth.

## 5. Child fields

A single `CHILD_FIELDS` constant (in `domain/child-fields.ts`) lists the demographic fields
as `{ key, label, type }`:
- `grade` (text), `gender` (text), `dob` (date), `guardianName` (text),
  `contact` (text), `homeLanguage` (text), `address` (text).

These are stored in the child's existing `fields: Record<string, string>` bag (no new
columns). Name, surname, class, `dateStarted`, `isSample`, `active` remain core columns.
**3d** will later replace this constant with a DB-driven, editable list; until then it is the
fixed set. A pure helper `buildChildFields(input)` maps form input to the `fields` bag, and
`ageFromDob(dob, today)` derives age for display.

## 6. Screens

- **Programmes & classes manager** (`/settings`, coordinator-only section): list active +
  retired programmes (add / rename / retire / restore); under each, its classes (add /
  rename / toggle garden-component / retire / restore). Adding a programme creates it empty —
  the coordinator then uses the 3a content config to add its areas/indicators/scale.
- **Children management** (reached from the class view): coordinators and the class's
  facilitators can **Add child** and **Edit child** (a `ChildEditor` form: first name,
  surname, the demographic fields from §5, start date, sample-child toggle), and
  retire/restore. Coordinators additionally get a **class reassignment** control. Builds on
  the M1 `ChildListScreen`.

Non-permitted users do not see the affordances; RLS blocks the writes regardless.

## 7. Multi-programme reports

`ReportsScreen` organisation scope changes from "use `programmes[0]`" to "render one report
section per **active** programme", each computed with that programme's own areas/indicators/
scale/threshold. Programme scope already targets a specific programme; class and child
scopes resolve their programme from the class (already correct after M2/M3a). With a single
programme (today) the output is unchanged.

## 8. Architecture

- **`data/roster-client.ts`** — online write layer (mirrors `config-client`):
  `addProgramme(name)`, `updateProgramme(id, fields)`, `setActive('programme'|'class_group'|
  'child', id, active)`, `addClass(programmeId, name, hasGardenComponent)`,
  `updateClass(id, fields)`, `addChild(input)`, `updateChild(id, input)`. Maps
  camelCase↔snake_case; throws on error. Callers re-pull reference data after a write.
- **`domain/child-fields.ts`** — `CHILD_FIELDS`, `buildChildFields`, `ageFromDob` (pure,
  TDD'd).
- **Components:** `ProgrammeClassManager`, `ChildEditor`; extend `ReportsScreen` for the
  per-programme org view; reuse the M3a `useConfigData`-style refetch.

## 9. Testing

- Pure helpers TDD'd: `buildChildFields` (maps inputs, omits blanks), `ageFromDob`
  (birthday-not-yet-passed edge case), and the per-programme org grouping helper.
- Component tests: `ChildEditor` renders the fields and submits the right payload;
  `ProgrammeClassManager` add-class calls the (mocked) roster client.
- Live verification after `0003` is applied: a coordinator creates a class + child; a
  facilitator can add a child to their own class but is blocked (RLS) from another class.

## 10. Success criteria

- A coordinator can create/rename/retire programmes and classes, and the assessment flow +
  reports reflect them.
- A coordinator can add/edit/retire any child; a lead facilitator can add/edit children in
  their own class(es) only (UI + RLS), and cannot create one in a class they don't own.
- All chosen demographic fields are captured and shown on the child profile.
- Organisation reports render per-programme once more than one programme exists.
- Retiring preserves history; pure-function + component suites green; M1/M2/M3a unaffected.
