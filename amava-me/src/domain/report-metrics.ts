import type { Assessment, Child, DevelopmentArea, Indicator } from './types'
import { classifyChange, type ChangeClass } from './assessment-logic'

export interface IndicatorReport {
  indicatorId: string
  indicatorText: string
  areaId: string
  nMeasured: number
  nImproved: number
  nStable: number
  nDeclined: number
  percentImproved: number
  avgBaseline: number | null
  avgLatest: number | null
  avgChange: number | null
}

export interface AreaReport {
  areaId: string
  areaName: string
  indicators: IndicatorReport[]
  nMeasured: number
  percentImproved: number
  avgBaseline: number | null
  avgLatest: number | null
}

export interface Headline {
  indicatorId: string
  indicatorText: string
  percentImproved: number
  nImproved: number
  nMeasured: number
}

export interface Report {
  areas: AreaReport[]
  childrenInScope: number
  withBaseline: number
  withFollowUp: number
  headlines: Headline[]
}

export interface ReportInput {
  children: Child[]
  assessments: Assessment[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  threshold: number
}

const round1 = (x: number): number => Math.round(x * 10) / 10
const mean = (xs: number[]): number | null => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

function scoreIn(a: Assessment, indicatorId: string): number | null {
  const s = a.scores.find(x => x.indicatorId === indicatorId)
  return s ? s.score : null
}

function baselineAndLatest(history: Assessment[], indicatorId: string): { baseline: number | null; latest: number | null } {
  const baselineA = history.find(a => a.type === 'baseline')
  const followUps = history.filter(a => a.type !== 'baseline').sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const latestA = followUps[followUps.length - 1]
  return {
    baseline: baselineA ? scoreIn(baselineA, indicatorId) : null,
    latest: latestA ? scoreIn(latestA, indicatorId) : null,
  }
}

export function buildReport(input: ReportInput): Report {
  const { children, assessments, areas, indicators, threshold } = input
  const scopeIds = new Set(children.map(c => c.id))
  const byChild = new Map<string, Assessment[]>()
  for (const a of assessments) {
    if (!scopeIds.has(a.childId)) continue
    const list = byChild.get(a.childId) ?? []
    list.push(a)
    byChild.set(a.childId, list)
  }

  const withBaseline = [...byChild.values()].filter(h => h.some(a => a.type === 'baseline')).length
  const withFollowUp = [...byChild.values()].filter(h => h.some(a => a.type !== 'baseline')).length

  const activeAreas = areas.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const headlines: Headline[] = []

  const areaReports: AreaReport[] = activeAreas.map(area => {
    const areaIndicators = indicators
      .filter(i => i.active && i.areaId === area.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const measuredChildrenInArea = new Set<string>()

    const indicatorReports: IndicatorReport[] = areaIndicators.map(ind => {
      const baselines: number[] = []
      const latests: number[] = []
      const changes: number[] = []
      let nImproved = 0, nStable = 0, nDeclined = 0
      for (const child of children) {
        const history = byChild.get(child.id) ?? []
        const { baseline, latest } = baselineAndLatest(history, ind.id)
        if (baseline === null || latest === null) continue
        measuredChildrenInArea.add(child.id)
        baselines.push(baseline)
        latests.push(latest)
        const change = latest - baseline
        changes.push(change)
        const cls = classifyChange(change, threshold)
        if (cls === 'improved') nImproved++
        else if (cls === 'declined') nDeclined++
        else nStable++
      }
      const nMeasured = changes.length
      const percentImproved = nMeasured ? Math.round((nImproved / nMeasured) * 100) : 0
      const rep: IndicatorReport = {
        indicatorId: ind.id,
        indicatorText: ind.text,
        areaId: area.id,
        nMeasured, nImproved, nStable, nDeclined, percentImproved,
        avgBaseline: mean(baselines),
        avgLatest: mean(latests),
        avgChange: mean(changes),
      }
      if (nMeasured > 0) {
        headlines.push({ indicatorId: ind.id, indicatorText: ind.text, percentImproved, nImproved, nMeasured })
      }
      return rep
    })

    const measuredIndicators = indicatorReports.filter(i => i.nMeasured > 0)
    return {
      areaId: area.id,
      areaName: area.name,
      indicators: indicatorReports,
      nMeasured: measuredChildrenInArea.size,
      percentImproved: measuredIndicators.length
        ? Math.round(measuredIndicators.reduce((s, i) => s + i.percentImproved, 0) / measuredIndicators.length)
        : 0,
      // Unweighted mean across the area's measured indicators (fine for small cohorts).
      avgBaseline: mean(measuredIndicators.map(i => i.avgBaseline).filter((v): v is number => v !== null)),
      avgLatest: mean(measuredIndicators.map(i => i.avgLatest).filter((v): v is number => v !== null)),
    }
  })

  headlines.sort((a, b) => b.percentImproved - a.percentImproved)
  return { areas: areaReports, childrenInScope: children.length, withBaseline, withFollowUp, headlines }
}

export interface ChildIndicatorRow {
  indicatorId: string
  indicatorText: string
  areaId: string
  baseline: number | null
  latest: number | null
  change: number | null
  classification: ChangeClass | null
}

export interface ChildAreaTrend {
  areaId: string
  areaName: string
  points: { date: string; avgScore: number }[]
}

export interface ChildObservation { date: string; areaId: string | null; note: string }

export interface ChildReport {
  childId: string
  childName: string
  rows: ChildIndicatorRow[]
  trends: ChildAreaTrend[]
  observations: ChildObservation[]
}

export interface ChildReportInput {
  child: Child
  history: Assessment[]
  areas: DevelopmentArea[]
  indicators: Indicator[]
  threshold: number
}

export function buildChildReport(input: ChildReportInput): ChildReport {
  const { child, history, areas, indicators, threshold } = input
  const activeAreas = areas.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))

  const rows: ChildIndicatorRow[] = []
  const trends: ChildAreaTrend[] = []

  for (const area of activeAreas) {
    const areaIndicators = indicators
      .filter(i => i.active && i.areaId === area.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    for (const ind of areaIndicators) {
      const { baseline, latest } = baselineAndLatest(history, ind.id)
      const change = baseline !== null && latest !== null ? latest - baseline : null
      rows.push({
        indicatorId: ind.id,
        indicatorText: ind.text,
        areaId: area.id,
        baseline, latest, change,
        classification: change === null ? null : classifyChange(change, threshold),
      })
    }

    const points = sorted
      .map(a => {
        const vals = areaIndicators
          .map(ind => scoreIn(a, ind.id))
          .filter((v): v is number => v !== null)
        return vals.length ? { date: a.date, avgScore: round1(vals.reduce((s, v) => s + v, 0) / vals.length) } : null
      })
      .filter((p): p is { date: string; avgScore: number } => p !== null)
    trends.push({ areaId: area.id, areaName: area.name, points })
  }

  const observations: ChildObservation[] = sorted.flatMap(a =>
    a.observations.map(o => ({ date: a.date, areaId: o.areaId, note: o.note })),
  )

  return {
    childId: child.id,
    childName: `${child.firstName} ${child.surname}`,
    rows, trends, observations,
  }
}
