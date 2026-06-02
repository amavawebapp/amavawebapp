import { Navigate } from 'react-router-dom'
import { AreaEditor } from '../../components/AreaEditor'
import { configClient } from '../../data/config-client'
import { reorder } from '../../domain/config-logic'
import { SubScreen } from './SubScreen'
import { useSettingsEditing } from './use-settings-editing'

export function SettingsAreas() {
  const { ref, online, isCoordinator, error, busy, run } = useSettingsEditing()

  if (!ref) return <p className="container">Loading…</p>
  if (!isCoordinator) return <Navigate to="/settings" replace />

  const programme = ref.programmes[0]
  const areas = ref.areas.filter(a => a.programmeId === programme?.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const indicatorsFor = (areaId: string) => ref.indicators.filter(i => i.areaId === areaId)

  return (
    <SubScreen title="Areas & indicators">
      {!online ? (
        <div className="am-card am-card--pad">
          <p style={{ margin: 0 }}>Editing settings needs an internet connection. Reconnect and try again.</p>
        </div>
      ) : (
        <>
          {busy && <p className="no-print" style={{ color: 'var(--muted)' }}>Saving…</p>}
          {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

          {areas.map(area => (
            <AreaEditor key={area.id} area={area} indicators={indicatorsFor(area.id)}
              onRenameArea={(id, name) => run(configClient.updateArea(id, { name }))}
              onToggleGarden={(id, gardenOnly) => run(configClient.updateArea(id, { gardenOnly }))}
              onMoveArea={(id, dir) => run(configClient.reorderRows('development_area', reorder(areas, id, dir)))}
              onToggleAreaActive={(id, active) => run(configClient.setActive('development_area', id, active))}
              onAddIndicator={(areaId, text) => run(configClient.addIndicator(areaId, text, Math.max(0, ...indicatorsFor(areaId).map(i => i.sortOrder)) + 1))}
              onSaveIndicatorText={(id, text, hint) => run(configClient.updateIndicator(id, { text, hint: hint || null }))}
              onMoveIndicator={(id, dir) => run(configClient.reorderRows('indicator', reorder(indicatorsFor(area.id), id, dir)))}
              onToggleIndicatorActive={(id, active) => run(configClient.setActive('indicator', id, active))}
            />
          ))}
          {programme && (
            <button className="primary" onClick={() => run(configClient.addArea(programme.id, 'New area', false, Math.max(0, ...areas.map(a => a.sortOrder)) + 1))}>
              Add area
            </button>
          )}
        </>
      )}
    </SubScreen>
  )
}
