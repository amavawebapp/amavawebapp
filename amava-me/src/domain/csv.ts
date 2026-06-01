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
  const rows = report.rows.map(r => [r.areaName, r.indicatorText, r.baseline, r.latest, r.change, r.classification])
  return rowsToCsv(header, rows)
}
