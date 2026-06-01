import { describe, it, expect } from 'vitest'
import { aggregateCsv, childCsv } from './csv'
import type { Report, ChildReport } from './report-metrics'

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
      rows: [{ indicatorId: 'i1', indicatorText: 'Listens', areaId: 'gen', areaName: 'General', baseline: 2, latest: 4, change: 2, classification: 'improved' }],
    }
    const lines = childCsv(cr).trim().split('\n')
    expect(lines[0]).toBe('area,indicator,baseline,latest,change,classification')
    expect(lines[1]).toBe('General,Listens,2,4,2,improved')
  })
})
