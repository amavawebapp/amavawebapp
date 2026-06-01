import type { Assessment, Child, DevelopmentArea, Indicator } from './types'
import { classifyChange } from './assessment-logic'

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
  const followUps = history.filter(a => a.type !== 'baseline').sort((a, b) => a.date.localeCompare(b.date))
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
      avgBaseline: mean(measuredIndicators.map(i => i.avgBaseline as number)),
      avgLatest: mean(measuredIndicators.map(i => i.avgLatest as number)),
    }
  })

  headlines.sort((a, b) => b.percentImproved - a.percentImproved)
  return { areas: areaReports, childrenInScope: children.length, withBaseline, withFollowUp, headlines }
}
