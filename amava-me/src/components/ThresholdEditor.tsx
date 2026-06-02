import { useState } from 'react'
import { validateThreshold } from '../domain/config-logic'

interface Props { scaleMax: number; value: number; onSave: (n: number) => void }

export function ThresholdEditor({ scaleMax, value, onSave }: Props) {
  const [n, setN] = useState(String(value))
  const num = Number(n)
  const err = n.trim() === '' ? 'Enter a number.' : validateThreshold(num, scaleMax)
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        A child counts as "improved" when their latest score rises by at least this many points versus baseline.
      </p>
      <input aria-label="improved threshold" type="number" min={1} max={scaleMax - 1} value={n} onChange={e => setN(e.target.value)} />
      {err && <span style={{ color: 'var(--terracotta)', marginLeft: 8 }}>{err}</span>}
      <button className="primary" style={{ marginLeft: 8 }} disabled={!!err} onClick={() => onSave(num)}>Save</button>
    </div>
  )
}
