import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from './BarChart'

describe('BarChart', () => {
  it('renders one bar rect per data point', () => {
    const { container } = render(
      <BarChart max={4} data={[{ label: 'A', value: 2 }, { label: 'B', value: 4 }]} />,
    )
    expect(container.querySelectorAll('rect.bar')).toHaveLength(2)
  })
  it('renders nothing meaningful for empty data without crashing', () => {
    const { container } = render(<BarChart max={4} data={[]} />)
    expect(container.querySelectorAll('rect.bar')).toHaveLength(0)
  })
})
