import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useAppServices } from '../app-context'
import { useReferenceData } from '../hooks/use-reference-data'
import { useSyncStatus } from '../hooks/use-sync-status'
import { Logo, Avatar, AVA_COLORS, SyncBanner, Donut, Icon, BottomNav } from '../components/ui'

export function HomeScreen() {
  const { session } = useAuth()
  const { store, engine } = useAppServices()
  const ref = useReferenceData()
  const { online, pendingCount } = useSyncStatus(store, engine)
  const navigate = useNavigate()

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const myClasses = ref.classes.filter(
    c => me?.role === 'coordinator' || me?.classIds.includes(c.id),
  )

  const total = ref.children.filter(
    ch => myClasses.some(c => c.id === ch.classId) && ch.active,
  ).length

  return (
    <div className="am-root am-screen">
      {/* custom warm header */}
      <div className="am-appbar" style={{ background: 'var(--surface)' }}>
        <div className="am-appbar__row" style={{ paddingBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="am-eyebrow">Hello, {me?.name?.split(' ')[0] ?? ''}</div>
            <Logo size={30} sub={false} />
          </div>
          <Avatar name={me?.name ?? '?'} color="var(--brand)" size={46} />
        </div>
      </div>

      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 16, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SyncBanner online={online} pending={pendingCount} />

        {myClasses.length === 0 ? (
          <div className="am-card am-card--pad">
            <p style={{ margin: 0 }}>No classes assigned yet. Please contact your coordinator.</p>
          </div>
        ) : (
          <>
            {/* term snapshot */}
            <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Donut value={100} label={String(total)} sublabel="children" color="var(--good)" size={104} />
              <div style={{ flex: 1 }}>
                <div className="am-h2">Your classes</div>
                <p className="am-muted" style={{ margin: '6px 0 0', fontSize: '.92rem' }}>
                  You have {total} children across {myClasses.length} classes.
                </p>
              </div>
            </div>

            <div className="am-sectionlab"><span className="am-eyebrow">My classes</span></div>

            {myClasses.map((c, i) => {
              const count = ref.children.filter(ch => ch.classId === c.id && ch.active).length
              return (
                <button key={c.id} className="am-row" onClick={() => navigate(`/class/${c.id}`)}>
                  <div className="am-ava" style={{ background: AVA_COLORS[i % AVA_COLORS.length] }}>
                    <Icon name="people" size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="am-row__title">{c.name}</div>
                    <div className="am-row__sub">{count} children</div>
                  </div>
                  <Icon name="chevron" className="am-row__chev" size={22} color="var(--sage)" />
                </button>
              )
            })}

            <button className="am-btn am-btn--brand am-btn--block" style={{ marginTop: 4 }} onClick={() => navigate('/reports')}>
              <Icon name="chart" size={22} /> View reports
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
