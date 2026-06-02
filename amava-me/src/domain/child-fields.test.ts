import { describe, it, expect } from 'vitest'
import { CHILD_FIELDS, buildChildFields, ageFromDob } from './child-fields'

describe('CHILD_FIELDS', () => {
  it('includes the agreed demographic fields', () => {
    expect(CHILD_FIELDS.map(f => f.key)).toEqual(
      ['grade', 'gender', 'dob', 'guardianName', 'contact', 'homeLanguage', 'address'],
    )
  })
})

describe('buildChildFields', () => {
  it('keeps only known, non-blank, trimmed values', () => {
    const out = buildChildFields({ grade: ' 3 ', gender: '', dob: '2018-05-01', bogus: 'x' })
    expect(out).toEqual({ grade: '3', dob: '2018-05-01' })
  })
})

describe('ageFromDob', () => {
  it('computes age when the birthday has passed this year', () => {
    expect(ageFromDob('2018-05-01', '2026-06-01')).toBe(8)
  })
  it('subtracts a year when the birthday has not yet occurred', () => {
    expect(ageFromDob('2018-12-01', '2026-06-01')).toBe(7)
  })
  it('returns null for a blank or invalid date', () => {
    expect(ageFromDob('', '2026-06-01')).toBeNull()
    expect(ageFromDob('not-a-date', '2026-06-01')).toBeNull()
  })
})
