import { describe, it, expect } from 'vitest'
import {
  nextAssessmentType,
  indicatorChange,
  classifyChange,
  visibleAreas,
} from './assessment-logic'
import type { Assessment, DevelopmentArea, ClassGroup } from './types'

const mkAssessment = (over: Partial<Assessment>): Assessment => ({
  id: 'a', childId: 'c', type: 'baseline', date: '2026-01-01',
  assessedBy: 'f', coAssessors: '', scaleMax: 4, scores: [], observations: [],
  attachments: [], syncState: 'synced', ...over,
})

describe('nextAssessmentType', () => {
  it('returns baseline when the child has no assessments', () => {
    expect(nextAssessmentType([])).toBe('baseline')
  })
  it('returns quarterly once a baseline exists', () => {
    expect(nextAssessmentType([mkAssessment({ type: 'baseline' })])).toBe('quarterly')
  })
})

describe('indicatorChange', () => {
  it('is latest minus baseline for an indicator', () => {
    const baseline = mkAssessment({
      type: 'baseline',
      scores: [{ indicatorId: 'i1', indicatorText: 'x', score: 2 }],
    })
    const latest = mkAssessment({
      type: 'quarterly', date: '2026-04-01',
      scores: [{ indicatorId: 'i1', indicatorText: 'x', score: 4 }],
    })
    expect(indicatorChange([baseline, latest], 'i1')).toBe(2)
  })
  it('returns null when no baseline score exists for the indicator', () => {
    const baseline = mkAssessment({ type: 'baseline', scores: [] })
    expect(indicatorChange([baseline], 'i1')).toBeNull()
  })
  it('returns null for a baseline-only child even if the baseline scored the indicator', () => {
    const baseline = mkAssessment({ type: 'baseline', scores: [{ indicatorId: 'i1', indicatorText: 'x', score: 3 }] })
    expect(indicatorChange([baseline], 'i1')).toBeNull()
  })
})

describe('classifyChange', () => {
  it('classifies improvement at or above the threshold', () => {
    expect(classifyChange(1, 1)).toBe('improved')
    expect(classifyChange(2, 1)).toBe('improved')
  })
  it('classifies zero as stable and negative as declined', () => {
    expect(classifyChange(0, 1)).toBe('stable')
    expect(classifyChange(-1, 1)).toBe('declined')
  })
})

describe('visibleAreas', () => {
  const areas: DevelopmentArea[] = [
    { id: 'g', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true },
    { id: 'n', programmeId: 'p', name: 'Garden', sortOrder: 5, gardenOnly: true, active: true },
    { id: 'x', programmeId: 'p', name: 'Old', sortOrder: 2, gardenOnly: false, active: false },
  ]
  it('hides garden-only areas for non-garden classes and inactive areas always', () => {
    const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'A', hasGardenComponent: false, active: true }
    expect(visibleAreas(areas, cls).map(a => a.id)).toEqual(['g'])
  })
  it('includes garden-only areas for garden classes, sorted', () => {
    const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'A', hasGardenComponent: true, active: true }
    expect(visibleAreas(areas, cls).map(a => a.id)).toEqual(['g', 'n'])
  })
})
