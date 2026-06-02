import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThresholdEditor } from './ThresholdEditor'

describe('ThresholdEditor', () => {
  it('saves a valid threshold', async () => {
    const onSave = vi.fn()
    render(<ThresholdEditor scaleMax={4} value={1} onSave={onSave} />)
    await userEvent.click(screen.getByRole('button', { name: /Save/ }))
    expect(onSave).toHaveBeenCalledWith(1)
  })
  it('blocks saving an out-of-range threshold and shows an error', async () => {
    const onSave = vi.fn()
    render(<ThresholdEditor scaleMax={4} value={1} onSave={onSave} />)
    const input = screen.getByLabelText('improved threshold')
    await userEvent.clear(input)
    await userEvent.type(input, '9')
    expect(screen.getByText(/between 1 and 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled()
  })
})
