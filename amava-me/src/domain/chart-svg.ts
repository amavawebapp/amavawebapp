export interface Bar { label: string; value: number }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** A bar chart as an SVG string (explicit hex brand colours — CSS vars don't resolve in PDF). */
export function barChartSvg(data: Bar[], max: number, opts?: { height?: number }): string {
  const height = opts?.height ?? 140, barW = 48, gap = 16, padBottom = 20
  const width = Math.max(1, data.length * (barW + gap))
  const safeMax = max > 0 ? max : 1
  const body = data.map((d, i) => {
    const h = Math.max(0, (d.value / safeMax) * (height - padBottom))
    const x = i * (barW + gap) + gap / 2
    const y = height - padBottom - h
    const cx = x + barW / 2
    return (
      `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="#687F8B"/>` +
      `<text x="${cx}" y="${height - 6}" font-size="11" text-anchor="middle" fill="#6b7780">${escapeXml(d.label)}</text>` +
      `<text x="${cx}" y="${y - 4}" font-size="11" text-anchor="middle" fill="#2b3338">${d.value}</text>`
    )
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
}
