import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useReportAssessments } from '../hooks/use-report-data'
import { CHILD_FIELDS, ageFromDob } from '../domain/child-fields'
import { childStatus } from '../domain/view-model'
import { AppBar, Avatar, Icon, BottomNav, StatusPill } from '../components/ui'
import type { Assessment } from '../domain/types'

const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/** Mean of an assessment's indicator scores, or null when there are none. */
const avgScore = (a: Assessment): number | null =>
  a.scores.length ? a.scores.reduce((s, x) => s + x.score, 0) / a.scores.length : null

export function ChildProfileScreen() {
  const { childId } = useParams()
  const { session } = useAuth()
  const { ref } = useConfigData()
  const assessments = useReportAssessments()
  const navigate = useNavigate()

  if (!ref) return <p className="container">Loading…</p>

  const child = ref.children.find(c => c.id === childId)
  if (!child) return <Navigate to="/" replace />

  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const canView = isCoordinator || (me?.classIds.includes(child.classId) ?? false)
  if (!canView) return <Navigate to="/" replace />

  const cls = ref.classes.find(c => c.id === child.classId)
  const fullName = `${child.firstName} ${child.surname}`

  const history = (assessments ?? [])
    .filter(a => a.childId === child.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  // Status pill: netChange = latest avg − earliest avg (null when <2 assessments).
  const assessmentCount = history.length
  const hasFollowUp = history.some(a => a.type !== 'baseline')
  const latestAvg = assessmentCount ? avgScore(history[0]) : null
  const earliestAvg = assessmentCount ? avgScore(history[history.length - 1]) : null
  const netChange =
    assessmentCount >= 2 && latestAvg != null && earliestAvg != null ? latestAvg - earliestAvg : null
  const status = childStatus(assessmentCount, hasFollowUp, netChange)

  const fieldRows = CHILD_FIELDS
    .filter(f => (child.fields[f.key] ?? '').trim() !== '')
    .map(f => {
      let value = child.fields[f.key]
      if (f.key === 'dob') {
        const age = ageFromDob(child.fields.dob, todayISO())
        if (age != null) value = `${value} (age ${age})`
      }
      return { key: f.key, label: f.label, value }
    })

  return (
    <div className="am-root am-screen">
      <AppBar title="Child profile" onBack={() => navigate(-1)} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* header */}
        <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={fullName} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="am-h2" style={{ margin: 0 }}>{fullName}</div>
            <div className="am-muted" style={{ fontSize: '.92rem', marginTop: 2 }}>{cls?.name ?? '—'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusPill status={status} />
            <span className="am-chip" style={{ ...(child.isSample
              ? { background: 'var(--good-soft)', color: 'var(--good)', borderColor: 'transparent' }
              : {}) }}>
              {child.isSample ? 'Sample' : 'Not in sample'}
            </span>
            </div>
          </div>
        </div>

        {/* details */}
        <div className="am-sectionlab"><span className="am-eyebrow">Details</span></div>
        <div className="am-card am-card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fieldRows.map(r => (
            <div key={r.key} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <div className="am-muted" style={{ flex: '0 0 128px', fontSize: '.88rem' }}>{r.label}</div>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{r.value || '—'}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <div className="am-muted" style={{ flex: '0 0 128px', fontSize: '.88rem' }}>Start date</div>
            <div style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{fmtDate(child.dateStarted)}</div>
          </div>
        </div>

        {/* assessment history */}
        <div className="am-sectionlab"><span className="am-eyebrow">Assessment history</span></div>
        <div className="am-card am-card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 ? (
            <p className="am-muted" style={{ margin: 0 }}>No assessments recorded yet.</p>
          ) : (
            history.map(a => {
              const avg = avgScore(a)
              return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {a.type === 'baseline' ? 'Baseline' : 'Quarterly'} · avg {avg != null ? avg.toFixed(1) : '—'}
                  </div>
                  <div className="am-muted" style={{ fontSize: '.86rem' }}>{fmtDate(a.date)}</div>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="am-btn am-btn--brand" style={{ flex: 1 }} onClick={() => navigate(`/assess/${child.id}`)}>
            <Icon name="check" size={20} /> Assess
          </button>
          <button className="am-btn am-btn--ghost" style={{ flex: 1 }} onClick={() => navigate(`/class/${child.classId}`)}>
            Back to class
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
