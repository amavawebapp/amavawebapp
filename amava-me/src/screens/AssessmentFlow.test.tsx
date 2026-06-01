import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessmentFlow } from './AssessmentFlow'
import type { Programme, DevelopmentArea, Indicator, ClassGroup, Child } from '../domain/types'

const programme: Programme = {
  id: 'p', name: 'After-school', scaleMax: 4, active: true,
  scaleDescriptors: [
    { value: 1, label: 'Emerging', description: '' },
    { value: 2, label: 'Developing', description: '' },
    { value: 3, label: 'Consistent', description: '' },
    { value: 4, label: 'Strong', description: '' },
  ],
}
const areas: DevelopmentArea[] = [
  { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true },
]
const indicators: Indicator[] = [
  { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
]
const cls: ClassGroup = { id: 'c', programmeId: 'p', name: 'Class A', hasGardenComponent: false, active: true }
const child: Child = {
  id: 'ch', classId: 'c', firstName: 'Lebo', surname: 'M', fields: {},
  dateStarted: '2026-01-01', isSample: true, active: true,
}

describe('AssessmentFlow', () => {
  it('captures scores and submits a baseline assessment with a scaleMax snapshot', async () => {
    const onSubmit = vi.fn()
    render(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Strong/ }))
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted).toMatchObject({
      childId: 'ch', type: 'baseline', assessedBy: 'f1',
      date: '2026-02-01', scaleMax: 4, syncState: 'pending',
    })
    expect(submitted.scores).toEqual([{ indicatorId: 'i1', indicatorText: 'Listens', score: 4 }])
  })

  it('blocks saving until every visible indicator is scored', async () => {
    const onSubmit = vi.fn()
    render(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/score every indicator/i)).toBeInTheDocument()
  })
})
