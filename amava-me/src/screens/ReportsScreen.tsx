import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useReportAssessments } from '../hooks/use-report-data'
import { buildReport, buildChildReport } from '../domain/report-metrics'
import { aggregateCsv, childCsv } from '../domain/csv'
import { downloadText } from '../lib/download'
import { ReportView } from '../components/ReportView'
import { IMPROVED_THRESHOLD } from '../config'
import type { Child } from '../domain/types'

type Scope =
  | { kind: 'org' }
  | { kind: 'programme'; id: string }
  | { kind: 'class'; id: string }
  | { kind: 'child'; id: string }

const slugify = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'report'

export function ReportsScreen() {
  const { session } = useAuth()
  const ref = useReferenceData()
  const assessments = useReportAssessments()
  const [scope, setScope] = useState<Scope | null>(null)

  const me = ref?.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'

  // Set a sensible default scope once reference data is available.
  useEffect(() => {
    if (scope || !ref || !me) return
    if (isCoordinator) setScope({ kind: 'org' })
    else if (me.classIds.length > 0) setScope({ kind: 'class', id: me.classIds[0] })
    else setScope({ kind: 'org' })
  }, [scope, ref, me, isCoordinator])

  const report = useMemo(() => {
    if (!ref || !assessments || !scope) return null
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
        child: buildChildReport({
          child,
          history: assessments.filter(a => a.childId === child.id),
          areas, indicators, threshold: IMPROVED_THRESHOLD,
        }),
      }
    }

    const children = inScope(visibleChildren)
    // Pick the programme that matches the scope (org falls back to the first programme;
    // multi-programme org rollups are a Milestone 3 concern).
    const programme =
      scope.kind === 'programme'
        ? ref.programmes.find(p => p.id === scope.id)
        : scope.kind === 'class'
          ? ref.programmes.find(p => p.id === ref.classes.find(c => c.id === scope.id)?.programmeId)
          : ref.programmes[0]
    const areas = ref.areas.filter(a => a.programmeId === programme?.id)
    const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
    return {
      kind: 'aggregate' as const,
      scaleMax: programme?.scaleMax ?? 4,
      aggregate: buildReport({ children, assessments, areas, indicators, threshold: IMPROVED_THRESHOLD }),
    }
  }, [ref, assessments, scope, isCoordinator, me])

  if (!ref || !assessments || !scope) return <p className="container">Loading…</p>

  const myClasses = ref.classes.filter(c => isCoordinator || me?.classIds.includes(c.id))
  const myChildren = ref.children.filter(c => myClasses.some(cl => cl.id === c.classId))
  const isActive = (s: Scope) =>
    s.kind === scope.kind && ('id' in s && 'id' in scope ? s.id === scope.id : true)

  const today = new Date().toISOString().slice(0, 10)
  const scopeLabel =
    scope.kind === 'org' ? 'organisation'
    : scope.kind === 'programme' ? `programme-${slugify(ref.programmes.find(p => p.id === scope.id)?.name ?? 'x')}`
    : scope.kind === 'class' ? `class-${slugify(ref.classes.find(c => c.id === scope.id)?.name ?? 'x')}`
    : 'child'
  // Child reports contain a name, so their CSV export is coordinator-only (spec §5).
  const canExport = report != null && (report.kind !== 'child' || isCoordinator)

  function exportCsv() {
    if (!report || !canExport) return
    if (report.kind === 'child') {
      downloadText(`amava-${slugify(report.child.childName)}-${today}.csv`, childCsv(report.child))
    } else {
      downloadText(`amava-${scopeLabel}-${today}.csv`, aggregateCsv(report.aggregate))
    }
  }

  return (
    <div className="container">
      <h1>Reports</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }} className="no-print">
        {isCoordinator && (
          <button className={isActive({ kind: 'org' }) ? 'primary' : ''} onClick={() => setScope({ kind: 'org' })}>Organisation</button>
        )}
        {isCoordinator && ref.programmes.map(p => (
          <button key={p.id} className={isActive({ kind: 'programme', id: p.id }) ? 'primary' : ''} onClick={() => setScope({ kind: 'programme', id: p.id })}>{p.name}</button>
        ))}
        {myClasses.map(c => (
          <button key={c.id} className={isActive({ kind: 'class', id: c.id }) ? 'primary' : ''} onClick={() => setScope({ kind: 'class', id: c.id })}>{c.name}</button>
        ))}
        <select
          value={scope.kind === 'child' ? scope.id : ''}
          onChange={e => e.target.value && setScope({ kind: 'child', id: e.target.value })}
        >
          <option value="" disabled>A child…</option>
          {myChildren.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>)}
        </select>
      </div>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportCsv} disabled={!canExport}>Export CSV</button>
        {!canExport && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Child CSV export is coordinator-only</span>}
        <button onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      {report
        ? <ReportView scaleMax={report.scaleMax} aggregate={report.kind === 'aggregate' ? report.aggregate : undefined} child={report.kind === 'child' ? report.child : undefined} />
        : <p>Nothing to show for this selection.</p>}
    </div>
  )
}
