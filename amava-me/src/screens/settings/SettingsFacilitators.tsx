import { Navigate } from 'react-router-dom'
import { AccountManager } from '../../components/AccountManager'
import { accountsClient } from '../../data/accounts-client'
import { SubScreen } from './SubScreen'
import { useSettingsEditing } from './use-settings-editing'

export function SettingsFacilitators() {
  const { ref, online, isCoordinator, error, busy, run } = useSettingsEditing()

  if (!ref) return <p className="container">Loading…</p>
  if (!isCoordinator) return <Navigate to="/settings" replace />

  return (
    <SubScreen title="Facilitators">
      {!online ? (
        <div className="am-card am-card--pad">
          <p style={{ margin: 0 }}>Editing settings needs an internet connection. Reconnect and try again.</p>
        </div>
      ) : (
        <>
          {busy && <p className="no-print" style={{ color: 'var(--muted)' }}>Saving…</p>}
          {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

          <AccountManager
            facilitators={ref.facilitators}
            classes={ref.classes}
            onCreate={input => run(accountsClient.createUser(input.username, input.password, input.name, input.role, input.classIds))}
            onSetPassword={(userId, password) => run(accountsClient.setPassword(userId, password))}
            onUpdate={(userId, name, role, classIds) => run(accountsClient.updateFacilitator(userId, name, role, classIds))}
            onSetActive={(userId, active) => run(accountsClient.setActive(userId, active))}
          />
        </>
      )}
    </SubScreen>
  )
}
