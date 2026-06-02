export const AVA_COLORS = ['#DD866C', '#6fa173', '#687F8B', '#c9a24a', '#7fae9f', '#b07d63']
export function Avatar({ name, color, size = 46 }: { name: string; color?: string; size?: number }) {
  const initials = name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
  const c = color || AVA_COLORS[(name.charCodeAt(0) + name.length) % AVA_COLORS.length]
  return (
    <div className="am-ava" style={{ width: size, height: size, flexBasis: size, background: c, fontSize: size * 0.36, borderRadius: size * 0.3 }}>
      {initials}
    </div>
  )
}
