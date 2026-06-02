import { useState } from 'react'
import type { Programme } from '../domain/types'
import { validateScale } from '../domain/config-logic'

interface Props {
  scaleMax: number
  descriptors: Programme['scaleDescriptors']
  hasData: boolean
  onSave: (scaleMax: number, descriptors: Programme['scaleDescriptors']) => void
}

export function ScaleEditor({ descriptors, hasData, onSave }: Props) {
  const [points, setPoints] = useState(descriptors)
  const update = (i: number, field: 'label' | 'description', v: string) =>
    setPoints(ps => ps.map((p, idx) => (idx === i ? { ...p, [field]: v } : p)))
  const addPoint = () => setPoints(ps => [...ps, { value: ps.length + 1, label: '', description: '' }])
  const removeLast = () => setPoints(ps => ps.slice(0, -1))
  const normalised = points.map((p, i) => ({ ...p, value: i + 1 }))
  const err = validateScale(normalised.length, normalised)
  return (
    <div className="am-stack" style={{ gap: 12 }}>
      {hasData && (
        <div className="am-card am-card--pad" style={{ color: 'var(--warn)', fontSize: '.92rem' }}>
          ⚠ Assessments already exist. Changing the scale affects future assessments only — past scores keep their original scale, so comparisons across the change may be harder to read.
        </div>
      )}
      <div className="am-stack" style={{ gap: 8 }}>
        {points.map((p, i) => (
          <div key={i} className="am-defrow" style={{ alignItems: 'center' }}>
            <span className="am-defrow__num">{i + 1}</span>
            <input className="am-input" aria-label={`point ${i + 1} label`} value={p.label} onChange={e => update(i, 'label', e.target.value)} placeholder="label" style={{ flex: '1 1 100px' }} />
            <input className="am-input" aria-label={`point ${i + 1} description`} value={p.description} onChange={e => update(i, 'description', e.target.value)} placeholder="description" style={{ flex: '2 1 140px' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="am-btn" onClick={addPoint} disabled={points.length >= 10}>Add point</button>
        <button className="am-btn am-btn--ghost" onClick={removeLast} disabled={points.length <= 2}>Remove last</button>
        <button className="am-btn am-btn--primary" disabled={!!err} onClick={() => onSave(normalised.length, normalised)}>Save scale</button>
      </div>
      {err && <span style={{ color: 'var(--warn)' }}>{err}</span>}
    </div>
  )
}
