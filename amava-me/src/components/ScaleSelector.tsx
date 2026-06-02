import { Icon } from './ui'
import type { Programme } from '../domain/types'

interface Props {
  descriptors: Programme['scaleDescriptors']
  value: number | null
  onChange: (value: number) => void
}

export function ScaleSelector({ descriptors, value, onChange }: Props) {
  return (
    <div className="am-scale" role="group" aria-label="Rating">
      {descriptors.map(d => {
        const on = value === d.value
        return (
          <button
            type="button"
            key={d.value}
            className={'am-scaleopt' + (on ? ' on' : '')}
            aria-pressed={on}
            onClick={() => onChange(d.value)}
          >
            <span className="am-scaleopt__num">{d.value}</span>
            <span style={{ flex: 1 }}>
              <span className="am-scaleopt__lab">{d.label}</span>
              <span className="am-scaleopt__desc" style={{ display: 'block' }}>{d.description}</span>
            </span>
            {on && <Icon name="check" size={22} color="var(--accent)" stroke={3} />}
          </button>
        )
      })}
    </div>
  )
}
