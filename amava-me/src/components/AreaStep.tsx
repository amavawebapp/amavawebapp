import type { DevelopmentArea, Indicator, Programme } from '../domain/types'
import { ScaleSelector } from './ScaleSelector'

interface Props {
  area: DevelopmentArea
  indicators: Indicator[]
  descriptors: Programme['scaleDescriptors']
  scores: Record<string, number>
  note: string
  onScore: (indicatorId: string, value: number) => void
  onNote: (note: string) => void
}

export function AreaStep({ area, indicators, descriptors, scores, note, onScore, onNote }: Props) {
  return (
    <section>
      <h2>{area.name}</h2>
      {indicators.map(ind => (
        <div key={ind.id} style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 600 }}>{ind.text}</p>
          {ind.hint && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{ind.hint}</p>}
          <ScaleSelector
            descriptors={descriptors}
            value={scores[ind.id] ?? null}
            onChange={v => onScore(ind.id, v)}
          />
        </div>
      ))}
      <label style={{ display: 'block', marginTop: 12 }}>
        Observations (optional)
        <textarea
          value={note}
          onChange={e => onNote(e.target.value)}
          rows={3}
          style={{ width: '100%', font: 'inherit' }}
        />
      </label>
    </section>
  )
}
