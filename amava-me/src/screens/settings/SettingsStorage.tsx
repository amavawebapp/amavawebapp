import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { configClient, type StorageUsage } from '../../data/config-client'
import { Icon } from '../../components/ui'
import { SubScreen } from './SubScreen'
import { SubHead } from './SubHead'
import { useSettingsEditing } from './use-settings-editing'

/** Free-tier storage limit: 1 GB. */
const STORAGE_LIMIT = 1073741824
const WARN_RATIO = 0.8

/** Format a byte count as MB with one decimal place. */
function toMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

const BUCKET_ROWS: { key: string; label: string }[] = [
  { key: 'child-photos', label: 'Child photos' },
  { key: 'child-docs', label: 'Indemnity forms' },
  { key: 'assessment-files', label: 'Assessment files' },
]

export function SettingsStorage() {
  const { ref, isCoordinator } = useSettingsEditing()
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setFailed(false)
    configClient.storageUsage()
      .then(u => { if (alive) setUsage(u) })
      .catch(() => { if (alive) setFailed(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (!ref) return <p className="container">Loading…</p>
  if (!isCoordinator) return <Navigate to="/settings" replace />

  const total = usage?.total ?? 0
  const ratio = Math.min(1, total / STORAGE_LIMIT)
  const nearFull = ratio >= WARN_RATIO
  const barColour = nearFull ? 'var(--warn)' : 'var(--good)'

  return (
    <SubScreen title="Storage">
      <SubHead eyebrow="This account" title="Cloud storage"
        sub="Photos, indemnity forms and assessment files are stored securely online. The free plan includes 1 GB." />

      {loading ? (
        <div className="am-card am-card--pad">
          <p className="am-muted" style={{ margin: 0 }}>Loading usage…</p>
        </div>
      ) : failed ? (
        <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="info" size={22} color="var(--warn)" style={{ flex: '0 0 22px', marginTop: 1 }} />
          <p style={{ margin: 0 }}>Couldn’t load usage. This needs an internet connection — reconnect and try again.</p>
        </div>
      ) : (
        <>
          <div className="am-card am-card--pad am-stack" style={{ gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{toMB(total)} MB of 1024 MB used</div>
              <div className="am-row__sub">{Math.round(ratio * 100)}%</div>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(2, ratio * 100)}%`, height: '100%', borderRadius: 999, background: barColour, transition: 'width .3s ease' }} />
            </div>
          </div>

          {nearFull && (
            <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
              background: 'color-mix(in srgb, var(--warn) 12%, var(--surface))', borderColor: 'var(--warn)' }}>
              <Icon name="flag" size={22} color="var(--warn)" style={{ flex: '0 0 22px', marginTop: 1 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>
                Storage is getting full — consider removing old photos/attachments or upgrading the plan.
              </p>
            </div>
          )}

          <div className="am-sectionlab"><span className="am-eyebrow">Breakdown</span></div>
          <div className="am-card am-card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BUCKET_ROWS.map(b => (
              <div key={b.key} style={{ display: 'flex', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600 }}>{b.label}</div>
                <div className="am-row__sub" style={{ fontWeight: 700 }}>{toMB(usage?.buckets[b.key] ?? 0)} MB</div>
              </div>
            ))}
          </div>
        </>
      )}
    </SubScreen>
  )
}
