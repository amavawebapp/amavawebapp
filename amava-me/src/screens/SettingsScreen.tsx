import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useOnlineStatus } from '../hooks/use-online-status'
import { configClient } from '../data/config-client'
import { reorder } from '../domain/config-logic'
import { AreaEditor } from '../components/AreaEditor'
import { ScaleEditor } from '../components/ScaleEditor'
import { ThresholdEditor } from '../components/ThresholdEditor'

export function SettingsScreen() {
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  if (me?.role !== 'coordinator') return <Navigate to="/" replace />
  if (!online) {
    return <div className="container"><h1>Settings</h1><p>Editing settings needs an internet connection. Reconnect and try again.</p></div>
  }

  const programme = ref.programmes[0]
  const areas = ref.areas.filter(a => a.programmeId === programme?.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const indicatorsFor = (areaId: string) => ref.indicators.filter(i => i.areaId === areaId)
  const run = async (p: Promise<void>) => { await p; await refresh() }

  return (
    <div className="container">
      <h1>Settings</h1>

      <h2>Areas &amp; indicators</h2>
      {areas.map(area => (
        <AreaEditor key={area.id} area={area} indicators={indicatorsFor(area.id)}
          onRenameArea={(id, name) => run(configClient.updateArea(id, { name }))}
          onToggleGarden={(id, gardenOnly) => run(configClient.updateArea(id, { gardenOnly }))}
          onMoveArea={(id, dir) => run(configClient.reorderRows('development_area', reorder(areas, id, dir)))}
          onToggleAreaActive={(id, active) => run(configClient.setActive('development_area', id, active))}
          onAddIndicator={(areaId, text) => run(configClient.addIndicator(areaId, text, indicatorsFor(areaId).length + 1))}
          onSaveIndicatorText={(id, text, hint) => run(configClient.updateIndicator(id, { text, hint: hint || null }))}
          onMoveIndicator={(id, dir) => run(configClient.reorderRows('indicator', reorder(indicatorsFor(area.id), id, dir)))}
          onToggleIndicatorActive={(id, active) => run(configClient.setActive('indicator', id, active))}
        />
      ))}
      {programme && (
        <button className="primary" onClick={() => run(configClient.addArea(programme.id, 'New area', false, areas.length + 1))}>
          Add area
        </button>
      )}

      {programme && (
        <>
          <h2 style={{ marginTop: 24 }}>Rating scale</h2>
          <ScaleEditor scaleMax={programme.scaleMax} descriptors={programme.scaleDescriptors} hasData={hasAssessments}
            onSave={(max, desc) => run(configClient.updateScale(programme.id, max, desc))} />

          <h2 style={{ marginTop: 24 }}>Improved threshold</h2>
          <ThresholdEditor scaleMax={programme.scaleMax} value={programme.improvedThreshold ?? 1}
            onSave={n => run(configClient.setThreshold(programme.id, n))} />
        </>
      )}
    </div>
  )
}
