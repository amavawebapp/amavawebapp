# Add-a-child Sheet + Settings Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Recreate the `ADD-CHILD-AND-SETTINGS.md` handoff inside `amava-me` — presentational only. Turn the add/edit child editor into a bottom sheet, and split the monolithic Settings screen into a hub + five sub-screen routes — reusing all existing editor logic and clients.

**Architecture:** Add new CSS primitives. Restyle `ChildEditor` as a `.am-sheet` modal. Rewrite `SettingsScreen` as a navigation hub (account header + Display controls + grouped rows). Move the existing editor invocations (ProgrammeClassManager, AreaEditor×N, ScaleEditor, ThresholdEditor, AccountManager) into five new sub-screen route components under `src/screens/settings/`, preserving the `run()` helper + client calls + role/online gating. Wire the Display controls to the existing `useAppearance()` context. No data/sync/auth/domain logic changes.

**Working dir:** `amava-me/` (run `npm run test` / `npm run build` there). Branch `settings-addchild` is checked out. Design reference in-repo: `../docs/design-handoff/ADD-CHILD-AND-SETTINGS.md`, `../docs/design-handoff/app/screens-settings.jsx`, `../docs/design-handoff/app/screens-main.jsx` (AddChildSheet), `../docs/design-handoff/styles/amava.css` (new `.am-*` rules).

---

## TASK 1 — New CSS primitives

**File:** Modify `src/styles/components.css` (append at end, before `.am-toast` is fine — just add to the file).

- [ ] **Step 1:** Append these rules verbatim (they are the new primitives from the design `amava.css`):

```css
/* ---- Bottom sheet (modal) ---- */
.am-scrim {
  position: absolute; inset: 0; z-index: 30;
  background: rgba(35,30,22,.42);
  display: flex; flex-direction: column; justify-content: flex-end;
  animation: amscrim .2s both;
}
@keyframes amscrim { from { opacity: 0; } to { opacity: 1; } }
.am-sheet {
  background: var(--surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 10px 16px calc(18px + env(safe-area-inset-bottom, 18px));
  box-shadow: 0 -12px 40px rgba(45,40,30,.18);
  max-height: 92%; overflow-y: auto;
  animation: amsheet .34s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes amsheet { from { transform: translateY(100%); } to { transform: none; } }
.am-sheet__grip { width: 42px; height: 5px; border-radius: 999px; background: var(--line); margin: 4px auto 16px; }
.am-sheet__head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.am-sheet__head .am-h2 { flex: 1; }
.am-sheet__x {
  width: 40px; height: 40px; flex: 0 0 40px; border-radius: 999px; border: none; cursor: pointer;
  background: var(--surface-2); color: var(--ink-soft); display: grid; place-items: center; font-size: 22px; line-height: 1;
}
.am-sheet__x:active { transform: scale(.94); }

/* ---- Toggle switch ---- */
.am-switch {
  width: 54px; height: 32px; flex: 0 0 54px; border-radius: 999px; border: none; padding: 0;
  background: var(--line); position: relative; cursor: pointer; transition: background .18s ease;
}
.am-switch.on { background: var(--good); }
.am-switch__knob {
  position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 999px;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.22); transition: left .18s cubic-bezier(.2,.8,.2,1);
}
.am-switch.on .am-switch__knob { left: 25px; }

/* ---- Control row ---- */
.am-ctrl {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface); border-radius: var(--radius); padding: 15px 16px;
  box-shadow: var(--shadow); border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
}
[data-theme="simple"] .am-ctrl { border: 1.5px solid var(--line); box-shadow: none; }
.am-ctrl__lab { font-weight: 700; font-size: 1.02rem; }
.am-ctrl__sub { color: var(--ink-soft); font-size: .84rem; margin-top: 2px; }

/* ---- Range slider ---- */
.am-range {
  -webkit-appearance: none; appearance: none; width: 100%; height: 10px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--line); outline: none; margin: 0;
  accent-color: var(--accent);
}
.am-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 32px; height: 32px; border-radius: 999px;
  background: var(--accent); border: 4px solid var(--surface); box-shadow: 0 2px 6px rgba(0,0,0,.2); cursor: pointer;
}
.am-range::-moz-range-thumb {
  width: 32px; height: 32px; border-radius: 999px;
  background: var(--accent); border: 4px solid var(--surface); box-shadow: 0 2px 6px rgba(0,0,0,.2); cursor: pointer;
}

/* ---- Read-only definition row (rating scale) ---- */
.am-defrow {
  display: flex; align-items: flex-start; gap: 14px; padding: 13px 15px;
  border-radius: var(--radius-sm); border: 1.5px solid var(--line); background: var(--surface);
}
.am-defrow__num {
  width: 36px; height: 36px; flex: 0 0 36px; border-radius: 10px; display: grid; place-items: center;
  font-weight: 900; font-size: 1.05rem; background: var(--surface-2); color: var(--brand);
}
```

- [ ] **Step 2:** `npm run build` (clean). Commit: `feat: sheet/switch/ctrl/range/defrow CSS primitives`

---

## TASK 2 — Add-a-child as a bottom sheet

**Files:** Modify `src/components/ChildEditor.tsx`, `src/components/ChildEditor.test.tsx`, `src/screens/ChildListScreen.tsx`.

KEEP all logic in `ChildEditor`: props `{ classes, allowClassChange, initial, onSubmit, onCancel }`, state, `valid` rule, and the exact `onSubmit` payload `{ classId, firstName: firstName.trim(), surname: surname.trim(), dateStarted, isSample, fields: buildChildFields(fieldVals) }`. KEEP `CHILD_FIELDS` demographic inputs (do NOT drop them — they're real data the prototype omitted). Add one optional prop `heading?: string` (default `'Add a child'`).

- [ ] **Step 1:** Rewrite `ChildEditor` to render a full bottom-sheet modal (scrim + sheet). Structure:
  - Outer `<div className="am-scrim" onClick={onCancel}>` then `<div className="am-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>`.
  - `<div className="am-sheet__grip" />`
  - Header `.am-sheet__head`: 40px brand square (`am-ava`, radius 12) with white `plus` Icon · `<div className="am-h2">{heading}</div>` · `<button className="am-sheet__x" onClick={onCancel} aria-label="Close">×</button>`.
  - Body `.am-stack` gap 16:
    - First name `.am-field` + `.am-input` keep `aria-label="first name"`, placeholder `e.g. Aphiwe`, `autoFocus`.
    - Surname `.am-field` + `.am-input` keep `aria-label="surname"`, placeholder `e.g. Mbeki`.
    - Class (only when `allowClassChange`): `.am-field` label "Class" + `.am-hscroll` of `.am-chip` buttons (one per `classes`), selected = `+ ' am-chip--on'`, each with a leading `<span className="am-chip__dot" style={{ background: selected ? '#fff' : 'var(--brand)' }} />`. Clicking sets `classId`. Add `aria-label="class"` to the hscroll container OR keep a visually-hidden select — SIMPLER: give each chip `aria-pressed`; update the test accordingly (see Step 3).
    - Demographic fields: keep the `CHILD_FIELDS.map` — render each as a `.am-field` + `.am-input` (date type for `f.type === 'date'`), keep `aria-label={f.label}`.
    - Sample: `.am-ctrl` row — left `.am-ctrl__lab` "Part of the research sample" + `.am-ctrl__sub` "Their scores will count in impact reports."; right a `<button className={'am-switch' + (isSample ? ' on' : '')} role="switch" aria-checked={isSample} aria-label="Part of the research sample" onClick={() => setIsSample(s => !s)}><span className="am-switch__knob" /></button>`.
    - Start date: `.am-field` "Start date" + `.am-input type="date"` keep `aria-label="start date"`.
    - Primary button `am-btn am-btn--primary am-btn--block am-btn--lg`, `disabled={!valid}`, leading `check` Icon, label = `heading === 'Add a child' ? 'Add child' : 'Save'`. onClick = the existing onSubmit payload.
  - Import `Icon` from `'./ui'`.

- [ ] **Step 2:** In `ChildListScreen.tsx`: the existing `{canManage && editing && <ChildEditor .../>}` already renders the editor — it now renders as a full-screen modal sheet (since ChildEditor owns the scrim). Pass `heading={editing === 'new' ? 'Add a child' : 'Edit child'}`. Keep the "Add a child" dashed button and `setEditing('new')`. Keep Edit/Retire and the retired `<details>`. Add a success Toast: import `Toast` from `'../components/ui'`, add `const [toast, setToast] = useState<string | null>(null)`; in `run`, accept an optional success message — simplest: after a successful add, set the toast. Concretely, change the add branch to:
  ```tsx
  onSubmit={input => {
    if (editing === 'new') run(rosterClient.addChild(input)).then(() => setToast(`Added ${input.firstName} — tap to start baseline`))
    else if (editing) run(rosterClient.updateChild(editing.id, input))
  }}
  ```
  (Note: `run` currently returns the promise; ensure it `return`s the awaited chain so `.then` fires after success. If `run` swallows errors, only show the toast when no error — acceptable to show on resolve.) Render `<Toast show={!!toast}>{toast}</Toast>` near the end; auto-clear with a `useEffect` (2600ms) like the prototype.
  - Make `run` return its promise: change `const run = async (p) => {...}` body to `return` nothing special but the async fn already returns a promise; ensure the `.then` runs after `refresh()` + `setEditing(null)`. Keep error handling intact.

- [ ] **Step 3:** Update `ChildEditor.test.tsx` to the new markup. Preserve behavioural intent: filling first name + surname + (class) and submitting calls `onSubmit` with the correct `ChildInput` (classId, trimmed names, dateStarted, isSample, fields). Query first name/surname/start date by their kept `aria-label`s. For class: query chips by name and assert `aria-pressed`/click selects. For sample: it's now a `role="switch"` with `aria-checked` (was a checkbox) — update the toggle interaction. For the submit button: it's labelled "Add child"/"Save" — query by role/name. Do NOT weaken the product to satisfy a brittle selector; update the test to the new accessible markup.

- [ ] **Step 4:** `npm run test -- ChildEditor` PASS; `npm run build` clean. Commit: `feat: add/edit child as a bottom sheet`

---

## TASK 3 — Settings hub + Display controls

**Files:** Modify `src/screens/SettingsScreen.tsx`. (The editor invocations move to sub-screens in Task 4 — for this task, replace the screen body with the hub; it will link to routes created in Task 4. To keep the build green between tasks, create the five sub-screen route components as part of Task 4 BEFORE adding their `<Route>`s; the hub's `navigate('/settings/...')` calls are just strings so they compile regardless.)

KEEP: `useAuth` (need `signOut`), `useConfigData` for `ref` + `me`/role, `useAppearance`. Drop the inline editors from this file (they move to Task 4).

- [ ] **Step 1:** Rewrite `SettingsScreen` as the hub (ref: `../docs/design-handoff/app/screens-settings.jsx` `SettingsScreen`). Structure:
  - Root `<div className="am-root am-screen">`, `<AppBar title="Settings" />` **with NO `onBack`** (root tab), body `.am-scroll .am-pad .am-anim` (gap 18), `<BottomNav />`.
  - **Account header:** 56px brand `Avatar` (name initials) + name (800/1.15rem) + `{role} · Amava Oluntu` sub (capitalize role). `me = ref.facilitators.find(f => f.id === session?.user.id)`; name `me?.name ?? ''`, role `me?.role ?? ''`.
  - **Display section** (`.am-sectionlab` "Display"), using `useAppearance()` `{ theme, setTheme, fsUser, setFsUser }`:
    - Text-size card `.am-card--pad`: header row "Text size" `.am-ctrl__lab` + read-only `.am-chip` `{Math.round(fsUser*100)}%`; slider row `A` (small) · `<input className="am-range" type="range" min={0.9} max={1.35} step={0.05} value={fsUser} onChange={e => setFsUser(Number(e.target.value))} aria-label="Text size" style={{ flex:1 }} />` · `A` (large); helper "Drag to make every screen easier to read."
    - Big & Simple `.am-ctrl`: label "Big & Simple mode" + sub "Bigger buttons, higher contrast, less clutter."; right `<button className={'am-switch' + (theme==='simple' ? ' on' : '')} role="switch" aria-checked={theme==='simple'} aria-label="Big and Simple mode" onClick={() => setTheme(theme==='simple' ? 'soft' : 'simple')}><span className="am-switch__knob" /></button>`.
  - **Grouped rows** — render groups, each `.am-sectionlab` eyebrow + `.am-row` buttons (40px `--surface-2` square with brand `Icon`, title, sub, trailing chevron). Gate by role:
    - If coordinator: group "Programme set-up" → rows: Programmes & classes (`people` → `/settings/programmes`), Areas & indicators (`spark` → `/settings/areas`), Rating scale (`chart` → `/settings/scale`); group "People" → Facilitator accounts (`people` → `/settings/facilitators`).
    - All users: group "This phone" → Offline data & sync (`wifi` → `/settings/offline`).
  - **Sign out:** `am-btn am-btn--ghost am-btn--block`, `style={{ color:'var(--warn)' }}`, `logout` Icon, label "Sign out" → `await signOut(); navigate('/login')`. (Verify `useAuth()` exposes `signOut`; if it's named differently, use the real name — read `src/auth/auth-context.tsx`.)
  - **Reg line** footer `.74rem` muted: `Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213`.
  - Import `AppBar, BottomNav, Avatar, Icon` from `'../components/ui'`, `useAppearance`, `useNavigate`, `useAuth`, `useConfigData`.

- [ ] **Step 2:** `npm run build` clean (routes added in Task 4; string paths compile fine). Commit: `feat: Settings hub + Display controls`

---

## TASK 4 — Settings sub-screens + routes

**Files:** Create `src/screens/settings/SubScreen.tsx`, `SettingsProgrammes.tsx`, `SettingsAreas.tsx`, `SettingsScale.tsx`, `SettingsFacilitators.tsx`, `SettingsOffline.tsx`. Modify `src/App.tsx`.

Each coordinator-only sub-screen reproduces the relevant editor block previously in `SettingsScreen` — KEEP the exact `run()` helper, client calls, and `useConfigData` wiring. Gate coordinator-only screens: if not coordinator → `<Navigate to="/settings" replace />`; if offline → show the "Editing settings needs an internet connection" note inside the SubScreen.

- [ ] **Step 1: SubScreen wrapper** `src/screens/settings/SubScreen.tsx`:

```tsx
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, BottomNav } from '../../components/ui'

export function SubScreen({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="am-root am-screen">
      <AppBar title={title} onBack={() => navigate('/settings')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 2: A shared coordinator/online guard + run() helper.** To avoid duplicating the `run`/guard in every file, create a small hook `src/screens/settings/use-settings-editing.ts`:

```tsx
import { useState } from 'react'
import { useAuth } from '../../auth/auth-context'
import { useConfigData } from '../../hooks/use-config-data'
import { useOnlineStatus } from '../../hooks/use-online-status'

export function useSettingsEditing() {
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const me = ref?.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const run = async (p: Promise<void>) => {
    setError(null); setBusy(true)
    try { await p; await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed. Please try again.') }
    finally { setBusy(false) }
  }
  return { ref, refresh, hasAssessments, online, isCoordinator, error, busy, run }
}
```

- [ ] **Step 3: SettingsProgrammes.tsx** — guard (coordinator+online), then `<SubScreen title="Programmes & classes">` containing `<ProgrammeClassManager .../>` with the EXACT same props/handlers as currently in `SettingsScreen` (addProgramme/updateProgramme/setActive 'programme'/addClass/updateClass/toggleGarden/setActive 'class_group' via `rosterClient`). Show `error`/`busy` notes. Non-coordinator → `<Navigate to="/settings" replace />`. Offline → note inside SubScreen.

- [ ] **Step 4: SettingsAreas.tsx** — guard, `<SubScreen title="Areas & indicators">` containing the `areas.map(area => <AreaEditor .../>)` block + the "Add area" button, EXACT handlers from current SettingsScreen (configClient.updateArea/reorderRows/setActive/addIndicator/updateIndicator + `reorder`). `areas`/`indicatorsFor` derived from `ref` like today (`programme = ref.programmes[0]`).

- [ ] **Step 5: SettingsScale.tsx** — guard, `<SubScreen title="Rating scale">` containing `<ScaleEditor .../>` + `<ThresholdEditor .../>` (EXACT props incl. the `key` expressions + `hasAssessments`) plus the info card (`info` Icon + "A child counts as improved when their score rises by 1 or more…"). `programme = ref.programmes[0]`.

- [ ] **Step 6: SettingsFacilitators.tsx** — guard, `<SubScreen title="Facilitators">` containing `<AccountManager .../>` with EXACT props (accountsClient.createUser/setPassword/updateFacilitator/setActive). Do NOT use the prototype's sample FACILITATORS array.

- [ ] **Step 7: SettingsOffline.tsx** — available to ALL authenticated users (no coordinator guard). Uses `useAppServices()` (`store`, `engine`) + `useSyncStatus(store, engine)` → `{ online, pendingCount, sync }`. `<SubScreen title="Offline data & sync">`:
  - Status card: 56px square — green `--good-soft` + `check` Icon when `online && pendingCount===0` ("Everything is saved"); `--warn` treatment ("Offline — N waiting" / "N waiting to upload") otherwise. Sub line e.g. "Saved on this phone".
  - Two `.am-stat` tiles: count of stored assessments on this phone and the waiting count (`pendingCount`, `--good` at 0, `--warn` when >0). For "on this phone" stored count, use `store.getAllAssessments()` length via a small `useEffect`+state (or show `pendingCount` only if simpler — prefer the real stored count). 
  - "Sync now" `am-btn--brand` block → `sync()` (online only; disable when offline).
  - Info card reassuring offline-first behaviour.
  - Import `useAppServices` from `'../../app-context'`, `useSyncStatus` from `'../../hooks/use-sync-status'`, `Icon` from `'../../components/ui'`.

- [ ] **Step 8: Routes** in `src/App.tsx` — add (each `RequireAuth` + `AppServicesProvider`):

```tsx
import { SettingsProgrammes } from './screens/settings/SettingsProgrammes'
import { SettingsAreas } from './screens/settings/SettingsAreas'
import { SettingsScale } from './screens/settings/SettingsScale'
import { SettingsFacilitators } from './screens/settings/SettingsFacilitators'
import { SettingsOffline } from './screens/settings/SettingsOffline'
// ...
      <Route path="/settings/programmes" element={<RequireAuth><AppServicesProvider><SettingsProgrammes /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/areas" element={<RequireAuth><AppServicesProvider><SettingsAreas /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/scale" element={<RequireAuth><AppServicesProvider><SettingsScale /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/facilitators" element={<RequireAuth><AppServicesProvider><SettingsFacilitators /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/offline" element={<RequireAuth><AppServicesProvider><SettingsOffline /></AppServicesProvider></RequireAuth>} />
```

Note BottomNav's `match` for settings is `startsWith('/settings')` — already covers the sub-routes (Settings tab stays active). Good.

- [ ] **Step 9:** `npm run build` clean; full `npm run test` green (component editor tests unaffected; ChildEditor updated in Task 2). Commit: `feat: Settings sub-screens (programmes/areas/scale/facilitators/offline) + routes`

---

## Self-review checklist
- **Logic preserved:** ChildEditor onSubmit payload + field names unchanged; every editor's client handlers identical to the old SettingsScreen; role + online gating preserved (coordinator-only editors; offline note). Facilitators still cannot reach config/account editors (sub-screens `<Navigate>` away + the hub hides those rows).
- **Appearance:** Big & Simple switch toggles `theme` soft↔simple via `useAppearance`; text size = `fsUser`. Persisted by the existing context.
- **No fabricated data:** SettingsOffline uses real `useSyncStatus`/`store` counts; SettingsFacilitators uses `accountsClient`/`ref.facilitators`, not the prototype sample list.
- **Tests:** ChildEditor.test updated to new markup (switch/chips) preserving behavioural intent; no product weakened for tests.
- **Build green between tasks:** hub (Task 3) uses string route paths, compiles before routes exist; Task 4 adds the route components + `<Route>`s.
