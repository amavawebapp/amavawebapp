# Amava M&E — Milestone 2: Reporting

**Design specification**
Date: 2026-06-01
Builds on: Milestone 1 (offline capture). See `2026-06-01-amava-me-tool-design.md` §6.

---

## 1. Purpose

Turn the assessments captured in M1 into the **confirmed quantitative impact data** Amava
needs for its board, internal team, and two reporting funders — at four levels (child,
class, programme, organisation), replacing reliance on qualitative stories alone.

Headline outputs the org explicitly wants, e.g.:
- *"X% of children improved in seeing the garden as a safe space since baseline."*
- *"X children increased in confidence"* (maps to the *strong sense of self* indicator).

## 2. Scope

**In scope:** the reporting engine (pure functions), four report levels, role-based access,
on-screen stat cards + simple charts + breakdown tables, CSV export, and a print-friendly
layout (browser "Print → Save as PDF" as the interim funder output).

**Out of scope:**
- **Branded PDF export** — Milestone 4.
- **Editable thresholds / indicators / scale** — Milestone 3. M2 uses a default
  "improved" threshold of **+1**, read from a single config constant so M3 can later wire
  an editor without touching report logic.
- Server-side aggregation — not needed at this scale.

## 3. Key decisions (confirmed)

| Decision | Choice |
|---|---|
| Where figures are computed | **Client-side**, from synced/cached data (reuses the M1 data layer) |
| Visual richness | **Stat cards + simple charts** |
| Charting | **Hand-rolled SVG** (bars + sparkline) — no new dependency, small bundle |
| Access | **Coordinators:** all four levels. **Facilitators:** Class + Child for their own classes only (enforced by existing RLS) |
| Interim funder output | **CSV + print-friendly page** now; branded PDF in M4 |

## 4. The reporting engine (pure, tested)

A new `domain/report-metrics.ts`, building on M1's `assessment-logic`
(`indicatorChange`, `classifyChange`). Given a set of children and their assessments it
computes, per indicator and aggregated per area:

- **# and % of children improved / stable / declined.** "Improved" = change ≥ the
  configured threshold (default **+1**); "declined" = change < 0; else "stable". Only
  children with both a baseline and at least one later assessment count toward
  change-based figures.
- **Average baseline score and average latest score** (per indicator and per area), plus
  average change.
- **Coverage counts:** children with a baseline; children with ≥1 follow-up.
- **Headline statements** per indicator, e.g. `{ indicatorText, percentImproved,
  nImproved, nMeasured }`, ready to render as "78% of children improved in …".

Integrity carried from M1: changes use the **baseline vs latest** scores, and reports rely
on the per-assessment `indicatorText` / `scaleMax` snapshots so that retiring or rewording
an indicator later (M3) never breaks historical figures. Indicators are grouped by their
`indicatorId`; the displayed label uses the most recent snapshot text.

## 5. Report levels (one engine, different child set)

- **Child** — identified. Full assessment history, per-indicator baseline→latest with
  change and classification, per-area trend across assessments, observation notes.
  Export is coordinator-only (contains a name).
- **Class** — all sample children in one class: aggregates + per-indicator movement.
- **Programme** — all classes in a programme, rolled up.
- **Organisation** — everything; headline impact stats. Anonymised.

All aggregate levels (class/programme/org) show **counts and percentages only — no child
names**. Filters available on every report: **date range** and **development area**.

The date range keeps the baseline always and bounds which *follow-ups* are counted (so a
report reads as "progress as of this period, vs baseline"); a window that dropped the
baseline would break every change figure. A literal **assessment-type** filter
(baseline/quarterly/all) was considered but **dropped** — it doesn't fit a
baseline-vs-latest model (filtering to "baseline only" leaves nothing to compare against).

## 6. Access model

The Reports area is role-aware:
- **Coordinator:** can pick any scope (Org / Programme / Class / Child).
- **Facilitator:** can pick Class / Child, limited to their assigned class(es).

This is defence-in-depth: the UI hides disallowed scopes, and the database RLS already
prevents a facilitator from fetching assessments outside their classes, so the engine
physically cannot produce other classes' figures for them.

## 7. Screens & components

- **ReportsScreen** (`screens/ReportsScreen.tsx`): a scope picker (Org/Programme/Class/
  Child, filtered by role) + filter controls (date range, area, type). Renders the
  selected report and the export buttons.
- **StatCard** — a headline number with a label (e.g. "78% improved · confidence").
- **BarChart** (SVG) — per-area bars: average baseline vs latest, and/or % improved.
- **Sparkline** (SVG) — small per-area trend across a child's assessments (Child report).
- **ReportTable** — per-indicator breakdown rows.
- A **print-friendly** CSS path (`@media print`) so the current report prints cleanly to
  PDF with Amava colours and without nav chrome.

## 8. Export

- **CSV** (client-side, no dependency — build a string, download via a Blob):
  - **Child CSV:** columns `area, indicator, baseline, latest, change, classification`.
  - **Class / Programme / Org CSV:** columns `area, indicator, n_measured, n_improved,
    n_stable, n_declined, percent_improved, avg_baseline, avg_latest, avg_change`.
    Anonymised (no names).
  - Filenames encode scope + date, e.g. `amava-class-1-report-2026-06-01.csv`.
- **Print to PDF:** the print-friendly layout from §7 (interim until the branded PDF in M4).

## 9. Data flow

- `hooks/use-report-data.ts` assembles the inputs for a chosen scope: the cached
  `ReferenceData` (children/classes/programmes) plus the assessments the user may see.
- The M1 `SyncClient.fetchAssessmentsForFacilitator()` already returns **all** assessments
  visible to the signed-in user under RLS (coordinator = all; facilitator = own classes).
  Add `LocalStore.getAllAssessments()` so reports also work offline from the cache.
- Reports compute from this in-memory set. A coordinator running reports online refreshes
  via a normal sync first.

## 10. New / changed files

- `src/domain/report-metrics.ts` + `report-metrics.test.ts`
- `src/domain/csv.ts` + `csv.test.ts`
- `src/hooks/use-report-data.ts`
- `src/screens/ReportsScreen.tsx`
- `src/components/StatCard.tsx`, `BarChart.tsx`, `Sparkline.tsx`, `ReportTable.tsx`
- `src/config.ts` — exports `IMPROVED_THRESHOLD = 1` (single source; M3 will make it editable)
- Changed: `src/data/datastore.ts` + `src/data/local-store.ts` — add `getAllAssessments()`
- Changed: `src/App.tsx` (a `/reports` route), `src/screens/HomeScreen.tsx` (a link)

## 11. Testing

- `report-metrics` and `csv` are pure functions, fully TDD'd against fixed datasets with
  known expected outputs (improved/stable/declined counts, percentages, averages, CSV
  text). Edge cases: a child with no baseline (excluded from change stats), an indicator
  scored at baseline only (no change), an empty set (zero-safe, no divide-by-zero).
- One ReportsScreen component test renders a known dataset and asserts a headline figure
  and a table row appear.

## 12. Success criteria

- A coordinator can open Reports, pick Organisation, and see headline stats like
  *"X% of children improved in [indicator] since baseline"*, plus per-area charts and a
  per-indicator table; and can do the same scoped to a Programme, Class, or Child.
- A facilitator sees only their own class/child reports.
- Any report exports to a correct CSV, and prints cleanly to PDF.
- All figures recompute correctly when an indicator is later reworded or retired (M3),
  because they key on indicator id + per-assessment snapshots.
- Pure-function test suite green; runs within free-tier limits at current scale.
