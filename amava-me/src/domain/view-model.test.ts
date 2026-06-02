import { describe, it, expect } from 'vitest'
import { areaIcon, shortLabel, childStatus, deriveChildView } from './view-model'
import type { ChildReport } from './report-metrics'

describe('areaIcon', () => {
  it('is deterministic by index and cycles', () => {
    expect(areaIcon(0)).toBe(areaIcon(0))
    expect(typeof areaIcon(99)).toBe('string')
  })
})

describe('shortLabel', () => {
  it('passes through short text', () => { expect(shortLabel('Shares tools', 18)).toBe('Shares tools') })
  it('truncates long text with ellipsis', () => {
    const out = shortLabel('Cooperates with peers during group garden activities', 18)
    expect(out.length).toBeLessThanOrEqual(19)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('childStatus', () => {
  it('new when no assessments', () => { expect(childStatus(0, false, null)).toBe('new') })
  it('base when only baseline', () => { expect(childStatus(1, false, null)).toBe('base') })
  it('up/flat/down from net change when has follow-up', () => {
    expect(childStatus(2, true, 0.5)).toBe('up')
    expect(childStatus(2, true, 0)).toBe('flat')
    expect(childStatus(2, true, -0.5)).toBe('down')
  })
})

describe('deriveChildView', () => {
  const rep: ChildReport = {
    childId: 'c1', childName: 'Amahle Dlamini',
    rows: [
      { indicatorId: 'i1', indicatorText: 'Shares', areaId: 'a1', areaName: 'Social', baseline: 2, latest: 3, change: 1, classification: 'improved' },
      { indicatorId: 'i2', indicatorText: 'Listens', areaId: 'a1', areaName: 'Social', baseline: 3, latest: 3, change: 0, classification: 'stable' },
      { indicatorId: 'i3', indicatorText: 'Waters', areaId: 'a2', areaName: 'Garden', baseline: null, latest: null, change: null, classification: null },
    ],
    trends: [
      { areaId: 'a1', areaName: 'Social', points: [{ date: '2026-02-01', avgScore: 2.5 }, { date: '2026-05-01', avgScore: 3 }] },
      { areaId: 'a2', areaName: 'Garden', points: [{ date: '2026-02-01', avgScore: 2 }] },
    ],
    observations: [{ date: '2026-05-01', areaId: 'a1', note: 'shared without asking' }],
  }
  it('derives firstName, measured/improved, hasLatest', () => {
    const v = deriveChildView(rep)
    expect(v.firstName).toBe('Amahle')
    expect(v.measured).toBe(2)
    expect(v.improved).toBe(1)
    expect(v.hasLatest).toBe(true)
  })
  it('maps trends to baseline/latest from first/last points', () => {
    const v = deriveChildView(rep)
    const social = v.trends.find(t => t.areaId === 'a1')!
    expect(social.baseline).toBe(2.5)
    expect(social.latest).toBe(3)
    const garden = v.trends.find(t => t.areaId === 'a2')!
    expect(garden.baseline).toBe(2)
    expect(garden.latest).toBe(2)
  })
})
