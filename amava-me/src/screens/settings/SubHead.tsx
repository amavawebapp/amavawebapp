export function SubHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div>
      {eyebrow && <div className="am-eyebrow">{eyebrow}</div>}
      <div className="am-h1" style={{ fontSize: '1.5rem', marginTop: 2 }}>{title}</div>
      {sub && <p className="am-muted" style={{ margin: '6px 0 0', fontSize: '.95rem' }}>{sub}</p>}
    </div>
  )
}
