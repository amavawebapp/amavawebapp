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
    expect(report.withFollowUp).toBe(2)
  })
  it('computes per-indicator improved/stable/declined over measured children only', () => {
    const i1 = report.areas[0].indicators.find(i => i.indicatorId === 'i1')!
    expect(i1.nMeasured).toBe(2)
    expect(i1.nImproved).toBe(2)
    expect(i1.percentImproved).toBe(100)
    const i2 = report.areas[0].indicators.find(i => i.indicatorId === 'i2')!
    expect(i2.nMeasured).toBe(2)
    expect(i2.nStable).toBe(1)
    expect(i2.nDeclined).toBe(1)
    expect(i2.percentImproved).toBe(0)
  })
  it('computes average baseline/latest/change per indicator over measured children', () => {
    const i1 = report.areas[0].indicators.find(i => i.indicatorId === 'i1')!
    expect(i1.avgBaseline).toBe(1.5)
    expect(i1.avgLatest).toBe(3)
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

import { buildChildReport } from './report-metrics'

describe('buildChildReport', () => {
  const cArea: DevelopmentArea = { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true }
  const cIndicators: Indicator[] = [
    { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
  ]
  const childA: Child = { id: 'A', classId: 'c', firstName: 'Lebo', surname: 'M', fields: {}, dateStarted: '2026-01-01', isSample: true, active: true }
  const history: Assessment[] = [
    ax('a1', 'A', 'baseline', '2026-01-10', { i1: 2 }),
    ax('a2', 'A', 'quarterly', '2026-04-10', { i1: 4 }),
  ]

  it('builds per-indicator baseline/latest/change/classification rows', () => {
    const r = buildChildReport({ child: childA, history, areas: [cArea], indicators: cIndicators, threshold: 1 })
    expect(r.childName).toBe('Lebo M')
    expect(r.rows[0]).toMatchObject({ indicatorId: 'i1', baseline: 2, latest: 4, change: 2, classification: 'improved' })
  })
  it('builds a per-area trend series across assessments by date', () => {
    const r = buildChildReport({ child: childA, history, areas: [cArea], indicators: cIndicators, threshold: 1 })
    const trend = r.trends[0]
    expect(trend.areaId).toBe('gen')
    expect(trend.points.map(p => p.date)).toEqual(['2026-01-10', '2026-04-10'])
    expect(trend.points.map(p => p.avgScore)).toEqual([2, 4])
  })
  it('leaves change null when there is no follow-up', () => {
    const r = buildChildReport({ child: childA, history: [history[0]], areas: [cArea], indicators: cIndicators, threshold: 1 })
    expect(r.rows[0]).toMatchObject({ baseline: 2, latest: null, change: null, classification: null })
  })
})
