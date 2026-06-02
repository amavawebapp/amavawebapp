import type { ChildReport } from './report-metrics'
import type { IconName } from '../components/ui/Icon'

const AREA_ICONS: IconName[] = ['heart', 'people', 'spark', 'leaf', 'sun', 'chart']
export function areaIcon(index: number): IconName {
  return AREA_ICONS[((index % AREA_ICONS.length) + AREA_ICONS.length) % AREA_ICONS.length]
}

export function shortLabel(text: string, max = 18): string {
  const t = text.trim()
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…'
}

/** netChange: latest-minus-baseline averaged across measured indicators (or null). */
export function childStatus(assessmentCount: number, hasFollowUp: boolean, netChange: number | null): import('../components/ui/StatusPill').StatusKey {
  if (assessmentCount === 0) return 'new'
  if (!hasFollowUp) return 'base'
  if (netChange == null) return 'flat'
  if (netChange > 0.001) return 'up'
  if (netChange < -0.001) return 'down'
  return 'flat'
}

export interface ChildTrendView { areaId: string; areaName: string; baseline: number | null; latest: number | null }
export interface ChildView {
  name: string; firstName: string
  measured: number; improved: number; hasLatest: boolean
  trends: ChildTrendView[]
  observations: { date: string; note: string }[]
}
export function deriveChildView(rep: ChildReport): ChildView {
  const measuredRows = rep.rows.filter(r => r.baseline != null && r.latest != null)
  return {
    name: rep.childName,
    firstName: rep.childName.split(/\s+/)[0] || rep.childName,
    measured: measuredRows.length,
    improved: rep.rows.filter(r => r.classification === 'improved').length,
    hasLatest: rep.rows.some(r => r.latest != null),
    trends: rep.trends.map(t => ({
      areaId: t.areaId, areaName: t.areaName,
      baseline: t.points[0]?.avgScore ?? null,
      latest: t.points.length ? t.points[t.points.length - 1].avgScore : null,
    })),
    observations: rep.observations.map(o => ({ date: o.date, note: o.note })),
  }
}
