import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgrammeClassManager } from './ProgrammeClassManager'
import type { Programme, ClassGroup } from '../domain/types'

const programmes: Programme[] = [
  { id: 'p1', name: 'After-school', scaleMax: 4, scaleDescriptors: [], active: true, improvedThreshold: 1 },
]
const classes: ClassGroup[] = [
  { id: 'c1', programmeId: 'p1', name: 'Class 1', hasGardenComponent: true, active: true },
]
const noop = () => {}
const base = {
  programmes, classes,
  onAddProgramme: noop, onRenameProgramme: noop, onToggleProgrammeActive: noop,
  onAddClass: noop, onRenameClass: noop, onToggleGarden: noop, onToggleClassActive: noop,
}

describe('ProgrammeClassManager', () => {
  it('lists programmes and their classes', () => {
    render(<ProgrammeClassManager {...base} />)
    expect(screen.getByDisplayValue('After-school')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Class 1')).toBeInTheDocument()
  })
  it('adds a class to a programme', async () => {
    const onAddClass = vi.fn()
    render(<ProgrammeClassManager {...base} onAddClass={onAddClass} />)
    await userEvent.type(screen.getByLabelText('new class for After-school'), 'Class 2')
    await userEvent.click(screen.getByRole('button', { name: /Add class/ }))
    expect(onAddClass).toHaveBeenCalledWith('p1', 'Class 2')
  })
})
