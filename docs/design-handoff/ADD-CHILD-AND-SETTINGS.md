# Handoff — Add a child & Settings

**Companion to `README.md`.** This document fully specifies two surfaces the main handoff left as stubs:

1. **Add a child** — the editor a facilitator opens from the child list.
2. **Settings** — the full Settings tab + its five detail screens.

Both are now built in the prototype. Recreate them inside `amava-me` using your existing logic; replace only markup + styling. All token/class names below are defined in `styles/amava.css` (the source of truth). New primitives added for these surfaces are flagged **(new)**.

> **Prototype files:** Add-a-child lives in `app/screens-main.jsx` (`AddChildSheet`, wired into `ChildListScreen`). Settings lives in `app/screens-settings.jsx` (`SettingsScreen` + `SettingsProgrammes` / `SettingsAreas` / `SettingsScale` / `SettingsFacilitators` / `SettingsOffline`). Routes registered in `app/app.jsx`.

---

## New shared primitives (in `styles/amava.css`)

Build these once; both surfaces reuse them.

| Class | Role | Key spec |
|---|---|---|
| `.am-scrim` **(new)** | Modal backdrop | `position:absolute; inset:0`, `rgba(35,30,22,.42)`, flex column justified to end (sheet sits at bottom). Fades in `.2s`. Anchors to the phone viewport. |
| `.am-sheet` **(new)** | Bottom sheet panel | `--surface` bg, top corners `--radius-lg`, `max-height:92%`, scrolls internally, slides up `.34s cubic-bezier(.2,.8,.2,1)`. Pad `10px 16px calc(18px + safe-area)`. |
| `.am-sheet__grip` **(new)** | Drag handle | 42×5 pill, `--line`, centered. |
| `.am-sheet__head` / `.am-sheet__x` **(new)** | Sheet title row + close | `__x` = 40px circle, `--surface-2`, `×` glyph. |
| `.am-switch` + `.am-switch__knob` **(new)** | Toggle | 54×32 pill; off `--line`, on `--good`; knob 26px white, slides `3px → 25px`. `role="switch"` + `aria-checked`. |
| `.am-ctrl` **(new)** | Control row card | Like `.am-row` but not tappable; holds a label/sub on the left and a control (switch/value) on the right. `.am-ctrl__lab` 700/1.02rem, `.am-ctrl__sub` `--ink-soft`/.84rem. |
| `.am-range` **(new)** | Slider | 10px track `--surface-2`, 32px `--accent` thumb with 4px `--surface` ring; `accent-color:var(--accent)` fallback. |
| `.am-defrow` + `.am-defrow__num` **(new)** | Read-only definition row | 1.5px `--line` border, `--radius-sm`; `__num` = 36px rounded `--surface-2` badge, `--brand` text. Used for the rating scale. |

Existing primitives reused: `.am-row`, `.am-card`/`.am-card--pad`, `.am-chip`/`.am-chip--on`, `.am-hscroll`, `.am-field`/`.am-field__lab`/`.am-input`, `.am-btn` variants, `.am-stat`, `.am-tag`, `.am-sectionlab`, `.am-eyebrow`, `.am-ava`, `AppBar`, `Avatar`, `Icon`, `BottomNav`.

---

# 1 · Add a child

### Form factor
A **bottom sheet** that slides up over the child list with a dimming scrim — not a separate route. Chosen for this audience: it keeps the list visible underneath (context preserved), is one clear focused task, and dismisses with a tap on the scrim, the `×`, or a downward swipe (wire swipe-to-dismiss if cheap; tap-to-dismiss is the floor).

### Entry point
The dashed **"Add a child"** ghost button at the bottom of `ChildListScreen` (`.am-btn--ghost --btn--block`, `border-style:dashed`, leading `plus` icon). Tapping sets local `sheet = true`. Keep your existing retired-children `<details>` below it unchanged.

### Anatomy (top → bottom)
1. **Grip** (`.am-sheet__grip`).
2. **Header** (`.am-sheet__head`): 40px brand square with white `plus` icon · `.am-h2` "Add a child" · `.am-sheet__x` close.
3. **First name** — `.am-field` + `.am-input`, `autoFocus`, placeholder `e.g. Aphiwe`.
4. **Surname** — `.am-field` + `.am-input`, placeholder `e.g. Mbeki`.
5. **Class** — label + `.am-hscroll` row of `.am-chip`; selected = `.am-chip--on`. **Pre-selected to the class the facilitator came from** (`params.classId`); they can switch. Each chip has an `.am-chip__dot` in the class colour (white when selected).
6. **Part of the research sample** — `.am-ctrl` row: label + sub "Their scores will count in impact reports." + `.am-switch`. **Default ON.** Maps to the child `sample` flag (the list shows "· not in sample" when false; aggregate reports exclude non-sample children).
7. **Start date** — `.am-field` + `<input type="date">` (`.am-input`), defaults to **today** (`new Date().toISOString().slice(0,10)`).
8. **Primary action** — `.am-btn--primary --btn--block --btn--lg`, leading `check` icon, label **"Add child"**.

### Validation & behavior
- The **Add child** button is `disabled` until **both first name and surname** are non-empty (`.trim()`). `[disabled]` already dims to .4 + blocks taps.
- On submit: construct the child, prepend it to the list (so it appears immediately at the top with a **"Not started" / "Tap to start baseline"** status — `childStatus` returns `new` when there's no baseline), close the sheet, and show a **Toast**: `Added {firstName} — tap to start baseline`.
- Dismiss (scrim / `×`) discards input with no confirmation (nothing destructive yet).
- Respect `prefers-reduced-motion`: the slide-up is transform-only; content is readable without it.

### Fields → data model
Captured: `firstName`, `surname`, `classId`, `sample` (bool), `started` (ISO date). This matches the seed shape in `app/data.jsx` (`firstName, surname, classId, sample, started, baseline:null, latest:null`).

### What to keep from the codebase
This sheet is the **presentation layer for your existing `ChildEditor`** (`src/screens/ChildListScreen.tsx`). Keep `ChildEditor`'s create/edit/retire logic, field names, and persistence (roster-client) — just render it as `.am-sheet`. If `ChildEditor` already supports **edit** (not only add), reuse the same sheet for editing (swap header to "Edit child", pre-fill values, add a "Retire child" text button under the primary action). The `sample` toggle and `started` date should map to whatever your real child record calls them.

---

# 2 · Settings

`SettingsScreen` is a **root tab** (reached from `BottomNav`, so **no back button** in its app bar). The five rows now navigate to real detail screens. Routes added in `app/app.jsx`:

```
settings              → SettingsScreen
settings-programmes   → SettingsProgrammes
settings-areas        → SettingsAreas
settings-scale        → SettingsScale
settings-facilitators → SettingsFacilitators
settings-offline      → SettingsOffline
```

Each detail screen uses the shared `SubScreen` wrapper (app bar with back → `settings`, scroll body, `BottomNav` with Settings active). In your router these are nested routes under `/settings`.

## 2.1 Settings — main screen
Order, all inside `.am-scroll.am-pad.am-anim` (`gap:18`):

1. **Account header** — 56px brand `Avatar` (initials) + name (800/1.15rem) + `{role} · {orgName}` sub.
2. **Display** section (`.am-sectionlab` "Display"):
   - **Text size card** (`.am-card--pad`): header row "Text size" + a read-only `.am-chip` showing `{Math.round(textScale*100)}%`; then a slider row `A · .am-range · A` (small `A` left, large `A` right); helper "Drag to make every screen easier to read." Wired to **`--fs-user`** (range **0.9–1.35**, step 0.05). The root multiplies `--fs * --fs-user` so the whole app reflows live — persist this value (localStorage or your settings store).
   - **Big & Simple mode** (`.am-ctrl` + `.am-switch`): helper "Bigger buttons, higher contrast, less clutter." **ON sets the root `data-theme="simple"`**, OFF returns to `data-theme="soft"`. This is the genuinely-valuable accessibility mode flagged in `README.md` (`--tap:60px`, `--fs:1.18`, solid borders). `aria-checked` reflects `theme === 'simple'`.
3. **Programme set-up** rows → `settings-programmes`, `settings-areas`, `settings-scale`. Each is an `.am-row` with a 40px `--surface-2` square (brand-tinted `Icon`), title, sub, trailing `chevron`.
4. **People** row → `settings-facilitators`.
5. **This phone** row → `settings-offline`.
6. **Sign out** — `.am-btn--ghost --btn--block`, `--warn` text, `logout` icon → existing sign-out.
7. **Reg line** footer (`AMAVA.regLine`, `.74rem` muted).

> **Prototype shortcut:** the prototype reads/writes `textScale` and the theme through the Tweaks panel state (`useTweaks`). In production these are **real settings** — back them with your settings store / context, not Tweaks (Tweaks is prototype scaffolding only). The Tweaks panel stays in sync because both read the same state in the prototype.

## 2.2 Programmes & classes — `SettingsProgrammes`
- `SubHead`: eyebrow "Programme" + title `{programmeName}` + descriptive sub.
- **Summary card** of `.am-chip`s (read-only): "5 areas", "24 indicators", "1–4 scale", "Garden component".
- **Classes** section (`.am-sectionlab`): one `.am-row` per class — class-colour `Avatar`/square with `people` icon, name, `{n} children · Garden class?`, trailing `pencil` (edit affordance).
- **"Add a class"** dashed ghost button.
- Data: `useConfigData` (programme), roster/config for classes + child counts.

## 2.3 Areas & indicators — `SettingsAreas`
- `SubHead`: "What you assess" / "5 development areas" / sub noting garden indicators only apply to garden classes.
- One `.am-card--pad` per area: header = 40px brand square (`area.icon`) + name (800) + `{n} indicators · garden only?` + trailing `pencil`; body = numbered list of indicator `text` (number badge in `--sage`).
- **"Add an area"** dashed ghost button.
- Data: `useReferenceData` / config-client (areas + indicators). Reorder/edit handled by your real editors.

## 2.4 Rating scale — `SettingsScale`
- `SubHead`: "How you score" / "The 1–4 scale" / sub.
- Four `.am-defrow`s from `AMAVA.descriptors`: `__num` badge + label (800) + description.
- **Info card** (`info` icon + text): explains a child counts as **improved** when their score rises by **≥1** (`improvedThreshold`) between baseline and a later check-in — keep this rule in sync with `report-metrics`.
- **"Edit scale labels"** ghost button.

## 2.5 Facilitators — `SettingsFacilitators`
- `SubHead`: "People" / "Who can record assessments" / sub explaining coordinator vs facilitator visibility (mirror your role rules — coordinators see all classes/reports; facilitators see only their `classIds`).
- One `.am-row` per person: `Avatar`, name, `{role} · {classes}`, trailing **status `.am-tag`** — **Active** (`--good-soft`/`--good`) or **Invited** (tinted `--highlight` / `--terracotta-deep`).
- **"Invite a facilitator"** `.am-btn--brand` block button.
- **Data:** the prototype ships sample `FACILITATORS` in `screens-settings.jsx` — **do not port it**; use **accounts-client**.

## 2.6 Offline data & sync — `SettingsOffline`
- **Status card**: 56px `--good-soft` square with `check` icon + "Everything is saved" + "Last synced {time}". Wire to `useSyncStatus` — switch to a `--warn` treatment ("Offline — N waiting") when offline/pending (mirror the home `SyncBanner`).
- **Two `.am-stat` tiles**: "{n} On this phone / assessments stored" and "0 Waiting / to upload" (the waiting count goes `--good` at 0, `--warn` when >0).
- **"Sync now"** `.am-btn--brand` (calls your sync-engine `push()`).
- **Info card** reassuring offline-first behaviour.

---

## Interactions & accessibility (both surfaces)
- **Entrance:** screens use `.am-anim` (transform-only rise; resting state fully visible). The sheet uses its own slide-up. All gated for `prefers-reduced-motion`.
- **Tap targets:** every control ≥ `--tap` (52 / 54 Garden / 60 Simple); switches 54×32, slider thumb 32px — all ≥ the 44px floor.
- **Switches:** `role="switch"` + `aria-checked`; **slider:** `aria-label="Text size"`. Give the sheet `role="dialog"` + `aria-modal` and move focus to the first field on open / return focus to the trigger on close.
- **Press feedback:** `.am-btn`/`.am-row`/`.am-back` scale to ~0.97 on `:active` (inherited).

## State
No new global state. Add only local component state:
- **Add a child:** `first, surname, classId, sample, start` (+ your `ChildEditor` state). Submit via roster-client.
- **Settings:** `textScale` (`--fs-user`) and `theme` (`soft`/`simple`) — **persist these** to your settings store / localStorage. Everything else is read from existing hooks (`useConfigData`, `useReferenceData`, `useSyncStatus`, accounts-client, sync-engine).
