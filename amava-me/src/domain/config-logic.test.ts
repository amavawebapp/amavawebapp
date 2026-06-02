import { describe, it, expect } from 'vitest'
import { reorder, validateScale, validateThreshold } from './config-logic'

const items = [
  { id: 'a', sortOrder: 1 },
  { id: 'b', sortOrder: 2 },
  { id: 'c', sortOrder: 3 },
]

describe('reorder', () => {
  it('swaps sort_order with the previous sibling when moving up', () => {
    expect(reorder(items, 'b', 'up')).toEqual([
      { id: 'b', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ])
  })
  it('swaps with the next sibling when moving down', () => {
    expect(reorder(items, 'b', 'down')).toEqual([
      { id: 'b', sortOrder: 3 },
      { id: 'c', sortOrder: 2 },
    ])
  })
  it('returns [] at the top/bottom boundary', () => {
    expect(reorder(items, 'a', 'up')).toEqual([])
    expect(reorder(items, 'c', 'down')).toEqual([])
  })
  it('returns [] for an unknown id', () => {
    expect(reorder(items, 'z', 'up')).toEqual([])
  })
})

const goodDescriptors = [
  { value: 1, label: 'Emerging', description: 'x' },
  { value: 2, label: 'Developing', description: 'y' },
  { value: 3, label: 'Strong', description: 'z' },
]

describe('validateScale', () => {
  it('passes for a well-formed scale', () => {
    expect(validateScale(3, goodDescriptors)).toBeNull()
  })
  it('rejects too few or too many points', () => {
    expect(validateScale(1, goodDescriptors.slice(0, 1))).toMatch(/between 2 and 10/)
  })
  it('rejects a descriptor count that does not match scaleMax', () => {
    expect(validateScale(4, goodDescriptors)).toMatch(/one descriptor per point/i)
  })
  it('rejects an empty label', () => {
    const bad = [{ value: 1, label: '', description: '' }, { value: 2, label: 'B', description: '' }]
    expect(validateScale(2, bad)).toMatch(/label/i)
  })
})

describe('validateThreshold', () => {
  it('accepts an integer within 1..scaleMax-1', () => {
    expect(validateThreshold(1, 4)).toBeNull()
    expect(validateThreshold(3, 4)).toBeNull()
  })
  it('rejects out-of-range or non-integer values', () => {
    expect(validateThreshold(0, 4)).toMatch(/between 1 and 3/)
    expect(validateThreshold(4, 4)).toMatch(/between 1 and 3/)
    expect(validateThreshold(1.5, 4)).toMatch(/whole number/i)
  })
})
