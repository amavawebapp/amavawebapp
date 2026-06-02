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
    <div>
      {hasData && (
        <p style={{ color: 'var(--terracotta)' }}>
          ⚠ Assessments already exist. Changing the scale affects future assessments only — past scores keep their original scale, so comparisons across the change may be harder to read.
        </p>
      )}
      {points.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
          <strong style={{ width: 20 }}>{i + 1}</strong>
          <input aria-label={`point ${i + 1} label`} value={p.label} onChange={e => update(i, 'label', e.target.value)} placeholder="label" />
          <input aria-label={`point ${i + 1} description`} value={p.description} onChange={e => update(i, 'description', e.target.value)} placeholder="description" style={{ flex: 1 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <button onClick={addPoint} disabled={points.length >= 10}>Add point</button>
        <button onClick={removeLast} disabled={points.length <= 2}>Remove last</button>
      </div>
      {err && <span style={{ color: 'var(--terracotta)' }}>{err}</span>}
      <button className="primary" style={{ marginLeft: 8 }} disabled={!!err} onClick={() => onSave(normalised.length, normalised)}>Save scale</button>
    </div>
  )
}
