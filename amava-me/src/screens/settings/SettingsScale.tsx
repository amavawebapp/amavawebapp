import { Navigate } from 'react-router-dom'
import { ScaleEditor } from '../../components/ScaleEditor'
import { ThresholdEditor } from '../../components/ThresholdEditor'
import { configClient } from '../../data/config-client'
import { Icon } from '../../components/ui'
import { SubScreen } from './SubScreen'
import { useSettingsEditing } from './use-settings-editing'

export function SettingsScale() {
  const { ref, hasAssessments, online, isCoordinator, error, busy, run } = useSettingsEditing()

  if (!ref) return <p className="container">Loading…</p>
  if (!isCoordinator) return <Navigate to="/settings" replace />

  const programme = ref.programmes[0]

  return (
    <SubScreen title="Rating scale">
      {!online ? (
        <div className="am-card am-card--pad">
          <p style={{ margin: 0 }}>Editing settings needs an internet connection. Reconnect and try again.</p>
        </div>
      ) : (
        <>
          {busy && <p className="no-print" style={{ color: 'var(--muted)' }}>Saving…</p>}
          {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

          {programme && (
            <>
              <ScaleEditor key={`${programme.id}-${programme.scaleMax}`} scaleMax={programme.scaleMax} descriptors={programme.scaleDescriptors} hasData={hasAssessments}
                onSave={(max, desc) => run(configClient.updateScale(programme.id, max, desc))} />

              <ThresholdEditor key={`${programme.id}-${programme.improvedThreshold ?? 1}`} scaleMax={programme.scaleMax} value={programme.improvedThreshold ?? 1}
                onSave={n => run(configClient.setThreshold(programme.id, n))} />

              <div className="am-card am-card--pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Icon name="info" size={22} color="var(--brand)" style={{ flex: '0 0 22px', marginTop: 1 }} />
                <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>
                  A child counts as <strong style={{ color: 'var(--good)' }}>improved</strong> when their score rises by 1 or more between the baseline and a later check-in.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </SubScreen>
  )
}
