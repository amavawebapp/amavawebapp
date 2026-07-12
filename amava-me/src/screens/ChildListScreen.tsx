import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { ChildEditor } from '../components/ChildEditor'
import { rosterClient } from '../data/roster-client'
import type { Child } from '../domain/types'
import { AppBar, Avatar, Icon, BottomNav, Toast } from '../components/ui'

export function ChildListScreen() {
  const { classId } = useParams()
  const { session } = useAuth()
  const { ref, refresh } = useConfigData()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Child | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!ref) return <p className="container">Loading…</p>
  const cls = ref.classes.find(c => c.id === classId)
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'
  const canManage = isCoordinator || (!!classId && (me?.classIds.includes(classId) ?? false))
  const children = ref.children.filter(c => c.classId === classId)

  const run = async (p: Promise<void>) => {
    setError(null)
    try { await p; await refresh(); setEditing(null); return true }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed. Please try again.'); return false }
  }

  const activeChildren = children.filter(c => c.active)
  const filtered = activeChildren.filter(ch =>
    `${ch.firstName} ${ch.surname}`.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="am-root am-screen">
      <AppBar title={cls?.name} onBack={() => navigate('/')} />
      <div className="am-scroll am-pad am-anim" style={{ paddingTop: 14, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <p style={{ color: 'var(--warn)', fontWeight: 700, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="am-chip" style={{ background: 'var(--good-soft)', color: 'var(--good)', borderColor: 'transparent' }}>
            {activeChildren.length} children
          </span>
          {cls?.hasGardenComponent && <span className="am-chip"><Icon name="leaf" size={14} /> Garden class</span>}
          <button className="am-btn am-btn--ghost" style={{ padding: '6px 14px', marginLeft: 'auto' }} onClick={() => navigate(`/class/${classId}/print`)}>
            <Icon name="print" size={16} /> Print class list
          </button>
        </div>

        {/* search */}
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={20} color="var(--sage)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="am-input" placeholder="Find a child…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 46 }} />
        </div>

        {filtered.map(ch => (
          <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="am-row" onClick={() => navigate(`/assess/${ch.id}`)}>
              <Avatar name={`${ch.firstName} ${ch.surname}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="am-row__title">{ch.firstName} {ch.surname}</div>
                <div className="am-row__sub">
                  Tap to assess{ch.isSample ? '' : ' · not in sample'}
                </div>
              </div>
              <Icon name="chevron" className="am-row__chev" size={22} color="var(--sage)" />
            </button>
            {canManage && (
              <div style={{ display: 'flex', gap: 8, paddingLeft: 8 }}>
                <button className="am-btn am-btn--ghost" style={{ padding: '6px 14px' }} onClick={() => navigate(`/child/${ch.id}`)}>View</button>
                <button className="am-btn am-btn--ghost" style={{ padding: '6px 14px' }} onClick={() => setEditing(ch)}>Edit</button>
                <button className="am-btn am-btn--ghost" style={{ padding: '6px 14px' }} onClick={() => run(rosterClient.setActive('child', ch.id, false))}>Retire</button>
              </div>
            )}
          </div>
        ))}

        {canManage && children.some(c => !c.active) && (
          <details>
            <summary>Retired children</summary>
            {children.filter(c => !c.active).map(ch => (
              <div key={ch.id} style={{ display: 'flex', gap: 8, opacity: 0.6, alignItems: 'center' }}>
                <span style={{ flex: 1 }}>{ch.firstName} {ch.surname}</span>
                <button onClick={() => run(rosterClient.setActive('child', ch.id, true))}>Restore</button>
              </div>
            ))}
          </details>
        )}

        {canManage && !editing && (
          <button className="am-btn am-btn--ghost am-btn--block" style={{ marginTop: 6, borderStyle: 'dashed' }} onClick={() => setEditing('new')}>
            <Icon name="plus" size={22} /> Add a child
          </button>
        )}
        {canManage && editing && (
          <ChildEditor
            key={editing === 'new' ? 'new' : editing.id}
            classes={ref.classes.filter(c => c.active)}
            allowClassChange={isCoordinator}
            initial={editing === 'new'
              ? { classId }
              : { classId: editing.classId, firstName: editing.firstName, surname: editing.surname, dateStarted: editing.dateStarted, isSample: editing.isSample, fields: editing.fields }}
            heading={editing === 'new' ? 'Add a child' : 'Edit child'}
            onCancel={() => setEditing(null)}
            onSubmit={input => {
              if (editing === 'new') run(rosterClient.addChild(input)).then(ok => { if (ok) setToast(`Added ${input.firstName} — tap to start baseline`) })
              else if (editing) run(rosterClient.updateChild(editing.id, input))
            }}
          />
        )}
      </div>

      <Toast show={!!toast}>{toast}</Toast>
      <BottomNav />
    </div>
  )
}
