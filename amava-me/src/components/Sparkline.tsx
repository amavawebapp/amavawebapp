interface Props { points: number[]; max: number; width?: number; height?: number }

export function Sparkline({ points, max, width = 120, height = 32 }: Props) {
  if (points.length === 0) return <svg width={width} height={height} aria-label="no data" />
  const safeMax = max > 0 ? max : 1
  const step = points.length > 1 ? width / (points.length - 1) : 0
  const coords = points.map((p, i) => `${i * step},${height - (p / safeMax) * height}`).join(' ')
  return (
    <svg width={width} height={height} role="img" aria-label="trend">
      <polyline points={coords} fill="none" stroke="var(--terracotta)" strokeWidth="2" />
    </svg>
  )
}
