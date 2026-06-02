import { useEffect, useState } from 'react'
import { useAppServices } from '../../app-context'
import { useSyncStatus } from '../../hooks/use-sync-status'
import { Icon } from '../../components/ui'
import { SubScreen } from './SubScreen'

export function SettingsOffline() {
  const { store, engine } = useAppServices()
  const { online, pendingCount, sync } = useSyncStatus(store, engine)
  const [storedCount, setStoredCount] = useState(0)

  useEffect(() => {
    let alive = true
    store.getAllAssessments().then(all => { if (alive) setStoredCount(all.length) })
    return () => { alive = false }
  }, [store, pendingCount])

  const allSaved = online && pendingCount === 0
  const statusTitle = allSaved
    ? 'Everything is saved'
    : online
      ? `${pendingCount} waiting to upload`
      : `Offline — ${pendingCount} waiting`

  return (
    <SubScreen title="Offline data & sync">
      <div className="am-card am-card--pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, flex: '0 0 56px', borderRadius: 18, display: 'grid', placeItems: 'center',
          background: allSaved ? 'var(--good-soft)' : 'color-mix(in srgb, var(--warn) 18%, var(--surface))' }}>
          <Icon name={allSaved ? 'check' : 'wifi'} size={28} color={allSaved ? 'var(--good)' : 'var(--warn)'} stroke={3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{statusTitle}</div>
          <div className="am-row__sub">Saved on this phone</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="am-stat">
          <div className="am-stat__v">{storedCount}</div>
          <div className="am-stat__l">On this phone</div>
          <div className="am-stat__s">assessments stored</div>
        </div>
        <div className="am-stat">
          <div className="am-stat__v" style={{ color: pendingCount > 0 ? 'var(--warn)' : 'var(--good)' }}>{pendingCount}</div>
          <div className="am-stat__l">Waiting</div>
          <div className="am-stat__s">to upload</div>
        </div>
      </div>

      <button className="am-btn am-btn--brand am-btn--block" disabled={!online} onClick={() => sync()}>
        <Icon name="wifi" size={20} /> Sync now
      </button>

      <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="info" size={22} color="var(--brand)" style={{ flex: '0 0 22px', marginTop: 1 }} />
        <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>
          You can keep working with no signal. Everything is saved on this phone and uploads on its own once you’re back online.
        </p>
      </div>
    </SubScreen>
  )
}
