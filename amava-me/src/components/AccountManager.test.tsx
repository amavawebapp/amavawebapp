import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountManager } from './AccountManager'
import type { Facilitator, ClassGroup } from '../domain/types'

const classes: ClassGroup[] = [
  { id: 'c1', programmeId: 'p', name: 'Class 1', hasGardenComponent: true, active: true },
]
const facilitators: Facilitator[] = [
  { id: 'u1', name: 'Nomsa K', role: 'coordinator', classIds: [], username: 'admin', active: true },
]
const noop = () => {}
const base = { facilitators, classes, onCreate: noop, onSetPassword: noop, onUpdate: noop, onSetActive: noop }

describe('AccountManager', () => {
  it('lists existing accounts', () => {
    render(<AccountManager {...base} />)
    expect(screen.getByDisplayValue('Nomsa K')).toBeInTheDocument()
    expect(screen.getByText(/admin/)).toBeInTheDocument()
  })
  it('creates an account with the entered details', async () => {
    const onCreate = vi.fn()
    render(<AccountManager {...base} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('new name'), 'Thabo M')
    await userEvent.type(screen.getByLabelText('new username'), 'thabo')
    await userEvent.type(screen.getByLabelText('new password'), 'password123')
    await userEvent.click(screen.getByLabelText('assign Class 1'))
    await userEvent.click(screen.getByRole('button', { name: /Create account/ }))
    expect(onCreate).toHaveBeenCalledWith({ username: 'thabo', password: 'password123', name: 'Thabo M', role: 'facilitator', classIds: ['c1'] })
  })
  it('blocks creation with an invalid username', async () => {
    const onCreate = vi.fn()
    render(<AccountManager {...base} onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('new name'), 'X')
    await userEvent.type(screen.getByLabelText('new username'), 'ab')
    await userEvent.type(screen.getByLabelText('new password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Create account/ }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/Username must be 3/)).toBeInTheDocument()
  })
})
