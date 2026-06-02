# Milestone 4 — Branded Funder PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Download PDF" button on the Reports screen produces a branded, funder-ready PDF (header/logo, headline stats, per-area SVG charts + tables, registration footer) of the current report, client-side and offline.

**Architecture:** Two pure modules build the artefacts — `chart-svg` (SVG strings) and `pdf-report` (a pdfmake document-definition plain object) — so the logic is fully unit-testable with no library import. A thin `lib/pdf` lazy-loads pdfmake to render/download. ReportsScreen wires a button gated like the CSV export.

**Tech Stack:** Existing stack + **pdfmake** (one new runtime dependency, lazy-loaded/code-split).

---

## File Structure

```
amava-me/src/
  domain/
    chart-svg.ts          # barChartSvg(data, max) -> SVG string (hex brand colours)
    chart-svg.test.ts
    pdf-report.ts         # formatPeriod + buildReportDoc -> pdfmake docDefinition (plain object)
    pdf-report.test.ts
  lib/
    logo.ts               # LOGO_DATA_URL ('' until the real logo is supplied)
    pdf.ts                # downloadPdf(doc, filename) -- lazy-imports pdfmake (DOM)
  screens/
    ReportsScreen.tsx     # + "Download PDF" button
```

---

## Task 1: chart-svg (SVG bar chart strings), TDD

**Files:**
- Create: `amava-me/src/domain/chart-svg.ts`
- Test: `amava-me/src/domain/chart-svg.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `amava-me/src/domain/chart-svg.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { barChartSvg } from './chart-svg'

describe('barChartSvg', () => {
  it('returns an <svg> string with one rect per data point in the brand colour', () => {
    const svg = barChartSvg([{ label: 'A', value: 2 }, { label: 'B', value: 4 }], 4)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect((svg.match(/<rect/g) || []).length).toBe(2)
    expect(svg).toContain('#687F8B')
  })
  it('escapes special characters in labels', () => {
    const svg = barChartSvg([{ label: 'A & B', value: 1 }], 4)
    expect(svg).toContain('A &amp; B')
    expect(svg).not.toContain('A & B<')
  })
  it('produces an svg with no rects for empty data without crashing', () => {
    const svg = barChartSvg([], 4)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).not.toContain('<rect')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- chart-svg`
Expected: FAIL — "Cannot find module './chart-svg'".

- [ ] **Step 3: Implement**

Create `amava-me/src/domain/chart-svg.ts`:
```ts
export interface Bar { label: string; value: number }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** A bar chart as an SVG string (explicit hex brand colours — CSS vars don't resolve in PDF). */
export function barChartSvg(data: Bar[], max: number, opts?: { height?: number }): string {
  const height = opts?.height ?? 140, barW = 48, gap = 16, padBottom = 20
  const width = Math.max(1, data.length * (barW + gap))
  const safeMax = max > 0 ? max : 1
  const body = data.map((d, i) => {
    const h = Math.max(0, (d.value / safeMax) * (height - padBottom))
    const x = i * (barW + gap) + gap / 2
    const y = height - padBottom - h
    const cx = x + barW / 2
    return (
      `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="#687F8B"/>` +
      `<text x="${cx}" y="${height - 6}" font-size="11" text-anchor="middle" fill="#6b7780">${escapeXml(d.label)}</text>` +
      `<text x="${cx}" y="${y - 4}" font-size="11" text-anchor="middle" fill="#2b3338">${d.value}</text>`
    )
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- chart-svg`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/domain/chart-svg.ts amava-me/src/domain/chart-svg.test.ts
git commit -m "feat: barChartSvg for embedding charts in the PDF"
```

---

## Task 2: pdf-report (period + document builder), TDD

**Files:**
- Create: `amava-me/src/lib/logo.ts`, `amava-me/src/domain/pdf-report.ts`
- Test: `amava-me/src/domain/pdf-report.test.ts`

- [ ] **Step 1: Create the logo slot**

Create `amava-me/src/lib/logo.ts`:
```ts
/** Base64 data URL of the Amava logo. Empty = use the text wordmark fallback.
 *  When the real logo is supplied, set this to e.g. 'data:image/png;base64,iVBOR...'. */
export const LOGO_DATA_URL = ''
```

- [ ] **Step 2: Write the failing tests**

Create `amava-me/src/domain/pdf-report.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatPeriod, buildReportDoc } from './pdf-report'
import type { Report, ChildReport } from './report-metrics'

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
const REG = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'

describe('formatPeriod', () => {
  it('formats a full range', () => {
    expect(formatPeriod('2026-01-01', '2026-04-30')).toBe('1 Jan 2026 – 30 Apr 2026')
  })
  it('handles open-ended and empty', () => {
    expect(formatPeriod('2026-01-01', '')).toBe('from 1 Jan 2026')
    expect(formatPeriod('', '2026-04-30')).toBe('to 30 Apr 2026')
    expect(formatPeriod('', '')).toBe('All dates')
  })
})

describe('buildReportDoc', () => {
  it('builds an aggregate doc with title, area, indicator, and an svg chart', () => {
    const doc = buildReportDoc({ kind: 'aggregate', title: 'Test Report', period: 'All dates', regLine: REG, scaleMax: 4, report })
    const s = JSON.stringify(doc.content)
    expect(s).toContain('Test Report')
    expect(s).toContain('General')
    expect(s).toContain('Listens')
    expect(s).toContain('svg')
  })
  it('puts the registration line and page numbers in the footer', () => {
    const doc = buildReportDoc({ kind: 'aggregate', title: 'T', period: 'All dates', regLine: REG, scaleMax: 4, report })
    const footer = JSON.stringify(doc.footer(1, 3))
    expect(footer).toContain('2011/108066/08')
    expect(footer).toContain('Page 1 of 3')
  })
  it('builds a child doc containing the child name', () => {
    const child: ChildReport = {
      childId: 'A', childName: 'Lebo M', trends: [], observations: [],
      rows: [{ indicatorId: 'i1', indicatorText: 'Listens', areaId: 'gen', areaName: 'General', baseline: 2, latest: 4, change: 2, classification: 'improved' }],
    }
    const doc = buildReportDoc({ kind: 'child', title: 'Child', period: 'All dates', regLine: REG, scaleMax: 4, child })
    expect(JSON.stringify(doc.content)).toContain('Lebo M')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- pdf-report`
Expected: FAIL — "Cannot find module './pdf-report'".

- [ ] **Step 4: Implement**

Create `amava-me/src/domain/pdf-report.ts`:
```ts
import type { Report, ChildReport, OrgSection } from './report-metrics'
import { barChartSvg } from './chart-svg'
import { LOGO_DATA_URL } from '../lib/logo'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : d
}
export function formatPeriod(from: string, to: string): string {
  if (from && to) return `${fmtDate(from)} – ${fmtDate(to)}`
  if (from) return `from ${fmtDate(from)}`
  if (to) return `to ${fmtDate(to)}`
  return 'All dates'
}

export interface PdfInput {
  kind: 'aggregate' | 'child' | 'org'
  title: string
  period: string
  regLine: string
  scaleMax: number
  report?: Report
  child?: ChildReport
  sections?: OrgSection[]
  logoDataUrl?: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function headlineBlocks(report: Report): any[] {
  const top = report.headlines.slice(0, 3)
  if (!top.length) return []
  return [{
    columns: top.map(h => ({
      width: '*',
      stack: [
        { text: `${h.percentImproved}%`, style: 'big' },
        { text: `improved · ${h.indicatorText}`, fontSize: 9 },
        { text: `${h.nImproved}/${h.nMeasured} children`, fontSize: 8, color: '#6b7780' },
      ],
    })),
    columnGap: 10, margin: [0, 8, 0, 8],
  }]
}

function areaBlocks(report: Report, scaleMax: number): any[] {
  const out: any[] = []
  for (const area of report.areas) {
    out.push({ text: area.areaName, style: 'h2', margin: [0, 10, 0, 4] })
    const bars = area.indicators.filter(i => i.avgLatest !== null).map(i => ({ label: i.indicatorText.slice(0, 10), value: i.avgLatest as number }))
    if (bars.length) out.push({ svg: barChartSvg(bars, scaleMax), width: 380, margin: [0, 0, 0, 6] })
    out.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['Indicator', 'Measured', 'Improved', 'Stable', 'Declined', '% improved', 'Avg latest'].map(t => ({ text: t, style: 'th' })),
          ...area.indicators.map(i => [
            i.indicatorText, i.nMeasured, i.nImproved, i.nStable, i.nDeclined, `${i.percentImproved}%`, i.avgLatest ?? '—',
          ]),
        ],
      },
      layout: 'lightHorizontalLines', fontSize: 9, margin: [0, 0, 0, 8],
    })
  }
  return out
}

function header(input: PdfInput): any {
  const logo = input.logoDataUrl ?? LOGO_DATA_URL
  const brand = logo ? { image: logo, width: 90 } : { text: 'Amava Oluntu', style: 'wordmark' }
  return {
    columns: [
      brand,
      { stack: [
        { text: input.title, style: 'h1', alignment: 'right' },
        { text: input.period, alignment: 'right', color: '#6b7780', fontSize: 10 },
      ] },
    ],
    margin: [0, 0, 0, 10],
  }
}

function childBlocks(child: ChildReport): any[] {
  const out: any[] = [{ text: child.childName, style: 'h1', margin: [0, 8, 0, 6] }]
  out.push({
    table: {
      headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto'],
      body: [
        ['Indicator', 'Baseline', 'Latest', 'Change', 'Status'].map(t => ({ text: t, style: 'th' })),
        ...child.rows.map(r => [
          r.indicatorText, r.baseline ?? '—', r.latest ?? '—',
          r.change === null ? '—' : (r.change > 0 ? `+${r.change}` : `${r.change}`),
          r.classification ?? '—',
        ]),
      ],
    },
    layout: 'lightHorizontalLines', fontSize: 9, margin: [0, 0, 0, 8],
  })
  if (child.observations.length) {
    out.push({ text: 'Observations', style: 'h2', margin: [0, 8, 0, 4] })
    out.push({ ul: child.observations.map(o => `${o.date}: ${o.note}`), fontSize: 9 })
  }
  return out
}

export function buildReportDoc(input: PdfInput): any {
  const content: any[] = [header(input)]
  if (input.kind === 'child' && input.child) {
    content.push(...childBlocks(input.child))
  } else if (input.kind === 'org' && input.sections) {
    for (const s of input.sections) {
      content.push({ text: s.programmeName, style: 'h1', margin: [0, 12, 0, 4] })
      content.push(...headlineBlocks(s.report))
      content.push(...areaBlocks(s.report, s.scaleMax))
    }
  } else if (input.report) {
    content.push(...headlineBlocks(input.report))
    content.push(...areaBlocks(input.report, input.scaleMax))
  }

  return {
    pageMargins: [40, 40, 40, 55],
    content,
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: input.regLine, fontSize: 8, color: '#6b7780' },
        { text: input.period, fontSize: 8, alignment: 'center', color: '#6b7780' },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, alignment: 'right', color: '#6b7780' },
      ],
      margin: [40, 8, 40, 0],
    }),
    styles: {
      h1: { fontSize: 18, bold: true, color: '#687F8B' },
      h2: { fontSize: 13, bold: true, color: '#687F8B' },
      big: { fontSize: 26, bold: true, color: '#687F8B' },
      wordmark: { fontSize: 20, bold: true, color: '#687F8B' },
      th: { bold: true, fontSize: 9, color: '#2b3338' },
    },
    defaultStyle: { fontSize: 10, color: '#2b3338' },
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- pdf-report`
Expected: PASS. Also `npm run build` (the `any` doc type compiles).

- [ ] **Step 6: Commit**

```bash
git add amava-me/src/lib/logo.ts amava-me/src/domain/pdf-report.ts amava-me/src/domain/pdf-report.test.ts
git commit -m "feat: pdf-report document builder + period formatter + logo slot"
```

---

## Task 3: pdfmake dependency + downloadPdf

**Files:**
- Create: `amava-me/src/lib/pdf.ts`
- Modify: `amava-me/package.json` (deps)

- [ ] **Step 1: Install pdfmake**

From inside `amava-me/`:
```bash
npm install pdfmake
npm install -D @types/pdfmake
```

- [ ] **Step 2: Implement the downloader**

Create `amava-me/src/lib/pdf.ts`:
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/** Lazy-load pdfmake (keeps it out of the main bundle) and download the document. */
export async function downloadPdf(doc: any, filename: string): Promise<void> {
  const pdfMakeMod: any = await import('pdfmake/build/pdfmake')
  const vfsMod: any = await import('pdfmake/build/vfs_fonts')
  const pdfMake = pdfMakeMod.default ?? pdfMakeMod
  // vfs_fonts export shape varies across pdfmake versions — handle the common ones.
  const vfs = vfsMod.pdfMake?.vfs ?? vfsMod.default?.pdfMake?.vfs ?? vfsMod.default?.vfs ?? vfsMod.vfs
  if (vfs) pdfMake.vfs = vfs
  pdfMake.createPdf(doc).download(filename)
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` — must compile cleanly. (If `@types/pdfmake` causes a strict-mode type error on the dynamic import, the `any` annotations above absorb it; if the build still complains about missing types for the `pdfmake/build/*` subpaths, add `// @ts-expect-error` immediately above each `await import(...)` line — these are JS-only entrypoints.)
Run: `npm run test` — all suites still pass.

- [ ] **Step 4: Commit**

```bash
git add amava-me/package.json amava-me/package-lock.json amava-me/src/lib/pdf.ts
git commit -m "feat: pdfmake dependency + lazy downloadPdf helper"
```

---

## Task 4: Download-PDF button in ReportsScreen

**Files:**
- Modify: `amava-me/src/screens/ReportsScreen.tsx`

- [ ] **Step 1: Add imports**

In `amava-me/src/screens/ReportsScreen.tsx`, add:
```tsx
import { buildReportDoc, formatPeriod } from '../domain/pdf-report'
import { downloadPdf } from '../lib/pdf'
```

- [ ] **Step 2: Add the exportPdf handler**

In the component body, after the existing `exportCsv` function, add (uses the existing `report`, `scope`, `scopeLabel`, `today`, `from`, `to` in scope):
```tsx
  const REG_LINE = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'
  function exportPdf() {
    if (!report) return
    const period = formatPeriod(from, to)
    const title = report.kind === 'child' ? report.child.childName : `${scopeLabel.replace(/-/g, ' ')} report`
    const doc = buildReportDoc({
      kind: report.kind,
      title: `Amava M&E — ${title}`,
      period, regLine: REG_LINE,
      scaleMax: report.kind === 'child' || report.kind === 'aggregate' ? report.scaleMax : 4,
      report: report.kind === 'aggregate' ? report.aggregate : undefined,
      child: report.kind === 'child' ? report.child : undefined,
      sections: report.kind === 'org' ? report.sections : undefined,
    })
    const base = report.kind === 'child' ? slugify(report.child.childName) : `${scopeLabel}`
    downloadPdf(doc, `amava-${base}-${today}.pdf`).catch(e => console.error('PDF export failed', e))
  }
```
Note: `report.kind === 'org'` has no top-level `scaleMax` (each section carries its own), so passing `4` as a harmless default for the org case is fine — `buildReportDoc` uses `section.scaleMax` per section for org.

- [ ] **Step 3: Add the button**

Next to the existing `<button onClick={exportCsv} disabled={!canExport}>Export CSV</button>`, add:
```tsx
        <button onClick={exportPdf} disabled={!canExport}>Download PDF</button>
```
(The `canExport` gate already makes the child PDF coordinator-only, matching CSV.)

- [ ] **Step 4: Verify**

Run: `npm run test` — all suites pass.
Run: `npm run build` — clean; confirm the build output shows pdfmake split into its own async chunk (a separate `pdfmake`/`vfs_fonts` chunk), i.e. not inflating the main entry.

- [ ] **Step 5: Commit**

```bash
git add amava-me/src/screens/ReportsScreen.tsx
git commit -m "feat: Download PDF button on Reports (branded funder export)"
```

- [ ] **Step 6: Manual verification**

`npm run dev`, sign in as the coordinator, open Reports at Organisation scope, click **Download PDF** → a PDF downloads with the wordmark header, headline stats, per-area bar charts + tables, and the registration footer. Repeat for a Child report (coordinator) and confirm the name appears and a facilitator can't export it.

---

## Self-Review

**Spec coverage:**
- Download PDF of current report (child/class/programme/org) → Task 4 ✓
- pdfmake, lazy-loaded → Task 3 ✓
- SVG charts embedded → Tasks 1, 2 (`svg` node) ✓
- Header logo-or-wordmark → Task 2 `header()` + `logo.ts` slot ✓
- Headline stats + per-area tables → Task 2 `headlineBlocks`/`areaBlocks` ✓
- Org = section per programme → Task 2 (org branch) ✓
- Registration footer + period + page numbers → Task 2 `footer` ✓
- Reporting period from filters → Task 2 `formatPeriod`, Task 4 wiring ✓
- Anonymisation / child coordinator-only → Task 4 `canExport` gate (aggregate has no names by construction) ✓
- Logo data-url slot, wordmark fallback → Task 2 ✓

**Placeholder scan:** No TBD/TODO; complete code each step. (The `// @ts-expect-error` guidance in Task 3 is a conditional fallback, not a placeholder.)

**Type consistency:** `PdfInput` (Task 2) consumed by Task 4's `exportPdf`; `buildReportDoc`/`formatPeriod` names match; `barChartSvg` (Task 1) used by `pdf-report` (Task 2); `downloadPdf` (Task 3) called in Task 4. The `report` discriminated union (`child`/`aggregate`/`org`) is mapped to `PdfInput` fields with matching guards. `OrgSection` (from M3b report-metrics) reused in `PdfInput.sections`. ✓

**Note:** uses `any` for pdfmake document definitions (the library's types are awkward for dynamic import); justified and isolated to the PDF modules.
