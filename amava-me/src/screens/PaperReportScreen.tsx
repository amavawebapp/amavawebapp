import { useMemo } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useReportAssessments } from '../hooks/use-report-data'
import {
  buildReport, buildChildReport, filterByDate,
  type Report, type ChildReport,
} from '../domain/report-metrics'
import type { ChangeClass } from '../domain/assessment-logic'
import { formatPeriod } from '../domain/pdf-report'
import { Icon } from '../components/ui'
import { areaIcon, deriveChildView } from '../domain/view-model'
import { IMPROVED_THRESHOLD } from '../config'
import type { Child } from '../domain/types'

type Scope =
  | { kind: 'org' }
  | { kind: 'programme'; id: string }
  | { kind: 'class'; id: string }
  | { kind: 'child'; id: string }

interface PaperState { scope?: Scope; from?: string; to?: string }

const REG_LINE = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'
const round = (x: number) => Math.round(x)
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function PaperReportScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as PaperState | null
  const { session } = useAuth()
  const ref = useReferenceData()
  const assessments = useReportAssessments()

  const scope = state?.scope ?? null
  const from = state?.from ?? ''
  const to = state?.to ?? ''

  const built = useMemo(() => {
    if (!ref || !assessments || !scope) return null
    const me = ref.facilitators.find(f => f.id === session?.user.id)
    const isCoordinator = me?.role === 'coordinator'
    const dated = filterByDate(assessments, from, to)
    const visibleClassIds = new Set(isCoordinator ? ref.classes.map(c => c.id) : (me?.classIds ?? []))
    const visibleChildren = ref.children.filter(c => visibleClassIds.has(c.classId))

    const inScope = (children: Child[]) => {
      if (scope.kind === 'org') return children
      if (scope.kind === 'programme') {
        const classIds = new Set(ref.classes.filter(c => c.programmeId === scope.id).map(c => c.id))
        return children.filter(c => classIds.has(c.classId))
      }
      if (scope.kind === 'class') return children.filter(c => c.classId === scope.id)
      return children.filter(c => c.id === scope.id)
    }

    if (scope.kind === 'child') {
      const child = visibleChildren.find(c => c.id === scope.id)
      if (!child) return null
      const cls = ref.classes.find(c => c.id === child.classId)
      const programme = ref.programmes.find(p => p.id === cls?.programmeId)
      const areas = ref.areas.filter(a => a.programmeId === programme?.id)
      const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
      return {
        kind: 'child' as const,
        scaleMax: programme?.scaleMax ?? 4,
        programmeName: programme?.name ?? '',
        scopeName: `${child.firstName} ${child.surname}`,
        className: cls?.name ?? '',
        child: buildChildReport({
          child,
          history: dated.filter(a => a.childId === child.id),
          areas, indicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD,
        }),
      }
    }

    const children = inScope(visibleChildren)
    const programme =
      scope.kind === 'programme'
        ? ref.programmes.find(p => p.id === scope.id)
        : scope.kind === 'class'
          ? ref.programmes.find(p => p.id === ref.classes.find(c => c.id === scope.id)?.programmeId)
          : ref.programmes[0]
    const areas = ref.areas.filter(a => a.programmeId === programme?.id)
    const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
    const scopeName =
      scope.kind === 'org' ? 'Whole organisation'
      : scope.kind === 'programme' ? (programme?.name ?? 'Programme')
      : (ref.classes.find(c => c.id === scope.id)?.name ?? 'Class')
    return {
      kind: 'aggregate' as const,
      scaleMax: programme?.scaleMax ?? 4,
      programmeName: programme?.name ?? '',
      scopeName,
      report: buildReport({ children, assessments: dated, areas, indicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD }),
    }
  }, [ref, assessments, scope, session, from, to])

  if (!scope) return <Navigate to="/reports" replace />
  if (!ref || !assessments) return <p className="container">Loading…</p>
  if (!built) return <Navigate to="/reports" replace />

  const isChild = built.kind === 'child'
  const period = formatPeriod(from, to)
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  const metaLeft = isChild && built.className ? `${built.className} · ` : `${built.scopeName} · `

  return (
    <div className="paper-stage">
      <div className="paper-topbar no-print">
        <button className="am-back" onClick={() => navigate('/reports')} style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }} aria-label="Back">
          <Icon name="back" size={24} />
        </button>
        <div className="paper-topbar__t">Printable report</div>
        <button className="am-btn" style={{ minHeight: 40, padding: '0 14px', background: '#fff' }} onClick={() => window.print()}>
          <Icon name="download" size={18} /> Save PDF
        </button>
      </div>
      <div className="paper-scroll">
        <div className="paper">
          <div className="paper__band">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="paper__logo">Amava</div>
                <div className="paper__oluntu">Oluntu</div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, paddingTop: 6 }}>
                <div className="paper__kicker" style={{ whiteSpace: 'nowrap' }}>Impact Report</div>
                {built.programmeName && <div className="paper__meta" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>{built.programmeName}</div>}
              </div>
            </div>
            <div className="paper__title">{isChild ? built.scopeName : 'Child development progress'}</div>
            <div className="paper__meta">{metaLeft}{period}</div>
          </div>

          {built.kind === 'child'
            ? <PaperChild report={built.child} scaleMax={built.scaleMax} />
            : <PaperAggregate report={built.report} scaleMax={built.scaleMax} />}

          <div className="paper__foot">
            <span>{REG_LINE}</span>
            <span>Generated {generated}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaperAggregate({ report, scaleMax }: { report: Report; scaleMax: number }) {
  const overall = report.areas.length
    ? round(mean(report.areas.map(a => a.percentImproved)))
    : report.headlines.length
      ? round(mean(report.headlines.map(h => h.percentImproved)))
      : 0
  const wins = report.headlines.slice(0, 3)
  return (
    <div className="paper__body">
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4a5450', margin: '0 0 8px' }}>
        Across <b>{report.childrenInScope} children</b> assessed this period, facilitators recorded an average
        improvement of <b style={{ color: 'var(--green-deep)' }}>{overall}%</b> on the indicators measured —
        meaning most children are moving steadily toward consistent, independent behaviour.
      </p>

      <div className="paper-h">At a glance</div>
      <div className="paper-stats">
        <div className="paper-stat"><div className="paper-stat__v">{report.childrenInScope}</div><div className="paper-stat__l">Children assessed</div><div className="paper-stat__s">in scope</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{report.withFollowUp}</div><div className="paper-stat__l">With follow-up</div><div className="paper-stat__s">baseline + check-in</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{overall}%</div><div className="paper-stat__l">Average improved</div><div className="paper-stat__s">across all indicators</div></div>
      </div>

      {wins.length > 0 && (
        <>
          <div className="paper-h">Biggest wins</div>
          <div className="paper-wins">
            {wins.map(h => (
              <div className="paper-win" key={h.indicatorId}>
                <div className="paper-win__v">{h.percentImproved}%</div>
                <div className="paper-win__t">{h.indicatorText}</div>
                <div className="paper-win__s">{h.nImproved} of {h.nMeasured} children improved</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="paper-h">Progress by development area</div>
      {report.areas.map((area, index) => (
        <div className="paper-area" key={area.areaId}>
          <div className="paper-area__h">
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--slate)', display: 'grid', placeItems: 'center' }}>
              <Icon name={areaIcon(index)} size={18} color="#fff" />
            </div>
            <div className="paper-area__name">{area.areaName}</div>
            <div className="paper-area__avg">avg {area.avgBaseline ?? '—'} → <b style={{ color: 'var(--green-deep)' }}>{area.avgLatest ?? '—'}</b> / {scaleMax}</div>
          </div>
          {area.indicators.map(i => (
            <div className="paper-ind" key={i.indicatorId}>
              <div className="paper-ind__t">{i.indicatorText}</div>
              <div className="paper-ind__track">
                <div className="paper-ind__fill" style={{ width: ((i.avgLatest ?? 0) / scaleMax) * 100 + '%' }} />
                {i.avgBaseline != null && <div className="paper-ind__base" style={{ left: (i.avgBaseline / scaleMax) * 100 + '%' }} />}
              </div>
              <div className="paper-ind__nums"><b>{i.avgLatest ?? '—'}</b> · {i.percentImproved}% up</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PaperChild({ report, scaleMax }: { report: ChildReport; scaleMax: number }) {
  const v = deriveChildView(report)
  const pct = v.measured ? round((v.improved / v.measured) * 100) : 0
  const avgGain = v.trends.length
    ? (v.trends.reduce((s, t) => s + ((t.latest ?? 0) - (t.baseline ?? 0)), 0) / v.trends.length).toFixed(1)
    : '0.0'
  const chgClass = (c: ChangeClass | null) => c === 'improved' ? 'paper-chg--up' : c === 'declined' ? 'paper-chg--down' : 'paper-chg--flat'
  const chgText = (change: number | null) => change == null ? '—' : change > 0 ? `▲ +${change}` : change < 0 ? `▼ ${change}` : 'same'
  return (
    <div className="paper__body">
      <div className="paper-h">Summary</div>
      <div className="paper-stats">
        <div className="paper-stat"><div className="paper-stat__v">{v.improved}/{v.measured}</div><div className="paper-stat__l">Indicators improved</div><div className="paper-stat__s">{pct}% of those measured</div></div>
        <div className="paper-stat"><div className="paper-stat__v">{v.trends.length}</div><div className="paper-stat__l">Areas tracked</div><div className="paper-stat__s">development areas</div></div>
        <div className="paper-stat"><div className="paper-stat__v" style={{ color: 'var(--green-deep)' }}>{avgGain}</div><div className="paper-stat__l">Average gain</div><div className="paper-stat__s">points on the 1–{scaleMax} scale</div></div>
      </div>

      <div className="paper-h">Growth by area</div>
      {v.trends.map(t => (
        <div className="paper-ind" key={t.areaId} style={{ gridTemplateColumns: '168px 1fr 116px' }}>
          <div className="paper-ind__t" style={{ fontWeight: 700 }}>{t.areaName}</div>
          <div className="paper-ind__track">
            <div className="paper-ind__fill" style={{ width: ((t.latest ?? 0) / scaleMax) * 100 + '%' }} />
            {t.baseline != null && <div className="paper-ind__base" style={{ left: (t.baseline / scaleMax) * 100 + '%' }} />}
          </div>
          <div className="paper-ind__nums">{t.baseline ?? '—'} → <b>{t.latest ?? '—'}</b> / {scaleMax}</div>
        </div>
      ))}

      <div className="paper-h">Every indicator</div>
      <table className="paper-tbl">
        <thead><tr><th>Indicator</th><th style={{ textAlign: 'center' }}>Baseline</th><th style={{ textAlign: 'center' }}>Now</th><th style={{ textAlign: 'center' }}>Change</th></tr></thead>
        <tbody>
          {report.rows.map((r, i) => (
            <tr key={i}>
              <td>{r.indicatorText}</td>
              <td style={{ textAlign: 'center' }}>{r.baseline ?? '—'}</td>
              <td style={{ textAlign: 'center', fontWeight: 800 }}>{r.latest ?? '—'}</td>
              <td style={{ textAlign: 'center' }}><span className={'paper-chg ' + chgClass(r.classification)}>{chgText(r.change)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {v.observations.length > 0 && (
        <>
          <div className="paper-h">Facilitator notes</div>
          {v.observations.map((o, i) => (
            <div className="paper-note" key={i}>
              <div className="paper-note__d">{o.date}</div>
              <div className="paper-note__t">{o.note}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
