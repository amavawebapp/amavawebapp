import { useState } from 'react'
import type { DevelopmentArea, Indicator } from '../domain/types'
import { IndicatorEditor } from './IndicatorEditor'

interface Props {
  area: DevelopmentArea
  indicators: Indicator[]
  onRenameArea: (id: string, name: string) => void
  onToggleGarden: (id: string, gardenOnly: boolean) => void
  onMoveArea: (id: string, dir: 'up' | 'down') => void
  onToggleAreaActive: (id: string, active: boolean) => void
  onAddIndicator: (areaId: string, text: string) => void
  onSaveIndicatorText: (id: string, text: string, hint: string) => void
  onMoveIndicator: (id: string, dir: 'up' | 'down') => void
  onToggleIndicatorActive: (id: string, active: boolean) => void
}

export function AreaEditor(p: Props) {
  const [name, setName] = useState(p.area.name)
  const [newInd, setNewInd] = useState('')
  const inds = [...p.indicators].sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <section style={{ border: '1px solid var(--sage)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 12, opacity: p.area.active ? 1 : 0.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input aria-label="area name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, fontWeight: 600 }} />
        {name !== p.area.name && <button onClick={() => p.onRenameArea(p.area.id, name.trim())} disabled={!name.trim()}>Save</button>}
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={p.area.gardenOnly} onChange={e => p.onToggleGarden(p.area.id, e.target.checked)} /> garden-only
        </label>
        <button aria-label="move area up" onClick={() => p.onMoveArea(p.area.id, 'up')}>↑</button>
        <button aria-label="move area down" onClick={() => p.onMoveArea(p.area.id, 'down')}>↓</button>
        <button aria-label={p.area.active ? 'retire area' : 'restore area'} onClick={() => p.onToggleAreaActive(p.area.id, !p.area.active)}>{p.area.active ? 'Retire' : 'Restore'}</button>
      </div>
      {inds.map(i => (
        <IndicatorEditor key={i.id} indicator={i}
          onSaveText={p.onSaveIndicatorText} onMove={p.onMoveIndicator} onToggleActive={p.onToggleIndicatorActive} />
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input aria-label="new indicator" value={newInd} onChange={e => setNewInd(e.target.value)} placeholder="New indicator…" style={{ flex: 1 }} />
        <button className="primary" disabled={!newInd.trim()}
          onClick={() => { if (newInd.trim()) { p.onAddIndicator(p.area.id, newInd.trim()); setNewInd('') } }}>Add</button>
      </div>
    </section>
  )
}
