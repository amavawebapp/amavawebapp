import type { Programme } from '../domain/types'

interface Props {
  descriptors: Programme['scaleDescriptors']
  value: number | null
  onChange: (value: number) => void
}

export function ScaleSelector({ descriptors, value, onChange }: Props) {
  return (
    <div role="group" style={{ display: 'grid', gap: 8 }}>
      {descriptors.map(d => (
        <button
          key={d.value}
          type="button"
          className={value === d.value ? 'primary' : ''}
          aria-pressed={value === d.value}
          onClick={() => onChange(d.value)}
        >
          <strong>{d.value} · {d.label}</strong>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{d.description}</div>
        </button>
      ))}
    </div>
  )
}
