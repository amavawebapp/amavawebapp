import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChildEditor } from './ChildEditor'
import type { ClassGroup } from '../domain/types'

const classes: ClassGroup[] = [
  { id: 'c1', programmeId: 'p', name: 'Class 1', hasGardenComponent: true, active: true },
  { id: 'c2', programmeId: 'p', name: 'Class 2', hasGardenComponent: false, active: true },
]

describe('ChildEditor', () => {
  it('submits a child payload including demographic fields', async () => {
    const onSubmit = vi.fn()
    render(<ChildEditor classes={classes} allowClassChange={false} initial={{ classId: 'c1' }} onSubmit={onSubmit} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText('first name'), 'Lebo')
    await userEvent.type(screen.getByLabelText('surname'), 'M')
    await userEvent.type(screen.getByLabelText('Grade'), '3')
    await userEvent.click(screen.getByRole('button', { name: /Add child/ }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      classId: 'c1', firstName: 'Lebo', surname: 'M', isSample: true, fields: { grade: '3' },
    })
  })

  it('disables the submit button until first name, surname, and class are present', () => {
    render(<ChildEditor classes={classes} allowClassChange={false} initial={{ classId: 'c1' }} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: /Add child/ })).toBeDisabled()
  })

  it('selects a class via chips and toggles the sample switch', async () => {
    const onSubmit = vi.fn()
    render(<ChildEditor classes={classes} allowClassChange initial={{}} onSubmit={onSubmit} onCancel={() => {}} />)
    // first chip is selected by default (classes[0])
    const class2 = screen.getByRole('button', { name: /Class 2/ })
    await userEvent.click(class2)
    expect(class2).toHaveAttribute('aria-pressed', 'true')

    const sample = screen.getByRole('switch', { name: /Part of the research sample/ })
    expect(sample).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(sample)
    expect(sample).toHaveAttribute('aria-checked', 'false')

    await userEvent.type(screen.getByLabelText('first name'), 'Lebo')
    await userEvent.type(screen.getByLabelText('surname'), 'M')
    await userEvent.click(screen.getByRole('button', { name: /Add child/ }))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      classId: 'c2', firstName: 'Lebo', surname: 'M', isSample: false,
    })
  })

  it('labels the submit button "Save" when editing', () => {
    render(<ChildEditor classes={classes} allowClassChange={false} heading="Edit child" initial={{ classId: 'c1' }} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument()
  })

  it('calls onCancel from the close button', async () => {
    const onCancel = vi.fn()
    render(<ChildEditor classes={classes} allowClassChange={false} initial={{ classId: 'c1' }} onSubmit={() => {}} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /Close/ }))
    expect(onCancel).toHaveBeenCalled()
  })
})
