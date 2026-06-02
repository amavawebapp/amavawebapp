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
    <section className="am-card am-card--pad" style={{ opacity: p.area.active ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="am-input" aria-label="area name" value={name} onChange={e => setName(e.target.value)} style={{ flex: '1 1 140px', fontWeight: 700 }} />
        {name !== p.area.name && <button className="am-btn" onClick={() => p.onRenameArea(p.area.id, name.trim())} disabled={!name.trim()}>Save</button>}
        <button className={'am-switch' + (p.area.gardenOnly ? ' on' : '')} role="switch"
          aria-checked={p.area.gardenOnly} aria-label="garden-only area"
          onClick={() => p.onToggleGarden(p.area.id, !p.area.gardenOnly)}>
          <span className="am-switch__knob" />
        </button>
        <button className="am-btn am-btn--ghost" aria-label="move area up" onClick={() => p.onMoveArea(p.area.id, 'up')}>↑</button>
        <button className="am-btn am-btn--ghost" aria-label="move area down" onClick={() => p.onMoveArea(p.area.id, 'down')}>↓</button>
        <button className="am-btn am-btn--ghost" aria-label={p.area.active ? 'retire area' : 'restore area'} onClick={() => p.onToggleAreaActive(p.area.id, !p.area.active)}>{p.area.active ? 'Retire' : 'Restore'}</button>
      </div>
      <div className="am-stack" style={{ gap: 8 }}>
        {inds.map(i => (
          <IndicatorEditor key={i.id} indicator={i}
            onSaveText={p.onSaveIndicatorText} onMove={p.onMoveIndicator} onToggleActive={p.onToggleIndicatorActive} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="am-input" aria-label="new indicator" value={newInd} onChange={e => setNewInd(e.target.value)} placeholder="New indicator…" style={{ flex: 1 }} />
        <button className="am-btn" disabled={!newInd.trim()}
          onClick={() => { if (newInd.trim()) { p.onAddIndicator(p.area.id, newInd.trim()); setNewInd('') } }}>Add</button>
      </div>
    </section>
  )
}
