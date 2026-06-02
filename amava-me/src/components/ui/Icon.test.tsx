import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Icon } from './Icon'

describe('Icon', () => {
  it('renders an svg with the named path', () => {
    const { container } = render(<Icon name="home" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy()
  })
  it('renders nothing-breaking for unknown name', () => {
    const { container } = render(<Icon name={'nope' as never} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
