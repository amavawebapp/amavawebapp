import type { DevelopmentArea, Indicator, Programme } from '../domain/types'
import { ScaleSelector } from './ScaleSelector'
import { Icon } from './ui'
import { areaIcon } from '../domain/view-model'

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
    <section className="am-stack">
      <div className="am-chip am-chip--lg">
        <Icon name={areaIcon(area.sortOrder)} size={20} />
        <span>{area.name}</span>
      </div>

      {indicators.map(ind => (
        <div key={ind.id} className="am-card">
          <p className="am-h2" style={{ marginTop: 0 }}>{ind.text}</p>
          {ind.hint && <p className="am-muted" style={{ marginTop: -6 }}>{ind.hint}</p>}
          <p className="am-muted">How often do you see this?</p>
          <ScaleSelector
            descriptors={descriptors}
            value={scores[ind.id] ?? null}
            onChange={v => onScore(ind.id, v)}
          />
        </div>
      ))}

      <div className="am-card">
        <label className="am-field">
          <span className="am-field__lab">Observations (optional)</span>
          <textarea
            className="am-input"
            value={note}
            onChange={e => onNote(e.target.value)}
            rows={3}
          />
        </label>
      </div>
    </section>
  )
}
