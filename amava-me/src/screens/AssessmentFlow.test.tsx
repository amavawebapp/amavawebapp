import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

function renderFlow(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('AssessmentFlow', () => {
  it('captures scores and submits a baseline assessment with a scaleMax snapshot', async () => {
    const onSubmit = vi.fn()
    renderFlow(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    // Step 1 (only area): score the indicator, then advance to Review.
    await userEvent.click(screen.getByRole('button', { name: /Strong/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Next$/ }))
    // Review step: save.
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted).toMatchObject({
      childId: 'ch', type: 'baseline', assessedBy: 'f1',
      date: '2026-02-01', scaleMax: 4, syncState: 'pending',
    })
    expect(submitted.scores).toEqual([{ indicatorId: 'i1', indicatorText: 'Listens', score: 4 }])
  })

  it('blocks advancing until the current area is fully scored', async () => {
    const onSubmit = vi.fn()
    renderFlow(
      <AssessmentFlow
        programme={programme} areas={areas} indicators={indicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    // Try to advance without scoring — gated, error shown, no submit.
    await userEvent.click(screen.getByRole('button', { name: /^Next$/ }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/score every indicator/i)).toBeInTheDocument()
    // Save assessment button is only on the Review step, not reachable yet.
    expect(screen.queryByRole('button', { name: /Save assessment/ })).not.toBeInTheDocument()
  })

  it('navigates across multiple areas, captures observations and co-assessors, and submits all scores', async () => {
    const twoAreas: DevelopmentArea[] = [
      { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true },
      { id: 'emo', programmeId: 'p', name: 'Emotional', sortOrder: 2, gardenOnly: false, active: true },
    ]
    const twoIndicators: Indicator[] = [
      { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
      { id: 'i2', areaId: 'emo', text: 'Communicates', hint: null, sortOrder: 1, active: true },
    ]
    const onSubmit = vi.fn()
    renderFlow(
      <AssessmentFlow
        programme={programme} areas={twoAreas} indicators={twoIndicators}
        cls={cls} child={child} type="baseline"
        facilitatorId="f1" today="2026-02-01"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    // Step 1: Next shown, Save not shown.
    expect(screen.queryByRole('button', { name: /Save assessment/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Strong/ })) // score i1
    await userEvent.type(screen.getByRole('textbox'), 'shared tools')      // observation for area gen
    await userEvent.click(screen.getByRole('button', { name: /^Next$/ }))
    // Step 2: still on an area step, Save not shown yet.
    expect(screen.queryByRole('button', { name: /Save assessment/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Strong/ })) // score i2
    await userEvent.click(screen.getByRole('button', { name: /^Next$/ }))
    // Review step: enter co-assessors then save.
    await userEvent.type(screen.getByRole('textbox'), 'Nomsa')
    await userEvent.click(screen.getByRole('button', { name: /Save assessment/ }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.scores).toHaveLength(2)
    expect(submitted.coAssessors).toBe('Nomsa')
    expect(submitted.observations).toEqual([{ areaId: 'gen', note: 'shared tools' }])
    expect(submitted.type).toBe('baseline')
    expect(submitted.scaleMax).toBe(4)
    expect(submitted.syncState).toBe('pending')
  })
})
