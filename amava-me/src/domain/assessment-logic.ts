import type { Assessment, AssessmentType, DevelopmentArea, ClassGroup } from './types'

export function nextAssessmentType(history: Assessment[]): AssessmentType {
  return history.some(a => a.type === 'baseline') ? 'quarterly' : 'baseline'
}

function scoreFor(a: Assessment | undefined, indicatorId: string): number | null {
  const s = a?.scores.find(s => s.indicatorId === indicatorId)
  return s ? s.score : null
}

/** latest score minus baseline score for an indicator; null if either missing. */
export function indicatorChange(history: Assessment[], indicatorId: string): number | null {
  const baseline = history.find(a => a.type === 'baseline')
  const followUps = history
    .filter(a => a.type !== 'baseline')
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const latest = followUps[followUps.length - 1]
  const base = scoreFor(baseline, indicatorId)
  const last = scoreFor(latest, indicatorId)
  if (base === null || last === null) return null
  return last - base
}

export type ChangeClass = 'improved' | 'stable' | 'declined'

export function classifyChange(change: number, improvedThreshold: number): ChangeClass {
  if (change >= improvedThreshold) return 'improved'
  if (change < 0) return 'declined'
  return 'stable'
}

/** Active areas applicable to a class, sorted; garden-only areas hidden for non-garden classes. */
export function visibleAreas(areas: DevelopmentArea[], cls: ClassGroup): DevelopmentArea[] {
  return areas
    .filter(a => a.active)
    .filter(a => !a.gardenOnly || cls.hasGardenComponent)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
