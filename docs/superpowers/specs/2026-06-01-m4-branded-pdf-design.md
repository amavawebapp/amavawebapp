# Amava M&E — Milestone 4: Branded Funder PDF

**Design specification**
Date: 2026-06-01
Builds on: M1, M2, M3a/b/c.

---

## 1. Purpose

Give coordinators a one-click **branded, funder-ready PDF** of any report (child / class /
programme / organisation), generated client-side and offline. Replaces the interim
"Print → Save as PDF" with a proper Amava-branded document for the two reporting funders.

## 2. Decisions (confirmed)

| Decision | Choice |
|---|---|
| Generator | **pdfmake** (client-side, lazy-loaded; vector text; native SVG) |
| Charts | **Embedded** as SVG (crisp vector, not raster) |
| Logo | Real logo file (user-provided) with a **wordmark fallback** until supplied |
| Footer | **Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213** + reporting period + page numbers |
| Anonymisation | Aggregate PDFs = counts/percentages only; child PDF (named) = **coordinator-only** |
| Fonts | pdfmake built-in font + brand palette (custom font embedding out of scope) |

## 3. Content & layout

- **Header:** logo (or "Amava Oluntu" wordmark in brand slate `#687F8B`); report title with
  scope label and reporting period.
- **Headline stats:** a row of the top headline figures (e.g. "78% improved — confidence
  (7/9)").
- **Per development area:** a bar chart (SVG, avg latest per indicator) followed by the
  per-indicator breakdown table (indicator, measured, improved, stable, declined, %improved,
  avg baseline, avg latest).
- **Organisation scope:** one section per active programme (mirrors the on-screen
  multi-programme report).
- **Child report:** name + per-indicator baseline/latest/change/status table + observations;
  coordinator-only export.
- **Footer (every page):** registration line, reporting period, page X of Y.

## 4. Architecture (units)

- **`src/domain/chart-svg.ts`** (pure): `barChartSvg(data: {label,value}[], max, opts?)` →
  an SVG **string** using explicit hex brand colours (no CSS vars, which don't resolve in
  PDF). Mirrors the on-screen `BarChart` geometry.
- **`src/domain/pdf-report.ts`** (pure): `buildReportDoc(input)` → a pdfmake
  `TDocumentDefinitions` plain object. Input: `{ kind: 'aggregate'|'child'|'org', report?,
  child?, sections?, scaleMax, title, period, regLine, logoDataUrl }`. Builds header,
  headline stats, per-area chart+table (via `barChartSvg`), footer. No pdfmake import here —
  it returns a plain object, so it is unit-testable without the library.
- **`src/lib/pdf.ts`**: `downloadPdf(doc, filename)` — dynamically `import('pdfmake/build/pdfmake')`
  + `import('pdfmake/build/vfs_fonts')`, creates the PDF, triggers download. Lazy import keeps
  pdfmake out of the main bundle.
- **`src/lib/logo.ts`**: `export const LOGO_DATA_URL = ''` — empty by default; when the real
  logo is supplied it becomes a base64 data URL. `buildReportDoc` renders the logo image when
  non-empty, else the text wordmark.
- **`src/screens/ReportsScreen.tsx`**: a **Download PDF** button beside Export CSV. Builds the
  input from the current `report` (aggregate/child/org) + the `from`/`to` period, computes the
  filename, calls `downloadPdf`. Gated by the same `canExport` rule (child PDF coordinator-only).

## 5. Reporting-period string

A small helper formats the period from the `from`/`to` filters: both set → "1 Jan 2026 –
30 Apr 2026"; only one → "from …"/"to …"; neither → "All dates". Pure, covered by tests.

## 6. Testing

- `chart-svg`: `barChartSvg` returns a string starting `<svg` with one `<rect` per data point
  and the brand hex fill; empty data → an `<svg>` with no rects (no crash). TDD.
- `pdf-report`: `buildReportDoc` for an aggregate report returns a docDefinition whose
  serialized form contains the title, the reg-number footer line, an area name, an indicator
  row value, and an `svg` node; child kind includes the child name; org kind includes each
  programme name. `formatPeriod` cases. TDD.
- `downloadPdf` (DOM + pdfmake) and the ReportsScreen button verified by build + manual.

## 7. Out of scope

Custom brand-font embedding; user-editable PDF templates; emailing PDFs. One new runtime
dependency (`pdfmake`) — justified, lazy-loaded.

## 8. Success criteria

- From any report, a coordinator clicks **Download PDF** and gets a branded PDF with the
  header, headline stats, per-area charts + tables, and the registration footer.
- Org-scope PDF contains a section per programme; child PDF is coordinator-only and named.
- Reporting period reflects the active date filter.
- When a logo data URL is supplied, it appears in the header automatically (no other change).
- Pure-function suite green; main bundle not bloated (pdfmake lazy-loaded); M1–M3 unaffected.
