import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useAppearance } from '../appearance'
import { AppBar, BottomNav, Avatar, Icon, type IconName } from '../components/ui'

const REG_LINE = 'Amava Oluntu NPC 2011/108066/08 · PBO 930 043 213'

type RowDef = { title: string; sub: string; icon: IconName; to: string }
type GroupDef = { heading: string; rows: RowDef[] }

export function SettingsScreen() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { ref } = useConfigData()
  const { theme, setTheme, fsUser, setFsUser } = useAppearance()

  if (!ref) return <p className="container">Loading…</p>

  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const name = me?.name ?? ''
  const role = me?.role ?? ''

  const groups: GroupDef[] = []
  if (isCoordinator) {
    groups.push({
      heading: 'Programme set-up',
      rows: [
        { title: 'Programmes & classes', sub: 'Manage programmes and the classes inside them', icon: 'people', to: '/settings/programmes' },
        { title: 'Areas & indicators', sub: 'What every child is scored on', icon: 'spark', to: '/settings/areas' },
        { title: 'Rating scale', sub: 'How scores are recorded', icon: 'chart', to: '/settings/scale' },
      ],
    })
    groups.push({
      heading: 'People',
      rows: [
        { title: 'Facilitator accounts', sub: 'Who can record assessments', icon: 'people', to: '/settings/facilitators' },
      ],
    })
    groups.push({
      heading: 'Account',
      rows: [
        { title: 'Storage', sub: 'How much cloud storage is used', icon: 'chart', to: '/settings/storage' },
      ],
    })
  }
  groups.push({
    heading: 'This phone',
    rows: [
      { title: 'Offline data & sync', sub: 'Stored on this phone, synced when online', icon: 'wifi', to: '/settings/offline' },
    ],
  })

  return (
    <div className="am-root am-screen">
      <AppBar title="Settings" />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={name} color="var(--brand)" size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{name}</div>
            <div className="am-row__sub" style={{ textTransform: 'capitalize' }}>{role} · Amava Oluntu</div>
          </div>
        </div>

        {/* display / accessibility */}
        <div>
          <div className="am-sectionlab"><span className="am-eyebrow">Display</span></div>
          <div className="am-stack" style={{ gap: 10, marginTop: 8 }}>
            <div className="am-card am-card--pad am-stack" style={{ gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="am-ctrl__lab">Text size</span>
                <span className="am-chip" style={{ cursor: 'default' }}>{Math.round(fsUser * 100)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 900, fontSize: '.95rem', color: 'var(--ink-soft)' }}>A</span>
                <input className="am-range" type="range" min={0.9} max={1.35} step={0.05} value={fsUser}
                  onChange={e => setFsUser(Number(e.target.value))} style={{ flex: 1 }} aria-label="Text size" />
                <span style={{ fontWeight: 900, fontSize: '1.55rem', color: 'var(--ink-soft)', lineHeight: 1 }}>A</span>
              </div>
              <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>Drag to make every screen easier to read.</p>
            </div>

            <div className="am-ctrl">
              <div style={{ flex: 1 }}>
                <div className="am-ctrl__lab">Big &amp; Simple mode</div>
                <div className="am-ctrl__sub">Bigger buttons, higher contrast, less clutter.</div>
              </div>
              <button className={'am-switch' + (theme === 'simple' ? ' on' : '')} role="switch" aria-checked={theme === 'simple'}
                aria-label="Big and Simple mode" onClick={() => setTheme(theme === 'simple' ? 'soft' : 'simple')}>
                <span className="am-switch__knob" />
              </button>
            </div>
          </div>
        </div>

        {/* grouped settings rows */}
        {groups.map(g => (
          <div key={g.heading}>
            <div className="am-sectionlab"><span className="am-eyebrow">{g.heading}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {g.rows.map(r => (
                <button key={r.title} className="am-row" onClick={() => navigate(r.to)}>
                  <div className="am-ava" style={{ width: 40, height: 40, flexBasis: 40, borderRadius: 12, background: 'var(--surface-2)' }}>
                    <Icon name={r.icon} size={20} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="am-row__title" style={{ fontSize: '1rem' }}>{r.title}</div>
                    <div className="am-row__sub">{r.sub}</div>
                  </div>
                  <Icon name="chevron" size={20} color="var(--sage)" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="am-btn am-btn--ghost am-btn--block" style={{ marginTop: 6, color: 'var(--warn)', borderColor: 'var(--line)' }}
          onClick={async () => { await signOut(); navigate('/login') }}>
          <Icon name="logout" size={20} /> Sign out
        </button>
        <p className="am-muted" style={{ textAlign: 'center', fontSize: '.74rem', margin: 0 }}>{REG_LINE}</p>
      </div>
      <BottomNav />
    </div>
  )
}
