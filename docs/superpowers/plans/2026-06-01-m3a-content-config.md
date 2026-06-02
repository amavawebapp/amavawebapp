# Milestone 3a — Content Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A coordinator can edit the programme's development areas, indicators, rating scale, and "improved" threshold from an in-app Settings area (online-only), with retire-not-delete integrity, and the changes flow into the assessment flow and reports.

**Architecture:** A small schema migration adds coordinator write RLS + an editable threshold column. Pure, TDD'd logic (`config-logic`) handles reorder + validation. A thin `ConfigClient` does online writes to Supabase; Settings screens call it and then re-pull reference data to refresh the cache + UI. Presentational editor components are kept small and focused.

**Tech Stack:** Existing M1/M2 stack (React + TS + Vite + Vitest + Supabase). No new runtime dependencies.

---

## File Structure

```
amava-me/
  supabase/migrations/0002_config_write.sql   # threshold column + coordinator write policies
  src/
    domain/
      types.ts                 # + Programme.improvedThreshold? (optional)
      config-logic.ts          # reorder + validateScale + validateThreshold (pure)
      config-logic.test.ts
    data/
      supabase-sync-client.ts  # map improved_threshold
      config-client.ts         # ConfigClient interface + SupabaseConfigClient + singleton
    hooks/
      use-config-data.ts       # ref + refresh + hasAssessments (online refetch)
    components/
      IndicatorEditor.tsx
      AreaEditor.tsx
      AreaEditor.test.tsx
      ScaleEditor.tsx
      ThresholdEditor.tsx
      ThresholdEditor.test.tsx
    screens/
      SettingsScreen.tsx
      ReportsScreen.tsx         # use programme.improvedThreshold
      HomeScreen.tsx            # + Settings link (coordinator)
    App.tsx                     # + /settings route
```

---

## Task 1: Schema migration (threshold column + coordinator write RLS)

**Files:**
- Create: `amava-me/supabase/migrations/0002_config_write.sql`

- [ ] **Step 1: Write the migration**

Create `amava-me/supabase/migrations/0002_config_write.sql`:
```sql
-- Editable "improved" threshold (was a frontend constant).
alter table programme add column if not exists improved_threshold int not null default 1;

-- Coordinators may insert/update config tables. Facilitators may not (no policy for them).
-- (Existing SELECT policies remain; RLS combines permissive policies with OR.)

create policy programme_cfg_update on programme for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

create policy area_cfg_insert on development_area for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
create policy area_cfg_update on development_area for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));

create policy indicator_cfg_insert on indicator for insert to authenticated
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
create policy indicator_cfg_update on indicator for update to authenticated
  using  (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'))
  with check (exists (select 1 from facilitator f where f.id = auth.uid() and f.role = 'coordinator'));
```

- [ ] **Step 2: Apply it to the live project**

This SQL must run against the live Supabase project (controller action, via the Management API `database/query` endpoint with a Personal Access Token, or by pasting into the dashboard SQL Editor). Applying it is required before the live verification in Task 8, but is NOT needed for the unit tests in Tasks 2–7.

- [ ] **Step 3: Commit**

```bash
git add amava-me/supabase/migrations/0002_config_write.sql
git commit -m "feat: migration for editable threshold + coordinator write RLS"
```

---

## Task 2: Editable threshold wiring (Programme type + mapping + reports)

**Files:**
- Modify: `amava-me/src/domain/types.ts`, `amava-me/src/data/supabase-sync-client.ts`, `amava-me/src/screens/ReportsScreen.tsx`

- [ ] **Step 1: Add the optional field to Programme**

In `amava-me/src/domain/types.ts`, add to the `Programme` interface (after `scaleMax`):
```ts
  /** "Improved" threshold (change ≥ this). Optional for back-compat with older fixtures. */
  improvedThreshold?: number
```

- [ ] **Step 2: Map it in the Supabase adapter**

In `amava-me/src/data/supabase-sync-client.ts`, in `fetchReferenceData`'s `programmes` map, add the field:
```ts
      programmes: (programmes.data ?? []).map(p => ({
        id: p.id, name: p.name, scaleMax: p.scale_max,
        scaleDescriptors: p.scale_descriptors, active: p.active,
        improvedThreshold: p.improved_threshold ?? 1,
      })),
```

- [ ] **Step 3: Use it in reports**

In `amava-me/src/screens/ReportsScreen.tsx`, replace the two uses of `threshold: IMPROVED_THRESHOLD` so the per-programme value wins:
- In the child branch:
```ts
          areas: shownAreas, indicators: shownIndicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD,
```
- In the aggregate branch:
```ts
      aggregate: buildReport({ children, assessments: dated, areas: shownAreas, indicators: shownIndicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD }),
```
Keep the existing `import { IMPROVED_THRESHOLD } from '../config'` (it's the fallback).

- [ ] **Step 4: Verify**

Run: `npm run build` — clean.
Run: `npm run test` — all existing suites still pass (the optional field doesn't break any fixture).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/types.ts amava-me/src/data/supabase-sync-client.ts amava-me/src/screens/ReportsScreen.tsx
git commit -m "feat: reports read editable per-programme improved threshold"
```

---

## Task 3: Pure config logic (reorder + validation), TDD

**Files:**
- Create: `amava-me/src/domain/config-logic.ts`
- Test: `amava-me/src/domain/config-logic.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/domain/config-logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { reorder, validateScale, validateThreshold } from './config-logic'

const items = [
  { id: 'a', sortOrder: 1 },
  { id: 'b', sortOrder: 2 },
  { id: 'c', sortOrder: 3 },
]

describe('reorder', () => {
  it('swaps sort_order with the previous sibling when moving up', () => {
    expect(reorder(items, 'b', 'up')).toEqual([
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ])
  })
  it('swaps with the next sibling when moving down', () => {
    expect(reorder(items, 'b', 'down')).toEqual([
      { id: 'b', sortOrder: 3 },
      { id: 'c', sortOrder: 2 },
    ])
  })
  it('returns [] at the top/bottom boundary', () => {
    expect(reorder(items, 'a', 'up')).toEqual([])
    expect(reorder(items, 'c', 'down')).toEqual([])
  })
  it('returns [] for an unknown id', () => {
    expect(reorder(items, 'z', 'up')).toEqual([])
  })
})

const goodDescriptors = [
  { value: 1, label: 'Emerging', description: 'x' },
  { value: 2, label: 'Developing', description: 'y' },
  { value: 3, label: 'Strong', description: 'z' },
]

describe('validateScale', () => {
  it('passes for a well-formed scale', () => {
    expect(validateScale(3, goodDescriptors)).toBeNull()
  })
  it('rejects too few or too many points', () => {
    expect(validateScale(1, goodDescriptors.slice(0, 1))).toMatch(/between 2 and 10/)
  })
  it('rejects a descriptor count that does not match scaleMax', () => {
    expect(validateScale(4, goodDescriptors)).toMatch(/one descriptor per point/i)
  })
  it('rejects an empty label', () => {
    const bad = [{ value: 1, label: '', description: '' }, { value: 2, label: 'B', description: '' }]
    expect(validateScale(2, bad)).toMatch(/label/i)
  })
})

describe('validateThreshold', () => {
  it('accepts an integer within 1..scaleMax-1', () => {
    expect(validateThreshold(1, 4)).toBeNull()
    expect(validateThreshold(3, 4)).toBeNull()
  })
  it('rejects out-of-range or non-integer values', () => {
    expect(validateThreshold(0, 4)).toMatch(/between 1 and 3/)
    expect(validateThreshold(4, 4)).toMatch(/between 1 and 3/)
    expect(validateThreshold(1.5, 4)).toMatch(/whole number/i)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- config-logic`
Expected: FAIL — "Cannot find module './config-logic'".

- [ ] **Step 3: Implement**

Create `amava-me/src/domain/config-logic.ts`:
```ts
export interface OrderedRow { id: string; sortOrder: number }
export type Direction = 'up' | 'down'

/** Returns the two rows whose sort_order should swap, or [] at a boundary / unknown id. */
export function reorder(items: OrderedRow[], id: string, direction: Direction): OrderedRow[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
  const idx = sorted.findIndex(i => i.id === id)
  if (idx < 0) return []
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= sorted.length) return []
  const a = sorted[idx], b = sorted[swapWith]
  return [
    { id: a.id, sortOrder: b.sortOrder },
    { id: b.id, sortOrder: a.sortOrder },
  ]
}

export interface ScalePoint { value: number; label: string; description: string }

/** null if valid, else an error message. */
export function validateScale(scaleMax: number, descriptors: ScalePoint[]): string | null {
  if (!Number.isInteger(scaleMax) || scaleMax < 2 || scaleMax > 10) {
    return 'A scale must have between 2 and 10 points.'
  }
  if (descriptors.length !== scaleMax) {
    return 'Provide exactly one descriptor per point.'
  }
  if (descriptors.some(d => d.label.trim() === '')) {
    return 'Each point needs a label.'
  }
  return null
}

export function validateThreshold(n: number, scaleMax: number): string | null {
  if (!Number.isInteger(n)) return 'The threshold must be a whole number.'
  if (n < 1 || n > scaleMax - 1) return `The threshold must be between 1 and ${scaleMax - 1}.`
  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- config-logic`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/config-logic.ts amava-me/src/domain/config-logic.test.ts
git commit -m "feat: pure config logic (reorder + scale/threshold validation)"
```

---

## Task 4: ConfigClient (online write layer)

**Files:**
- Create: `amava-me/src/data/config-client.ts`

- [ ] **Step 1: Implement the interface + Supabase client + singleton**

Create `amava-me/src/data/config-client.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ScalePoint } from '../domain/config-logic'

type ConfigTable = 'development_area' | 'indicator'

export interface ConfigClient {
  addArea(programmeId: string, name: string, gardenOnly: boolean, sortOrder: number): Promise<void>
  updateArea(id: string, fields: { name?: string; gardenOnly?: boolean }): Promise<void>
  addIndicator(areaId: string, text: string, sortOrder: number): Promise<void>
  updateIndicator(id: string, fields: { text?: string; hint?: string | null }): Promise<void>
  setActive(table: ConfigTable, id: string, active: boolean): Promise<void>
  reorderRows(table: ConfigTable, updates: { id: string; sortOrder: number }[]): Promise<void>
  updateScale(programmeId: string, scaleMax: number, descriptors: ScalePoint[]): Promise<void>
  setThreshold(programmeId: string, n: number): Promise<void>
}

export class SupabaseConfigClient implements ConfigClient {
  constructor(private sb: SupabaseClient) {}

  private async run(p: PromiseLike<{ error: unknown }>) {
    const { error } = await p
    if (error) throw error
  }

  async addArea(programmeId: string, name: string, gardenOnly: boolean, sortOrder: number) {
    await this.run(this.sb.from('development_area').insert({
      programme_id: programmeId, name, garden_only: gardenOnly, sort_order: sortOrder, active: true,
    }))
  }
  async updateArea(id: string, fields: { name?: string; gardenOnly?: boolean }) {
    const patch: Record<string, unknown> = {}
    if (fields.name !== undefined) patch.name = fields.name
    if (fields.gardenOnly !== undefined) patch.garden_only = fields.gardenOnly
    await this.run(this.sb.from('development_area').update(patch).eq('id', id))
  }
  async addIndicator(areaId: string, text: string, sortOrder: number) {
    await this.run(this.sb.from('indicator').insert({
      area_id: areaId, text, hint: null, sort_order: sortOrder, active: true,
    }))
  }
  async updateIndicator(id: string, fields: { text?: string; hint?: string | null }) {
    const patch: Record<string, unknown> = {}
    if (fields.text !== undefined) patch.text = fields.text
    if (fields.hint !== undefined) patch.hint = fields.hint
    await this.run(this.sb.from('indicator').update(patch).eq('id', id))
  }
  async setActive(table: ConfigTable, id: string, active: boolean) {
    await this.run(this.sb.from(table).update({ active }).eq('id', id))
  }
  async reorderRows(table: ConfigTable, updates: { id: string; sortOrder: number }[]) {
    for (const u of updates) {
      await this.run(this.sb.from(table).update({ sort_order: u.sortOrder }).eq('id', u.id))
    }
  }
  async updateScale(programmeId: string, scaleMax: number, descriptors: ScalePoint[]) {
    await this.run(this.sb.from('programme').update({ scale_max: scaleMax, scale_descriptors: descriptors }).eq('id', programmeId))
  }
  async setThreshold(programmeId: string, n: number) {
    await this.run(this.sb.from('programme').update({ improved_threshold: n }).eq('id', programmeId))
  }
}

export const configClient: ConfigClient = new SupabaseConfigClient(supabase)
```

- [ ] **Step 2: Verify**

Run: `npm run build` — clean.

- [ ] **Step 3: Commit**

```bash
git add amava-me/src/data/config-client.ts
git commit -m "feat: ConfigClient online write layer for content config"
```

---

## Task 5: use-config-data hook

**Files:**
- Create: `amava-me/src/hooks/use-config-data.ts`

- [ ] **Step 1: Implement**

Create `amava-me/src/hooks/use-config-data.ts`:
```ts
import { useCallback, useEffect, useState } from 'react'
import type { ReferenceData } from '../domain/types'
import { useAppServices } from '../app-context'

/** Online refetch of reference data for the Settings screen, plus whether any
 *  assessments exist (drives the scale-change warning). */
export function useConfigData() {
  const { store, engine } = useAppServices()
  const [ref, setRef] = useState<ReferenceData | null>(null)
  const [hasAssessments, setHasAssessments] = useState(false)

  const refresh = useCallback(async () => {
    try { await engine.pull() } catch { /* fall back to cache */ }
    setRef(await store.getReferenceData())
    setHasAssessments((await store.getAllAssessments()).length > 0)
  }, [store, engine])

  useEffect(() => { refresh() }, [refresh])

  return { ref, refresh, hasAssessments }
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` — clean.
```bash
git add amava-me/src/hooks/use-config-data.ts
git commit -m "feat: use-config-data hook (online refetch + hasAssessments)"
```

---

## Task 6: IndicatorEditor + AreaEditor components (TDD on AreaEditor)

**Files:**
- Create: `amava-me/src/components/IndicatorEditor.tsx`, `amava-me/src/components/AreaEditor.tsx`
- Test: `amava-me/src/components/AreaEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/AreaEditor.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaEditor } from './AreaEditor'
import type { DevelopmentArea, Indicator } from '../domain/types'

const area: DevelopmentArea = { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true }
const indicators: Indicator[] = [
  { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
]
const noop = () => {}
const baseProps = {
  area, indicators,
  onRenameArea: noop, onToggleGarden: noop, onMoveArea: noop, onToggleAreaActive: noop,
  onAddIndicator: noop, onSaveIndicatorText: noop, onMoveIndicator: noop, onToggleIndicatorActive: noop,
}

describe('AreaEditor', () => {
  it('renders the area name and its indicator', () => {
    render(<AreaEditor {...baseProps} />)
    expect(screen.getByDisplayValue('General')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Listens')).toBeInTheDocument()
  })
  it('adds a new indicator', async () => {
    const onAddIndicator = vi.fn()
    render(<AreaEditor {...baseProps} onAddIndicator={onAddIndicator} />)
    await userEvent.type(screen.getByLabelText('new indicator'), 'Shares tools')
    await userEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(onAddIndicator).toHaveBeenCalledWith('gen', 'Shares tools')
  })
  it('retires an indicator', async () => {
    const onToggleIndicatorActive = vi.fn()
    render(<AreaEditor {...baseProps} onToggleIndicatorActive={onToggleIndicatorActive} />)
    await userEvent.click(screen.getByRole('button', { name: /Retire/ }))
    expect(onToggleIndicatorActive).toHaveBeenCalledWith('i1', false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AreaEditor`
Expected: FAIL — "Cannot find module './AreaEditor'".

- [ ] **Step 3: Implement IndicatorEditor**

Create `amava-me/src/components/IndicatorEditor.tsx`:
```tsx
import { useState } from 'react'
import type { Indicator } from '../domain/types'

interface Props {
  indicator: Indicator
  onSaveText: (id: string, text: string, hint: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
  onToggleActive: (id: string, active: boolean) => void
}

export function IndicatorEditor({ indicator, onSaveText, onMove, onToggleActive }: Props) {
  const [text, setText] = useState(indicator.text)
  const [hint, setHint] = useState(indicator.hint ?? '')
  const dirty = text !== indicator.text || hint !== (indicator.hint ?? '')
  return (
    <div style={{ opacity: indicator.active ? 1 : 0.5, display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
      <input aria-label="indicator text" value={text} onChange={e => setText(e.target.value)} style={{ flex: 1 }} />
      <input aria-label="indicator hint" value={hint} onChange={e => setHint(e.target.value)} placeholder="hint (optional)" style={{ width: 150 }} />
      {dirty && <button onClick={() => onSaveText(indicator.id, text.trim(), hint.trim())} disabled={!text.trim()}>Save</button>}
      <button aria-label="move indicator up" onClick={() => onMove(indicator.id, 'up')}>↑</button>
      <button aria-label="move indicator down" onClick={() => onMove(indicator.id, 'down')}>↓</button>
      <button onClick={() => onToggleActive(indicator.id, !indicator.active)}>{indicator.active ? 'Retire' : 'Restore'}</button>
    </div>
  )
}
```

- [ ] **Step 4: Implement AreaEditor**

Create `amava-me/src/components/AreaEditor.tsx`:
```tsx
import { useState } from 'react'
import type { DevelopmentArea, Indicator } from '../domain/types'
import { IndicatorEditor } from './IndicatorEditor'

interface Props {
  area: DevelopmentArea
  indicators: Indicator[]
  onRenameArea: (id: string, name: string) => void
  onToggleGarden: (id: string, gardenOnly: boolean) => void
  onMoveArea: (id: string, dir: 'up' | 'down') => void
  onToggleAreaActive: (id: string, active: boolean) => void
  onAddIndicator: (areaId: string, text: string) => void
  onSaveIndicatorText: (id: string, text: string, hint: string) => void
  onMoveIndicator: (id: string, dir: 'up' | 'down') => void
  onToggleIndicatorActive: (id: string, active: boolean) => void
}

export function AreaEditor(p: Props) {
  const [name, setName] = useState(p.area.name)
  const [newInd, setNewInd] = useState('')
  const inds = [...p.indicators].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <section style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12, opacity: p.area.active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input aria-label="area name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, fontWeight: 600 }} />
        {name !== p.area.name && <button onClick={() => p.onRenameArea(p.area.id, name.trim())} disabled={!name.trim()}>Save</button>}
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={p.area.gardenOnly} onChange={e => p.onToggleGarden(p.area.id, e.target.checked)} /> garden-only
        </label>
        <button aria-label="move area up" onClick={() => p.onMoveArea(p.area.id, 'up')}>↑</button>
        <button aria-label="move area down" onClick={() => p.onMoveArea(p.area.id, 'down')}>↓</button>
        <button onClick={() => p.onToggleAreaActive(p.area.id, !p.area.active)}>{p.area.active ? 'Retire' : 'Restore'}</button>
      </div>
      {inds.map(i => (
        <IndicatorEditor key={i.id} indicator={i}
          onSaveText={p.onSaveIndicatorText} onMove={p.onMoveIndicator} onToggleActive={p.onToggleIndicatorActive} />
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input aria-label="new indicator" value={newInd} onChange={e => setNewInd(e.target.value)} placeholder="New indicator…" style={{ flex: 1 }} />
        <button className="primary" disabled={!newInd.trim()}
          onClick={() => { if (newInd.trim()) { p.onAddIndicator(p.area.id, newInd.trim()); setNewInd('') } }}>Add</button>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- AreaEditor`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/components/IndicatorEditor.tsx amava-me/src/components/AreaEditor.tsx amava-me/src/components/AreaEditor.test.tsx
git commit -m "feat: AreaEditor + IndicatorEditor config components"
```

---

## Task 7: ScaleEditor + ThresholdEditor components (TDD on ThresholdEditor)

**Files:**
- Create: `amava-me/src/components/ScaleEditor.tsx`, `amava-me/src/components/ThresholdEditor.tsx`
- Test: `amava-me/src/components/ThresholdEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/ThresholdEditor.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThresholdEditor } from './ThresholdEditor'

describe('ThresholdEditor', () => {
  it('saves a valid threshold', async () => {
    const onSave = vi.fn()
    render(<ThresholdEditor scaleMax={4} value={1} onSave={onSave} />)
    await userEvent.click(screen.getByRole('button', { name: /Save/ }))
    expect(onSave).toHaveBeenCalledWith(1)
  })
  it('blocks saving an out-of-range threshold and shows an error', async () => {
    const onSave = vi.fn()
    render(<ThresholdEditor scaleMax={4} value={1} onSave={onSave} />)
    const input = screen.getByLabelText('improved threshold')
    await userEvent.clear(input)
    await userEvent.type(input, '9')
    expect(screen.getByText(/between 1 and 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ThresholdEditor`
Expected: FAIL — "Cannot find module './ThresholdEditor'".

- [ ] **Step 3: Implement ThresholdEditor**

Create `amava-me/src/components/ThresholdEditor.tsx`:
```tsx
import { useState } from 'react'
import { validateThreshold } from '../domain/config-logic'

interface Props { scaleMax: number; value: number; onSave: (n: number) => void }

export function ThresholdEditor({ scaleMax, value, onSave }: Props) {
  const [n, setN] = useState(String(value))
  const num = Number(n)
  const err = n.trim() === '' ? 'Enter a number.' : validateThreshold(num, scaleMax)
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        A child counts as “improved” when their latest score rises by at least this many points versus baseline.
      </p>
      <input aria-label="improved threshold" type="number" min={1} max={scaleMax - 1} value={n} onChange={e => setN(e.target.value)} />
      {err && <span style={{ color: 'var(--terracotta)', marginLeft: 8 }}>{err}</span>}
      <button className="primary" style={{ marginLeft: 8 }} disabled={!!err} onClick={() => onSave(num)}>Save</button>
    </div>
  )
}
```

- [ ] **Step 4: Implement ScaleEditor**

Create `amava-me/src/components/ScaleEditor.tsx`:
```tsx
import { useState } from 'react'
import type { Programme } from '../domain/types'
import { validateScale } from '../domain/config-logic'

interface Props {
  scaleMax: number
  descriptors: Programme['scaleDescriptors']
  hasData: boolean
  onSave: (scaleMax: number, descriptors: Programme['scaleDescriptors']) => void
}

export function ScaleEditor({ descriptors, hasData, onSave }: Props) {
  const [points, setPoints] = useState(descriptors)
  const update = (i: number, field: 'label' | 'description', v: string) =>
    setPoints(ps => ps.map((p, idx) => (idx === i ? { ...p, [field]: v } : p)))
  const addPoint = () => setPoints(ps => [...ps, { value: ps.length + 1, label: '', description: '' }])
  const removeLast = () => setPoints(ps => ps.slice(0, -1))
  const normalised = points.map((p, i) => ({ ...p, value: i + 1 }))
  const err = validateScale(normalised.length, normalised)
  return (
    <div>
      {hasData && (
        <p style={{ color: 'var(--terracotta)' }}>
          ⚠ Assessments already exist. Changing the scale affects future assessments only — past scores keep their original scale, so comparisons across the change may be harder to read.
        </p>
      )}
      {points.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <strong style={{ width: 20 }}>{i + 1}</strong>
          <input aria-label={`point ${i + 1} label`} value={p.label} onChange={e => update(i, 'label', e.target.value)} placeholder="label" />
          <input aria-label={`point ${i + 1} description`} value={p.description} onChange={e => update(i, 'description', e.target.value)} placeholder="description" style={{ flex: 1 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <button onClick={addPoint} disabled={points.length >= 10}>Add point</button>
        <button onClick={removeLast} disabled={points.length <= 2}>Remove last</button>
      </div>
      {err && <span style={{ color: 'var(--terracotta)' }}>{err}</span>}
      <button className="primary" style={{ marginLeft: 8 }} disabled={!!err} onClick={() => onSave(normalised.length, normalised)}>Save scale</button>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ThresholdEditor`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/components/ScaleEditor.tsx amava-me/src/components/ThresholdEditor.tsx amava-me/src/components/ThresholdEditor.test.tsx
git commit -m "feat: ScaleEditor + ThresholdEditor config components"
```

---

## Task 8: SettingsScreen + route + Home link

**Files:**
- Create: `amava-me/src/screens/SettingsScreen.tsx`
- Modify: `amava-me/src/App.tsx`, `amava-me/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Implement SettingsScreen**

Create `amava-me/src/screens/SettingsScreen.tsx`:
```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useOnlineStatus } from '../hooks/use-online-status'
import { configClient } from '../data/config-client'
import { reorder } from '../domain/config-logic'
import { AreaEditor } from '../components/AreaEditor'
import { ScaleEditor } from '../components/ScaleEditor'
import { ThresholdEditor } from '../components/ThresholdEditor'

export function SettingsScreen() {
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  if (me?.role !== 'coordinator') return <Navigate to="/" replace />
  if (!online) {
    return <div className="container"><h1>Settings</h1><p>Editing settings needs an internet connection. Reconnect and try again.</p></div>
  }

  const programme = ref.programmes[0]
  const areas = ref.areas.filter(a => a.programmeId === programme?.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const indicatorsFor = (areaId: string) => ref.indicators.filter(i => i.areaId === areaId)
  const run = async (p: Promise<void>) => { await p; await refresh() }

  return (
    <div className="container">
      <h1>Settings</h1>

      <h2>Areas &amp; indicators</h2>
      {areas.map(area => (
        <AreaEditor key={area.id} area={area} indicators={indicatorsFor(area.id)}
          onRenameArea={(id, name) => run(configClient.updateArea(id, { name }))}
          onToggleGarden={(id, gardenOnly) => run(configClient.updateArea(id, { gardenOnly }))}
          onMoveArea={(id, dir) => run(configClient.reorderRows('development_area', reorder(areas, id, dir)))}
          onToggleAreaActive={(id, active) => run(configClient.setActive('development_area', id, active))}
          onAddIndicator={(areaId, text) => run(configClient.addIndicator(areaId, text, indicatorsFor(areaId).length + 1))}
          onSaveIndicatorText={(id, text, hint) => run(configClient.updateIndicator(id, { text, hint: hint || null }))}
          onMoveIndicator={(id, dir) => run(configClient.reorderRows('indicator', reorder(indicatorsFor(area.id), id, dir)))}
          onToggleIndicatorActive={(id, active) => run(configClient.setActive('indicator', id, active))}
        />
      ))}
      {programme && (
        <button className="primary" onClick={() => run(configClient.addArea(programme.id, 'New area', false, areas.length + 1))}>
          Add area
        </button>
      )}

      {programme && (
        <>
          <h2 style={{ marginTop: 24 }}>Rating scale</h2>
          <ScaleEditor scaleMax={programme.scaleMax} descriptors={programme.scaleDescriptors} hasData={hasAssessments}
            onSave={(max, desc) => run(configClient.updateScale(programme.id, max, desc))} />

          <h2 style={{ marginTop: 24 }}>Improved threshold</h2>
          <ThresholdEditor scaleMax={programme.scaleMax} value={programme.improvedThreshold ?? 1}
            onSave={n => run(configClient.setThreshold(programme.id, n))} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the /settings route**

In `amava-me/src/App.tsx`, add the import:
```tsx
import { SettingsScreen } from './screens/SettingsScreen'
```
and the route inside `<Routes>`:
```tsx
      <Route path="/settings" element={<RequireAuth><AppServicesProvider><SettingsScreen /></AppServicesProvider></RequireAuth>} />
```

- [ ] **Step 3: Add a coordinator-only Settings link on Home**

In `amava-me/src/screens/HomeScreen.tsx`, the component already finds `me` (the facilitator) and has `Link` imported. Add this just after the existing "View reports" link line:
```tsx
      {me?.role === 'coordinator' && <p className="no-print"><Link to="/settings">Settings (edit indicators &amp; scale) →</Link></p>}
```
If `me` is not already computed in HomeScreen, it is — `const me = ref.facilitators.find(f => f.id === session?.user.id)` exists there from M1. Use it.

- [ ] **Step 4: Run the full suite + build**

Run: `npm run test`
Expected: ALL suites pass (M1 + M2 + config-logic + AreaEditor + ThresholdEditor).
Run: `npm run build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/screens/SettingsScreen.tsx amava-me/src/App.tsx amava-me/src/screens/HomeScreen.tsx
git commit -m "feat: SettingsScreen (areas/indicators/scale/threshold) + route + Home link"
```

- [ ] **Step 6: Live verification (after migration 0002 applied)**

With `0002_config_write.sql` applied to the live project, sign in as the coordinator, open Settings, and confirm: reword an indicator → saves; retire → it greys and disappears from a new report after refresh; add an indicator; change the threshold → a report's "improved" counts shift accordingly. Confirm a facilitator login is redirected away from `/settings`.

---

## Self-Review

**Spec coverage:**
- Coordinator-only Settings, online-only → Task 8 (role + online guards) ✓
- Schema: coordinator write RLS + `improved_threshold` → Task 1 ✓
- Editable threshold flows into reports → Task 2 ✓
- Areas/indicators add/rename/reword/hint/reorder/retire/restore + garden-only toggle → Tasks 6, 8 ✓
- Scale editor (points + descriptors) with warning when data exists → Task 7 (`hasData`), Task 5 (`hasAssessments`) ✓
- Threshold editor with validation → Task 7 ✓
- Retire-not-delete; reword in place; reorder via sort_order → Tasks 4 (`setActive`, `reorderRows`, updates), 3 (`reorder`) ✓
- Pure logic TDD'd → Task 3 ✓
- Facilitator cannot edit (UI redirect + RLS) → Task 8 + Task 1 ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `ConfigClient` (Task 4) methods match `SettingsScreen` call sites (Task 8) and `reorder`'s return shape `{id, sortOrder}[]` (Task 3) feeds `reorderRows` (Task 4). `ScalePoint` defined in Task 3 is imported by Task 4 and matches `Programme['scaleDescriptors']` element shape (`{value,label,description}`). `Programme.improvedThreshold?` (Task 2) read in Task 8 + reports. AreaEditor/IndicatorEditor prop names match between Tasks 6 and 8. `useConfigData` returns `{ref, refresh, hasAssessments}` (Task 5) used in Task 8. ✓

**Note:** `Programme.improvedThreshold` is optional, so existing M1/M2 Programme fixtures (e.g. AssessmentFlow test) still compile unchanged.
