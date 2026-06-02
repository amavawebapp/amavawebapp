import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useReportAssessments } from '../hooks/use-report-data'
import { buildReport, buildChildReport, buildOrgSections, filterByDate } from '../domain/report-metrics'
import { aggregateCsv, childCsv } from '../domain/csv'
import { downloadText } from '../lib/download'
import { buildReportDoc, formatPeriod } from '../domain/pdf-report'
import { downloadPdf } from '../lib/pdf'
import { ReportView } from '../components/ReportView'
import { AppBar, Icon, BottomNav } from '../components/ui'
import { IMPROVED_THRESHOLD } from '../config'
import type { Child } from '../domain/types'

type Scope =
  | { kind: 'org' }
  | { kind: 'programme'; id: string }
  | { kind: 'class'; id: string }
  | { kind: 'child'; id: string }

const slugify = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'report'

export function ReportsScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const ref = useReferenceData()
  const assessments = useReportAssessments()
  const [scope, setScope] = useState<Scope | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [areaFilter, setAreaFilter] = useState('') // '' = all areas

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
      const shownAreas = areaFilter ? areas.filter(a => a.id === areaFilter) : areas
      const shownIndicators = indicators.filter(i => shownAreas.some(a => a.id === i.areaId))
      return {
        kind: 'child' as const,
        scaleMax: programme?.scaleMax ?? 4,
        child: buildChildReport({
          child,
          history: dated.filter(a => a.childId === child.id),
          areas: shownAreas, indicators: shownIndicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD,
        }),
      }
    }

    if (scope.kind === 'org') {
      const orgAreas = areaFilter ? ref.areas.filter(a => a.id === areaFilter) : ref.areas
      const orgIndicators = ref.indicators.filter(i => orgAreas.some(a => a.id === i.areaId))
      return {
        kind: 'org' as const,
        sections: buildOrgSections({
          programmes: ref.programmes, classes: ref.classes, areas: orgAreas,
          indicators: orgIndicators, children: visibleChildren, assessments: dated,
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
    const shownAreas = areaFilter ? areas.filter(a => a.id === areaFilter) : areas
    const shownIndicators = indicators.filter(i => shownAreas.some(a => a.id === i.areaId))
    return {
      kind: 'aggregate' as const,
      scaleMax: programme?.scaleMax ?? 4,
      aggregate: buildReport({ children, assessments: dated, areas: shownAreas, indicators: shownIndicators, threshold: programme?.improvedThreshold ?? IMPROVED_THRESHOLD }),
    }
  }, [ref, assessments, scope, isCoordinator, me, from, to, areaFilter])

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

  const REG_LINE = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'
  function exportPdf() {
    if (!report) return
    const period = formatPeriod(from, to)
    const title = report.kind === 'child' ? report.child.childName : `${scopeLabel.replace(/-/g, ' ')} report`
    const scaleMax = report.kind === 'org' ? 4 : report.scaleMax
    const doc = buildReportDoc({
      kind: report.kind,
      title: `Amava M&E — ${title}`,
      period,
      regLine: REG_LINE,
      scaleMax,
      report: report.kind === 'aggregate' ? report.aggregate : undefined,
      child: report.kind === 'child' ? report.child : undefined,
      sections: report.kind === 'org' ? report.sections : undefined,
    })
    const base = report.kind === 'child' ? slugify(report.child.childName) : scopeLabel
    downloadPdf(doc, `amava-${base}-${today}.pdf`).catch(e => console.error('PDF export failed', e))
  }

  function exportCsv() {
    if (!report) return
    if (report.kind === 'child') {
      downloadText(`amava-${slugify(report.child.childName)}-${today}.csv`, childCsv(report.child))
    } else if (report.kind === 'org') {
      const text = report.sections.map(s => `# ${s.programmeName}\n` + aggregateCsv(s.report)).join('\n')
      downloadText(`amava-organisation-${today}.csv`, text)
    } else {
      downloadText(`amava-${scopeLabel}-${today}.csv`, aggregateCsv(report.aggregate))
    }
  }

  // Children with any assessment (for the "One child" sub-picker + default).
  const childIdsWithData = new Set(assessments.map(a => a.childId))
  const childrenWithData = myChildren.filter(c => childIdsWithData.has(c.id))
  const activeProgrammes = ref.programmes.filter(p => p.active)
  const showProgramme = activeProgrammes.length > 1

  function pickClass() {
    const first = myClasses[0]
    if (first) setScope({ kind: 'class', id: first.id })
  }
  function pickChild() {
    const first = childrenWithData[0] ?? myChildren[0]
    if (first) setScope({ kind: 'child', id: first.id })
  }
  function pickProgramme() {
    const first = activeProgrammes[0]
    if (first) setScope({ kind: 'programme', id: first.id })
  }

  const segActive = (kind: Scope['kind']) => scope.kind === kind

  return (
    <div className="am-root am-screen">
      <AppBar title="Reports" onBack={() => navigate('/')} />
      <div className="am-scroll am-pad" style={{ paddingTop: 12, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* scope segmented control */}
        <div className="am-seg no-print">
          {isCoordinator && (
            <button className={segActive('org') ? 'on' : ''} onClick={() => setScope({ kind: 'org' })}>Everyone</button>
          )}
          <button className={segActive('class') ? 'on' : ''} onClick={pickClass}>By class</button>
          {isCoordinator && showProgramme && (
            <button className={segActive('programme') ? 'on' : ''} onClick={pickProgramme}>By programme</button>
          )}
          <button className={segActive('child') ? 'on' : ''} onClick={pickChild}>One child</button>
        </div>

        {/* sub-pickers */}
        {scope.kind === 'class' && (
          <div className="am-hscroll no-print">
            {myClasses.map(c => (
              <button key={c.id} className={'am-chip' + (isActive({ kind: 'class', id: c.id }) ? ' am-chip--on' : '')} onClick={() => setScope({ kind: 'class', id: c.id })}>{c.name}</button>
            ))}
          </div>
        )}
        {scope.kind === 'programme' && (
          <div className="am-hscroll no-print">
            {activeProgrammes.map(p => (
              <button key={p.id} className={'am-chip' + (isActive({ kind: 'programme', id: p.id }) ? ' am-chip--on' : '')} onClick={() => setScope({ kind: 'programme', id: p.id })}>{p.name}</button>
            ))}
          </div>
        )}
        {scope.kind === 'child' && (
          <div className="am-hscroll no-print">
            {childrenWithData.map(c => (
              <button key={c.id} className={'am-chip' + (isActive({ kind: 'child', id: c.id }) ? ' am-chip--on' : '')} onClick={() => setScope({ kind: 'child', id: c.id })}>{c.firstName}</button>
            ))}
          </div>
        )}

        {/* filters */}
        <details className="no-print">
          <summary className="am-eyebrow" style={{ cursor: 'pointer' }}>Filters</summary>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
            <label className="am-row__sub">From <input className="am-input" style={{ width: 'auto' }} type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label className="am-row__sub">To <input className="am-input" style={{ width: 'auto' }} type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
            <select className="am-input" style={{ width: 'auto' }} value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
              <option value="">All areas</option>
              {ref.areas.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {(from || to || areaFilter) && <button className="am-btn am-btn--ghost" onClick={() => { setFrom(''); setTo(''); setAreaFilter('') }}>Clear filters</button>}
          </div>
        </details>

        {/* report body */}
        {!report && <p className="am-muted">Nothing to show for this selection.</p>}
        {report?.kind === 'org' && report.sections.map(s => (
          <section key={s.programmeId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="am-sectionlab"><span className="am-eyebrow">{s.programmeName}</span></div>
            <ReportView scaleMax={s.scaleMax} aggregate={s.report} />
          </section>
        ))}
        {report?.kind === 'aggregate' && <ReportView scaleMax={report.scaleMax} aggregate={report.aggregate} />}
        {report?.kind === 'child' && <ReportView scaleMax={report.scaleMax} child={report.child} />}

        {/* export actions */}
        <div className="am-sectionlab no-print"><span className="am-eyebrow">Share this report</span></div>
        <button
          className="am-btn am-btn--brand am-btn--block no-print"
          disabled={!canExport}
          onClick={() => navigate('/report/print', { state: { scope, from, to } })}
        >
          <Icon name="report" size={20} /> Open printable report
        </button>
        <div className="no-print" style={{ display: 'flex', gap: 10 }}>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} disabled={!canExport} onClick={exportPdf}><Icon name="download" size={20} /> PDF</button>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} onClick={() => window.print()}><Icon name="print" size={20} /> Print</button>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} disabled={!canExport} onClick={exportCsv}>CSV</button>
        </div>
        {!canExport && <p className="am-muted no-print" style={{ fontSize: '.78rem', textAlign: 'center', margin: 0 }}>Child export is coordinator-only.</p>}
        <p className="am-muted no-print" style={{ fontSize: '.78rem', textAlign: 'center', margin: 0 }}>
          Reports never show a child's name unless you choose “One child”.
        </p>
      </div>
      <BottomNav />
    </div>
  )
}
