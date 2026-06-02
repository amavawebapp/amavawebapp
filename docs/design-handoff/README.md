# Handoff: Amava M&E — Mobile UI Redesign

## Overview
This package is the design handoff for a visual + UX redesign of the **Amava Oluntu child-development M&E app** (`amava-me`). It restyles every screen for a phone-first, low-literacy / low-tech-confidence audience (community facilitators), applies the **Amava 2022 brand**, and substantially upgrades the **reports** (on-screen and printable).

The redesign is **purely presentational + interaction polish**. It does **not** change the data model, sync engine, auth, routing, or domain logic. All existing TypeScript (`src/domain`, `src/data`, `src/hooks`, `src/auth`) stays as-is.

## About the Design Files
The files in this bundle (`Amava redesign.html` + `app/*.jsx` + `styles/amava.css`) are **design references built in HTML/React-via-Babel**. They are a prototype showing the intended look, layout, copy, and interactions — **not** production code to paste in.

Your task is to **recreate these designs inside the existing `amava-me` codebase** (React 18 + TypeScript + Vite + react-router, plain CSS with custom properties). The prototype deliberately mirrors your real screen structure so the mapping is direct (see **Screen → File Map** below). Keep all existing logic; replace markup + styling.

> The prototype uses **sample data generated in `app/data.jsx`**. Ignore it — your real data comes from `useReferenceData`, `useReportData`, `useConfigData`, etc. The prototype's `buildAggregate` / `buildChild` are simplified mirrors of your real `src/domain/report-metrics.ts`; use the real ones.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, shadows, and interactions are all specified below and present in `styles/amava.css`. Recreate pixel-faithfully, but using your codebase's conventions (CSS files under `src/styles`, component files under `src/components` / `src/screens`).

---

## Design System / Tokens

All tokens live in `styles/amava.css` (`:root` + three `[data-theme]` blocks). Your existing `src/styles/tokens.css` already centralizes most of these — extend it.

### Brand palette (unchanged from 2022 guide)
| Token | Hex | Use |
|---|---|---|
| `--slate` | `#687F8B` | App identity, headings, primary brand |
| `--slate-deep` | `#4d626d` | Darker slate (report band on Simple) |
| `--teal` | `#97D7D9` | Soft accent (sparingly) |
| `--sand` | `#E5BF7A` | Highlight, report accent stripe |
| `--green` | `#C4E2B7` | Positive / improvement (light) |
| `--green-deep` | `#6fa173` | Improvement bars, "now" values |
| `--sage` | `#9CA297` | Muted icons / chevrons |
| `--terracotta` | `#DD866C` | Primary CTA (warm direction) |
| `--terracotta-deep` | `#c96a4f` | CTA pressed / warnings |

### Semantic tokens (theme-driven — values shown for the **default "Soft" theme**)
```
--bg:        #FBF7F0   (warm cream app background)
--bg-2:      #F4EDE1   (behind the phone / gradient base)
--surface:   #ffffff   (cards, app bar)
--surface-2: #fbf8f3   (insets, chips, score badges)
--ink:       #33403b   (primary text)
--ink-soft:  #6b746f   (secondary text)
--line:      #ece3d6   (hairlines, borders)
--brand:     #687F8B   (headings, identity)
--accent:    #DD866C   (primary CTA)
--good:      #6fa173   (improvement)
--good-soft: #e6f1de   (improvement chip bg)
--warn:      #c96a4f   (errors / "watch")
--highlight: #E5BF7A
```

### Shape / spacing / scale
```
--radius:    20px   (cards/buttons; 24 Garden, 18 Simple)
--radius-sm: 14px
--radius-lg: 28px
--pad:       16px   (screen gutter)
--tap:       52px   (minimum tap target; 54 Garden, 60 Simple)  ← never go below 48px
--shadow:    0 1px 2px rgba(45,40,30,.04), 0 6px 18px rgba(45,40,30,.06)
--shadow-lg: 0 2px 6px rgba(45,40,30,.06), 0 18px 40px rgba(45,40,30,.10)
font-size:   calc(16px * --fs * --fs-user)   (root, on .am-root)
```

### Three visual directions (`data-theme` on the root)
The prototype ships **three interchangeable themes**, switched by setting `data-theme="soft|garden|simple"` on the app root. They only change CSS custom properties (color/radius/shadow/`--fs`) — no markup changes. **Ship "Soft" as the default.** Keep the other two as an optional setting if useful (e.g. an accessibility "Big & Simple" mode is genuinely valuable for this audience).
- **`soft`** (default): warm cream, rounded white cards, terracotta CTA — friendly & calm.
- **`garden`**: green-tinted bg, greener brand (`--brand:#4f7d54`), slightly larger radius/`--fs:1.04` — leans into the garden programme.
- **`simple`**: white bg, high contrast (`--brand:#4d626d`), solid borders instead of shadows, `--tap:60px`, `--fs:1.18` — maximum readability / accessibility.

A user-facing **text-size control** is exposed as `--fs-user` (0.9–1.35) multiplied onto the theme's `--fs`; wire it to a Settings slider.

### Typography
- **Logo wordmark only:** `Cavorting` (OTF supplied in `fonts/Cavorting.otf`). Used **exclusively** for the "Amava" wordmark (`.am-logo`, `.paper__logo`). Do **not** use it for headings or UI text — it is decorative/low-legibility.
- **Everything else:** `Nunito Sans` (Google Fonts; weights 400/600/700/800/900). This is the practical web stand-in for the brand's Avenir. Warm, geometric-humanist, highly legible.
  - Note: the brand guide lists **Avenir Book/Black**. `MinionPro-Regular.otf` was also supplied but is a serif and is **not used** in this redesign (per the agreed direction: clean readable sans for all UI). If you have an Avenir license, you may swap `Nunito Sans` → `Avenir` 1:1.
- Type roles (rem on a 16px root):
  - `.am-h1` 900 / 1.7rem / -0.03em
  - `.am-h2` 800 / 1.18rem / -0.02em
  - `.am-eyebrow` 800 / 0.72rem / +0.12em / uppercase / `--sage`
  - body 400–700 / 1rem / 1.45
  - stat value 900 / 2rem / -0.04em / `--brand`

---

## Screen → File Map (prototype → your codebase)

| Prototype (in `app/`) | Your file | Notes |
|---|---|---|
| `LoginScreen` (`screens-main.jsx`) | `src/screens/LoginScreen.tsx` | Keep `signIn` logic + `loginIdentifierToEmail`. |
| `HomeScreen` | `src/screens/HomeScreen.tsx` | Keep class filtering by role/`classIds`. |
| `ChildListScreen` | `src/screens/ChildListScreen.tsx` | Keep add/edit/retire + `ChildEditor`. |
| `AssessScreen` + `ReviewStep` | `src/screens/AssessmentFlow.tsx` (+ `AssessChildRoute.tsx`) | Keep step model = `visibleAreas`, scoring state, validation, submit. **Adds a final Review step.** |
| `AreaStep` / `ScaleSelector` (inlined in `AssessScreen`) | `src/components/AreaStep.tsx`, `src/components/ScaleSelector.tsx` | Redesigned scale buttons. |
| `ReportsScreen` + `AggregateReport` + `ChildReport` | `src/screens/ReportsScreen.tsx` + `src/components/ReportView.tsx` (+ `BarChart`, `Sparkline`, `StatCard`, `ReportTable`) | Keep scope/filter/export logic. New visuals replace BarChart/Sparkline/StatCard. |
| `PaperReport` (`report-paper.jsx`) | `src/domain/pdf-report.ts` + `src/lib/pdf.ts` + `src/styles/print.css` | New printable layout (see Reports section). |
| `BottomNav` (`screens-main.jsx`) | **New** shared component | Add a persistent bottom tab bar (Classes / Reports / Settings). |
| `SettingsScreen` (`app.jsx`) | `src/screens/SettingsScreen.tsx` | Prototype is a styled stub; keep your real editors. |
| `Icon`, `AppBar`, `Avatar`, `SyncBanner`, `StatusPill`, `Bars`, `Dumbbell`, `Donut`, `Toast`, `Logo` (`ui.jsx`) | **New** `src/components/ui/*` | Shared primitives — see Components. |

---

## Screens

### 1. Login — `src/screens/LoginScreen.tsx`
- **Layout:** centered single column, `--pad` gutter, cream bg. Vertical: hero block (top, ~78px top padding) → form card → spacer → reg-line footer.
- **Hero:** 92×92 rounded-square (`--radius-lg`) in `--brand` with a white `leaf` icon (48px), `--shadow-lg`; below it the `Amava` Cavorting wordmark at 48px + "OLUNTU" eyebrow; below that a 1.05rem `--ink-soft` welcome line (max-width ~280px, centered).
- **Form:** white `.am-card` (radius `--radius`, `--shadow`), 18px padding, `gap:16`. Two fields (Username, Password) using `.am-input` (min-height `--tap`, 2px `--line` border, radius `--radius-sm`, focus border `--brand`). Field label `.am-field__lab` 800/0.9rem. Primary block button `.am-btn--primary --btn--lg`. Helper line 0.86rem centered.
- **Behavior:** submit → existing `signIn`; on error show `--warn` message ("Incorrect username or password.").

### 2. Home / My classes — `src/screens/HomeScreen.tsx`
- **Header (custom app bar):** `.am-appbar` (sticky, `padding-top:58px` to clear the iOS status area on web PWA), white bg, bottom hairline. Left: eyebrow "Hello, {firstName}" + `Amava` wordmark (30px). Right: 46px `--brand` Avatar with the user's initials.
- **Body** (`.am-scroll`, 16px top pad, `gap:16`, entrance stagger via `.am-anim`):
  1. **Sync banner** `.am-sync` (pill): green `--good-soft` "Saved & synced" when online; `--warn` "Offline — saved on this phone · N waiting" when offline + pending. Wire to `useSyncStatus`.
  2. **Term snapshot card:** `.am-card` with a `Donut` (size 104, label `{assessed}/{total}`, sublabel "this term", color `--good`) + heading "This term's progress" + supportive sentence.
  3. **"MY CLASSES" section label** (`.am-sectionlab` with eyebrow).
  4. **Class rows** `.am-row` (one per visible class): 46px colored square icon (`people` glyph), title = class name (700/1.06rem), sub = "{n} children · {done} assessed this term", trailing chevron. Tap → `/class/:id`.
  5. **"View reports"** `.am-btn--brand` block button → `/reports`.
- **Bottom nav** pinned (Classes active).

### 3. Child list — `src/screens/ChildListScreen.tsx`
- **App bar** with back chevron (`.am-back`, 44px circle, `--surface-2` bg) + class name title.
- **Body:** chip row (`{done} of {n} assessed` in green; "Garden class" chip if `hasGardenComponent`); a **search input** with leading `search` icon (46px left padding); then **child rows** `.am-row`: initials `Avatar`, name (700), sub = contextual hint ("Tap to start baseline" if no baseline / "Tap to add quarterly check-in" if baseline only / "Tap to assess"; append "· not in sample" when `!isSample`), trailing **`StatusPill`** (Improving ▲ / Steady / Watch / Baseline done / Not started — derived from `report-metrics`). Tap → `/assess/:id`.
- **"Add a child"** dashed ghost button (keep your `ChildEditor` + retired-children `<details>`).

### 4. Assessment flow — `src/screens/AssessmentFlow.tsx`
The most-used screen. Keep your exact step model (`visibleAreas`, per-indicator scores, "score every indicator" validation, `coAssessors`, observation notes, submit → `enqueueAssessment` + `engine.push()`), but restructure into a guided, one-area-per-step wizard **plus a new final Review step**.
- **Header:** back (step 0 → cancel to class; else previous step), child name + "{Baseline|Quarterly check-in} · {class}", child Avatar. Below: **progress bar of segments** `.am-steps` (one per area + 1 for review; `.done` = `--good`, `.now` = `--accent`) + "Step X of N · {Area}".
- **Per-area step:** area icon chip + area name; for each indicator: bold indicator text (1.06rem) + "How often do you see this?" helper + **`.am-scale`** options. Optional "Anything you noticed?" textarea per area.
- **Scale option `.am-scaleopt`** (replaces `ScaleSelector` buttons): full-width, 2px border, min-height `--tap`; left = 38px rounded number badge; then label (800) + description (0.84rem `--ink-soft`). Selected: border `--accent`, bg `color-mix(--accent 8%, surface)`, badge fills `--accent`/white, trailing check. Descriptors come from `programme.scaleDescriptors` (e.g. 1 Emerging … 4 Strong).
- **Review step (`ReviewStep`, new):** "Review the scores" + one tappable card per area (icon, name, average "/4", and chips `{short}: {score}`) that jumps back to that step to edit; then the "Who agreed on these scores?" (`coAssessors`) input.
- **Sticky action bar** (bottom, blurred): inline `--warn` validation message; **Next** (→ arrow) on area steps, **Save assessment** (✓) on review. Save → submit + navigate to `/class/:id` and show a success **Toast** ("Saved — {firstName}'s assessment").

### 5. Reports — `src/screens/ReportsScreen.tsx` + `src/components/ReportView.tsx`
Keep all scope/role/date/area-filter/export logic. Replace visuals:
- **Scope segmented control** `.am-seg`: Everyone / By class / One child (gate by `isCoordinator` as today). Sub-picker chip rows (`.am-hscroll`) for class or child selection.
- **Aggregate view (`AggregateReport`):**
  - Title block: scope eyebrow + "How the children are growing".
  - **Headline card:** big `Donut` (overall % improved) + sentence + two inline stats (children in scope, with follow-up).
  - **"Biggest wins":** top-3 indicators by `% improved` as cards (62px mini-donut + indicator text + "{nImproved} of {nMeasured} children improved").
  - **Area filter chips** (`.am-hscroll`): All areas + each area short name.
  - **Per-area cards:** area icon + name + "Average now {avgLatest}/4 · was {avgBaseline}"; then **`Bars`** — one horizontal bar per indicator, fill = avg latest (`--good`), with a **baseline tick mark** overlaid (the `.am-bar__base` vertical line). Legend: "Now" swatch + "Baseline" tick.
- **Child view (`ChildReport`):** Avatar + name + class; if no follow-up → friendly "Baseline recorded" empty state; else headline `Donut` ({improved}/{measured}) + sentence; **"Growth by area"** card using **`Dumbbell`** rows (baseline = hollow ring, now = filled `--good` dot, connector line green if up / `--warn` if down) + value; then facilitator notes as cards.
- **Export actions:** "Open printable report" (`--brand` block → opens `PaperReport`), PDF + Print ghost buttons, and the existing privacy note ("Reports never show a child's name unless you choose One child").

### 6. Printable report (PDF/print) — `src/domain/pdf-report.ts` + `src/styles/print.css`
A4 document, brand-fixed (does **not** follow the app theme). See `app/report-paper.jsx` for exact markup and `styles/amava.css` (`.paper*` rules) for styling.
- **Header band:** `--slate` background, 40/52px padding; left = white `Amava` Cavorting wordmark + "OLUNTU"; right = "IMPACT REPORT" eyebrow + programme name (right-aligned, `white-space:nowrap`). Bottom edge: a **6px tricolor stripe** (terracotta / sand / green, 33% each). Title (900/34px) + meta line "{scope} · {period}".
- **Body (52px gutter):** narrative summary sentence → **"AT A GLANCE"** 3-up stat cards → **"BIGGEST WINS"** 3-up tinted cards → **"PROGRESS BY DEVELOPMENT AREA"**: per-area card, each indicator a row of `[label | progress track with baseline tick | "{avgLatest} · {pct}% up"]`.
- **Child report variant (`PaperChild`):** summary stats (improved/measured, areas tracked, avg gain) → "GROWTH BY AREA" bars → **"EVERY INDICATOR"** table (Indicator / Baseline / Now / Change with ▲▼ pills) → facilitator notes (left-bordered `--sand` callouts).
- **Footer:** reg line (`Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213`) + "Generated {date}".
- **Print CSS:** `@page { size:A4; margin:0 }`; hide everything except `.paper`; `.paper { width:100% }`. Your existing `downloadPdf` path in `src/lib/pdf.ts` / `pdf-report.ts` should produce this layout.

---

## Components (new shared primitives — `app/ui.jsx`)
Build these as small typed components (e.g. `src/components/ui/`):
- **`Icon`** — single-path line-icon set (24×24, `currentColor`, `stroke-width` 2). Names used: home, people, chart, report, gear, chevron, back, check, plus, sun, heart, spark, leaf, search, download, print, arrowup, arrowright, flag, pencil, wifi, logout, info. (Replace with your icon lib if you have one; keep the stroke weight/size.)
- **`Logo`** — Cavorting wordmark + "OLUNTU" eyebrow.
- **`AppBar`** — sticky header (back button optional, title, optional right slot).
- **`Avatar`** — initials in a rounded square; deterministic color from a 6-color brand cycle, or pass an explicit color.
- **`SyncBanner`** — online/offline pill (wire to `useSyncStatus`).
- **`StatusPill`** — improving/steady/watch/baseline/new tag.
- **`Bars`** — horizontal indicator bars with optional baseline tick.
- **`Dumbbell`** — baseline→latest range marker (per-area child trend).
- **`Donut`** — SVG ring gauge with center label/sublabel.
- **`Toast`** — transient confirmation (auto-dismiss ~2.6s).
- **`BottomNav`** — 3-tab bar; each tab ≥52px, active = `--accent`.

## Interactions & Behavior
- **Navigation:** unchanged routes (`/`, `/class/:id`, `/assess/:id`, `/reports`, `/settings`, `/login`). Add a persistent **BottomNav** on Home/Reports/Settings.
- **Entrance animation:** `.am-anim > *` staggers a 9px translateY rise over .42s (`cubic-bezier(.2,.8,.2,1)`). **Important:** the resting state is fully visible (opacity 1) — never animate opacity from 0, so content is never hidden if animation can't run. Respect `prefers-reduced-motion`.
- **Press feedback:** buttons/rows scale to ~0.97 on `:active`.
- **Assessment validation:** block "Next" until every indicator on the current area is scored; show inline `--warn` message.
- **Toast** on successful save.
- **Bars/Donut** animate fill/`stroke-dashoffset` on mount (.6–.8s) — decorative only.

## State Management
No new global state. Reuse existing hooks/clients: `useReferenceData`, `useReportData`, `useConfigData`, `useSyncStatus`, `useOnlineStatus`, `auth-context`, `roster-client`, `config-client`, `accounts-client`, `sync-engine`. Local component state covers: assessment wizard (`stepIdx`, `scores`, `notes`, `coAssessors`), report scope + filters, search query, theme + text-size (persist theme/`--fs-user` to localStorage or your settings store).

## Assets
- `fonts/Cavorting.otf` — wordmark only (supplied).
- `fonts/MinionPro-Regular.otf` — supplied but **unused** in this redesign.
- `Nunito Sans` — Google Fonts (or self-host); swap to licensed `Avenir` if available.
- Icons are inline SVG paths (see `Icon` in `app/ui.jsx`) — replace with your preferred icon set at the same 24px/stroke-2 spec.
- No raster imagery is required.

## Files in this bundle
- `Amava redesign.html` — entry; loads React 18 + Babel, fonts, CSS, and the scripts below.
- `styles/amava.css` — **all tokens, themes, and component styles** (the source of truth for visuals).
- `app/data.jsx` — sample data + simplified metrics (**reference only — do not port; use real `src/domain`**).
- `app/ui.jsx` — shared primitives (Icon, AppBar, Avatar, charts, etc.).
- `app/screens-main.jsx` — Login, Home, Child list, Assessment + Review, BottomNav.
- `app/screens-reports.jsx` — Reports (aggregate + child).
- `app/report-paper.jsx` — printable A4 report (aggregate + child).
- `app/app.jsx` — shell: routing/nav state, theme tweaks, Settings stub, device frame.
- `frames/ios-frame.jsx`, `tweaks-panel.jsx` — prototype scaffolding only (status-bar frame + the theme toggle panel); **not part of the product** — ignore for implementation.
```
```
