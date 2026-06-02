import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useConfigData } from '../hooks/use-config-data'
import { useOnlineStatus } from '../hooks/use-online-status'
import { useAppearance, type ThemeName } from '../appearance'
import { configClient } from '../data/config-client'
import { reorder } from '../domain/config-logic'
import { AreaEditor } from '../components/AreaEditor'
import { ScaleEditor } from '../components/ScaleEditor'
import { ThresholdEditor } from '../components/ThresholdEditor'
import { ProgrammeClassManager } from '../components/ProgrammeClassManager'
import { rosterClient } from '../data/roster-client'
import { AccountManager } from '../components/AccountManager'
import { accountsClient } from '../data/accounts-client'
import { AppBar, BottomNav } from '../components/ui'

const THEMES: { key: ThemeName; label: string }[] = [
  { key: 'soft', label: 'Soft' },
  { key: 'garden', label: 'Garden' },
  { key: 'simple', label: 'Big & Simple' },
]

function AppearanceCard() {
  const { theme, setTheme, fsUser, setFsUser } = useAppearance()
  return (
    <div className="am-card am-card--pad">
      <div className="am-eyebrow">Appearance</div>
      <div className="am-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {THEMES.map(t => (
          <button
            key={t.key}
            type="button"
            className={'am-chip' + (theme === t.key ? ' am-chip--on' : '')}
            aria-pressed={theme === t.key}
            onClick={() => setTheme(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <label className="am-field" style={{ marginTop: 18 }}>
        <span className="am-field__lab">Text size</span>
        <input
          type="range"
          min="0.9"
          max="1.35"
          step="0.05"
          value={fsUser}
          onChange={e => setFsUser(Number(e.target.value))}
          aria-label="Text size"
          style={{ width: '100%' }}
        />
      </label>
      <p style={{ margin: '10px 0 0', fontWeight: 800 }}>Aa — the quick brown fox</p>
    </div>
  )
}

export function SettingsScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { ref, refresh, hasAssessments } = useConfigData()
  const online = useOnlineStatus()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!ref) return <p className="container">Loading…</p>

  const me = ref.facilitators.find(f => f.id === session?.user.id)
  const isCoordinator = me?.role === 'coordinator'

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
    <div className="am-root am-screen">
      <AppBar title="Settings" onBack={() => navigate('/')} />
      <div className="am-scroll am-pad am-anim">
        <AppearanceCard />

        {!isCoordinator && (
          <div className="am-card am-card--pad">
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              Settings like programmes, classes, accounts and indicators are managed by your co-ordinator.
            </p>
          </div>
        )}

        {isCoordinator && !online && (
          <div className="am-card am-card--pad">
            <p style={{ margin: 0 }}>Editing settings needs an internet connection. Reconnect and try again.</p>
          </div>
        )}

        {isCoordinator && online && (
          <>
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

            <h2>Accounts</h2>
            <AccountManager
              facilitators={ref.facilitators}
              classes={ref.classes}
              onCreate={input => run(accountsClient.createUser(input.username, input.password, input.name, input.role, input.classIds))}
              onSetPassword={(userId, password) => run(accountsClient.setPassword(userId, password))}
              onUpdate={(userId, name, role, classIds) => run(accountsClient.updateFacilitator(userId, name, role, classIds))}
              onSetActive={(userId, active) => run(accountsClient.setActive(userId, active))}
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
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
