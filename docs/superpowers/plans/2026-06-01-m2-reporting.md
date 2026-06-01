# Milestone 2 — Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinators and facilitators can view impact reports at child / class / programme / organisation level (stat cards, simple SVG charts, per-indicator tables), export any report to CSV, and print it to PDF — all computed client-side from the data captured in M1.

**Architecture:** Pure functions (`report-metrics`, `csv`) compute everything from the in-memory set of assessments the signed-in user may see (RLS already scopes this). A `use-report-data` hook assembles inputs for a chosen scope; `ReportsScreen` owns scope/filter state and renders a presentational `ReportView`. Charts are hand-rolled SVG (no new dependency).

**Tech Stack:** Existing M1 stack (React + TypeScript + Vite + Vitest). No new runtime dependencies.

---

## File Structure

```
src/
  config.ts                         # IMPROVED_THRESHOLD (single source; M3 makes it editable)
  domain/
    report-metrics.ts               # buildReport + buildChildReport + types
    report-metrics.test.ts
    csv.ts                          # aggregateCsv + childCsv (pure string builders)
    csv.test.ts
  data/
    datastore.ts                    # + getAllAssessments() on LocalStore
    local-store.ts                  # + getAllAssessments() Dexie impl
  hooks/
    use-report-data.ts              # assemble children + assessments for a scope
  components/
    StatCard.tsx
    BarChart.tsx                    # SVG bars
    Sparkline.tsx                   # SVG trend line
    ReportTable.tsx
    ReportView.tsx                  # presentational: composes the above from a Report/ChildReport
    ReportView.test.tsx
  lib/
    download.ts                     # downloadText(filename, text) via Blob (DOM)
  screens/
    ReportsScreen.tsx               # scope picker + filters + data hook + ReportView + export
  App.tsx                           # + /reports route
  screens/HomeScreen.tsx            # + Reports link
  styles/print.css                  # @media print layout
```

---

## Task 1: Config constant + LocalStore.getAllAssessments

**Files:**
- Create: `amava-me/src/config.ts`
- Modify: `amava-me/src/data/datastore.ts`, `amava-me/src/data/local-store.ts`
- Test: `amava-me/src/data/local-store.test.ts` (add a case)

- [ ] **Step 1: Create the config constant**

Create `amava-me/src/config.ts`:
```ts
/** Minimum score increase vs baseline that counts as "improved". M3 will make this editable. */
export const IMPROVED_THRESHOLD = 1
```

- [ ] **Step 2: Add getAllAssessments to the LocalStore interface**

In `amava-me/src/data/datastore.ts`, add one method to the `LocalStore` interface (after `getAssessmentsForChild`):
```ts
  /** All assessments in the local cache (pending + synced), for reporting. */
  getAllAssessments(): Promise<Assessment[]>
```

- [ ] **Step 3: Write the failing test**

In `amava-me/src/data/local-store.test.ts`, add inside the `describe('DexieLocalStore', ...)` block:
```ts
  it('returns all assessments across children', async () => {
    await store.enqueueAssessment(mkAssessment('a1', 'c1'))
    await store.saveSyncedAssessments([{ ...mkAssessment('a2', 'c2'), syncState: 'synced' }])
    const all = await store.getAllAssessments()
    expect(all.map(a => a.id).sort()).toEqual(['a1', 'a2'])
  })
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test -- local-store`
Expected: FAIL — `getAllAssessments is not a function`.

- [ ] **Step 5: Implement it**

In `amava-me/src/data/local-store.ts`, add this method to the `DexieLocalStore` class (after `getAssessmentsForChild`):
```ts
  async getAllAssessments(): Promise<Assessment[]> {
    return this.assessments.toArray()
  }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- local-store`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add amava-me/src/config.ts amava-me/src/data/datastore.ts amava-me/src/data/local-store.ts amava-me/src/data/local-store.test.ts
git commit -m "feat: report threshold config + getAllAssessments on local store"
```

---

## Task 2: Aggregate report engine (`buildReport`)

**Files:**
- Create: `amava-me/src/domain/report-metrics.ts`
- Test: `amava-me/src/domain/report-metrics.test.ts`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/domain/report-metrics.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildReport } from './report-metrics'
import type { Assessment, Child, DevelopmentArea, Indicator } from './types'

const area: DevelopmentArea = { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true }
const indicators: Indicator[] = [
  { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
  { id: 'i2', areaId: 'gen', text: 'Co-operates', hint: null, sortOrder: 2, active: true },
]
const child = (id: string): Child => ({
  id, classId: 'c', firstName: id, surname: 'X', fields: {}, dateStarted: '2026-01-01', isSample: true, active: true,
})
const ax = (id: string, childId: string, type: 'baseline' | 'quarterly', date: string, s: Record<string, number>): Assessment => ({
  id, childId, type, date, assessedBy: 'f', coAssessors: '', scaleMax: 4,
  scores: Object.entries(s).map(([indicatorId, score]) => ({ indicatorId, indicatorText: '', score })),
  observations: [], syncState: 'synced',
})

describe('buildReport', () => {
  // 3 children. A: i1 2->4 (improved), i2 3->3 (stable). B: i1 1->2 (improved), i2 2->1 (declined).
  // C: baseline only (excluded from change stats).
  const children = [child('A'), child('B'), child('C')]
  const assessments: Assessment[] = [
    ax('a1', 'A', 'baseline', '2026-01-10', { i1: 2, i2: 3 }),
    ax('a2', 'A', 'quarterly', '2026-04-10', { i1: 4, i2: 3 }),
    ax('b1', 'B', 'baseline', '2026-01-10', { i1: 1, i2: 2 }),
    ax('b2', 'B', 'quarterly', '2026-04-10', { i1: 2, i2: 1 }),
    ax('c1', 'C', 'baseline', '2026-01-10', { i1: 3, i2: 3 }),
  ]
  const report = buildReport({ children, assessments, areas: [area], indicators, threshold: 1 })

  it('counts children, baseline coverage, and follow-up coverage', () => {
    expect(report.childrenInScope).toBe(3)
    expect(report.withBaseline).toBe(3)
    expect(report.withFollowUp).toBe(2) // A and B only
  })

  it('computes per-indicator improved/stable/declined over measured children only', () => {
    const i1 = report.areas[0].indicators.find(i => i.indicatorId === 'i1')!
    expect(i1.nMeasured).toBe(2)        // A, B (C excluded: no follow-up)
    expect(i1.nImproved).toBe(2)        // A +2, B +1
    expect(i1.percentImproved).toBe(100)
    const i2 = report.areas[0].indicators.find(i => i.indicatorId === 'i2')!
    expect(i2.nMeasured).toBe(2)
    expect(i2.nStable).toBe(1)          // A 3->3
    expect(i2.nDeclined).toBe(1)        // B 2->1
    expect(i2.percentImproved).toBe(0)
  })

  it('computes average baseline/latest/change per indicator over measured children', () => {
    const i1 = report.areas[0].indicators.find(i => i.indicatorId === 'i1')!
    expect(i1.avgBaseline).toBe(1.5)    // (2+1)/2
    expect(i1.avgLatest).toBe(3)        // (4+2)/2
    expect(i1.avgChange).toBe(1.5)
  })

  it('uses the current indicator text for the label', () => {
    const i1 = report.areas[0].indicators.find(i => i.indicatorId === 'i1')!
    expect(i1.indicatorText).toBe('Listens')
  })

  it('produces headlines sorted by percent improved (descending)', () => {
    expect(report.headlines[0].indicatorId).toBe('i1')
    expect(report.headlines[0].percentImproved).toBe(100)
  })

  it('is zero-safe with no assessments', () => {
    const empty = buildReport({ children: [], assessments: [], areas: [area], indicators, threshold: 1 })
    expect(empty.childrenInScope).toBe(0)
    expect(empty.areas[0].indicators[0].nMeasured).toBe(0)
    expect(empty.areas[0].indicators[0].percentImproved).toBe(0)
    expect(empty.areas[0].indicators[0].avgBaseline).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- report-metrics`
Expected: FAIL — "Cannot find module './report-metrics'".

- [ ] **Step 3: Implement the engine**

Create `amava-me/src/domain/report-metrics.ts`:
```ts
import type { Assessment, Child, DevelopmentArea, Indicator } from './types'
import { classifyChange } from './assessment-logic'

export interface IndicatorReport {
  indicatorId: string
  indicatorText: string
  areaId: string
  nMeasured: number
  nImproved: number
  nStable: number
  nDeclined: number
  percentImproved: number
  avgBaseline: number | null
  avgLatest: number | null
  avgChange: number | null
}

export interface AreaReport {
  areaId: string
  areaName: string
  indicators: IndicatorReport[]
  nMeasured: number
  percentImproved: number
  avgBaseline: number | null
  avgLatest: number | null
}

export interface Headline {
  indicatorId: string
  indicatorText: string
  percentImproved: number
  nImproved: number
  nMeasured: number
}

export interface Report {
  areas: AreaReport[]
  childrenInScope: number
  withBaseline: number
  withFollowUp: number
  headlines: Headline[]
}

export interface ReportInput {
  children: Child[]
  assessments: Assessment[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  threshold: number
}

const round1 = (x: number): number => Math.round(x * 10) / 10
const mean = (xs: number[]): number | null => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

function scoreIn(a: Assessment, indicatorId: string): number | null {
  const s = a.scores.find(x => x.indicatorId === indicatorId)
  return s ? s.score : null
}

/** Baseline score and latest follow-up score for one child + indicator. */
function baselineAndLatest(history: Assessment[], indicatorId: string): { baseline: number | null; latest: number | null } {
  const baselineA = history.find(a => a.type === 'baseline')
  const followUps = history.filter(a => a.type !== 'baseline').sort((a, b) => a.date.localeCompare(b.date))
  const latestA = followUps[followUps.length - 1]
  return {
    baseline: baselineA ? scoreIn(baselineA, indicatorId) : null,
    latest: latestA ? scoreIn(latestA, indicatorId) : null,
  }
}

export function buildReport(input: ReportInput): Report {
  const { children, assessments, areas, indicators, threshold } = input
  const scopeIds = new Set(children.map(c => c.id))
  const byChild = new Map<string, Assessment[]>()
  for (const a of assessments) {
    if (!scopeIds.has(a.childId)) continue
    const list = byChild.get(a.childId) ?? []
    list.push(a)
    byChild.set(a.childId, list)
  }

  const withBaseline = [...byChild.values()].filter(h => h.some(a => a.type === 'baseline')).length
  const withFollowUp = [...byChild.values()].filter(h => h.some(a => a.type !== 'baseline')).length

  const activeAreas = areas.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const headlines: Headline[] = []

  const areaReports: AreaReport[] = activeAreas.map(area => {
    const areaIndicators = indicators
      .filter(i => i.active && i.areaId === area.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const measuredChildrenInArea = new Set<string>()

    const indicatorReports: IndicatorReport[] = areaIndicators.map(ind => {
      const baselines: number[] = []
      const latests: number[] = []
      const changes: number[] = []
      let nImproved = 0, nStable = 0, nDeclined = 0
      for (const child of children) {
        const history = byChild.get(child.id) ?? []
        const { baseline, latest } = baselineAndLatest(history, ind.id)
        if (baseline === null || latest === null) continue
        measuredChildrenInArea.add(child.id)
        baselines.push(baseline)
        latests.push(latest)
        const change = latest - baseline
        changes.push(change)
        const cls = classifyChange(change, threshold)
        if (cls === 'improved') nImproved++
        else if (cls === 'declined') nDeclined++
        else nStable++
      }
      const nMeasured = changes.length
      const percentImproved = nMeasured ? Math.round((nImproved / nMeasured) * 100) : 0
      const rep: IndicatorReport = {
        indicatorId: ind.id,
        indicatorText: ind.text,
        areaId: area.id,
        nMeasured, nImproved, nStable, nDeclined, percentImproved,
        avgBaseline: mean(baselines),
        avgLatest: mean(latests),
        avgChange: mean(changes),
      }
      if (nMeasured > 0) {
        headlines.push({ indicatorId: ind.id, indicatorText: ind.text, percentImproved, nImproved, nMeasured })
      }
      return rep
    })

    const measuredIndicators = indicatorReports.filter(i => i.nMeasured > 0)
    return {
      areaId: area.id,
      areaName: area.name,
      indicators: indicatorReports,
      nMeasured: measuredChildrenInArea.size,
      percentImproved: measuredIndicators.length
        ? Math.round(measuredIndicators.reduce((s, i) => s + i.percentImproved, 0) / measuredIndicators.length)
        : 0,
      avgBaseline: mean(measuredIndicators.map(i => i.avgBaseline as number)),
      avgLatest: mean(measuredIndicators.map(i => i.avgLatest as number)),
    }
  })

  headlines.sort((a, b) => b.percentImproved - a.percentImproved)
  return { areas: areaReports, childrenInScope: children.length, withBaseline, withFollowUp, headlines }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- report-metrics`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/report-metrics.ts amava-me/src/domain/report-metrics.test.ts
git commit -m "feat: aggregate report engine (buildReport) with tests"
```

---

## Task 3: Child report engine (`buildChildReport`)

**Files:**
- Modify: `amava-me/src/domain/report-metrics.ts`
- Test: `amava-me/src/domain/report-metrics.test.ts` (add a describe block)

- [ ] **Step 1: Write the failing test**

Add to `amava-me/src/domain/report-metrics.test.ts` (append after the existing `describe`):
```ts
import { buildChildReport } from './report-metrics'

describe('buildChildReport', () => {
  const area: DevelopmentArea = { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true }
  const indicators: Indicator[] = [
    { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
  ]
  const childA: Child = { id: 'A', classId: 'c', firstName: 'Lebo', surname: 'M', fields: {}, dateStarted: '2026-01-01', isSample: true, active: true }
  const history: Assessment[] = [
    ax('a1', 'A', 'baseline', '2026-01-10', { i1: 2 }),
    ax('a2', 'A', 'quarterly', '2026-04-10', { i1: 4 }),
  ]

  it('builds per-indicator baseline/latest/change/classification rows', () => {
    const r = buildChildReport({ child: childA, history, areas: [area], indicators, threshold: 1 })
    expect(r.childName).toBe('Lebo M')
    const row = r.rows[0]
    expect(row).toMatchObject({ indicatorId: 'i1', baseline: 2, latest: 4, change: 2, classification: 'improved' })
  })

  it('builds a per-area trend series across assessments by date', () => {
    const r = buildChildReport({ child: childA, history, areas: [area], indicators, threshold: 1 })
    const trend = r.trends[0]
    expect(trend.areaId).toBe('gen')
    expect(trend.points.map(p => p.date)).toEqual(['2026-01-10', '2026-04-10'])
    expect(trend.points.map(p => p.avgScore)).toEqual([2, 4])
  })

  it('leaves change null when there is no follow-up', () => {
    const r = buildChildReport({ child: childA, history: [history[0]], areas: [area], indicators, threshold: 1 })
    expect(r.rows[0]).toMatchObject({ baseline: 2, latest: null, change: null, classification: null })
  })
})
```
(Note: `ax`, `Child`, `DevelopmentArea`, `Indicator`, `Assessment` are already imported/defined at the top of this test file from Task 2.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- report-metrics`
Expected: FAIL — `buildChildReport` is not exported.

- [ ] **Step 3: Implement buildChildReport**

Append to `amava-me/src/domain/report-metrics.ts`:
```ts
import type { ChangeClass } from './assessment-logic'

export interface ChildIndicatorRow {
  indicatorId: string
  indicatorText: string
  areaId: string
  baseline: number | null
  latest: number | null
  change: number | null
  classification: ChangeClass | null
}

export interface ChildAreaTrend {
  areaId: string
  areaName: string
  points: { date: string; avgScore: number }[]
}

export interface ChildObservation { date: string; areaId: string | null; note: string }

export interface ChildReport {
  childId: string
  childName: string
  rows: ChildIndicatorRow[]
  trends: ChildAreaTrend[]
  observations: ChildObservation[]
}

export interface ChildReportInput {
  child: Child
  history: Assessment[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  threshold: number
}

export function buildChildReport(input: ChildReportInput): ChildReport {
  const { child, history, areas, indicators, threshold } = input
  const activeAreas = areas.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))

  const rows: ChildIndicatorRow[] = []
  const trends: ChildAreaTrend[] = []

  for (const area of activeAreas) {
    const areaIndicators = indicators
      .filter(i => i.active && i.areaId === area.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    for (const ind of areaIndicators) {
      const { baseline, latest } = baselineAndLatest(history, ind.id)
      const change = baseline !== null && latest !== null ? latest - baseline : null
      rows.push({
        indicatorId: ind.id,
        indicatorText: ind.text,
        areaId: area.id,
        baseline, latest, change,
        classification: change === null ? null : classifyChange(change, threshold),
      })
    }

    // Trend: average of this area's indicator scores within each assessment, in date order.
    const points = sorted
      .map(a => {
        const vals = areaIndicators
          .map(ind => scoreIn(a, ind.id))
          .filter((v): v is number => v !== null)
        return vals.length ? { date: a.date, avgScore: round1(vals.reduce((s, v) => s + v, 0) / vals.length) } : null
      })
      .filter((p): p is { date: string; avgScore: number } => p !== null)
    trends.push({ areaId: area.id, areaName: area.name, points })
  }

  const observations: ChildObservation[] = sorted.flatMap(a =>
    a.observations.map(o => ({ date: a.date, areaId: o.areaId, note: o.note })),
  )

  return {
    childId: child.id,
    childName: `${child.firstName} ${child.surname}`,
    rows, trends, observations,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- report-metrics`
Expected: PASS (9 tests total in the file).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/report-metrics.ts amava-me/src/domain/report-metrics.test.ts
git commit -m "feat: per-child report engine (buildChildReport) with tests"
```

---

## Task 4: CSV builders + download util

**Files:**
- Create: `amava-me/src/domain/csv.ts`, `amava-me/src/lib/download.ts`
- Test: `amava-me/src/domain/csv.test.ts`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/domain/csv.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { aggregateCsv, childCsv } from './csv'
import type { Report } from './report-metrics'
import type { ChildReport } from './report-metrics'

const report: Report = {
  childrenInScope: 2, withBaseline: 2, withFollowUp: 2, headlines: [],
  areas: [{
    areaId: 'gen', areaName: 'General', nMeasured: 2, percentImproved: 100, avgBaseline: 1.5, avgLatest: 3,
    indicators: [{
      indicatorId: 'i1', indicatorText: 'Listens, attentively', areaId: 'gen',
      nMeasured: 2, nImproved: 2, nStable: 0, nDeclined: 0, percentImproved: 100,
      avgBaseline: 1.5, avgLatest: 3, avgChange: 1.5,
    }],
  }],
}

describe('aggregateCsv', () => {
  it('has a header row and one row per indicator', () => {
    const csv = aggregateCsv(report)
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('area,indicator,n_measured,n_improved,n_stable,n_declined,percent_improved,avg_baseline,avg_latest,avg_change')
    expect(lines).toHaveLength(2)
  })
  it('quotes fields that contain commas', () => {
    expect(aggregateCsv(report)).toContain('"Listens, attentively"')
  })
})

describe('childCsv', () => {
  it('emits area/indicator/baseline/latest/change/classification rows', () => {
    const cr: ChildReport = {
      childId: 'A', childName: 'Lebo M', trends: [], observations: [],
      rows: [{ indicatorId: 'i1', indicatorText: 'Listens', areaId: 'gen', baseline: 2, latest: 4, change: 2, classification: 'improved' }],
    }
    const lines = childCsv(cr).trim().split('\n')
    expect(lines[0]).toBe('area,indicator,baseline,latest,change,classification')
    expect(lines[1]).toBe('gen,Listens,2,4,2,improved')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- csv`
Expected: FAIL — "Cannot find module './csv'".

- [ ] **Step 3: Implement the CSV builders**

Create `amava-me/src/domain/csv.ts`:
```ts
import type { Report, ChildReport } from './report-metrics'

/** Quote a CSV cell if it contains a comma, quote, or newline. */
function cell(v: string | number | null): string {
  if (v === null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function rowsToCsv(header: string[], rows: (string | number | null)[][]): string {
  return [header.join(','), ...rows.map(r => r.map(cell).join(','))].join('\n') + '\n'
}

export function aggregateCsv(report: Report): string {
  const header = ['area', 'indicator', 'n_measured', 'n_improved', 'n_stable', 'n_declined', 'percent_improved', 'avg_baseline', 'avg_latest', 'avg_change']
  const rows = report.areas.flatMap(area =>
    area.indicators.map(i => [
      area.areaName, i.indicatorText, i.nMeasured, i.nImproved, i.nStable, i.nDeclined,
      i.percentImproved, i.avgBaseline, i.avgLatest, i.avgChange,
    ]),
  )
  return rowsToCsv(header, rows)
}

export function childCsv(report: ChildReport): string {
  const header = ['area', 'indicator', 'baseline', 'latest', 'change', 'classification']
  const rows = report.rows.map(r => [r.areaId, r.indicatorText, r.baseline, r.latest, r.change, r.classification])
  return rowsToCsv(header, rows)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- csv`
Expected: PASS (3 tests).

- [ ] **Step 5: Create the download helper (DOM; no test)**

Create `amava-me/src/lib/download.ts`:
```ts
/** Trigger a browser download of text content (e.g. CSV). */
export function downloadText(filename: string, text: string, mime = 'text/csv'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/domain/csv.ts amava-me/src/domain/csv.test.ts amava-me/src/lib/download.ts
git commit -m "feat: CSV builders and download helper"
```

---

## Task 5: SVG chart + presentational components

**Files:**
- Create: `amava-me/src/components/StatCard.tsx`, `BarChart.tsx`, `Sparkline.tsx`, `ReportTable.tsx`
- Test: `amava-me/src/components/BarChart.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/BarChart.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from './BarChart'

describe('BarChart', () => {
  it('renders one bar rect per data point', () => {
    const { container } = render(
      <BarChart max={4} data={[{ label: 'A', value: 2 }, { label: 'B', value: 4 }]} />,
    )
    expect(container.querySelectorAll('rect.bar')).toHaveLength(2)
  })
  it('renders nothing meaningful for empty data without crashing', () => {
    const { container } = render(<BarChart max={4} data={[]} />)
    expect(container.querySelectorAll('rect.bar')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- BarChart`
Expected: FAIL — "Cannot find module './BarChart'".

- [ ] **Step 3: Implement BarChart**

Create `amava-me/src/components/BarChart.tsx`:
```tsx
interface Bar { label: string; value: number }
interface Props { data: Bar[]; max: number; height?: number }

export function BarChart({ data, max, height = 140 }: Props) {
  const barW = 48, gap = 16, padBottom = 20
  const width = Math.max(1, data.length * (barW + gap))
  const safeMax = max > 0 ? max : 1
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="bar chart">
      {data.map((d, idx) => {
        const h = Math.max(0, (d.value / safeMax) * (height - padBottom))
        const x = idx * (barW + gap) + gap / 2
        const y = height - padBottom - h
        return (
          <g key={d.label}>
            <rect className="bar" x={x} y={y} width={barW} height={h} rx={4} fill="var(--slate)" />
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="11" fill="var(--text)">{d.value}</text>
          </g>
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 4: Implement StatCard**

Create `amava-me/src/components/StatCard.tsx`:
```tsx
interface Props { value: string; label: string; sub?: string }

export function StatCard({ value, label, sub }: Props) {
  return (
    <div style={{
      border: '1px solid var(--green)', borderRadius: 'var(--radius)',
      padding: 16, minWidth: 160, background: '#fff',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--primary)' }}>{value}</div>
      <div style={{ fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}
```

- [ ] **Step 5: Implement Sparkline**

Create `amava-me/src/components/Sparkline.tsx`:
```tsx
interface Props { points: number[]; max: number; width?: number; height?: number }

export function Sparkline({ points, max, width = 120, height = 32 }: Props) {
  if (points.length === 0) return <svg width={width} height={height} aria-label="no data" />
  const safeMax = max > 0 ? max : 1
  const step = points.length > 1 ? width / (points.length - 1) : 0
  const coords = points.map((p, i) => `${i * step},${height - (p / safeMax) * height}`).join(' ')
  return (
    <svg width={width} height={height} role="img" aria-label="trend">
      <polyline points={coords} fill="none" stroke="var(--terracotta)" strokeWidth="2" />
    </svg>
  )
}
```

- [ ] **Step 6: Implement ReportTable**

Create `amava-me/src/components/ReportTable.tsx`:
```tsx
import type { ReactNode } from 'react'

interface Props { columns: string[]; rows: ReactNode[][] }

export function ReportTable({ columns, rows }: Props) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr>{columns.map(c => (
          <th key={c} style={{ textAlign: 'left', borderBottom: '2px solid var(--sage)', padding: '6px 8px' }}>{c}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((cell, j) => (
            <td key={j} style={{ borderBottom: '1px solid #eee', padding: '6px 8px' }}>{cell}</td>
          ))}</tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- BarChart`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add amava-me/src/components/StatCard.tsx amava-me/src/components/BarChart.tsx amava-me/src/components/Sparkline.tsx amava-me/src/components/ReportTable.tsx amava-me/src/components/BarChart.test.tsx
git commit -m "feat: SVG StatCard/BarChart/Sparkline + ReportTable components"
```

---

## Task 6: ReportView (presentational composition)

**Files:**
- Create: `amava-me/src/components/ReportView.tsx`
- Test: `amava-me/src/components/ReportView.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `amava-me/src/components/ReportView.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportView } from './ReportView'
import type { Report } from '../domain/report-metrics'

const report: Report = {
  childrenInScope: 2, withBaseline: 2, withFollowUp: 2,
  headlines: [{ indicatorId: 'i1', indicatorText: 'Listens', percentImproved: 100, nImproved: 2, nMeasured: 2 }],
  areas: [{
    areaId: 'gen', areaName: 'General', nMeasured: 2, percentImproved: 100, avgBaseline: 1.5, avgLatest: 3,
    indicators: [{
      indicatorId: 'i1', indicatorText: 'Listens', areaId: 'gen',
      nMeasured: 2, nImproved: 2, nStable: 0, nDeclined: 0, percentImproved: 100,
      avgBaseline: 1.5, avgLatest: 3, avgChange: 1.5,
    }],
  }],
}

describe('ReportView (aggregate)', () => {
  it('shows a headline percentage and the area name and indicator row', () => {
    render(<ReportView scaleMax={4} aggregate={report} />)
    expect(screen.getByText(/100%/)).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Listens')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ReportView`
Expected: FAIL — "Cannot find module './ReportView'".

- [ ] **Step 3: Implement ReportView**

Create `amava-me/src/components/ReportView.tsx`:
```tsx
import type { Report, ChildReport } from '../domain/report-metrics'
import { StatCard } from './StatCard'
import { BarChart } from './BarChart'
import { Sparkline } from './Sparkline'
import { ReportTable } from './ReportTable'

interface Props {
  scaleMax: number
  aggregate?: Report
  child?: ChildReport
}

export function ReportView({ scaleMax, aggregate, child }: Props) {
  if (child) return <ChildReportBody report={child} scaleMax={scaleMax} />
  if (aggregate) return <AggregateBody report={aggregate} scaleMax={scaleMax} />
  return <p>No data.</p>
}

function AggregateBody({ report, scaleMax }: { report: Report; scaleMax: number }) {
  const top = report.headlines.slice(0, 3)
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard value={`${report.childrenInScope}`} label="Children" sub={`${report.withFollowUp} with follow-up`} />
        {top.map(h => (
          <StatCard key={h.indicatorId} value={`${h.percentImproved}%`} label="improved"
            sub={`${h.indicatorText} (${h.nImproved}/${h.nMeasured})`} />
        ))}
      </div>
      {report.areas.map(area => (
        <section key={area.areaId} style={{ marginBottom: 24 }}>
          <h3>{area.areaName}</h3>
          <BarChart
            max={scaleMax}
            data={area.indicators
              .filter(i => i.avgLatest !== null)
              .map(i => ({ label: i.indicatorText.slice(0, 10), value: i.avgLatest as number }))}
          />
          <ReportTable
            columns={['Indicator', 'Measured', 'Improved', 'Stable', 'Declined', '% improved', 'Avg base', 'Avg latest']}
            rows={area.indicators.map(i => [
              i.indicatorText, i.nMeasured, i.nImproved, i.nStable, i.nDeclined,
              `${i.percentImproved}%`, i.avgBaseline ?? '—', i.avgLatest ?? '—',
            ])}
          />
        </section>
      ))}
    </div>
  )
}

function ChildReportBody({ report, scaleMax }: { report: ChildReport; scaleMax: number }) {
  return (
    <div>
      <h2>{report.childName}</h2>
      {report.trends.map(t => (
        <div key={t.areaId} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ minWidth: 160 }}>{t.areaName}</span>
          <Sparkline points={t.points.map(p => p.avgScore)} max={scaleMax} />
        </div>
      ))}
      <ReportTable
        columns={['Indicator', 'Baseline', 'Latest', 'Change', 'Status']}
        rows={report.rows.map(r => [
          r.indicatorText, r.baseline ?? '—', r.latest ?? '—',
          r.change === null ? '—' : (r.change > 0 ? `+${r.change}` : `${r.change}`),
          r.classification ?? '—',
        ])}
      />
      {report.observations.length > 0 && (
        <section>
          <h3>Observations</h3>
          <ul>{report.observations.map((o, i) => <li key={i}>{o.date}: {o.note}</li>)}</ul>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ReportView`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/components/ReportView.tsx amava-me/src/components/ReportView.test.tsx
git commit -m "feat: ReportView composing stat cards, charts, and tables"
```

---

## Task 7: use-report-data hook + ReportsScreen

**Files:**
- Create: `amava-me/src/hooks/use-report-data.ts`, `amava-me/src/screens/ReportsScreen.tsx`

- [ ] **Step 1: Implement the data hook**

Create `amava-me/src/hooks/use-report-data.ts`:
```ts
import { useEffect, useState } from 'react'
import type { Assessment } from '../domain/types'
import { useAppServices } from '../app-context'

/** Loads all assessments the user may see (cache-first, then refresh from server). */
export function useReportAssessments() {
  const { store, engine } = useAppServices()
  const [assessments, setAssessments] = useState<Assessment[] | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const cached = await store.getAllAssessments()
      if (active && cached.length) setAssessments(cached)
      try {
        await engine.pull()
        const fresh = await store.getAllAssessments()
        if (active) setAssessments(fresh)
      } catch {
        if (active && !cached.length) setAssessments([])
      }
    })()
    return () => { active = false }
  }, [store, engine])

  return assessments
}
```

- [ ] **Step 2: Implement ReportsScreen**

Create `amava-me/src/screens/ReportsScreen.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useReportAssessments } from '../hooks/use-report-data'
import { buildReport, buildChildReport } from '../domain/report-metrics'
import { aggregateCsv, childCsv } from '../domain/csv'
import { downloadText } from '../lib/download'
import { ReportView } from '../components/ReportView'
import { IMPROVED_THRESHOLD } from '../config'
import type { Child } from '../domain/types'

type Scope = { kind: 'org' } | { kind: 'programme'; id: string } | { kind: 'class'; id: string } | { kind: 'child'; id: string }

export function ReportsScreen() {
  const { session } = useAuth()
  const ref = useReferenceData()
  const assessments = useReportAssessments()
  const [scope, setScope] = useState<Scope>({ kind: 'org' })

  const report = useMemo(() => {
    if (!ref || !assessments) return null
    const me = ref.facilitators.find(f => f.id === session?.user.id)
    const isCoordinator = me?.role === 'coordinator'
    // Children the user may report on (defence-in-depth; RLS already filters assessments).
    const visibleClassIds = new Set(isCoordinator ? ref.classes.map(c => c.id) : (me?.classIds ?? []))
    const visibleChildren = ref.children.filter(c => visibleClassIds.has(c.classId))

    const inScope = (children: Child[]) => {
      if (scope.kind === 'org') return children
      if (scope.kind === 'programme') {
        const classIds = new Set(ref.classes.filter(c => c.programmeId === scope.id).map(c => c.id))
        return children.filter(c => classIds.has(c.classId))
      }
      if (scope.kind === 'class') return children.filter(c => c.classId === scope.id)
      return children.filter(c => c.id === scope.id)
    }

    if (scope.kind === 'child') {
      const child = visibleChildren.find(c => c.id === scope.id)
      if (!child) return null
      const cls = ref.classes.find(c => c.id === child.classId)
      const areas = ref.areas.filter(a => a.programmeId === cls?.programmeId)
      const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
      const programme = ref.programmes.find(p => p.id === cls?.programmeId)
      return {
        kind: 'child' as const,
        scaleMax: programme?.scaleMax ?? 4,
        child: buildChildReport({
          child,
          history: assessments.filter(a => a.childId === child.id),
          areas, indicators, threshold: IMPROVED_THRESHOLD,
        }),
      }
    }

    const children = inScope(visibleChildren)
    // Use the first programme's structure for the scope (single-programme today).
    const programme = ref.programmes[0]
    const areas = ref.areas.filter(a => a.programmeId === programme?.id)
    const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
    return {
      kind: 'aggregate' as const,
      scaleMax: programme?.scaleMax ?? 4,
      aggregate: buildReport({ children, assessments, areas, indicators, threshold: IMPROVED_THRESHOLD }),
    }
  }, [ref, assessments, scope, session])

  if (!ref || !assessments) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const myClasses = ref.classes.filter(c => isCoordinator || me?.classIds.includes(c.id))
  const myChildren = ref.children.filter(c => myClasses.some(cl => cl.id === c.classId))

  function exportCsv() {
    if (!report) return
    if (report.kind === 'child') downloadText(`amava-${report.child.childName}-report.csv`, childCsv(report.child))
    else downloadText(`amava-${scope.kind}-report.csv`, aggregateCsv(report.aggregate))
  }

  return (
    <div className="container">
      <h1>Reports</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }} className="no-print">
        {isCoordinator && <button onClick={() => setScope({ kind: 'org' })}>Organisation</button>}
        {isCoordinator && ref.programmes.map(p => (
          <button key={p.id} onClick={() => setScope({ kind: 'programme', id: p.id })}>{p.name}</button>
        ))}
        {myClasses.map(c => (
          <button key={c.id} onClick={() => setScope({ kind: 'class', id: c.id })}>{c.name}</button>
        ))}
        <select onChange={e => e.target.value && setScope({ kind: 'child', id: e.target.value })} defaultValue="">
          <option value="" disabled>A child…</option>
          {myChildren.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>)}
        </select>
      </div>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportCsv}>Export CSV</button>
        <button onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      {report
        ? <ReportView scaleMax={report.scaleMax} aggregate={report.kind === 'aggregate' ? report.aggregate : undefined} child={report.kind === 'child' ? report.child : undefined} />
        : <p>Nothing to show for this selection.</p>}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: compiles cleanly.

- [ ] **Step 4: Commit**

```bash
git add amava-me/src/hooks/use-report-data.ts amava-me/src/screens/ReportsScreen.tsx
git commit -m "feat: report data hook and ReportsScreen with scope/export"
```

---

## Task 8: Wire route, Home link, and print styles

**Files:**
- Modify: `amava-me/src/App.tsx`, `amava-me/src/screens/HomeScreen.tsx`, `amava-me/src/main.tsx`
- Create: `amava-me/src/styles/print.css`

- [ ] **Step 1: Add the /reports route**

In `amava-me/src/App.tsx`, add the import and route. Add to imports:
```tsx
import { ReportsScreen } from './screens/ReportsScreen'
```
Add this `<Route>` alongside the others (inside `<Routes>`):
```tsx
      <Route path="/reports" element={<RequireAuth><AppServicesProvider><ReportsScreen /></AppServicesProvider></RequireAuth>} />
```

- [ ] **Step 2: Add a Reports link on Home**

In `amava-me/src/screens/HomeScreen.tsx`, add `Link` is already imported. Add this just after the `<h1>My classes</h1>` line (before the classes list/empty-state):
```tsx
      <p className="no-print"><Link to="/reports">View reports →</Link></p>
```

- [ ] **Step 3: Create print styles**

Create `amava-me/src/styles/print.css`:
```css
@media print {
  .no-print { display: none !important; }
  .container { max-width: 100%; }
  a[href]::after { content: ''; } /* don't print URLs after links */
  h1, h2, h3 { color: #000; }
}
```

- [ ] **Step 4: Import print styles**

In `amava-me/src/main.tsx`, add after the existing `import './styles/base.css'` line:
```tsx
import './styles/print.css'
```

- [ ] **Step 5: Run the full suite and build**

Run: `npm run test`
Expected: ALL suites pass (M1 suites + report-metrics, csv, BarChart, ReportView).
Run: `npm run build`
Expected: clean production build.

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/App.tsx amava-me/src/screens/HomeScreen.tsx amava-me/src/main.tsx amava-me/src/styles/print.css
git commit -m "feat: wire /reports route, Home link, and print styles"
```

---

## Self-Review

**Spec coverage:**
- Engine: improved/stable/declined counts + %, avg baseline/latest/change, coverage, headlines → Task 2 ✓; child-level rows + trends + observations → Task 3 ✓
- Four levels (child/class/programme/org) → Task 7 scope logic ✓
- Role-based access (coordinator all; facilitator own classes) → Task 7 (`visibleClassIds`, scope buttons gated by `isCoordinator`); enforced in depth by RLS ✓
- Stat cards + simple charts + tables → Tasks 5, 6 ✓
- CSV export (child + aggregate, anonymised aggregate) → Task 4 + Task 7 wiring ✓
- Print-to-PDF interim → Task 8 print.css + `window.print()` ✓
- Threshold from config (M3-ready) → Task 1 `IMPROVED_THRESHOLD`, used in Task 7 ✓
- `getAllAssessments` for offline reporting → Task 1 ✓
- No new runtime dependency (hand-rolled SVG) → Tasks 5, 6 ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `Report`/`AreaReport`/`IndicatorReport`/`Headline` (Task 2) and `ChildReport`/`ChildIndicatorRow`/`ChildAreaTrend`/`ChildObservation` (Task 3) are consumed unchanged by `csv.ts` (Task 4), `ReportView` (Task 6), and `ReportsScreen` (Task 7). `buildReport`/`buildChildReport` input shapes match call sites. `downloadText`, `aggregateCsv`, `childCsv`, `IMPROVED_THRESHOLD`, `getAllAssessments` names match across tasks. `BarChart` prop `{data:{label,value}[], max}`, `Sparkline` `{points:number[], max}`, `StatCard` `{value,label,sub}`, `ReportTable` `{columns, rows}` match ReportView usage. ✓

**Note on single-programme assumption:** Task 7 aggregate path uses `ref.programmes[0]` for area/indicator structure (correct today — one programme). When M3 introduces multiple programmes, programme/org rollups must iterate programmes; flagged here so it isn't a silent gap.
