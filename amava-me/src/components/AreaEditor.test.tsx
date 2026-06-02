import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaEditor } from './AreaEditor'
import type { DevelopmentArea, Indicator } from '../domain/types'

const area: DevelopmentArea = { id: 'gen', programmeId: 'p', name: 'General', sortOrder: 1, gardenOnly: false, active: true }
const indicators: Indicator[] = [
  { id: 'i1', areaId: 'gen', text: 'Listens', hint: null, sortOrder: 1, active: true },
]
const noop = () => {}
const baseProps = {
  area, indicators,
  onRenameArea: noop, onToggleGarden: noop, onMoveArea: noop, onToggleAreaActive: noop,
  onAddIndicator: noop, onSaveIndicatorText: noop, onMoveIndicator: noop, onToggleIndicatorActive: noop,
}

describe('AreaEditor', () => {
  it('renders the area name and its indicator', () => {
    render(<AreaEditor {...baseProps} />)
    expect(screen.getByDisplayValue('General')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Listens')).toBeInTheDocument()
  })
  it('adds a new indicator', async () => {
    const onAddIndicator = vi.fn()
    render(<AreaEditor {...baseProps} onAddIndicator={onAddIndicator} />)
    await userEvent.type(screen.getByLabelText('new indicator'), 'Shares tools')
    await userEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(onAddIndicator).toHaveBeenCalledWith('gen', 'Shares tools')
  })
  it('retires an indicator', async () => {
    const onToggleIndicatorActive = vi.fn()
    render(<AreaEditor {...baseProps} onToggleIndicatorActive={onToggleIndicatorActive} />)
    await userEvent.click(screen.getByRole('button', { name: /Retire/ }))
    expect(onToggleIndicatorActive).toHaveBeenCalledWith('i1', false)
  })
})
