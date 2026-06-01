# Milestone 1 — Offline Capture (Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A lead facilitator can sign in, open a child in their class, and record a Baseline or Quarterly assessment (1–4 per indicator, notes, co-facilitators) **fully offline on a phone**, with the assessment queued on-device and synced automatically when back online.

**Architecture:** React + TypeScript PWA (Vite). All persistence goes through a `DataStore` interface. Two implementations exist: a Dexie/IndexedDB local store (cached reference data + a pending-assessment queue) and a `SyncClient` that talks to Supabase. Sync logic and UI are unit-tested against an in-memory fake `SyncClient`, so the whole milestone is buildable and testable before any cloud account exists. The real Supabase adapter is a thin wrapper wired in at the end.

**Tech Stack:** Vite, React, TypeScript, react-router-dom, Dexie (IndexedDB), @supabase/supabase-js, TanStack Query, Vitest + @testing-library/react + fake-indexeddb, vite-plugin-pwa (Workbox).

---

## File Structure

```
amava-me/
  index.html
  vite.config.ts                 # Vite + PWA + Vitest config
  package.json
  src/
    main.tsx                     # App entry, router, providers
    App.tsx                      # Route definitions + guard
    styles/
      tokens.css                 # Brand palette + font variables
      base.css                   # Resets + base element styles
    domain/
      types.ts                   # All domain TypeScript types
      assessment-logic.ts        # Pure functions: due status, change calc
      assessment-logic.test.ts
    data/
      datastore.ts               # DataStore + SyncClient interfaces
      local-store.ts             # Dexie implementation (cache + queue)
      local-store.test.ts
      fake-sync-client.ts        # In-memory SyncClient for tests/dev
      supabase-sync-client.ts    # Real Supabase adapter
      sync-engine.ts             # Flush queue + pull reference data
      sync-engine.test.ts
    auth/
      auth-context.tsx           # Session provider (Supabase auth)
      require-auth.tsx           # Route guard
    hooks/
      use-reference-data.ts      # Load + cache programmes/classes/children/config
      use-online-status.ts       # navigator.onLine + events
      use-sync-status.ts         # Pending count + last-sync state
    screens/
      LoginScreen.tsx
      HomeScreen.tsx             # Facilitator's classes + children + due badges
      ChildListScreen.tsx
      AssessmentFlow.tsx         # Multi-step capture
      AssessmentFlow.test.tsx
    components/
      ScaleSelector.tsx          # 1–4 tap buttons with descriptor
      SyncBadge.tsx              # "N waiting to sync"
      AreaStep.tsx               # One development area's indicators
  supabase/
    migrations/0001_init.sql     # Schema
    seed.sql                     # After-school programme + areas/indicators + sample data
  .env.example
```

---

## Task 1: Scaffold project + test tooling

**Files:**
- Create: `amava-me/` (Vite project), `amava-me/vite.config.ts`, `amava-me/package.json`

- [ ] **Step 1: Create the Vite React-TS app**

Run from the repo root:
```bash
npm create vite@latest amava-me -- --template react-ts
cd amava-me
npm install
```

- [ ] **Step 2: Add runtime + dev dependencies**

```bash
npm install react-router-dom @supabase/supabase-js @tanstack/react-query dexie
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb vite-plugin-pwa
```

- [ ] **Step 3: Configure Vite for Vitest + PWA**

Replace `amava-me/vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Amava M&E',
        short_name: 'Amava M&E',
        theme_color: '#687F8B',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: Add test setup file**

Create `amava-me/src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

- [ ] **Step 5: Add test script**

In `amava-me/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify dev server and test runner work**

Run: `npm run dev` — Expected: Vite serves on localhost without errors (Ctrl-C to stop).
Run: `npm run test` — Expected: "No test files found" (exit 0) — tooling is wired.

- [ ] **Step 7: Commit**

```bash
git add amava-me
git commit -m "chore: scaffold Vite React-TS PWA with Vitest"
```

---

## Task 2: Domain types

**Files:**
- Create: `amava-me/src/domain/types.ts`

- [ ] **Step 1: Write the domain types**

Create `amava-me/src/domain/types.ts`:
```ts
export type Role = 'facilitator' | 'coordinator'
export type AssessmentType = 'baseline' | 'quarterly'
export type SyncState = 'pending' | 'synced'

export interface Programme {
  id: string
  name: string
  scaleMax: number
  scaleDescriptors: { value: number; label: string; description: string }[]
  active: boolean
}

export interface DevelopmentArea {
  id: string
  programmeId: string
  name: string
  sortOrder: number
  /** When true this area only shows for classes with hasGardenComponent. */
  gardenOnly: boolean
  active: boolean
}

export interface Indicator {
  id: string
  areaId: string
  text: string
  hint: string | null
  sortOrder: number
  active: boolean
}

export interface ClassGroup {
  id: string
  programmeId: string
  name: string
  hasGardenComponent: boolean
  active: boolean
}

export interface Child {
  id: string
  classId: string
  firstName: string
  surname: string
  /** Extra demographic fields are config-driven; stored as a bag. */
  fields: Record<string, string>
  dateStarted: string // ISO date
  isSample: boolean
  active: boolean
}

export interface Facilitator {
  id: string
  name: string
  role: Role
  classIds: string[]
}

export interface ScoreEntry {
  indicatorId: string
  /** Snapshot of indicator text at scoring time, for history integrity. */
  indicatorText: string
  score: number
}

export interface ObservationEntry {
  areaId: string | null
  note: string
}

export interface Assessment {
  id: string
  childId: string
  type: AssessmentType
  date: string // ISO date
  assessedBy: string // facilitator id
  coAssessors: string
  /** Snapshot of the scale max in force when this was taken. */
  scaleMax: number
  scores: ScoreEntry[]
  observations: ObservationEntry[]
  syncState: SyncState
}

/** Everything a facilitator needs cached to assess offline. */
export interface ReferenceData {
  programmes: Programme[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  classes: ClassGroup[]
  children: Child[]
  facilitators: Facilitator[]
  fetchedAt: string
}
```

- [ ] **Step 2: Commit**

```bash
git add amava-me/src/domain/types.ts
git commit -m "feat: add domain types"
```

---

## Task 3: Assessment logic (pure functions, TDD)

**Files:**
- Create: `amava-me/src/domain/assessment-logic.ts`
- Test: `amava-me/src/domain/assessment-logic.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/domain/assessment-logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  nextAssessmentType,
  indicatorChange,
  classifyChange,
  visibleAreas,
} from './assessment-logic'
import type { Assessment, DevelopmentArea, ClassGroup } from './types'

const mkAssessment = (over: Partial<Assessment>): Assessment => ({
  id: 'a', childId: 'c', type: 'baseline', date: '2026-01-01',
  assessedBy: 'f', coAssessors: '', scaleMax: 4, scores: [], observations: [],
  syncState: 'synced', ...over,
})

describe('nextAssessmentType', () => {
  it('returns baseline when the child has no assessments', () => {
    expect(nextAssessmentType([])).toBe('baseline')
  })
  it('returns quarterly once a baseline exists', () => {
    expect(nextAssessmentType([mkAssessment({ type: 'baseline' })])).toBe('quarterly')
  })
})

describe('indicatorChange', () => {
  it('is latest minus baseline for an indicator', () => {
    const baseline = mkAssessment({
      type: 'baseline',
      scores: [{ indicatorId: 'i1', indicatorText: 'x', score: 2 }],
    })
    const latest = mkAssessment({
      type: 'quarterly', date: '2026-04-01',
      scores: [{ indicatorId: 'i1', indicatorText: 'x', score: 4 }],
    })
    expect(indicatorChange([baseline, latest], 'i1')).toBe(2)
  })
  it('returns null when no baseline score exists for the indicator', () => {
    const baseline = mkAssessment({ type: 'baseline', scores: [] })
    expect(indicatorChange([baseline], 'i1')).toBeNull()
  })
})

describe('classifyChange', () => {
  it('classifies improvement at or above the threshold', () => {
    expect(classifyChange(1, 1)).toBe('improved')
    expect(classifyChange(2, 1)).toBe('improved')
  })
  it('classifies zero as stable and negative as declined', () => {
    expect(classifyChange(0, 1)).toBe('stable')
    expect(classifyChange(-1, 1)).toBe('declined')
  })
})

describe('visibleAreas', () => {
  const areas: DevelopmentArea[] = [
    { id: 'g', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true },
    { id: 'n', programmeId: 'p', name: 'Garden', sortOrder: 5, gardenOnly: true, active: true },
    { id: 'x', programmeId: 'p', name: 'Old', sortOrder: 2, gardenOnly: false, active: false },
  ]
  it('hides garden-only areas for non-garden classes and inactive areas always', () => {
    const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'A', hasGardenComponent: false, active: true }
    expect(visibleAreas(areas, cls).map(a => a.id)).toEqual(['g'])
  })
  it('includes garden-only areas for garden classes, sorted', () => {
    const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'A', hasGardenComponent: true, active: true }
    expect(visibleAreas(areas, cls).map(a => a.id)).toEqual(['g', 'n'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- assessment-logic`
Expected: FAIL — "Cannot find module './assessment-logic'".

- [ ] **Step 3: Implement the logic**

Create `amava-me/src/domain/assessment-logic.ts`:
```ts
import type { Assessment, AssessmentType, DevelopmentArea, ClassGroup } from './types'

export function nextAssessmentType(history: Assessment[]): AssessmentType {
  return history.some(a => a.type === 'baseline') ? 'quarterly' : 'baseline'
}

function scoreFor(a: Assessment | undefined, indicatorId: string): number | null {
  const s = a?.scores.find(s => s.indicatorId === indicatorId)
  return s ? s.score : null
}

/** latest score minus baseline score for an indicator; null if either missing. */
export function indicatorChange(history: Assessment[], indicatorId: string): number | null {
  const baseline = history.find(a => a.type === 'baseline')
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const base = scoreFor(baseline, indicatorId)
  const last = scoreFor(latest, indicatorId)
  if (base === null || last === null) return null
  return last - base
}

export type ChangeClass = 'improved' | 'stable' | 'declined'

export function classifyChange(change: number, improvedThreshold: number): ChangeClass {
  if (change >= improvedThreshold) return 'improved'
  if (change < 0) return 'declined'
  return 'stable'
}

/** Active areas applicable to a class, sorted; garden-only areas hidden for non-garden classes. */
export function visibleAreas(areas: DevelopmentArea[], cls: ClassGroup): DevelopmentArea[] {
  return areas
    .filter(a => a.active)
    .filter(a => !a.gardenOnly || cls.hasGardenComponent)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- assessment-logic`
Expected: PASS (4 suites, 8 tests).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain
git commit -m "feat: assessment due/change/visibility logic with tests"
```

---

## Task 4: DataStore + SyncClient interfaces

**Files:**
- Create: `amava-me/src/data/datastore.ts`

- [ ] **Step 1: Define the interfaces**

Create `amava-me/src/data/datastore.ts`:
```ts
import type { Assessment, ReferenceData } from '../domain/types'

/** On-device cache + pending-assessment queue. */
export interface LocalStore {
  saveReferenceData(data: ReferenceData): Promise<void>
  getReferenceData(): Promise<ReferenceData | null>
  /** Queue an assessment captured offline. */
  enqueueAssessment(a: Assessment): Promise<void>
  getPendingAssessments(): Promise<Assessment[]>
  markSynced(id: string): Promise<void>
  /** All assessments (pending + synced) for a child, for history views. */
  getAssessmentsForChild(childId: string): Promise<Assessment[]>
  saveSyncedAssessments(list: Assessment[]): Promise<void>
}

/** Remote source of truth (Supabase in production, fake in tests). */
export interface SyncClient {
  fetchReferenceData(): Promise<ReferenceData>
  fetchAssessmentsForFacilitator(): Promise<Assessment[]>
  pushAssessment(a: Assessment): Promise<void>
}
```

- [ ] **Step 2: Commit**

```bash
git add amava-me/src/data/datastore.ts
git commit -m "feat: define LocalStore and SyncClient interfaces"
```

---

## Task 5: Dexie local store (TDD)

**Files:**
- Create: `amava-me/src/data/local-store.ts`
- Test: `amava-me/src/data/local-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/data/local-store.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { DexieLocalStore } from './local-store'
import type { Assessment, ReferenceData } from '../domain/types'

const emptyRef: ReferenceData = {
  programmes: [], areas: [], indicators: [], classes: [],
  children: [], facilitators: [], fetchedAt: '2026-01-01T00:00:00Z',
}
const mkAssessment = (id: string, childId: string): Assessment => ({
  id, childId, type: 'baseline', date: '2026-01-01', assessedBy: 'f',
  coAssessors: '', scaleMax: 4, scores: [], observations: [], syncState: 'pending',
})

describe('DexieLocalStore', () => {
  let store: DexieLocalStore
  beforeEach(async () => {
    store = new DexieLocalStore(`test-${Math.floor(performance.now())}`)
    await store.clear()
  })

  it('round-trips reference data', async () => {
    await store.saveReferenceData({ ...emptyRef, fetchedAt: '2026-02-02T00:00:00Z' })
    const got = await store.getReferenceData()
    expect(got?.fetchedAt).toBe('2026-02-02T00:00:00Z')
  })

  it('enqueues and lists pending assessments', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    const pending = await store.getPendingAssessments()
    expect(pending.map(a => a.id)).toEqual(['a1'])
  })

  it('markSynced removes an item from the pending list', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    await store.markSynced('a1')
    expect(await store.getPendingAssessments()).toEqual([])
  })

  it('returns all assessments for a child', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    await store.saveSyncedAssessments([{ ...mkAssessment('a2', 'c1'), syncState: 'synced' }])
    const list = await store.getAssessmentsForChild('c1')
    expect(list.map(a => a.id).sort()).toEqual(['a1', 'a2'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- local-store`
Expected: FAIL — "Cannot find module './local-store'".

- [ ] **Step 3: Implement the Dexie store**

Create `amava-me/src/data/local-store.ts`:
```ts
import Dexie, { type Table } from 'dexie'
import type { Assessment, ReferenceData } from '../domain/types'
import type { LocalStore } from './datastore'

interface RefRow { key: 'current'; data: ReferenceData }

export class DexieLocalStore extends Dexie implements LocalStore {
  private reference!: Table<RefRow, string>
  private assessments!: Table<Assessment, string>

  constructor(name = 'amava-me') {
    super(name)
    this.version(1).stores({
      reference: 'key',
      assessments: 'id, childId, syncState',
    })
  }

  async clear(): Promise<void> {
    await this.reference.clear()
    await this.assessments.clear()
  }

  async saveReferenceData(data: ReferenceData): Promise<void> {
    await this.reference.put({ key: 'current', data })
  }

  async getReferenceData(): Promise<ReferenceData | null> {
    const row = await this.reference.get('current')
    return row ? row.data : null
  }

  async enqueueAssessment(a: Assessment): Promise<void> {
    await this.assessments.put({ ...a, syncState: 'pending' })
  }

  async getPendingAssessments(): Promise<Assessment[]> {
    return this.assessments.where('syncState').equals('pending').toArray()
  }

  async markSynced(id: string): Promise<void> {
    await this.assessments.update(id, { syncState: 'synced' })
  }

  async getAssessmentsForChild(childId: string): Promise<Assessment[]> {
    return this.assessments.where('childId').equals(childId).toArray()
  }

  async saveSyncedAssessments(list: Assessment[]): Promise<void> {
    await this.assessments.bulkPut(list.map(a => ({ ...a, syncState: 'synced' as const })))
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- local-store`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/data/local-store.ts amava-me/src/data/local-store.test.ts
git commit -m "feat: Dexie local store for cache + offline queue"
```

---

## Task 6: Fake SyncClient (for tests + offline dev)

**Files:**
- Create: `amava-me/src/data/fake-sync-client.ts`

- [ ] **Step 1: Implement the in-memory fake**

Create `amava-me/src/data/fake-sync-client.ts`:
```ts
import type { Assessment, ReferenceData } from '../domain/types'
import type { SyncClient } from './datastore'

/** In-memory SyncClient: lets the whole app run + be tested with no backend. */
export class FakeSyncClient implements SyncClient {
  pushed: Assessment[] = []
  constructor(
    private reference: ReferenceData,
    private existing: Assessment[] = [],
  ) {}

  async fetchReferenceData(): Promise<ReferenceData> {
    return this.reference
  }
  async fetchAssessmentsForFacilitator(): Promise<Assessment[]> {
    return [...this.existing, ...this.pushed]
  }
  async pushAssessment(a: Assessment): Promise<void> {
    this.pushed.push({ ...a, syncState: 'synced' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add amava-me/src/data/fake-sync-client.ts
git commit -m "feat: in-memory fake SyncClient for tests and offline dev"
```

---

## Task 7: Sync engine (TDD)

**Files:**
- Create: `amava-me/src/data/sync-engine.ts`
- Test: `amava-me/src/data/sync-engine.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/data/sync-engine.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SyncEngine } from './sync-engine'
import { DexieLocalStore } from './local-store'
import { FakeSyncClient } from './fake-sync-client'
import type { Assessment, ReferenceData } from '../domain/types'

const ref: ReferenceData = {
  programmes: [], areas: [], indicators: [], classes: [],
  children: [], facilitators: [], fetchedAt: '2026-03-03T00:00:00Z',
}
const mkAssessment = (id: string): Assessment => ({
  id, childId: 'c1', type: 'baseline', date: '2026-01-01', assessedBy: 'f',
  coAssessors: '', scaleMax: 4, scores: [], observations: [], syncState: 'pending',
})

describe('SyncEngine', () => {
  let store: DexieLocalStore
  beforeEach(async () => {
    store = new DexieLocalStore(`sync-${Math.floor(performance.now())}`)
    await store.clear()
  })

  it('pull caches reference data and synced assessments locally', async () => {
    const client = new FakeSyncClient(ref, [{ ...mkAssessment('a1'), syncState: 'synced' }])
    const engine = new SyncEngine(store, client)
    await engine.pull()
    expect((await store.getReferenceData())?.fetchedAt).toBe('2026-03-03T00:00:00Z')
    expect((await store.getAssessmentsForChild('c1')).map(a => a.id)).toEqual(['a1'])
  })

  it('push flushes pending assessments to the client and marks them synced', async () => {
    const client = new FakeSyncClient(ref)
    const engine = new SyncEngine(store, client)
    await store.enqueueAssessment(mkAssessment('a1'))
    const count = await engine.push()
    expect(count).toBe(1)
    expect(client.pushed.map(a => a.id)).toEqual(['a1'])
    expect(await store.getPendingAssessments()).toEqual([])
  })

  it('push leaves the item pending if the client throws', async () => {
    const client = new FakeSyncClient(ref)
    client.pushAssessment = async () => { throw new Error('offline') }
    const engine = new SyncEngine(store, client)
    await store.enqueueAssessment(mkAssessment('a1'))
    const count = await engine.push()
    expect(count).toBe(0)
    expect((await store.getPendingAssessments()).map(a => a.id)).toEqual(['a1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- sync-engine`
Expected: FAIL — "Cannot find module './sync-engine'".

- [ ] **Step 3: Implement the sync engine**

Create `amava-me/src/data/sync-engine.ts`:
```ts
import type { LocalStore, SyncClient } from './datastore'

export class SyncEngine {
  constructor(private store: LocalStore, private client: SyncClient) {}

  /** Pull reference data + this facilitator's assessments into the local cache. */
  async pull(): Promise<void> {
    const [ref, assessments] = await Promise.all([
      this.client.fetchReferenceData(),
      this.client.fetchAssessmentsForFacilitator(),
    ])
    await this.store.saveReferenceData(ref)
    await this.store.saveSyncedAssessments(assessments)
  }

  /** Flush queued assessments. Returns how many synced. Failures stay pending. */
  async push(): Promise<number> {
    const pending = await this.store.getPendingAssessments()
    let synced = 0
    for (const a of pending) {
      try {
        await this.client.pushAssessment(a)
        await this.store.markSynced(a.id)
        synced++
      } catch {
        // leave pending; will retry on next sync
      }
    }
    return synced
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- sync-engine`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/data/sync-engine.ts amava-me/src/data/sync-engine.test.ts
git commit -m "feat: sync engine (pull cache, push queue with retry)"
```

---

## Task 8: Brand tokens + base styles

**Files:**
- Create: `amava-me/src/styles/tokens.css`, `amava-me/src/styles/base.css`

- [ ] **Step 1: Write the design tokens**

Create `amava-me/src/styles/tokens.css`:
```css
:root {
  /* Amava 2022 palette */
  --slate: #687F8B;
  --teal: #97D7D9;
  --sand: #E5BF7A;
  --green: #C4E2B7;
  --sage: #9CA297;
  --terracotta: #DD866C;

  --bg: #ffffff;
  --text: #2b3338;
  --muted: #6b7780;
  --primary: var(--slate);
  --accent: var(--terracotta);

  --radius: 12px;
  --tap-min: 48px; /* phone-friendly minimum tap target */
  --font-display: 'Cavorting', system-ui, sans-serif;
  --font-body: 'Minion Pro', Georgia, serif;
}
```

- [ ] **Step 2: Write base styles**

Create `amava-me/src/styles/base.css`:
```css
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text);
  background: var(--bg);
}
h1, h2, h3 { font-family: var(--font-display); color: var(--primary); }
button {
  min-height: var(--tap-min);
  border-radius: var(--radius);
  border: 1px solid var(--sage);
  background: #fff;
  font: inherit;
  cursor: pointer;
}
button.primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.container { max-width: 640px; margin: 0 auto; padding: 16px; }
```

- [ ] **Step 3: Import tokens in entry (placeholder import, wired in Task 12)**

No test. Visual styling is verified manually in Task 13's smoke test.

- [ ] **Step 4: Commit**

```bash
git add amava-me/src/styles
git commit -m "style: brand design tokens and base styles"
```

---

## Task 9: ScaleSelector + AreaStep components

**Files:**
- Create: `amava-me/src/components/ScaleSelector.tsx`, `amava-me/src/components/AreaStep.tsx`
- Test: `amava-me/src/components/ScaleSelector.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/ScaleSelector.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScaleSelector } from './ScaleSelector'

const descriptors = [
  { value: 1, label: 'Emerging', description: 'rarely observed' },
  { value: 2, label: 'Developing', description: 'inconsistent' },
  { value: 3, label: 'Consistent', description: 'most of the time' },
  { value: 4, label: 'Strong', description: 'independently' },
]

describe('ScaleSelector', () => {
  it('renders one button per scale point with its label', () => {
    render(<ScaleSelector descriptors={descriptors} value={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /Emerging/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Strong/ })).toBeInTheDocument()
  })
  it('calls onChange with the chosen value', async () => {
    const onChange = vi.fn()
    render(<ScaleSelector descriptors={descriptors} value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Strong/ }))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ScaleSelector`
Expected: FAIL — "Cannot find module './ScaleSelector'".

- [ ] **Step 3: Implement ScaleSelector**

Create `amava-me/src/components/ScaleSelector.tsx`:
```tsx
import type { Programme } from '../domain/types'

interface Props {
  descriptors: Programme['scaleDescriptors']
  value: number | null
  onChange: (value: number) => void
}

export function ScaleSelector({ descriptors, value, onChange }: Props) {
  return (
    <div role="group" style={{ display: 'grid', gap: 8 }}>
      {descriptors.map(d => (
        <button
          key={d.value}
          type="button"
          className={value === d.value ? 'primary' : ''}
          aria-pressed={value === d.value}
          onClick={() => onChange(d.value)}
        >
          <strong>{d.value} · {d.label}</strong>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{d.description}</div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement AreaStep (uses ScaleSelector per indicator)**

Create `amava-me/src/components/AreaStep.tsx`:
```tsx
import type { DevelopmentArea, Indicator, Programme } from '../domain/types'
import { ScaleSelector } from './ScaleSelector'

interface Props {
  area: DevelopmentArea
  indicators: Indicator[]
  descriptors: Programme['scaleDescriptors']
  scores: Record<string, number>
  note: string
  onScore: (indicatorId: string, value: number) => void
  onNote: (note: string) => void
}

export function AreaStep({ area, indicators, descriptors, scores, note, onScore, onNote }: Props) {
  return (
    <section>
      <h2>{area.name}</h2>
      {indicators.map(ind => (
        <div key={ind.id} style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 600 }}>{ind.text}</p>
          {ind.hint && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{ind.hint}</p>}
          <ScaleSelector
            descriptors={descriptors}
            value={scores[ind.id] ?? null}
            onChange={v => onScore(ind.id, v)}
          />
        </div>
      ))}
      <label style={{ display: 'block', marginTop: 12 }}>
        Observations (optional)
        <textarea
          value={note}
          onChange={e => onNote(e.target.value)}
          rows={3}
          style={{ width: '100%', font: 'inherit' }}
        />
      </label>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ScaleSelector`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/components
git commit -m "feat: ScaleSelector and AreaStep capture components"
```

---

## Task 10: AssessmentFlow screen (TDD)

**Files:**
- Create: `amava-me/src/screens/AssessmentFlow.tsx`
- Test: `amava-me/src/screens/AssessmentFlow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/screens/AssessmentFlow.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessmentFlow } from './AssessmentFlow'
import type { Programme, DevelopmentArea, Indicator, ClassGroup, Child } from '../domain/types'

const programme: Programme = {
  id: 'p', name: 'After-school', scaleMax: 4, active: true,
  scaleDescriptors: [
    { value: 1, label: 'Emerging', description: '' },
    { value: 2, label: 'Developing', description: '' },
    { value: 3, label: 'Consistent', description: '' },
    { value: 4, label: 'Strong', description: '' },
  ],
}
const areas: DevelopmentArea[] = [
  { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true },
]
const indicators: Indicator[] = [
  { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
]
const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'Class A', hasGardenComponent: false, active: true }
const child: Child = {
  id: 'ch', classId: 'c', firstName: 'Lebo', surname: 'M', fields: {},
  dateStarted: '2026-01-01', isSample: true, active: true,
}

describe('AssessmentFlow', () => {
  it('captures scores and submits a baseline assessment with a scaleMax snapshot', async () => {
    const onSubmit = vi.fn()
    render(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Strong/ }))
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted).toMatchObject({
      childId: 'ch', type: 'baseline', assessedBy: 'f1',
      date: '2026-02-01', scaleMax: 4, syncState: 'pending',
    })
    expect(submitted.scores).toEqual([{ indicatorId: 'i1', indicatorText: 'Listens', score: 4 }])
  })

  it('blocks saving until every visible indicator is scored', async () => {
    const onSubmit = vi.fn()
    render(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/score every indicator/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AssessmentFlow`
Expected: FAIL — "Cannot find module './AssessmentFlow'".

- [ ] **Step 3: Implement AssessmentFlow**

Create `amava-me/src/screens/AssessmentFlow.tsx`:
```tsx
import { useState } from 'react'
import type {
  Assessment, AssessmentType, Child, ClassGroup, DevelopmentArea, Indicator, Programme,
} from '../domain/types'
import { visibleAreas } from '../domain/assessment-logic'
import { AreaStep } from '../components/AreaStep'

interface Props {
  programme: Programme
  areas: DevelopmentArea[]
  indicators: Indicator[]
  cls: ClassGroup
  child: Child
  type: AssessmentType
  facilitatorId: string
  today: string
  onSubmit: (a: Assessment) => void
  onCancel: () => void
}

let idSeq = 0
function newId(today: string, childId: string): string {
  idSeq += 1
  return `${childId}-${today}-${idSeq}`
}

export function AssessmentFlow(props: Props) {
  const { programme, areas, indicators, cls, child, type, facilitatorId, today } = props
  const steps = visibleAreas(areas, cls)
  const [stepIdx, setStepIdx] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [coAssessors, setCoAssessors] = useState('')
  const [error, setError] = useState('')

  const area = steps[stepIdx]
  const areaIndicators = indicators.filter(i => i.areaId === area.id && i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const allIndicators = indicators.filter(
    i => i.active && steps.some(s => s.id === i.areaId),
  )
  const isLast = stepIdx === steps.length - 1

  function handleSubmit() {
    const unscored = allIndicators.filter(i => scores[i.id] == null)
    if (unscored.length > 0) {
      setError('Please score every indicator before saving.')
      return
    }
    const assessment: Assessment = {
      id: newId(today, child.id),
      childId: child.id,
      type,
      date: today,
      assessedBy: facilitatorId,
      coAssessors,
      scaleMax: programme.scaleMax,
      scores: allIndicators.map(i => ({
        indicatorId: i.id, indicatorText: i.text, score: scores[i.id],
      })),
      observations: Object.entries(notes)
        .filter(([, note]) => note.trim() !== '')
        .map(([areaId, note]) => ({ areaId, note })),
      syncState: 'pending',
    }
    props.onSubmit(assessment)
  }

  return (
    <div className="container">
      <header>
        <h1>{child.firstName} {child.surname}</h1>
        <p style={{ color: 'var(--muted)' }}>
          {type === 'baseline' ? 'Baseline' : 'Quarterly'} · {cls.name} · Step {stepIdx + 1} of {steps.length}
        </p>
      </header>

      <AreaStep
        area={area}
        indicators={areaIndicators}
        descriptors={programme.scaleDescriptors}
        scores={scores}
        note={notes[area.id] ?? ''}
        onScore={(indicatorId, value) => setScores(s => ({ ...s, [indicatorId]: value }))}
        onNote={note => setNotes(n => ({ ...n, [area.id]: note }))}
      />

      {isLast && (
        <label style={{ display: 'block', marginTop: 12 }}>
          Co-facilitators who agreed on these scores
          <input
            value={coAssessors}
            onChange={e => setCoAssessors(e.target.value)}
            style={{ width: '100%', font: 'inherit' }}
          />
        </label>
      )}

      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {stepIdx > 0 && (
          <button type="button" onClick={() => setStepIdx(i => i - 1)}>Back</button>
        )}
        {!isLast && (
          <button type="button" className="primary" onClick={() => setStepIdx(i => i + 1)}>
            Next
          </button>
        )}
        {isLast && (
          <button type="button" className="primary" onClick={handleSubmit}>
            Save assessment
          </button>
        )}
        <button type="button" onClick={props.onCancel}>Cancel</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AssessmentFlow`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/screens/AssessmentFlow.tsx amava-me/src/screens/AssessmentFlow.test.tsx
git commit -m "feat: offline assessment capture flow"
```

---

## Task 11: Online status + sync status hooks

**Files:**
- Create: `amava-me/src/hooks/use-online-status.ts`, `amava-me/src/hooks/use-sync-status.ts`
- Create: `amava-me/src/components/SyncBadge.tsx`

- [ ] **Step 1: Implement use-online-status**

Create `amava-me/src/hooks/use-online-status.ts`:
```ts
import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
```

- [ ] **Step 2: Implement use-sync-status**

Create `amava-me/src/hooks/use-sync-status.ts`:
```ts
import { useCallback, useEffect, useState } from 'react'
import type { LocalStore } from '../data/datastore'
import type { SyncEngine } from '../data/sync-engine'
import { useOnlineStatus } from './use-online-status'

export function useSyncStatus(store: LocalStore, engine: SyncEngine) {
  const online = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)

  const refresh = useCallback(async () => {
    setPendingCount((await store.getPendingAssessments()).length)
  }, [store])

  const sync = useCallback(async () => {
    if (!online) return
    await engine.push()
    await refresh()
  }, [online, engine, refresh])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { if (online) sync() }, [online, sync])

  return { online, pendingCount, refresh, sync }
}
```

- [ ] **Step 3: Implement SyncBadge**

Create `amava-me/src/components/SyncBadge.tsx`:
```tsx
interface Props { online: boolean; pendingCount: number }

export function SyncBadge({ online, pendingCount }: Props) {
  return (
    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
      {online ? '● Online' : '○ Offline'}
      {pendingCount > 0 && ` · ${pendingCount} waiting to sync`}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add amava-me/src/hooks amava-me/src/components/SyncBadge.tsx
git commit -m "feat: online + sync status hooks and badge"
```

---

## Task 12: Auth context + route guard

**Files:**
- Create: `amava-me/src/auth/auth-context.tsx`, `amava-me/src/auth/require-auth.tsx`, `amava-me/src/screens/LoginScreen.tsx`
- Create: `amava-me/src/lib/supabase.ts`, `amava-me/.env.example`

- [ ] **Step 1: Add Supabase client + env example**

Create `amava-me/src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url ?? '', anonKey ?? '')
```

Create `amava-me/.env.example`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: Implement auth context**

Create `amava-me/src/auth/auth-context.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthValue {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }
  async function signOut() { await supabase.auth.signOut() }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 3: Implement route guard**

Create `amava-me/src/auth/require-auth.tsx`:
```tsx
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="container">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 4: Implement login screen**

Create `amava-me/src/screens/LoginScreen.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'

export function LoginScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn(email, password)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <form className="container" onSubmit={submit}>
      <h1>Amava M&E</h1>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} /></label>
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}
      <button className="primary" type="submit">Sign in</button>
    </form>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/auth amava-me/src/lib amava-me/src/screens/LoginScreen.tsx amava-me/.env.example
git commit -m "feat: Supabase auth context, route guard, login screen"
```

---

## Task 13: Supabase schema + seed + real SyncClient adapter

**Files:**
- Create: `amava-me/supabase/migrations/0001_init.sql`, `amava-me/supabase/seed.sql`
- Create: `amava-me/src/data/supabase-sync-client.ts`

- [ ] **Step 1: Write the schema migration**

Create `amava-me/supabase/migrations/0001_init.sql`:
```sql
create table programme (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scale_max int not null default 4,
  scale_descriptors jsonb not null,
  active boolean not null default true
);

create table development_area (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programme(id),
  name text not null,
  sort_order int not null,
  garden_only boolean not null default false,
  active boolean not null default true
);

create table indicator (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references development_area(id),
  text text not null,
  hint text,
  sort_order int not null,
  active boolean not null default true
);

create table class_group (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programme(id),
  name text not null,
  has_garden_component boolean not null default true,
  active boolean not null default true
);

create table facilitator (
  id uuid primary key,                 -- matches auth.users.id
  name text not null,
  role text not null default 'facilitator',
  class_ids uuid[] not null default '{}'
);

create table child (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references class_group(id),
  first_name text not null,
  surname text not null,
  fields jsonb not null default '{}',
  date_started date not null,
  is_sample boolean not null default true,
  active boolean not null default true
);

create table assessment (
  id text primary key,                 -- client-generated for offline-first
  child_id uuid not null references child(id),
  type text not null,
  date date not null,
  assessed_by uuid not null references facilitator(id),
  co_assessors text not null default '',
  scale_max int not null,
  scores jsonb not null,               -- [{indicatorId, indicatorText, score}]
  observations jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table programme enable row level security;
alter table development_area enable row level security;
alter table indicator enable row level security;
alter table class_group enable row level security;
alter table facilitator enable row level security;
alter table child enable row level security;
alter table assessment enable row level security;

-- Any signed-in user may read reference data.
create policy ref_read_programme on programme for select to authenticated using (true);
create policy ref_read_area on development_area for select to authenticated using (true);
create policy ref_read_indicator on indicator for select to authenticated using (true);
create policy ref_read_class on class_group for select to authenticated using (true);
create policy ref_read_facilitator on facilitator for select to authenticated using (true);

-- A facilitator sees children only in their assigned classes; coordinators see all.
create policy child_read on child for select to authenticated using (
  exists (
    select 1 from facilitator f
    where f.id = auth.uid()
      and (f.role = 'coordinator' or child.class_id = any (f.class_ids))
  )
);

-- A facilitator reads/writes assessments for children in their classes; coordinators all.
create policy assessment_rw on assessment for all to authenticated using (
  exists (
    select 1 from facilitator f join child c on c.id = assessment.child_id
    where f.id = auth.uid()
      and (f.role = 'coordinator' or c.class_id = any (f.class_ids))
  )
) with check (
  exists (
    select 1 from facilitator f join child c on c.id = assessment.child_id
    where f.id = auth.uid()
      and (f.role = 'coordinator' or c.class_id = any (f.class_ids))
  )
);
```

- [ ] **Step 2: Write the seed data (after-school programme)**

Create `amava-me/supabase/seed.sql`:
```sql
-- After-school garden programme with the 1–4 scale and 5 areas.
insert into programme (id, name, scale_max, scale_descriptors) values
  ('11111111-1111-1111-1111-111111111111', 'After-school Garden', 4,
   '[{"value":1,"label":"Emerging","description":"rarely or not yet observed"},
     {"value":2,"label":"Developing","description":"beginning to show, inconsistent"},
     {"value":3,"label":"Consistent","description":"reliably shows this most of the time"},
     {"value":4,"label":"Strong","description":"consistently and independently demonstrates this"}]');

insert into development_area (id, programme_id, name, sort_order, garden_only) values
  ('a1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','General',1,false),
  ('a1000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Emotional Development',2,false),
  ('a1000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Artistic / Creative Development',3,false),
  ('a1000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Social & Interaction Skills',4,false),
  ('a1000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Garden & Connection to Nature',5,true);

insert into indicator (area_id, text, sort_order) values
  ('a1000000-0000-0000-0000-000000000001','Good general appearance',1),
  ('a1000000-0000-0000-0000-000000000001','Willingness to clean up after class',2),
  ('a1000000-0000-0000-0000-000000000001','Willingness to listen and ask questions',3),
  ('a1000000-0000-0000-0000-000000000001','Willing to co-operate',4),
  ('a1000000-0000-0000-0000-000000000001','Shows effort and engagement in activities',5),
  ('a1000000-0000-0000-0000-000000000002','Willingness to communicate with the facilitator',1),
  ('a1000000-0000-0000-0000-000000000002','Ability to demonstrate a strong sense of self',2),
  ('a1000000-0000-0000-0000-000000000002','Ability to show empathy when appropriate',3),
  ('a1000000-0000-0000-0000-000000000002','Willingness to express feelings and emotions verbally',4),
  ('a1000000-0000-0000-0000-000000000003','Ability to identify materials / tools',1),
  ('a1000000-0000-0000-0000-000000000003','Ability to hold and use materials / tools',2),
  ('a1000000-0000-0000-0000-000000000003','Willingness to show and share work with other children',3),
  ('a1000000-0000-0000-0000-000000000003','Willingness to experiment with materials',4),
  ('a1000000-0000-0000-0000-000000000003','Ability to complete projects as instructed',5),
  ('a1000000-0000-0000-0000-000000000004','Concentrates, listens and follows instructions',1),
  ('a1000000-0000-0000-0000-000000000004','Shows appreciation for other children',2),
  ('a1000000-0000-0000-0000-000000000004','Shows respect to the facilitator',3),
  ('a1000000-0000-0000-0000-000000000004','Demonstrates good problem-solving in class',4),
  ('a1000000-0000-0000-0000-000000000004','Freely shares tools and materials with others',5),
  ('a1000000-0000-0000-0000-000000000005','Self-regulates when required',1),
  ('a1000000-0000-0000-0000-000000000005','Interacts with the garden outside facilitated sessions',2),
  ('a1000000-0000-0000-0000-000000000005','Shows care for the environment/animals/insects',3),
  ('a1000000-0000-0000-0000-000000000005','Shows interest/fascination with the outdoors',4),
  ('a1000000-0000-0000-0000-000000000005','Uses the space independently during breakaways',5);

insert into class_group (id, programme_id, name, has_garden_component) values
  ('c1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Class 1', true);
```

- [ ] **Step 3: Implement the real Supabase SyncClient**

Create `amava-me/src/data/supabase-sync-client.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Assessment, Facilitator, ReferenceData } from '../domain/types'
import type { SyncClient } from './datastore'

/** Maps snake_case DB rows to the camelCase domain shape and back. */
export class SupabaseSyncClient implements SyncClient {
  constructor(private sb: SupabaseClient, private currentFacilitatorId: string) {}

  async fetchReferenceData(): Promise<ReferenceData> {
    const [programmes, areas, indicators, classes, facilitators, children] = await Promise.all([
      this.sb.from('programme').select('*').eq('active', true),
      this.sb.from('development_area').select('*'),
      this.sb.from('indicator').select('*'),
      this.sb.from('class_group').select('*').eq('active', true),
      this.sb.from('facilitator').select('*'),
      this.sb.from('child').select('*').eq('active', true),
    ])
    const err = [programmes, areas, indicators, classes, facilitators, children].find(r => r.error)
    if (err?.error) throw err.error
    return {
      programmes: (programmes.data ?? []).map(p => ({
        id: p.id, name: p.name, scaleMax: p.scale_max,
        scaleDescriptors: p.scale_descriptors, active: p.active,
      })),
      areas: (areas.data ?? []).map(a => ({
        id: a.id, programmeId: a.programme_id, name: a.name,
        sortOrder: a.sort_order, gardenOnly: a.garden_only, active: a.active,
      })),
      indicators: (indicators.data ?? []).map(i => ({
        id: i.id, areaId: i.area_id, text: i.text, hint: i.hint,
        sortOrder: i.sort_order, active: i.active,
      })),
      classes: (classes.data ?? []).map(c => ({
        id: c.id, programmeId: c.programme_id, name: c.name,
        hasGardenComponent: c.has_garden_component, active: c.active,
      })),
      children: (children.data ?? []).map(c => ({
        id: c.id, classId: c.class_id, firstName: c.first_name, surname: c.surname,
        fields: c.fields, dateStarted: c.date_started, isSample: c.is_sample, active: c.active,
      })),
      facilitators: (facilitators.data ?? []).map((f): Facilitator => ({
        id: f.id, name: f.name, role: f.role, classIds: f.class_ids,
      })),
      fetchedAt: new Date().toISOString(),
    }
  }

  async fetchAssessmentsForFacilitator(): Promise<Assessment[]> {
    const { data, error } = await this.sb.from('assessment').select('*')
    if (error) throw error
    return (data ?? []).map(a => ({
      id: a.id, childId: a.child_id, type: a.type, date: a.date,
      assessedBy: a.assessed_by, coAssessors: a.co_assessors, scaleMax: a.scale_max,
      scores: a.scores, observations: a.observations, syncState: 'synced',
    }))
  }

  async pushAssessment(a: Assessment): Promise<void> {
    const { error } = await this.sb.from('assessment').upsert({
      id: a.id, child_id: a.childId, type: a.type, date: a.date,
      assessed_by: a.assessedBy, co_assessors: a.coAssessors, scale_max: a.scaleMax,
      scores: a.scores, observations: a.observations,
    })
    if (error) throw error
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add amava-me/supabase amava-me/src/data/supabase-sync-client.ts
git commit -m "feat: Supabase schema, seed data, and SyncClient adapter"
```

---

## Task 14: Wire the app together + manual smoke test

**Files:**
- Modify: `amava-me/src/main.tsx`, `amava-me/src/App.tsx`
- Create: `amava-me/src/app-context.tsx`, `amava-me/src/hooks/use-reference-data.ts`
- Create: `amava-me/src/screens/HomeScreen.tsx`, `amava-me/src/screens/ChildListScreen.tsx`

- [ ] **Step 1: Create an app-level store/engine/client context**

Create `amava-me/src/app-context.tsx`:
```tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DexieLocalStore } from './data/local-store'
import { SyncEngine } from './data/sync-engine'
import { SupabaseSyncClient } from './data/supabase-sync-client'
import { supabase } from './lib/supabase'
import { useAuth } from './auth/auth-context'

interface AppServices { store: DexieLocalStore; engine: SyncEngine }
const Ctx = createContext<AppServices | null>(null)

export function AppServicesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const value = useMemo<AppServices | null>(() => {
    if (!session) return null
    const store = new DexieLocalStore()
    const client = new SupabaseSyncClient(supabase, session.user.id)
    return { store, engine: new SyncEngine(store, client) }
  }, [session])
  if (!value) return <>{children}</>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppServices(): AppServices {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AppServices unavailable (not signed in)')
  return ctx
}
```

- [ ] **Step 2: Reference-data hook (pull on load, read from cache)**

Create `amava-me/src/hooks/use-reference-data.ts`:
```ts
import { useEffect, useState } from 'react'
import type { ReferenceData } from '../domain/types'
import { useAppServices } from '../app-context'

export function useReferenceData() {
  const { store, engine } = useAppServices()
  const [data, setData] = useState<ReferenceData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const cached = await store.getReferenceData()
      if (active && cached) setData(cached)
      try {
        await engine.pull()
        const fresh = await store.getReferenceData()
        if (active && fresh) setData(fresh)
      } catch {
        // offline: keep cached
      }
    })()
    return () => { active = false }
  }, [store, engine])

  return data
}
```

- [ ] **Step 3: Home + child list screens**

Create `amava-me/src/screens/HomeScreen.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useAppServices } from '../app-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useSyncStatus } from '../hooks/use-sync-status'
import { SyncBadge } from '../components/SyncBadge'

export function HomeScreen() {
  const { session } = useAuth()
  const { store, engine } = useAppServices()
  const ref = useReferenceData()
  const { online, pendingCount } = useSyncStatus(store, engine)

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const myClasses = ref.classes.filter(
    c => me?.role === 'coordinator' || me?.classIds.includes(c.id),
  )

  return (
    <div className="container">
      <SyncBadge online={online} pendingCount={pendingCount} />
      <h1>My classes</h1>
      <ul>
        {myClasses.map(c => (
          <li key={c.id}><Link to={`/class/${c.id}`}>{c.name}</Link></li>
        ))}
      </ul>
    </div>
  )
}
```

Create `amava-me/src/screens/ChildListScreen.tsx`:
```tsx
import { Link, useParams } from 'react-router-dom'
import { useReferenceData } from '../hooks/use-reference-data'

export function ChildListScreen() {
  const { classId } = useParams()
  const ref = useReferenceData()
  if (!ref) return <p className="container">Loading…</p>
  const cls = ref.classes.find(c => c.id === classId)
  const children = ref.children.filter(c => c.classId === classId && c.isSample)

  return (
    <div className="container">
      <h1>{cls?.name}</h1>
      <ul>
        {children.map(ch => (
          <li key={ch.id}>
            <Link to={`/assess/${ch.id}`}>{ch.firstName} {ch.surname}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Wire routes in App.tsx**

Replace `amava-me/src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import { RequireAuth } from './auth/require-auth'
import { AppServicesProvider } from './app-context'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ChildListScreen } from './screens/ChildListScreen'
import { AssessChildRoute } from './screens/AssessChildRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<RequireAuth><AppServicesProvider><HomeScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/class/:classId" element={<RequireAuth><AppServicesProvider><ChildListScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/assess/:childId" element={<RequireAuth><AppServicesProvider><AssessChildRoute /></AppServicesProvider></RequireAuth>} />
    </Routes>
  )
}
```

- [ ] **Step 5: Create the assess route that connects flow → queue → sync**

Create `amava-me/src/screens/AssessChildRoute.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useAppServices } from '../app-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { AssessmentFlow } from './AssessmentFlow'
import { nextAssessmentType } from '../domain/assessment-logic'
import type { Assessment } from '../domain/types'

export function AssessChildRoute() {
  const { childId } = useParams()
  const { session } = useAuth()
  const { store, engine } = useAppServices()
  const ref = useReferenceData()
  const navigate = useNavigate()
  const [type, setType] = useState<'baseline' | 'quarterly' | null>(null)

  useEffect(() => {
    if (childId) store.getAssessmentsForChild(childId).then(h => setType(nextAssessmentType(h)))
  }, [childId, store])

  if (!ref || !type) return <p className="container">Loading…</p>
  const child = ref.children.find(c => c.id === childId)!
  const cls = ref.classes.find(c => c.id === child.classId)!
  const programme = ref.programmes.find(p => p.id === cls.programmeId)!
  const areas = ref.areas.filter(a => a.programmeId === programme.id)
  const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))

  async function handleSubmit(a: Assessment) {
    await store.enqueueAssessment(a)
    await engine.push() // best-effort; stays queued if offline
    navigate(`/class/${cls.id}`)
  }

  return (
    <AssessmentFlow
      programme={programme} areas={areas} indicators={indicators}
      cls={cls} child={child} type={type}
      facilitatorId={session!.user.id} today={new Date().toISOString().slice(0, 10)}
      onSubmit={handleSubmit} onCancel={() => navigate(`/class/${cls.id}`)}
    />
  )
}
```

- [ ] **Step 6: Wire providers + styles in main.tsx**

Replace `amava-me/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/auth-context'
import './styles/tokens.css'
import './styles/base.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 7: Run the full test suite**

Run: `npm run test`
Expected: PASS — all suites green (assessment-logic, local-store, sync-engine, ScaleSelector, AssessmentFlow).

- [ ] **Step 8: Type-check and build**

Run: `npm run build`
Expected: TypeScript compiles and Vite produces a production build with no errors.

- [ ] **Step 9: Manual smoke test (requires a Supabase project)**

1. Create a free Supabase project; run `0001_init.sql` then `seed.sql` in the SQL editor.
2. Create one auth user (a facilitator) and insert a matching `facilitator` row with that `auth.uid()` and `class_ids = {c1000000-...0001}`; insert 2–3 `child` rows in that class.
3. Copy `.env.example` to `.env` with the project URL + anon key.
4. `npm run dev`, sign in, open the class, assess a child (score all indicators), Save.
5. Confirm the row appears in the `assessment` table.
6. In dev tools, set the network to **Offline**, assess another child, Save → confirm "1 waiting to sync"; set back **Online** → confirm it syncs and the badge clears.

- [ ] **Step 10: Commit**

```bash
git add amava-me/src
git commit -m "feat: wire auth, routing, home/class/assess flow with offline sync"
```

---

## Self-Review

**Spec coverage (M1 scope):**
- Offline phone capture → Tasks 5, 7, 10, 11, 14 ✓
- Per-facilitator login → Task 12 ✓
- 1–4 scale with descriptors → Tasks 9, 13 (seed) ✓
- Baseline vs quarterly → Tasks 3, 14 ✓
- Garden area only for garden classes → Task 3 `visibleAreas`, Task 13 `garden_only` ✓
- Scale-max snapshot for history integrity → Tasks 2, 10, 13 ✓
- Facilitator-sees-own-classes security → Task 13 RLS ✓
- Brand palette/fonts → Task 8 ✓
- Deferred to later milestones: reporting (M2), self-service config UI (M3), branded PDF + Cloudflare deploy (M4). PWA manifest is configured in Task 1; install polish lands in M4.

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `LocalStore`/`SyncClient` (Task 4) are implemented by `DexieLocalStore` (5), `FakeSyncClient` (6), `SupabaseSyncClient` (13) and consumed by `SyncEngine` (7) with matching signatures. `Assessment`/`ReferenceData` (Task 2) used consistently throughout. `visibleAreas`, `nextAssessmentType` signatures match call sites in Tasks 10/14. ✓
