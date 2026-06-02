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
