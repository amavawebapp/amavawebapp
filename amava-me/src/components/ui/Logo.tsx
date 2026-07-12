export function Logo({ size = 30, sub = true, color }: { size?: number; sub?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span className="am-logo" style={{ fontSize: size, color: color ?? 'var(--terracotta)' }}>Amava</span>
      {sub && <span style={{ fontWeight: 800, fontSize: size * 0.26, letterSpacing: '.34em',
        textTransform: 'uppercase', color: 'var(--sage)', marginTop: 4, marginLeft: 2 }}>Oluntu</span>}
    </div>
  )
}
