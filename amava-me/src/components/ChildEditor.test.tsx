import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChildEditor } from './ChildEditor'
import type { ClassGroup } from '../domain/types'

const classes: ClassGroup[] = [
  { id: 'c1', programmeId: 'p', name: 'Class 1', hasGardenComponent: true, active: true },
]

describe('ChildEditor', () => {
  it('submits a child payload including demographic fields', async () => {
    const onSubmit = vi.fn()
    render(<ChildEditor classes={classes} allowClassChange={false} initial={{ classId: 'c1' }} onSubmit={onSubmit} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('first name'), 'Lebo')
    await userEvent.type(screen.getByLabelText('surname'), 'M')
    await userEvent.type(screen.getByLabelText('Grade'), '3')
    await userEvent.click(screen.getByRole('button', { name: /Save/ }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      classId: 'c1', firstName: 'Lebo', surname: 'M', isSample: true, fields: { grade: '3' },
    })
  })
  it('disables Save until first name, surname, and class are present', () => {
    render(<ChildEditor classes={classes} allowClassChange={false} initial={{ classId: 'c1' }} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled()
  })
})
