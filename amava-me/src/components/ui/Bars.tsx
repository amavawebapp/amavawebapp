export interface BarDatum { label: string; value: number | null; baseline?: number | null; color?: string; suffix?: string }
export function Bars({ data, max = 4, showBaseline = true }: { data: BarDatum[]; max?: number; showBaseline?: boolean }) {
  return (
    <div className="am-bars">
      {data.map((d, i) => {
        const pct = Math.max(4, ((d.value ?? 0) / max) * 100)
        const basePct = d.baseline != null ? (d.baseline / max) * 100 : null
        return (
          <div key={i}>
            <div className="am-bar__top">
              <span className="am-bar__lab">{d.label}</span>
              <span className="am-bar__val">{d.value ?? '—'}{d.suffix || ''}</span>
            </div>
            <div className="am-bar__track">
              <div className="am-bar__fill" style={{ width: pct + '%', background: d.color || 'var(--good)' }} />
              {showBaseline && basePct != null && <div className="am-bar__base" style={{ left: `calc(${basePct}% - 1px)` }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
