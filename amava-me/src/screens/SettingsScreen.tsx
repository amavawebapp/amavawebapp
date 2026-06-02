import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useOnlineStatus } from '../hooks/use-online-status'
import { configClient } from '../data/config-client'
import { reorder } from '../domain/config-logic'
import { AreaEditor } from '../components/AreaEditor'
import { ScaleEditor } from '../components/ScaleEditor'
import { ThresholdEditor } from '../components/ThresholdEditor'
import { ProgrammeClassManager } from '../components/ProgrammeClassManager'
import { rosterClient } from '../data/roster-client'

export function SettingsScreen() {
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!ref) return <p className="container">Loading…</p>
  const me = ref.facilitators.find(f => f.id === session?.user.id)
  if (me?.role !== 'coordinator') return <Navigate to="/" replace />
  if (!online) {
    return <div className="container"><h1>Settings</h1><p>Editing settings needs an internet connection. Reconnect and try again.</p></div>
  }

  const programme = ref.programmes[0]
  const areas = ref.areas.filter(a => a.programmeId === programme?.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const indicatorsFor = (areaId: string) => ref.indicators.filter(i => i.areaId === areaId)
  const run = async (p: Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await p
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <h1>Settings</h1>
      {busy && <p className="no-print" style={{ color: 'var(--muted)' }}>Saving…</p>}
      {error && <p style={{ color: 'var(--terracotta)' }}>{error}</p>}

      <h2>Programmes &amp; classes</h2>
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

      <h2>Areas &amp; indicators</h2>
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

      {programme && (
        <>
          <h2 style={{ marginTop: 24 }}>Rating scale</h2>
          <ScaleEditor key={`${programme.id}-${programme.scaleMax}`} scaleMax={programme.scaleMax} descriptors={programme.scaleDescriptors} hasData={hasAssessments}
            onSave={(max, desc) => run(configClient.updateScale(programme.id, max, desc))} />

          <h2 style={{ marginTop: 24 }}>Improved threshold</h2>
          <ThresholdEditor key={`${programme.id}-${programme.improvedThreshold ?? 1}`} scaleMax={programme.scaleMax} value={programme.improvedThreshold ?? 1}
            onSave={n => run(configClient.setThreshold(programme.id, n))} />
        </>
      )}
    </div>
  )
}
