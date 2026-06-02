export function Donut({ value, label, sublabel, color = 'var(--good)', size = 116 }: {
  value: number; label: string; sublabel?: string; color?: string; size?: number
}) {
  const r = (size - 16) / 2, c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: size * 0.27, color: 'var(--ink)', letterSpacing: '-.04em', lineHeight: 1 }}>{label}</div>
          {sublabel && <div style={{ fontWeight: 800, fontSize: size * 0.1, color: 'var(--ink-soft)', marginTop: 3 }}>{sublabel}</div>}
        </div>
      </div>
    </div>
  )
}
