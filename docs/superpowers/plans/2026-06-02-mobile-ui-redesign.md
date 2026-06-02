# Amava M&E — Mobile UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the `claude-design` visual/UX redesign (phone-first, low-literacy audience, Amava 2022 brand) inside the existing `amava-me` codebase — **presentational only**, preserving every line of data/sync/auth/domain logic.

**Architecture:** Replace markup + CSS. Add a shared UI primitive library (`src/components/ui/`), a persistent bottom nav, a theme + text-size appearance context (localStorage-persisted), a guided assessment wizard with a new Review step, redesigned reports, and a new on-screen printable A4 report. All screens keep their existing hooks/clients and call signatures. Pure view-model helpers (icon/label/child-view derivation) are TDD'd.

**Tech Stack:** React 19 + TypeScript + Vite + react-router-dom 7, plain CSS with custom properties, Vitest + @testing-library/react, pdfmake (existing). Design source-of-truth lives in-repo at `docs/design-handoff/` (CSS at `docs/design-handoff/styles/amava.css`, reference JSX in `docs/design-handoff/app/*.jsx`, README at `docs/design-handoff/README.md`).

**Working directory for all commands:** `amava-me/` (run `npm` from there, e.g. `npm --prefix amava-me run test`). Test command: `npm run test` (= `vitest run`). Typecheck/build: `npm run build` (= `tsc -b && vite build`).

---

## CRITICAL: data-shape adaptations (prototype assumes fields that DON'T exist)

The prototype `data.jsx` invents convenience fields. The **real** domain (`src/domain/types.ts`, `report-metrics.ts`) does NOT have them. Every screen rewrite MUST adapt:

| Prototype field | Reality | Adaptation |
|---|---|---|
| `area.icon` | DevelopmentArea has no icon | `areaIcon(index)` helper cycles a fixed icon list |
| `area.short`, `indicator.short` | only `name` / `text` exist | `shortLabel(text, n)` helper truncates |
| `descriptors` | `programme.scaleDescriptors` `{value,label,description}[]` | use programme.scaleDescriptors |
| `cls.garden` | `ClassGroup.hasGardenComponent` | use `.hasGardenComponent` |
| `area.gardenOnly` | `DevelopmentArea.gardenOnly` | matches |
| `report.total` | not on Report | use `childrenInScope` for "assessed", and for "of N enrolled" pass children count separately |
| `report.improved` / `report.measured` (child) | ChildReport has `rows[]` w/ `classification` | derive: measured = rows with baseline≠null && latest≠null; improved = rows w/ classification==='improved' |
| `report.firstName`, `report.hasLatest` (child) | ChildReport has `childName` only | firstName = childName.split(' ')[0]; hasLatest = any row.latest≠null |
| `trends[].baseline` / `.latest` | ChildAreaTrend has `points:{date,avgScore}[]` | baseline = points[0]?.avgScore; latest = points[last]?.avgScore |
| `headlines[].text` / `.id` | Headline has `indicatorText` / `indicatorId` | use those |
| aggregate area `indicators[].short/avgLatest/avgBaseline` | IndicatorReport has `indicatorText/avgLatest/avgBaseline/percentImproved/nImproved/nMeasured` | use those; label via shortLabel(indicatorText) |
| `report-metrics` builders named `buildAggregate`/`buildChild` | real names `buildReport`/`buildChildReport`/`buildOrgSections` | use real names |

**Scope kinds:** real `ReportsScreen` supports FOUR scopes: `org | programme | class | child`. The prototype shows three (Everyone/By class/One child). **Preserve all four** — render a `programme` chip sub-picker when there is >1 active programme (see Task 19).

**`report` object shape on screen:** ReportsScreen builds `{ kind: 'aggregate'|'child'|'org', aggregate?, child?, sections?, scaleMax }`. For `org`, render one aggregate block per `sections[]` entry (each `OrgSection` = `{programmeName, scaleMax, report}`).

---

## File structure

**New files**
- `src/styles/components.css` — all `.am-*` + `.paper*` component styles (from design CSS)
- `src/assets/fonts/Cavorting.otf` — already staged (wordmark font)
- `src/appearance.tsx` — theme + text-size context/provider (localStorage)
- `src/components/AppShell.tsx` — wraps a screen body + renders `BottomNav`
- `src/components/ui/Icon.tsx`, `Logo.tsx`, `AppBar.tsx`, `Avatar.tsx`, `SyncBanner.tsx`, `StatusPill.tsx`, `Bars.tsx`, `Dumbbell.tsx`, `Donut.tsx`, `Toast.tsx`, `BottomNav.tsx`
- `src/components/ui/index.ts` — barrel export
- `src/domain/view-model.ts` + `src/domain/view-model.test.ts` — `areaIcon`, `shortLabel`, `childStatus`, `deriveChildView`
- `src/screens/PaperReportScreen.tsx` — on-screen printable A4 report

**Modified files**
- `src/styles/tokens.css` — full token set + 3 theme blocks + font vars
- `src/styles/base.css` — reset + `.am-root` sizing
- `src/styles/print.css` — `.paper` print rules
- `src/main.tsx` — import `components.css`; wrap `<App/>` in `<AppearanceProvider>`
- `index.html` — Nunito Sans `<link>` + preconnect
- `src/App.tsx` — add `/report/print` route
- `src/screens/LoginScreen.tsx`, `HomeScreen.tsx`, `ChildListScreen.tsx`, `AssessmentFlow.tsx`, `ReportsScreen.tsx`, `SettingsScreen.tsx`
- `src/components/ScaleSelector.tsx`, `AreaStep.tsx`, `ReportView.tsx`
- Existing tests touching changed markup: `ReportView.test.tsx`, `ScaleSelector.test.tsx`, `ChildEditor.test.tsx`, `AssessmentFlow.test.tsx` (and any of AccountManager/AreaEditor/ProgrammeClassManager/ThresholdEditor that assert removed markup)

**Untouched (logic):** everything in `src/data/`, `src/auth/`, `src/hooks/`, `src/domain/{types,report-metrics,assessment-logic,config-logic,csv,username,child-fields,chart-svg,pdf-report}.ts`, `src/lib/`, `src/app-context.tsx`.

---

## PHASE 0 — Foundations (tokens, fonts, CSS, appearance)

### Task 1: Wire fonts

**Files:**
- Modify: `index.html`
- Modify: `src/styles/tokens.css` (font vars — done in Task 2)
- Asset already staged: `src/assets/fonts/Cavorting.otf`

- [ ] **Step 1:** In `index.html`, inside `<head>` after the theme-color meta, add Google Fonts for Nunito Sans:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;0,900&display=swap" rel="stylesheet" />
```

- [ ] **Step 2:** Commit.

```bash
git add index.html
git commit -m "chore: load Nunito Sans web font"
```

> Cavorting `@font-face` is declared in components.css (Task 3) referencing `../assets/fonts/Cavorting.otf`.

---

### Task 2: Replace tokens.css with full token set + 3 themes

**Files:**
- Modify (replace contents): `src/styles/tokens.css`

- [ ] **Step 1:** Replace the entire file with the token + theme blocks below (these are the design `:root`/`[data-theme]` blocks from `docs/design-handoff/styles/amava.css`, with font vars pointing at Cavorting + Nunito Sans). Keep legacy aliases (`--text`, `--muted`, `--primary`, `--tap-min`, `--font-display`, `--font-body`, `--radius`) so any not-yet-migrated markup still renders.

```css
:root {
  /* raw brand tokens (constant across themes) */
  --slate: #687F8B;
  --slate-deep: #4d626d;
  --teal: #97D7D9;
  --sand: #E5BF7A;
  --green: #C4E2B7;
  --green-deep: #6fa173;
  --sage: #9CA297;
  --terracotta: #DD866C;
  --terracotta-deep: #c96a4f;

  --font-logo: 'Cavorting', 'Brush Script MT', cursive;
  --font: 'Nunito Sans', -apple-system, system-ui, sans-serif;

  /* semantic — overridden per theme (defaults = Soft) */
  --bg: #FBF7F0; --bg-2: #F4EDE1; --surface: #ffffff; --surface-2: #fbf8f3;
  --ink: #33403b; --ink-soft: #6b746f; --line: #ece3d6;
  --brand: #687F8B; --accent: #DD866C; --accent-ink: #ffffff;
  --good: #6fa173; --good-soft: #e6f1de; --warn: #c96a4f; --highlight: #E5BF7A;

  --radius: 20px; --radius-sm: 14px; --radius-lg: 28px; --pad: 16px;
  --shadow: 0 1px 2px rgba(45,40,30,.04), 0 6px 18px rgba(45,40,30,.06);
  --shadow-lg: 0 2px 6px rgba(45,40,30,.06), 0 18px 40px rgba(45,40,30,.10);
  --fs: 1; --tap: 52px;

  /* legacy aliases (back-compat for un-migrated markup) */
  --text: var(--ink); --muted: var(--ink-soft); --primary: var(--brand);
  --tap-min: var(--tap); --font-display: var(--font-logo); --font-body: var(--font);
}

[data-theme="soft"] {
  --bg:#FBF7F0; --bg-2:#F4EDE1; --surface:#ffffff; --surface-2:#fbf8f3;
  --ink:#33403b; --ink-soft:#6b746f; --line:#ece3d6;
  --brand:#687F8B; --accent:#DD866C; --accent-ink:#fff;
  --good:#6fa173; --good-soft:#e6f1de; --warn:#c96a4f; --highlight:#E5BF7A;
  --radius:20px; --radius-sm:14px; --radius-lg:28px;
  --shadow:0 1px 2px rgba(45,40,30,.04), 0 6px 18px rgba(45,40,30,.06);
  --fs:1; --tap:52px;
}

[data-theme="garden"] {
  --bg:#EEF3E6; --bg-2:#e3ecd6; --surface:#ffffff; --surface-2:#f4f8ee;
  --ink:#2c3a2e; --ink-soft:#5d6b58; --line:#dde6d0;
  --brand:#4f7d54; --accent:#DD866C; --accent-ink:#fff;
  --good:#5e9763; --good-soft:#dcead0; --warn:#c96a4f; --highlight:#E5BF7A;
  --radius:24px; --radius-sm:16px; --radius-lg:34px;
  --shadow:0 2px 4px rgba(40,55,35,.05), 0 12px 28px rgba(40,55,35,.10);
  --fs:1.04; --tap:54px;
}

[data-theme="simple"] {
  --bg:#ffffff; --bg-2:#f1f4f5; --surface:#ffffff; --surface-2:#f6f8f9;
  --ink:#1f2a2f; --ink-soft:#566169; --line:#d3dbdf;
  --brand:#4d626d; --accent:#c96a4f; --accent-ink:#fff;
  --good:#3f7d56; --good-soft:#e1f0e5; --warn:#bf5236; --highlight:#E5BF7A;
  --radius:18px; --radius-sm:12px; --radius-lg:22px;
  --shadow:0 1px 0 rgba(0,0,0,.04); --fs:1.18; --tap:60px;
}
```

- [ ] **Step 2:** Commit.

```bash
git add src/styles/tokens.css
git commit -m "feat: full brand token set + 3 themes"
```

---

### Task 3: Add components.css (all .am-* + .paper* styles)

**Files:**
- Create: `src/styles/components.css`
- Modify: `src/main.tsx`

- [ ] **Step 1:** Create `src/styles/components.css`. Copy the CSS from `docs/design-handoff/styles/amava.css` **starting at the `@font-face` block (line ~9) through the end of the file**, EXCLUDING the `:root` and the three `[data-theme]` token blocks (those now live in tokens.css). Concretely: include the `@font-face`, then everything from the `/* =====...` separator after the themes (the `* { box-sizing... }` rule at line ~90) to EOF (`.am-toast` block). Fix the font path: the `@font-face` `src` must be `url('../assets/fonts/Cavorting.otf')`.

The included blocks are: `@font-face` (Cavorting), `*` reset, `.am-root`, `.am-screen`, `.am-scroll`, `.am-pad/.am-stack`, `.am-logo`, `.am-appbar*`, `.am-back`, `.am-btn*`, `.am-card*`, `.am-row*`, `.am-ava`, `.am-chip*`, `.am-seg*`, `.am-hscroll`, `.am-eyebrow/.am-h1/.am-h2/.am-muted`, `.am-sync*`, `.am-scale*/.am-scaleopt*`, `.am-steps*`, `.am-bottomnav/.am-navbtn`, `.am-stat*`, `.am-bars/.am-bar*`, `.am-tag*`, `.am-field*/.am-input`, `.am-sectionlab`, `amfade` keyframes + `.am-anim`, the entire `PRINTABLE REPORT` section (`.paper-stage`…`.paper__foot`, `@media print`), and `.am-toast`.

- [ ] **Step 2:** In `src/main.tsx`, add the import after `base.css`:

```tsx
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/print.css'
```

- [ ] **Step 3:** Verify the font path resolves — run `npm run build` and confirm no "can't resolve ../assets/fonts/Cavorting.otf" error.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4:** Commit.

```bash
git add src/styles/components.css src/main.tsx
git commit -m "feat: add am-* + paper component styles"
```

---

### Task 4: Reset base.css

**Files:**
- Modify (replace contents): `src/styles/base.css`

- [ ] **Step 1:** Replace contents with a minimal reset that defers visuals to components.css. Keep `.container` as a back-compat centering wrapper used by Settings sub-editors.

```css
html, body, #root { height: 100%; margin: 0; }
body {
  font-family: var(--font);
  color: var(--ink);
  background: var(--bg-2);
  -webkit-font-smoothing: antialiased;
}
/* legacy container kept for Settings sub-editors not yet restyled */
.container { max-width: 640px; margin: 0 auto; padding: 16px; }
.no-print { }
```

- [ ] **Step 2:** Commit.

```bash
git add src/styles/base.css
git commit -m "refactor: slim base.css to reset"
```

---

### Task 5: Appearance context (theme + text size)

**Files:**
- Create: `src/appearance.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1:** Create `src/appearance.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeName = 'soft' | 'garden' | 'simple'
const THEME_KEY = 'amava.theme'
const FS_KEY = 'amava.fsUser'

function readTheme(): ThemeName {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'garden' || v === 'simple' ? v : 'soft'
}
function readFs(): number {
  const v = Number(localStorage.getItem(FS_KEY))
  return v >= 0.9 && v <= 1.35 ? v : 1
}

interface AppearanceValue {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  fsUser: number
  setFsUser: (n: number) => void
}
const Ctx = createContext<AppearanceValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readTheme)
  const [fsUser, setFsState] = useState<number>(readFs)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--fs-user', String(fsUser))
  }, [theme, fsUser])

  function setTheme(t: ThemeName) { localStorage.setItem(THEME_KEY, t); setThemeState(t) }
  function setFsUser(n: number) {
    const clamped = Math.min(1.35, Math.max(0.9, n))
    localStorage.setItem(FS_KEY, String(clamped)); setFsState(clamped)
  }

  return <Ctx.Provider value={{ theme, setTheme, fsUser, setFsUser }}>{children}</Ctx.Provider>
}

export function useAppearance(): AppearanceValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppearance must be used within AppearanceProvider')
  return v
}
```

- [ ] **Step 2:** In `src/main.tsx`, wrap `<App/>`:

```tsx
import { AppearanceProvider } from './appearance'
// ...
      <AuthProvider>
        <AppearanceProvider>
          <App />
        </AppearanceProvider>
      </AuthProvider>
```

- [ ] **Step 3:** Commit.

```bash
git add src/appearance.tsx src/main.tsx
git commit -m "feat: appearance context (theme + text size, persisted)"
```

> NOTE: `data-theme` is set on `<html>`. `.am-root` font-size uses `calc(16px * var(--fs) * var(--fs-user, 1))`; ensure each screen's outermost element carries class `am-root` (AppShell in Task 6, or screen root). The Soft default still applies before any screen mounts because tokens.css `:root` defaults to Soft values.

---

### Task 6: AppShell + BottomNav mount pattern

**Files:**
- Create: `src/components/AppShell.tsx` (after BottomNav exists — depends on Task 10; if executing in order, create the file now with a placeholder import and finish in Task 10, OR reorder so Task 10 precedes this. Recommended: do Tasks 7–10 then this.)

- [ ] **Step 1:** Create `src/components/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react'
import { BottomNav } from './ui/BottomNav'

export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="am-root am-screen">
      {children}
      {nav && <BottomNav />}
    </div>
  )
}
```

- [ ] **Step 2:** Commit (after Task 10).

```bash
git add src/components/AppShell.tsx
git commit -m "feat: AppShell wrapper with bottom nav"
```

---

## PHASE 1 — Shared UI primitives + view-model helpers

### Task 7: Icon component (+ test)

**Files:**
- Create: `src/components/ui/Icon.tsx`
- Test: `src/components/ui/Icon.test.tsx`

- [ ] **Step 1: Write the failing test** `src/components/ui/Icon.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Icon } from './Icon'

describe('Icon', () => {
  it('renders an svg with the named path', () => {
    const { container } = render(<Icon name="home" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy()
  })
  it('renders nothing-breaking for unknown name', () => {
    const { container } = render(<Icon name={'nope' as never} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
```

- [ ] **Step 2:** Run `npm run test -- Icon` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/components/ui/Icon.tsx` — copy the `PATHS` map and `Icon` function from `docs/design-handoff/app/ui.jsx` (lines ~7–39), converted to TS:

```tsx
const PATHS: Record<string, string> = {
  home: 'M3 11l9-7 9 7M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9',
  people: 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM17 11a3 3 0 10-1-5.8M21 19v-1a4 4 0 00-3-3.8',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  report: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h7M9 17h5',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 2h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 22h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  chevron: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6', check: 'M20 6L9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  sun: 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 100 8 4 4 0 000-8z',
  heart: 'M12 20s-7-4.5-9.5-9A4.5 4.5 0 0112 5a4.5 4.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  leaf: 'M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c2-3 4-5 7-6.5',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  download: 'M12 3v12M7 11l5 5 5-5M5 21h14',
  print: 'M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-5a1 1 0 011-1h16a1 1 0 011 1v5a1 1 0 01-1 1h-2M6 14h12v7H6z',
  arrowup: 'M12 19V5M6 11l6-6 6 6', arrowright: 'M5 12h14M13 6l6 6-6 6',
  flag: 'M5 21V4M5 4s1.5-1 4-1 4 2 7 2 3-1 3-1v9s-1 1-3 1-4.5-2-7-2-4 1-4 1',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  wifi: 'M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  logout: 'M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9',
  info: 'M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z',
}

export type IconName = keyof typeof PATHS

export function Icon({
  name, size = 24, stroke = 2, color = 'currentColor', fill = 'none', style, className,
}: {
  name: IconName; size?: number; stroke?: number; color?: string; fill?: string
  style?: React.CSSProperties; className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      <path d={PATHS[name as string] || ''} />
    </svg>
  )
}
```

- [ ] **Step 4:** Run `npm run test -- Icon` → PASS.
- [ ] **Step 5:** Commit.

```bash
git add src/components/ui/Icon.tsx src/components/ui/Icon.test.tsx
git commit -m "feat: Icon primitive"
```

---

### Task 8: Logo, AppBar, Avatar, SyncBanner, StatusPill, Toast

**Files:**
- Create: `src/components/ui/Logo.tsx`, `AppBar.tsx`, `Avatar.tsx`, `SyncBanner.tsx`, `StatusPill.tsx`, `Toast.tsx`

- [ ] **Step 1:** Create each, porting from `docs/design-handoff/app/ui.jsx` to TS. `StatusPill` takes a typed status.

`Logo.tsx`:
```tsx
export function Logo({ size = 30, sub = true, color }: { size?: number; sub?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span className="am-logo" style={{ fontSize: size, color }}>Amava</span>
      {sub && <span style={{ fontWeight: 800, fontSize: size * 0.26, letterSpacing: '.34em',
        textTransform: 'uppercase', color: 'var(--sage)', marginTop: 4, marginLeft: 2 }}>Oluntu</span>}
    </div>
  )
}
```

`AppBar.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function AppBar({ title, onBack, right, center, big }: {
  title: ReactNode; onBack?: () => void; right?: ReactNode; center?: boolean; big?: boolean
}) {
  return (
    <div className="am-appbar">
      <div className="am-appbar__row">
        {onBack && <button className="am-back" onClick={onBack} aria-label="Back"><Icon name="back" size={26} /></button>}
        <div className={'am-appbar__title' + (center ? ' center' : '')} style={big ? { fontSize: '1.6rem', fontWeight: 900 } : undefined}>{title}</div>
        {right}
      </div>
    </div>
  )
}
```

`Avatar.tsx`:
```tsx
export const AVA_COLORS = ['#DD866C', '#6fa173', '#687F8B', '#c9a24a', '#7fae9f', '#b07d63']
export function Avatar({ name, color, size = 46 }: { name: string; color?: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
  const c = color || AVA_COLORS[(name.charCodeAt(0) + name.length) % AVA_COLORS.length]
  return (
    <div className="am-ava" style={{ width: size, height: size, flexBasis: size, background: c, fontSize: size * 0.36, borderRadius: size * 0.3 }}>
      {initials}
    </div>
  )
}
```

`SyncBanner.tsx`:
```tsx
export function SyncBanner({ online, pending }: { online: boolean; pending: number }) {
  return (
    <div className={'am-sync ' + (online ? 'am-sync--on' : 'am-sync--off')}>
      <span className="am-sync__dot" />
      {online ? 'Saved & synced' : 'Offline — saved on this phone'}
      {pending > 0 && <span style={{ opacity: .85 }}>· {pending} waiting</span>}
    </div>
  )
}
```

`StatusPill.tsx`:
```tsx
import { Icon } from './Icon'
export type StatusKey = 'up' | 'flat' | 'down' | 'base' | 'new'
export function StatusPill({ status }: { status: StatusKey }) {
  const map: Record<StatusKey, { cls: string; icon?: 'arrowup'; text: string }> = {
    up: { cls: 'am-tag--up', icon: 'arrowup', text: 'Improving' },
    flat: { cls: 'am-tag--flat', text: 'Steady' },
    down: { cls: 'am-tag--down', text: 'Watch' },
    base: { cls: 'am-tag--flat', text: 'Baseline done' },
    new: { cls: 'am-tag--flat', text: 'Not started' },
  }
  const m = map[status]
  return <span className={'am-tag ' + m.cls}>{m.icon && <Icon name={m.icon} size={13} stroke={2.6} />}{m.text}</span>
}
```

`Toast.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return <div className="am-toast"><Icon name="check" size={18} stroke={3} /> {children}</div>
}
```

- [ ] **Step 2:** Commit.

```bash
git add src/components/ui/Logo.tsx src/components/ui/AppBar.tsx src/components/ui/Avatar.tsx src/components/ui/SyncBanner.tsx src/components/ui/StatusPill.tsx src/components/ui/Toast.tsx
git commit -m "feat: Logo/AppBar/Avatar/SyncBanner/StatusPill/Toast primitives"
```

---

### Task 9: Donut, Bars, Dumbbell (SVG charts)

**Files:**
- Create: `src/components/ui/Donut.tsx`, `Bars.tsx`, `Dumbbell.tsx`

- [ ] **Step 1:** Port from `docs/design-handoff/app/ui.jsx` to TS.

`Donut.tsx`:
```tsx
export function Donut({ value, label, sublabel, color = 'var(--good)', size = 116 }: {
  value: number; label: string; sublabel?: string; color?: string; size?: number
}) {
  const r = (size - 16) / 2, c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: size * 0.27, color: 'var(--ink)', letterSpacing: '-.04em', lineHeight: 1 }}>{label}</div>
          {sublabel && <div style={{ fontWeight: 800, fontSize: size * 0.1, color: 'var(--ink-soft)', marginTop: 3 }}>{sublabel}</div>}
        </div>
      </div>
    </div>
  )
}
```

`Bars.tsx`:
```tsx
export interface BarDatum { label: string; value: number | null; baseline?: number | null; color?: string; suffix?: string }
export function Bars({ data, max = 4, showBaseline = true }: { data: BarDatum[]; max?: number; showBaseline?: boolean }) {
  return (
    <div className="am-bars">
      {data.map((d, i) => {
        const pct = Math.max(4, ((d.value ?? 0) / max) * 100)
        const basePct = d.baseline != null ? (d.baseline / max) * 100 : null
        return (
          <div key={i}>
            <div className="am-bar__top">
              <span className="am-bar__lab">{d.label}</span>
              <span className="am-bar__val">{d.value ?? '—'}{d.suffix || ''}</span>
            </div>
            <div className="am-bar__track">
              <div className="am-bar__fill" style={{ width: pct + '%', background: d.color || 'var(--good)' }} />
              {showBaseline && basePct != null && <div className="am-bar__base" style={{ left: `calc(${basePct}% - 1px)` }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

`Dumbbell.tsx`:
```tsx
function Dot({ left, color, ring }: { left: number; color?: string; ring?: boolean }) {
  return <div style={{ position: 'absolute', top: 7, left: `calc(${left}% - 7px)`, width: 14, height: 14,
    borderRadius: 999, background: ring ? 'var(--surface)' : color, border: ring ? '3px solid var(--sage)' : '3px solid var(--surface)',
    boxShadow: ring ? 'none' : '0 1px 3px rgba(0,0,0,.18)' }} />
}
export function Dumbbell({ baseline, latest, max = 4 }: { baseline: number | null; latest: number | null; max?: number }) {
  const bp = baseline != null ? (baseline / max) * 100 : null
  const lp = latest != null ? (latest / max) * 100 : null
  const up = latest != null && baseline != null && latest >= baseline
  return (
    <div style={{ position: 'relative', height: 26, flex: 1 }}>
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, borderRadius: 2, background: 'var(--surface-2)', border: '1px solid var(--line)' }} />
      {bp != null && lp != null && (
        <div style={{ position: 'absolute', top: 11.5, height: 4, borderRadius: 2,
          left: Math.min(bp, lp) + '%', width: Math.abs(lp - bp) + '%', background: up ? 'var(--good)' : 'var(--warn)' }} />
      )}
      {bp != null && <Dot left={bp} ring />}
      {lp != null && <Dot left={lp} color={up ? 'var(--good)' : 'var(--warn)'} />}
    </div>
  )
}
```

- [ ] **Step 2:** Commit.

```bash
git add src/components/ui/Donut.tsx src/components/ui/Bars.tsx src/components/ui/Dumbbell.tsx
git commit -m "feat: Donut/Bars/Dumbbell chart primitives"
```

---

### Task 10: BottomNav (react-router-aware) + ui barrel

**Files:**
- Create: `src/components/ui/BottomNav.tsx`, `src/components/ui/index.ts`

- [ ] **Step 1:** Create `BottomNav.tsx`. Active tab derives from `useLocation().pathname`. Only show the Settings tab to coordinators? — No: show all three always (Settings route itself redirects non-coordinators). Tabs: Classes (`/`), Reports (`/reports`), Settings (`/settings`).

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const ITEMS: { key: string; label: string; icon: IconName; path: string; match: (p: string) => boolean }[] = [
  { key: 'home', label: 'Classes', icon: 'home', path: '/', match: p => p === '/' || p.startsWith('/class') || p.startsWith('/assess') },
  { key: 'reports', label: 'Reports', icon: 'chart', path: '/reports', match: p => p.startsWith('/report') },
  { key: 'settings', label: 'Settings', icon: 'gear', path: '/settings', match: p => p.startsWith('/settings') },
]

export function BottomNav() {
  const loc = useLocation()
  const nav = useNavigate()
  return (
    <nav className="am-bottomnav">
      {ITEMS.map(it => {
        const on = it.match(loc.pathname)
        return (
          <button key={it.key} className={'am-navbtn' + (on ? ' on' : '')} onClick={() => nav(it.path)} aria-current={on ? 'page' : undefined}>
            <Icon name={it.icon} size={25} stroke={on ? 2.4 : 2} />
            {it.label}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2:** Create `src/components/ui/index.ts`:

```ts
export { Icon, type IconName } from './Icon'
export { Logo } from './Logo'
export { AppBar } from './AppBar'
export { Avatar, AVA_COLORS } from './Avatar'
export { SyncBanner } from './SyncBanner'
export { StatusPill, type StatusKey } from './StatusPill'
export { Toast } from './Toast'
export { Donut } from './Donut'
export { Bars, type BarDatum } from './Bars'
export { Dumbbell } from './Dumbbell'
export { BottomNav } from './BottomNav'
```

- [ ] **Step 3:** Now create `src/components/AppShell.tsx` (Task 6 body) and commit both.

```bash
git add src/components/ui/BottomNav.tsx src/components/ui/index.ts src/components/AppShell.tsx
git commit -m "feat: BottomNav + ui barrel + AppShell"
```

---

### Task 11: View-model helpers (TDD)

**Files:**
- Create: `src/domain/view-model.ts`
- Test: `src/domain/view-model.test.ts`

These convert real domain shapes → what the redesigned views need. Pure functions.

- [ ] **Step 1: Write the failing test** `src/domain/view-model.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { areaIcon, shortLabel, childStatus, deriveChildView } from './view-model'
import type { ChildReport } from './report-metrics'

describe('areaIcon', () => {
  it('is deterministic by index and cycles', () => {
    expect(areaIcon(0)).toBe(areaIcon(0))
    expect(typeof areaIcon(99)).toBe('string')
  })
})

describe('shortLabel', () => {
  it('passes through short text', () => { expect(shortLabel('Shares tools', 18)).toBe('Shares tools') })
  it('truncates long text with ellipsis', () => {
    const out = shortLabel('Cooperates with peers during group garden activities', 18)
    expect(out.length).toBeLessThanOrEqual(19)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('childStatus', () => {
  it('new when no assessments', () => { expect(childStatus(0, false, null)).toBe('new') })
  it('base when only baseline', () => { expect(childStatus(1, false, null)).toBe('base') })
  it('up/flat/down from net change when has follow-up', () => {
    expect(childStatus(2, true, 0.5)).toBe('up')
    expect(childStatus(2, true, 0)).toBe('flat')
    expect(childStatus(2, true, -0.5)).toBe('down')
  })
})

describe('deriveChildView', () => {
  const rep: ChildReport = {
    childId: 'c1', childName: 'Amahle Dlamini',
    rows: [
      { indicatorId: 'i1', indicatorText: 'Shares', areaId: 'a1', areaName: 'Social', baseline: 2, latest: 3, change: 1, classification: 'improved' },
      { indicatorId: 'i2', indicatorText: 'Listens', areaId: 'a1', areaName: 'Social', baseline: 3, latest: 3, change: 0, classification: 'stable' },
      { indicatorId: 'i3', indicatorText: 'Waters', areaId: 'a2', areaName: 'Garden', baseline: null, latest: null, change: null, classification: null },
    ],
    trends: [
      { areaId: 'a1', areaName: 'Social', points: [{ date: '2026-02-01', avgScore: 2.5 }, { date: '2026-05-01', avgScore: 3 }] },
      { areaId: 'a2', areaName: 'Garden', points: [{ date: '2026-02-01', avgScore: 2 }] },
    ],
    observations: [{ date: '2026-05-01', areaId: 'a1', note: 'shared without asking' }],
  }
  it('derives firstName, measured/improved, hasLatest', () => {
    const v = deriveChildView(rep)
    expect(v.firstName).toBe('Amahle')
    expect(v.measured).toBe(2)
    expect(v.improved).toBe(1)
    expect(v.hasLatest).toBe(true)
  })
  it('maps trends to baseline/latest from first/last points', () => {
    const v = deriveChildView(rep)
    const social = v.trends.find(t => t.areaId === 'a1')!
    expect(social.baseline).toBe(2.5)
    expect(social.latest).toBe(3)
    const garden = v.trends.find(t => t.areaId === 'a2')!
    expect(garden.baseline).toBe(2)
    expect(garden.latest).toBe(2)
  })
})
```

- [ ] **Step 2:** Run `npm run test -- view-model` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/domain/view-model.ts`:

```ts
import type { ChildReport } from './report-metrics'
import type { IconName } from '../components/ui/Icon'

const AREA_ICONS: IconName[] = ['heart', 'people', 'spark', 'leaf', 'sun', 'chart']
export function areaIcon(index: number): IconName {
  return AREA_ICONS[((index % AREA_ICONS.length) + AREA_ICONS.length) % AREA_ICONS.length]
}

export function shortLabel(text: string, max = 18): string {
  const t = text.trim()
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…'
}

/** netChange: latest-minus-baseline averaged across measured indicators (or null). */
export function childStatus(assessmentCount: number, hasFollowUp: boolean, netChange: number | null): import('../components/ui/StatusPill').StatusKey {
  if (assessmentCount === 0) return 'new'
  if (!hasFollowUp) return 'base'
  if (netChange == null) return 'flat'
  if (netChange > 0.001) return 'up'
  if (netChange < -0.001) return 'down'
  return 'flat'
}

export interface ChildTrendView { areaId: string; areaName: string; baseline: number | null; latest: number | null }
export interface ChildView {
  name: string; firstName: string
  measured: number; improved: number; hasLatest: boolean
  trends: ChildTrendView[]
  observations: { date: string; note: string }[]
}
export function deriveChildView(rep: ChildReport): ChildView {
  const measuredRows = rep.rows.filter(r => r.baseline != null && r.latest != null)
  return {
    name: rep.childName,
    firstName: rep.childName.split(/\s+/)[0] || rep.childName,
    measured: measuredRows.length,
    improved: rep.rows.filter(r => r.classification === 'improved').length,
    hasLatest: rep.rows.some(r => r.latest != null),
    trends: rep.trends.map(t => ({
      areaId: t.areaId, areaName: t.areaName,
      baseline: t.points[0]?.avgScore ?? null,
      latest: t.points.length ? t.points[t.points.length - 1].avgScore : null,
    })),
    observations: rep.observations.map(o => ({ date: o.date, note: o.note })),
  }
}
```

- [ ] **Step 4:** Run `npm run test -- view-model` → PASS.
- [ ] **Step 5:** Commit.

```bash
git add src/domain/view-model.ts src/domain/view-model.test.ts
git commit -m "feat: view-model helpers (areaIcon/shortLabel/childStatus/deriveChildView)"
```

---

## PHASE 2 — Screens

> For each screen: KEEP all existing imports/hooks/handlers exactly; only change the returned JSX + add presentational state (search query, toast, step index where noted). Verify with `npm run build` after each.

### Task 12: LoginScreen

**Files:** Modify `src/screens/LoginScreen.tsx`

- [ ] **Step 1:** Keep `useAuth`, `loginIdentifierToEmail`, state, and `submit`. Replace the returned JSX with the hero + card layout (see `docs/design-handoff/app/screens-main.jsx` `LoginScreen`, ~lines 6–47). Real wiring:
  - Root: `<div className="am-root am-screen">` (no bottom nav on login).
  - Form `onSubmit={submit}`; Username input `value={username}` `onChange`, `autoCapitalize="none"`, keep `aria-label="username"`; Password input `type="password"` `value={password}` keep `aria-label="password"`.
  - Reg line footer text: `Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213`.
  - Error: `{error && <p style={{ color: 'var(--warn)', ... }}>{error}</p>}` above the button.
  - Submit button: `className="am-btn am-btn--primary am-btn--block am-btn--lg" type="submit"`.
  - Hero uses `<Icon name="leaf" size={48} color="#fff" .../>` in a 92px `--brand` rounded square + `<Logo size={48} />`.
  - Import `{ Icon, Logo }` from `../components/ui`.

- [ ] **Step 2:** `npm run build` → succeeds. Commit.

```bash
git add src/screens/LoginScreen.tsx
git commit -m "feat: redesign LoginScreen"
```

---

### Task 13: HomeScreen

**Files:** Modify `src/screens/HomeScreen.tsx`

- [ ] **Step 1:** Keep `useAuth`, `useAppServices`, `useReferenceData`, `useSyncStatus`, the `me` + `myClasses` computation. Replace JSX (ref: `docs/design-handoff/app/screens-main.jsx` `HomeScreen`):
  - Wrap in `<div className="am-root am-screen">` … `<BottomNav />` at end (or use `<AppShell>`).
  - Custom app bar: eyebrow `Hello, {me?.name?.split(' ')[0] ?? ''}` + `<Logo size={30} sub={false} />`; right `<Avatar name={me?.name ?? '?'} color="var(--brand)" />`.
  - Body `className="am-scroll am-pad am-anim"`:
    1. `<SyncBanner online={online} pending={pendingCount} />`
    2. Term snapshot card: compute `total = ` children in myClasses (`ref.children.filter(ch => myClasses.some(c => c.id === ch.classId) && ch.active)`); `assessed` = those with any assessment this term. **There is no per-term assessment count in ReferenceData.** Use a simple proxy: `assessed` = children with `isSample` OR just show `{myClasses.length} classes`. To avoid inventing data, render the donut as `label={String(total)}` `sublabel="children"` `value={100}` and heading "Your classes" with sentence "You have {total} children across {myClasses.length} classes." (Do NOT fabricate an "assessed this term" number — assessments aren't in this hook.)
    3. Section label "My classes".
    4. Class rows: for each `c` in `myClasses`, `count = ref.children.filter(ch => ch.classId === c.id && ch.active).length`; row icon square color cycles `AVA_COLORS[i % AVA_COLORS.length]` with `<Icon name="people" color="#fff" />`; title `c.name`; sub `{count} children`; trailing chevron. `onClick={() => navigate('/class/' + c.id)}` (import `useNavigate`).
    5. "View reports" `am-btn--brand am-btn--block` → `navigate('/reports')`.
  - Empty state when `myClasses.length === 0`: keep the "No classes assigned yet" message inside a card.
  - Import `{ Logo, Avatar, AVA_COLORS, SyncBanner, Donut, Icon, BottomNav }`.

- [ ] **Step 2:** `npm run build` → succeeds. Commit.

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: redesign HomeScreen"
```

---

### Task 14: ChildListScreen

**Files:** Modify `src/screens/ChildListScreen.tsx`

- [ ] **Step 1:** KEEP all logic: `useConfigData` `{ref, refresh}`, `isCoordinator`, `canManage`, `rosterClient.addChild/updateChild/setActive`, the `editing` state, `<ChildEditor>` usage (same props incl. `key`), and the retired-children `<details>`. Replace surrounding JSX (ref: `screens-main.jsx` `ChildListScreen`):
  - `<AppBar title={cls?.name} onBack={() => navigate('/')} />` then body `am-scroll am-pad am-anim`.
  - Chip row: a `done`-style chip — since assessment counts aren't in this screen's data, show `{activeChildren.length} children` and, if `cls?.hasGardenComponent`, a "Garden class" chip with leaf icon. (Drop the prototype's "{done} of {n} assessed" — that count isn't available here.)
  - Search input with leading search icon (`paddingLeft: 46`), `value={q}` new `useState('')`, filter active children by `(firstName+' '+surname).toLowerCase().includes(q)`.
  - Child rows: `<button className="am-row" onClick={() => navigate('/assess/' + ch.id)}>` with `<Avatar name={firstName+' '+surname} />`, title name, sub hint ("Tap to assess" + " · not in sample" when `!ch.isSample`), and a trailing control. For status: this screen has no assessment history, so render an `Edit`/`Retire` affordance set as today instead of StatusPill — KEEP the existing Edit + Retire buttons (move them into the row or a row action area). **Do not remove management controls.** Simplest faithful approach: keep each child as a row showing name + sub; below the name show small Edit/Retire text buttons when `canManage` (as today). Tapping the row navigates to assess.
  - "Add a child" dashed ghost button when `canManage`: `className="am-btn am-btn--ghost am-btn--block" style={{ borderStyle: 'dashed' }}` → `setEditing('new')`. Keep the `<ChildEditor>` render exactly as today when `editing`.
  - `<BottomNav />` at end.
  - Import `{ AppBar, Avatar, Icon, BottomNav }`; add `useNavigate`.

- [ ] **Step 2:** `npm run build` → succeeds. Commit.

```bash
git add src/screens/ChildListScreen.tsx
git commit -m "feat: redesign ChildListScreen (keep CRUD/retire)"
```

---

### Task 15: ScaleSelector restyle

**Files:** Modify `src/components/ScaleSelector.tsx`; update `src/components/ScaleSelector.test.tsx` if it asserts old markup.

- [ ] **Step 1:** Keep props `{ descriptors, value, onChange }`. Render `.am-scale` container with one `.am-scaleopt` button per descriptor (ref: `screens-main.jsx` lines ~239–251):

```tsx
import { Icon } from './ui'
import type { Programme } from '../domain/types'
export function ScaleSelector({ descriptors, value, onChange }: {
  descriptors: Programme['scaleDescriptors']; value: number | null; onChange: (v: number) => void
}) {
  return (
    <div className="am-scale">
      {descriptors.map(d => {
        const on = value === d.value
        return (
          <button type="button" key={d.value} className={'am-scaleopt' + (on ? ' on' : '')}
            aria-pressed={on} onClick={() => onChange(d.value)}>
            <span className="am-scaleopt__num">{d.value}</span>
            <span style={{ flex: 1 }}>
              <span className="am-scaleopt__lab">{d.label}</span>
              <span className="am-scaleopt__desc" style={{ display: 'block' }}>{d.description}</span>
            </span>
            {on && <Icon name="check" size={22} color="var(--accent)" stroke={3} />}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2:** Run `npm run test -- ScaleSelector`. If it fails on markup (e.g. queried by old role/text), update the test to query by label text + `aria-pressed`. Keep behavioural assertions (clicking calls onChange with value).
- [ ] **Step 3:** Commit.

```bash
git add src/components/ScaleSelector.tsx src/components/ScaleSelector.test.tsx
git commit -m "feat: restyle ScaleSelector as am-scaleopt"
```

---

### Task 16: AreaStep restyle

**Files:** Modify `src/components/AreaStep.tsx`

- [ ] **Step 1:** Keep props `{ area, indicators, descriptors, scores, note, onScore, onNote }`. Render the area header chip + per-indicator block (bold text + "How often do you see this?" + `<ScaleSelector descriptors value={scores[ind.id] ?? null} onChange={v => onScore(ind.id, v)} />`) + the optional observation textarea wired to `note`/`onNote`. Area icon via `areaIcon(area.sortOrder)` (import from `../domain/view-model`). Indicator `hint` (if present) can render under the indicator text as `.am-muted`. Ref: `screens-main.jsx` per-area step (~lines 224–259).

- [ ] **Step 2:** `npm run build`. Commit.

```bash
git add src/components/AreaStep.tsx
git commit -m "feat: restyle AreaStep (area chip + indicators)"
```

---

### Task 17: AssessmentFlow — wizard + Review step + sticky bar + toast

**Files:** Modify `src/screens/AssessmentFlow.tsx`; update `src/screens/AssessmentFlow.test.tsx`.

- [ ] **Step 1:** KEEP all props and the EXACT assessment construction in submit (`id: crypto.randomUUID()`, scores from `allIndicators`, observations filtered by non-empty note, `scaleMax: programme.scaleMax`, `syncState: 'pending'`, then `props.onSubmit(assessment)`), the `visibleAreas(areas, cls)` computation, and validation ("Please score every indicator before saving."). Keep state `stepIdx, scores, notes, coAssessors, error`. The step model: `steps = visibleAreas`, total steps = `steps.length + 1` (last = Review).

Restructure JSX (ref: `screens-main.jsx` `AssessScreen` + `ReviewStep`):
  - App bar: back button (`stepIdx===0` → `onCancel()`, else `setStepIdx(s=>s-1)`), child name + `"{type==='baseline'?'First assessment':'Quarterly check-in'} · {cls.name}"`, child `<Avatar size={42} />`.
  - Progress `.am-steps`: one `.am-steps__d` per area (`done` if `i<stepIdx`, `now` if `i===stepIdx`) + one for review (`now` if `isReview`). Caption "Step X of N · {area.name}" or "Review & save".
  - Body: when not review, render `<AreaStep area={steps[stepIdx]} indicators={indicators.filter(i => i.areaId === steps[stepIdx].id)} descriptors={programme.scaleDescriptors} scores={scores} note={notes[area.id] ?? ''} onScore={(id,v)=>{setScores(s=>({...s,[id]:v})); setError('')}} onNote={n=>setNotes(x=>({...x,[area.id]:n}))} />`. When review, render the Review step: a tappable `am-card` per area showing average `/{programme.scaleMax}` and per-indicator chips (`shortLabel(indicator.text, 14): score`), tapping → `setStepIdx(i)`; plus the "Who agreed on these scores?" input wired to `coAssessors`.
  - Sticky action bar (the `position:absolute` blurred bar): inline `--warn` error; **Next** button on area steps → validate current area's indicators all scored (`indicators for this area where scores[id]==null`); if unscored `setError(...)` else `setStepIdx(s=>s+1)`. On review: **Save assessment** → run the existing submit construction, then `props.onSubmit`. (`onSubmit` navigates; the success Toast is shown by AssessChildRoute OR here just before calling onSubmit — simplest: keep navigation in route; skip toast here to avoid unmount race. Optional: lift a `?saved=` query — NOT required.)
  - "score every indicator" validation must still cover **all** indicators before final save (the per-step Next gating already ensures this, but keep a final guard before submit identical to current logic).
  - Import `{ AppBar, Avatar, Icon }`, `AreaStep`, `shortLabel`.

- [ ] **Step 2:** Update `AssessmentFlow.test.tsx`: keep behavioural tests (must score all indicators; submit builds correct Assessment). Adapt to the wizard: the test likely scored all indicators on one screen — now it must advance through steps. Update it to click each area's scale options then Next, reach Review, click Save, and assert `onSubmit` received an Assessment with the right `scores.length`, `coAssessors`, `observations`, `type`, `scaleMax`. Query scale options by their label text/`aria-pressed`.

- [ ] **Step 3:** Run `npm run test -- AssessmentFlow` → PASS. `npm run build` → succeeds. Commit.

```bash
git add src/screens/AssessmentFlow.tsx src/screens/AssessmentFlow.test.tsx
git commit -m "feat: guided assessment wizard + Review step"
```

---

### Task 18: ReportView (on-screen aggregate + child bodies)

**Files:** Modify `src/components/ReportView.tsx`; update `src/components/ReportView.test.tsx`.

- [ ] **Step 1:** Keep props `{ scaleMax, aggregate?, child? }`. Rebuild the two bodies (ref: `screens-reports.jsx` `AggregateReport` + `ChildReport`), adapting to REAL shapes:

**AggregateBody(report: Report, scaleMax):**
  - `overallPct = report.headlines.length ? round(mean(headlines.percentImproved)) : 0` — but better use all areas: `round(mean(report.areas.map(a=>a.percentImproved)))` when areas exist; fall back to headlines. Use headlines for the "Biggest wins" 3-up (each: `Donut value={h.percentImproved} label={h.percentImproved+'%'}`, text `h.indicatorText`, sub `{h.nImproved} of {h.nMeasured} children improved`).
  - Headline card: `<Donut value={overallPct} label={overallPct+'%'} sublabel="improved" size={124} />` + sentence + inline stats `report.childrenInScope` (children) and `report.withFollowUp` (with follow-up).
  - Area filter chips: "All areas" + each `report.areas` (label `shortLabel(area.areaName)`); local `areaFilter` state (default 'all').
  - Per-area cards (filtered): icon `areaIcon(index)`, name `area.areaName`, sub `Average now {area.avgLatest ?? '—'} / {scaleMax} · was {area.avgBaseline ?? '—'}`; `<Bars max={scaleMax} data={area.indicators.map(i => ({ label: shortLabel(i.indicatorText), value: i.avgLatest, baseline: i.avgBaseline }))} />` + legend (Now swatch / Baseline tick).

**ChildReportBody(report: ChildReport, scaleMax):** use `deriveChildView(report)` → `v`.
  - Header: `<Avatar name={v.name} size={56} />` + `v.name` + (class name not in ChildReport → omit or pass via props; simplest: omit class subline).
  - If `!v.hasLatest`: friendly "Baseline recorded" empty card ("Add a quarterly check-in to see how {v.firstName} is growing.").
  - Else: headline `<Donut value={v.measured ? round(v.improved/v.measured*100) : 0} label={\`${v.improved}/${v.measured}\`} sublabel="grown" />` + sentence "{v.firstName} improved on {v.improved} of {v.measured} things measured." Growth by area card: one row per `v.trends` → label `shortLabel(t.areaName, 16)` + `<Dumbbell baseline={t.baseline} latest={t.latest} max={scaleMax} />` + value `{t.latest ?? '—'}`; legend. Facilitator notes: one card per `v.observations` (date + note).

  - Import `{ Donut, Bars, Dumbbell, Avatar, Icon }`, `{ areaIcon, shortLabel, deriveChildView }`.

- [ ] **Step 2:** Update `ReportView.test.tsx`. The existing M2 tests assert percentages keep the `%` sign and use `getAllByText` — PRESERVE those semantics. Re-point queries to the new markup (Donut labels render the `%`). Keep the assertion that a `%` is shown and area/indicator names appear. Do NOT remove the `%` to satisfy a selector — query the Donut label text instead.

- [ ] **Step 3:** Run `npm run test -- ReportView` → PASS. `npm run build`. Commit.

```bash
git add src/components/ReportView.tsx src/components/ReportView.test.tsx
git commit -m "feat: redesign on-screen ReportView (Donut/Bars/Dumbbell)"
```

---

### Task 19: ReportsScreen (scope segmented control + sub-pickers + exports + printable link)

**Files:** Modify `src/screens/ReportsScreen.tsx`

- [ ] **Step 1:** KEEP every bit of logic: scope state (all four kinds `org|programme|class|child`), default-scope effect, `from`/`to`/`areaFilter`, the `report` builder memo (`buildReport`/`buildChildReport`/`buildOrgSections`), `canExport`, `exportPdf`, `exportCsv`, `REG_LINE`, `slugify`, `formatPeriod`, `today`. Replace JSX:
  - `<AppBar title="Reports" onBack={() => navigate('/')} />`, body `am-scroll am-pad`, `<BottomNav />`.
  - Segmented control `.am-seg`: buttons Everyone (`org`), By class (`class`), One child (`child`) — gate `child`/`class` by role exactly as today (coordinators see all; facilitators default to their class). Add a fourth segment **By programme** (`programme`) ONLY when `ref.programmes.filter(p=>p.active).length > 1`. Clicking a segment sets a sensible default id (first class in scope / first child with data / first programme), mirroring current setScope calls.
  - Sub-picker `.am-hscroll` chip rows for `class` (active classes the user may see), `child` (children with any assessment), and `programme` (active programmes) — each chip sets scope id.
  - Render: if `report.kind==='child'` → `<ReportView scaleMax={report.scaleMax} child={report.child} />`; if `'aggregate'` → `<ReportView scaleMax={report.scaleMax} aggregate={report.aggregate} />`; if `'org'` → map `report.sections` to a titled block each: section programme name (`am-sectionlab`) + `<ReportView scaleMax={s.scaleMax} aggregate={s.report} />`.
  - Date filters (`from`/`to`) + area filter: keep as compact controls (a small "Filters" `<details>` with two `.am-input type="date"` and an area `<select>` or chip row) — KEEP their state and wiring.
  - Export section: "Open printable report" `am-btn--brand am-btn--block` → `navigate('/report/print', { state: { scope, from, to } })` (PaperReport reads it); then a row with **PDF** (`exportPdf`) and **Print** (`window.print()` or also navigate to print) ghost buttons, gated by `canExport`; plus the privacy note. KEEP "Export CSV" — wire it to `exportCsv` (can live in the same row or the Filters area).
  - Import `{ AppBar, Icon, BottomNav }`; add `useNavigate`.

- [ ] **Step 2:** `npm run build` → succeeds. Commit.

```bash
git add src/screens/ReportsScreen.tsx
git commit -m "feat: redesign ReportsScreen (segmented scope, keep exports/filters)"
```

---

### Task 20: PaperReport screen + print route

**Files:** Create `src/screens/PaperReportScreen.tsx`; modify `src/App.tsx`, `src/styles/print.css`.

- [ ] **Step 1:** Replace `src/styles/print.css` so only `.paper` prints (the `.paper*` visual rules already live in components.css from Task 3):

```css
@media print {
  @page { size: A4; margin: 0; }
  body * { visibility: hidden; }
  .paper, .paper * { visibility: visible; }
  .paper { position: absolute; left: 0; top: 0; box-shadow: none; width: 100%; }
  .paper-topbar, .paper-stage { background: #fff !important; }
  .no-print { display: none !important; }
}
```

- [ ] **Step 2:** Create `src/screens/PaperReportScreen.tsx`. Read scope/dates from `useLocation().state` (fallback: redirect to `/reports` if absent). Rebuild reports with the same domain builders the ReportsScreen uses (import `buildReport`/`buildChildReport` + the hooks `useReferenceData`, `useReportAssessments`, plus `useConfigData` for threshold if needed; reuse the same input assembly as ReportsScreen — extract a shared helper if convenient, else duplicate minimally). Render `.paper-stage > .paper-topbar (Back + Save PDF→window.print) > .paper-scroll > .paper` with `.paper__band` (slate band, white `Amava` logo + "OLUNTU", "IMPACT REPORT" kicker + programme name, tricolor `::after` stripe from CSS), title + meta (`scopeName · period`), then aggregate or child body (ref: `docs/design-handoff/app/report-paper.jsx` `PaperAggregate`/`PaperChild`), and `.paper__foot` (REG_LINE + "Generated {date}"). Adapt child body via `deriveChildView` + `report.rows` for the "Every indicator" table (Baseline/Now/Change with ▲▼ from `row.classification`/`row.change`). Period via `formatPeriod(from,to)`.

- [ ] **Step 3:** In `src/App.tsx` add the route:

```tsx
import { PaperReportScreen } from './screens/PaperReportScreen'
// inside <Routes>:
      <Route path="/report/print" element={<RequireAuth><AppServicesProvider><PaperReportScreen /></AppServicesProvider></RequireAuth>} />
```

- [ ] **Step 4:** `npm run build` → succeeds. Commit.

```bash
git add src/screens/PaperReportScreen.tsx src/App.tsx src/styles/print.css
git commit -m "feat: on-screen printable A4 report"
```

---

### Task 21: SettingsScreen — Appearance section + bottom nav

**Files:** Modify `src/screens/SettingsScreen.tsx`

- [ ] **Step 1:** KEEP the coordinator guard, online guard, and all existing editor sections (`ProgrammeClassManager`, `AccountManager`, `AreaEditor`, `ScaleEditor`, `ThresholdEditor`) unchanged. Wrap the screen in `<div className="am-root am-screen">` with `<AppBar title="Settings" onBack={() => navigate('/')} />`, a scrollable body, and `<BottomNav />`.
  - **Move the Appearance section ABOVE the coordinator/online guards** so EVERY user (incl. facilitators) can change theme + text size. Structure: render AppBar + Appearance card always; then if non-coordinator, show a short note instead of the editors (don't `<Navigate>` away — that would block facilitators from appearance settings; instead conditionally render the editors only for coordinators). If offline, show the existing "editing needs internet" note in place of the editors.
  - Appearance card uses `useAppearance()`:
    - Theme: three chip/buttons (Soft / Garden / Big & Simple) calling `setTheme('soft'|'garden'|'simple')`, active = `am-chip--on`.
    - Text size: `<input type="range" min="0.9" max="1.35" step="0.05" value={fsUser} onChange={e=>setFsUser(Number(e.target.value))} />` with a live "Aa" preview line.
  - Import `{ AppBar, BottomNav }`, `useAppearance`, `useNavigate`.

- [ ] **Step 2:** Run the existing Settings-related tests (`npm run test -- ProgrammeClassManager AccountManager AreaEditor ThresholdEditor`) → ensure still PASS (logic untouched). `npm run build`. Commit.

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat: Settings appearance (theme + text size) + nav, keep editors"
```

---

## PHASE 3 — Verify, fix tests, ship

### Task 22: Full test repair pass

**Files:** any remaining test asserting removed markup.

- [ ] **Step 1:** Run the full suite: `npm run test`. Expected baseline before redesign was ~81 passing.
- [ ] **Step 2:** For each failure, determine: is it a **real behavioural regression** (fix the CODE) or a **markup-coupled assertion** (fix the TEST to query the new accessible markup)? Per project rule, NEVER weaken the product to satisfy a brittle test — fix the test instead, preserving its behavioural intent (e.g. ReportView `%` sign, ChildEditor display values).
- [ ] **Step 3:** Re-run `npm run test` → all PASS. Commit.

```bash
git add -A
git commit -m "test: update assertions to redesigned markup"
```

---

### Task 23: Typecheck + production build

- [ ] **Step 1:** `npm run build` (= `tsc -b && vite build`) → no TS errors, build succeeds, no missing-asset warnings for the font.
- [ ] **Step 2:** Confirm `pdfmake` chunk still code-splits (lazy `import` in `src/lib/pdf.ts` untouched). Commit any fixes.

```bash
git add -A
git commit -m "chore: typecheck + build clean"
```

---

### Task 24: Manual smoke + deploy + memory

- [ ] **Step 1:** `npm run dev`; manually verify on a narrow viewport: Login → Home (bottom nav, donut, class rows) → Child list (search, add child still works) → Assessment wizard (steps, validation, Review, Save) → Reports (segmented scope, donut/bars, child dumbbells, Open printable report → A4 → browser Print) → Settings (theme switch Soft/Garden/Simple, text-size slider persists across reload). Confirm offline banner + `prefers-reduced-motion` (content visible without animation).
- [ ] **Step 2:** Deploy: from repo root, `npm --prefix amava-me run build` then `npx wrangler@latest pages deploy amava-me/dist --project-name amava-me --branch main --commit-dirty=true` with env `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID=7844fa2cefae73897ea66d92d3801648` (token supplied by user at deploy time).
- [ ] **Step 3:** Verify `https://amava-me.pages.dev` serves the redesign. Update `memory/amava-me-project.md` with the redesign status. Final commit + (if using PR flow) open PR.

---

## Self-review notes (gaps deliberately handled)

- **Assessment counts on Home/ChildList:** `useReferenceData` does NOT expose assessments, so the prototype's "{done} assessed this term" is NOT fabricated — Home shows child/class counts; ChildList shows child count + garden chip. (If real per-term counts are wanted later, that's a data-layer change out of scope for a presentational redesign.)
- **Area icons / short labels:** invented presentationally via `areaIcon`/`shortLabel` (no data-model change).
- **Child report class name:** ChildReport has no class name; omitted from the on-screen child header (or pass via prop from ReportsScreen if trivially available).
- **Fourth scope (`programme`):** preserved; surfaced only when >1 active programme.
- **Theme on `<html>`:** `data-theme` + `--fs-user` set on `documentElement`; screens carry `am-root` for font sizing.
- **Tests:** redesigned markup will break markup-coupled assertions; Task 22 fixes tests (not product), preserving behavioural intent.
