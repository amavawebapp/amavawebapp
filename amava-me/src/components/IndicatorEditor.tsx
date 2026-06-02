import { useState } from 'react'
import type { Indicator } from '../domain/types'

interface Props {
  indicator: Indicator
  onSaveText: (id: string, text: string, hint: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
  onToggleActive: (id: string, active: boolean) => void
}

export function IndicatorEditor({ indicator, onSaveText, onMove, onToggleActive }: Props) {
  const [text, setText] = useState(indicator.text)
  const [hint, setHint] = useState(indicator.hint ?? '')
  const dirty = text !== indicator.text || hint !== (indicator.hint ?? '')
  return (
    <div style={{ opacity: indicator.active ? 1 : 0.5, display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
      <input aria-label="indicator text" value={text} onChange={e => setText(e.target.value)} style={{ flex: 1 }} />
      <input aria-label="indicator hint" value={hint} onChange={e => setHint(e.target.value)} placeholder="hint (optional)" style={{ width: 150 }} />
      {dirty && <button onClick={() => onSaveText(indicator.id, text.trim(), hint.trim())} disabled={!text.trim()}>Save</button>}
      <button aria-label="move indicator up" onClick={() => onMove(indicator.id, 'up')}>↑</button>
      <button aria-label="move indicator down" onClick={() => onMove(indicator.id, 'down')}>↓</button>
      <button onClick={() => onToggleActive(indicator.id, !indicator.active)}>{indicator.active ? 'Retire' : 'Restore'}</button>
    </div>
  )
}
