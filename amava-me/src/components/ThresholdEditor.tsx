import { useState } from 'react'
import { validateThreshold } from '../domain/config-logic'

interface Props { scaleMax: number; value: number; onSave: (n: number) => void }

export function ThresholdEditor({ scaleMax, value, onSave }: Props) {
  const [n, setN] = useState(String(value))
  const num = Number(n)
  const err = n.trim() === '' ? 'Enter a number.' : validateThreshold(num, scaleMax)
  return (
    <div className="am-card am-card--pad am-stack" style={{ gap: 12 }}>
      <p className="am-muted" style={{ margin: 0, fontSize: '.92rem' }}>
        A child counts as "improved" when their latest score rises by at least this many points versus baseline.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="am-input" aria-label="improved threshold" type="number" min={1} max={scaleMax - 1} value={n} onChange={e => setN(e.target.value)} style={{ width: 110 }} />
        <button className="am-btn am-btn--primary" disabled={!!err} onClick={() => onSave(num)}>Save</button>
      </div>
      {err && <span style={{ color: 'var(--warn)' }}>{err}</span>}
    </div>
  )
}
