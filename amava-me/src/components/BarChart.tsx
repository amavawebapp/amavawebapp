interface Bar { label: string; value: number }
interface Props { data: Bar[]; max: number; height?: number }

export function BarChart({ data, max, height = 140 }: Props) {
  const barW = 48, gap = 16, padBottom = 20
  const width = Math.max(1, data.length * (barW + gap))
  const safeMax = max > 0 ? max : 1
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="bar chart">
      {data.map((d, idx) => {
        const h = Math.max(0, (d.value / safeMax) * (height - padBottom))
        const x = idx * (barW + gap) + gap / 2
        const y = height - padBottom - h
        return (
          <g key={d.label}>
            <rect className="bar" x={x} y={y} width={barW} height={h} rx={4} fill="var(--slate)" />
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="11" fill="var(--text)">{d.value}</text>
          </g>
        )
      })}
    </svg>
  )
}
