import { Navigate } from 'react-router-dom'
import { ProgrammeClassManager } from '../../components/ProgrammeClassManager'
import { rosterClient } from '../../data/roster-client'
import { SubScreen } from './SubScreen'
import { useSettingsEditing } from './use-settings-editing'

export function SettingsProgrammes() {
  const { ref, online, isCoordinator, error, busy, run } = useSettingsEditing()

  if (!ref) return <p className="container">Loading…</p>
  if (!isCoordinator) return <Navigate to="/settings" replace />

  return (
    <SubScreen title="Programmes & classes">
      {!online ? (
        <div className="am-card am-card--pad">
          <p style={{ margin: 0 }}>Editing settings needs an internet connection. Reconnect and try again.</p>
        </div>
      ) : (
        <>
          {busy && <p className="no-print" style={{ color: 'var(--muted)' }}>Saving…</p>}
          {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

          <ProgrammeClassManager
            programmes={ref.programmes}
            classes={ref.classes}
            onAddProgramme={name => run(rosterClient.addProgramme(name))}
            onRenameProgramme={(id, name) => run(rosterClient.updateProgramme(id, { name }))}
            onToggleProgrammeActive={(id, active) => run(rosterClient.setActive('programme', id, active))}
            onAddClass={(programmeId, name) => run(rosterClient.addClass(programmeId, name, false))}
            onRenameClass={(id, name) => run(rosterClient.updateClass(id, { name }))}
            onToggleGarden={(id, hasGardenComponent) => run(rosterClient.updateClass(id, { hasGardenComponent }))}
            onToggleClassActive={(id, active) => run(rosterClient.setActive('class_group', id, active))}
          />
        </>
      )}
    </SubScreen>
  )
}
