import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScaleSelector } from './ScaleSelector'

const descriptors = [
  { value: 1, label: 'Emerging', description: 'rarely observed' },
  { value: 2, label: 'Developing', description: 'inconsistent' },
  { value: 3, label: 'Consistent', description: 'most of the time' },
  { value: 4, label: 'Strong', description: 'independently' },
]

describe('ScaleSelector', () => {
  it('renders one button per scale point with its label', () => {
    render(<ScaleSelector descriptors={descriptors} value={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /Emerging/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Strong/ })).toBeInTheDocument()
  })
  it('calls onChange with the chosen value', async () => {
    const onChange = vi.fn()
    render(<ScaleSelector descriptors={descriptors} value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Strong/ }))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})
