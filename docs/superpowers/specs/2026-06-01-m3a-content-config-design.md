# Amava M&E — Milestone 3a: Content Config

**Design specification**
Date: 2026-06-01
Builds on: M1 (offline capture), M2 (reporting). See `2026-06-01-amava-me-tool-design.md` §4.

---

## 1. Purpose

Give coordinators a self-service way to edit **what the programme measures** — its
development areas, indicators, rating scale, and "improved" threshold — without a
developer. This is the org's original explicit ask ("it would be ideal if indicators could
change") and the first slice of the larger Milestone 3.

## 2. Scope

**In scope:** a coordinator-only Settings area to manage, for the existing programme:
- development **areas** (add / rename / reorder / retire / restore; toggle garden-only),
- **indicators** (add / reword / edit hint / reorder / retire / restore),
- the **rating scale** (number of points + each point's label and description),
- the **improved threshold**.

**Connectivity:** **online-only.** Edits write straight to Supabase; the Settings area shows
an "editing needs a connection" notice when offline. (Config is a rare coordinator desk
task — offline editing would add merge/conflict complexity for little value.)

**Out of scope (other M3 slices):** programmes CRUD, classes/children/facilitator
management, demographic-field config, and multi-programme report rollups (3b/3c/3d). 3a
edits the existing programme's content only.

## 3. Decisions (confirmed)

| Decision | Choice |
|---|---|
| Who can edit | **Coordinators only** (facilitators cannot) |
| Connectivity | **Online-only** |
| Delete model | **Retire (`active=false`), never hard-delete** |
| Reword | **In place** (same id; label updates everywhere, incl. past reports) |
| Reorder | **Up/down buttons** swapping `sort_order` (no drag-and-drop dependency) |
| Scale change with existing data | **Allowed, with a clear warning**; old assessments keep their recorded `scaleMax` |

## 4. Schema changes (`supabase/migrations/0002_config_write.sql`)

1. **`alter table programme add column improved_threshold int not null default 1;`** — the
   threshold becomes editable data. Reports read it (see §7).
2. **Coordinator write policies** (the reference tables currently have only SELECT policies,
   so all writes are blocked). Add INSERT + UPDATE policies on `programme`,
   `development_area`, and `indicator`, each gated on the actor being a coordinator:
   ```sql
   create policy <name>_cfg_write on <table> for insert to authenticated
     with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
   create policy <name>_cfg_update on <table> for update to authenticated
     using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
     with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
   ```
   No DELETE policy — retiring is an UPDATE of `active`. Existing SELECT policies are
   unchanged (RLS combines permissive policies with OR).

This migration is applied to the live project the same way as `0001` (Management API /
SQL editor); the file is the source of truth.

## 5. Integrity rules

- **Retire (`active=false`)** hides an area/indicator from *new* assessments and from
  reports going forward; its past scores remain in the database untouched. **Restore**
  sets `active=true`. Retiring an area also hides its indicators (the area no longer
  renders).
- **Reword** edits `text`/`hint` on the same row id — trends continue and reports show the
  updated wording. (Past per-assessment `indicatorText` snapshots remain for audit/CSV of
  historical rows, but live reports use the current wording.)
- **Reorder** swaps `sort_order` between adjacent active siblings.
- **Scale:** editing `scale_max` / `scale_descriptors` affects future assessments only; each
  past assessment keeps the `scaleMax` it recorded. When assessments already exist for the
  programme, the scale editor shows a warning before saving that cross-period comparisons
  may be affected.

**Accepted behaviour:** a retired indicator drops out of future reports (intended). A
reworded indicator's new label appears everywhere, including historical reports (it's the
same indicator).

## 6. Screens (new `/settings`, coordinator-only route)

A Settings landing reachable from Home (coordinator only), with three sections:

- **Areas & Indicators manager:** lists the programme's areas in order; each expands to its
  indicators. Per area: rename, toggle *garden-only*, move up/down, retire/restore, add
  indicator. Per indicator: reword, edit hint, move up/down, retire/restore. Retired items
  render greyed with a Restore action. An "Add area" / "Add indicator" affordance each.
- **Scale editor:** edit the number of points and each point's label + description; add or
  remove a point. A warning banner appears when assessments already exist.
- **Threshold editor:** a number input for "improved = +N", with help text; validated to
  1…(scaleMax − 1).

Non-coordinators visiting `/settings` are redirected (defence-in-depth on top of RLS). When
offline, the area shows a connection-required notice instead of edit controls.

## 7. Reporting integration

`Programme` gains an `improvedThreshold` field (mapped from `improved_threshold`).
`ReportsScreen` uses `programme.improvedThreshold` (falling back to the existing
`IMPROVED_THRESHOLD` constant when absent) instead of the hard-coded constant, so edits to
the threshold flow straight into reports. No other report logic changes.

## 8. Architecture & units

- **`data/config-client.ts`** — a thin online write layer over `supabase`, used only by the
  Settings screens. Methods: `addArea`, `updateArea`, `addIndicator`, `updateIndicator`,
  `setActive(table, id, active)`, `reorderRows(table, updates)`, `updateScale(programmeId,
  scaleMax, descriptors)`, `setThreshold(programmeId, n)`. Maps camelCase↔snake_case.
  After any successful write, the caller triggers `engine.pull()` to refresh the cache + UI.
- **`domain/config-logic.ts`** (pure, TDD'd):
  - `reorder(items, id, direction)` → returns the items needing a new `sort_order` (the two
    swapped rows), or `[]` at a boundary.
  - `validateScale(scaleMax, descriptors)` → error string | null (max in 2–10; descriptors
    length === max; every label non-empty; values 1…max).
  - `validateThreshold(n, scaleMax)` → error string | null (integer 1…scaleMax−1).
- **Screens:** `screens/SettingsScreen.tsx` (sections + offline/role guards),
  `components/AreaEditor.tsx`, `components/IndicatorEditor.tsx`, `components/ScaleEditor.tsx`,
  `components/ThresholdEditor.tsx`. Each editor takes data + callbacks; data fetching/refresh
  lives in SettingsScreen.

## 9. Testing

- `config-logic` pure functions fully TDD'd (reorder at middle/boundaries; scale validation
  pass/fail cases; threshold validation).
- A component test: the Areas & Indicators manager renders areas+indicators and a reword/
  retire action calls the (mocked) config client with the right arguments.
- The live write path (RLS + mapping) is verified against the real backend after the
  migration is applied, the same way M1's backend was smoke-tested.

## 10. Success criteria

- A coordinator can add, reword, reorder, retire, and restore an indicator and an area, and
  toggle an area's garden-only flag — and the changes show up in the assessment flow and
  reports after a sync.
- A coordinator can change the scale's points/descriptors (with a warning when data exists)
  and the improved threshold, and reports reflect the new threshold.
- A facilitator cannot reach or perform any of these edits (UI redirect + RLS denial).
- Retiring preserves historical scores; rewording keeps trends continuous.
- Pure-function suite green; existing M1/M2 suites unaffected.
