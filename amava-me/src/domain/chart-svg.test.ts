import { describe, it, expect } from 'vitest'
import { barChartSvg } from './chart-svg'

describe('barChartSvg', () => {
  it('returns an <svg> string with one rect per data point in the brand colour', () => {
    const svg = barChartSvg([{ label: 'A', value: 2 }, { label: 'B', value: 4 }], 4)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect((svg.match(/<rect/g) || []).length).toBe(2)
    expect(svg).toContain('#687F8B')
  })
  it('escapes special characters in labels', () => {
    const svg = barChartSvg([{ label: 'A & B', value: 1 }], 4)
    expect(svg).toContain('A &amp; B')
    expect(svg).not.toContain('A & B<')
  })
  it('produces an svg with no rects for empty data without crashing', () => {
    const svg = barChartSvg([], 4)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).not.toContain('<rect')
  })
})
