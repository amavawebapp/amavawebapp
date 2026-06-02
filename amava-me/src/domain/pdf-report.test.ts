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
