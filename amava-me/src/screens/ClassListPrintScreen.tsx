import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useConfigData } from '../hooks/use-config-data'
import { Icon } from '../components/ui'

const REG_LINE = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'
const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export function ClassListPrintScreen() {
  const { classId } = useParams()
  const { ref } = useConfigData()
  const navigate = useNavigate()

  if (!ref) return <p className="container">Loading…</p>

  const cls = ref.classes.find(c => c.id === classId)
  if (!cls) return <Navigate to="/" replace />
  const programme = ref.programmes.find(p => p.id === cls.programmeId)
  const children = ref.children
    .filter(c => c.classId === cls.id && c.active)
    .sort((a, b) => `${a.surname} ${a.firstName}`.localeCompare(`${b.surname} ${b.firstName}`))

  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="paper-stage">
      <div className="paper-topbar no-print">
        <button className="am-back" onClick={() => navigate(`/class/${cls.id}`)} style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }} aria-label="Back">
          <Icon name="back" size={24} />
        </button>
        <div className="paper-topbar__t">Class list</div>
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
                <div className="paper__kicker" style={{ whiteSpace: 'nowrap' }}>Class list</div>
                {programme && <div className="paper__meta" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>{programme.name}</div>}
              </div>
            </div>
            <div className="paper__title">{cls.name}</div>
            <div className="paper__meta">{programme?.name ?? ''} · Generated {generated}</div>
          </div>

          <div className="paper__body">
            <table className="paper-tbl">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>#</th>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'center' }}>Sample</th>
                  <th>Start date</th>
                </tr>
              </thead>
              <tbody>
                {children.map((ch, i) => (
                  <tr key={ch.id}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{ch.firstName} {ch.surname}</td>
                    <td>{ch.fields.grade || '—'}</td>
                    <td>{ch.fields.gender || '—'}</td>
                    <td>{ch.fields.guardianName || '—'}</td>
                    <td>{ch.fields.contact || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{ch.isSample ? 'Yes' : 'No'}</td>
                    <td>{fmtDate(ch.dateStarted)}</td>
                  </tr>
                ))}
                {children.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8a938e' }}>No active children in this class.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="paper__foot">
            <span>{REG_LINE}</span>
            <span>Generated {generated}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
