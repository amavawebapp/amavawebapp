import { describe, it, expect } from 'vitest'
import { loginIdentifierToEmail, validateUsername } from './username'

describe('loginIdentifierToEmail', () => {
  it('appends the synthetic domain to a bare username (lowercased)', () => {
    expect(loginIdentifierToEmail('Thabo')).toBe('thabo@amava.local')
  })
  it('passes through an actual email (lowercased)', () => {
    expect(loginIdentifierToEmail('Person@Example.com')).toBe('person@example.com')
  })
  it('trims surrounding whitespace', () => {
    expect(loginIdentifierToEmail('  thabo  ')).toBe('thabo@amava.local')
  })
})

describe('validateUsername', () => {
  it('accepts a valid username', () => {
    expect(validateUsername('thabo.m')).toBeNull()
    expect(validateUsername('lead-1')).toBeNull()
  })
  it('rejects too short, too long, or illegal characters', () => {
    expect(validateUsername('ab')).toMatch(/3/)
    expect(validateUsername('has space')).toMatch(/letters/i)
    expect(validateUsername('UPPER!')).toMatch(/letters/i)
  })
})
