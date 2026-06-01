interface Props { value: string; label: string; sub?: string }

export function StatCard({ value, label, sub }: Props) {
  return (
    <div style={{
      border: '1px solid var(--green)', borderRadius: 'var(--radius)',
      padding: 16, minWidth: 160, background: '#fff',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--primary)' }}>{value}</div>
      <div style={{ fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}
