import { useMemo, useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useReportAssessments } from '../hooks/use-report-data'
import { buildReport, buildChildReport } from '../domain/report-metrics'
import { aggregateCsv, childCsv } from '../domain/csv'
import { downloadText } from '../lib/download'
import { ReportView } from '../components/ReportView'
import { IMPROVED_THRESHOLD } from '../config'
import type { Child } from '../domain/types'

type Scope = { kind: 'org' } | { kind: 'programme'; id: string } | { kind: 'class'; id: string } | { kind: 'child'; id: string }

export function ReportsScreen() {
  const { session } = useAuth()
  const ref = useReferenceData()
  const assessments = useReportAssessments()
  const [scope, setScope] = useState<Scope>({ kind: 'org' })

  const report = useMemo(() => {
    if (!ref || !assessments) return null
    const me = ref.facilitators.find(f => f.id === session?.user.id)
    const isCoordinator = me?.role === 'coordinator'
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
      const areas = ref.areas.filter(a => a.programmeId === cls?.programmeId)
      const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
      const programme = ref.programmes.find(p => p.id === cls?.programmeId)
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
    const programme = ref.programmes[0]
    const areas = ref.areas.filter(a => a.programmeId === programme?.id)
    const indicators = ref.indicators.filter(i => areas.some(a => a.id === i.areaId))
    return {
      kind: 'aggregate' as const,
      scaleMax: programme?.scaleMax ?? 4,
      aggregate: buildReport({ children, assessments, areas, indicators, threshold: IMPROVED_THRESHOLD }),
    }
  }, [ref, assessments, scope, session])

  if (!ref || !assessments) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const myClasses = ref.classes.filter(c => isCoordinator || me?.classIds.includes(c.id))
  const myChildren = ref.children.filter(c => myClasses.some(cl => cl.id === c.classId))

  function exportCsv() {
    if (!report) return
    if (report.kind === 'child') downloadText(`amava-${report.child.childName}-report.csv`, childCsv(report.child))
    else downloadText(`amava-${scope.kind}-report.csv`, aggregateCsv(report.aggregate))
  }

  return (
    <div className="container">
      <h1>Reports</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }} className="no-print">
        {isCoordinator && <button onClick={() => setScope({ kind: 'org' })}>Organisation</button>}
        {isCoordinator && ref.programmes.map(p => (
          <button key={p.id} onClick={() => setScope({ kind: 'programme', id: p.id })}>{p.name}</button>
        ))}
        {myClasses.map(c => (
          <button key={c.id} onClick={() => setScope({ kind: 'class', id: c.id })}>{c.name}</button>
        ))}
        <select onChange={e => e.target.value && setScope({ kind: 'child', id: e.target.value })} defaultValue="">
          <option value="" disabled>A child…</option>
          {myChildren.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>)}
        </select>
      </div>
      <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportCsv}>Export CSV</button>
        <button onClick={() => window.print()}>Print / Save PDF</button>
      </div>
      {report
        ? <ReportView scaleMax={report.scaleMax} aggregate={report.kind === 'aggregate' ? report.aggregate : undefined} child={report.kind === 'child' ? report.child : undefined} />
        : <p>Nothing to show for this selection.</p>}
    </div>
  )
}
