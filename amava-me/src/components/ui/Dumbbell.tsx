function Dot({ left, color, ring }: { left: number; color?: string; ring?: boolean }) {
  return <div style={{ position: 'absolute', top: 7, left: `calc(${left}% - 7px)`, width: 14, height: 14,
    borderRadius: 999, background: ring ? 'var(--surface)' : color, border: ring ? '3px solid var(--sage)' : '3px solid var(--surface)',
    boxShadow: ring ? 'none' : '0 1px 3px rgba(0,0,0,.18)' }} />
}
export function Dumbbell({ baseline, latest, max = 4 }: { baseline: number | null; latest: number | null; max?: number }) {
  const bp = baseline != null ? (baseline / max) * 100 : null
  const lp = latest != null ? (latest / max) * 100 : null
  const up = latest != null && baseline != null && latest >= baseline
  return (
    <div style={{ position: 'relative', height: 26, flex: 1 }}>
      <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, borderRadius: 2, background: 'var(--surface-2)', border: '1px solid var(--line)' }} />
      {bp != null && lp != null && (
        <div style={{ position: 'absolute', top: 11.5, height: 4, borderRadius: 2,
          left: Math.min(bp, lp) + '%', width: Math.abs(lp - bp) + '%', background: up ? 'var(--good)' : 'var(--warn)' }} />
      )}
      {bp != null && <Dot left={bp} ring />}
      {lp != null && <Dot left={lp} color={up ? 'var(--good)' : 'var(--warn)'} />}
    </div>
  )
}
