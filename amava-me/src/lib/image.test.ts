import { describe, it, expect } from 'vitest'
import { isAcceptableUpload, MAX_PDF_BYTES } from './image'

const mkFile = (type: string, size: number): File => {
  const f = new File(['x'], 'f', { type })
  // jsdom's File.size derives from content; override for size-based checks.
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('isAcceptableUpload', () => {
  it('accepts images regardless of size', () => {
    expect(isAcceptableUpload(mkFile('image/jpeg', 50 * 1024 * 1024)).ok).toBe(true)
    expect(isAcceptableUpload(mkFile('image/png', 10)).ok).toBe(true)
  })

  it('accepts PDFs at or under the limit', () => {
    expect(isAcceptableUpload(mkFile('application/pdf', MAX_PDF_BYTES)).ok).toBe(true)
    expect(isAcceptableUpload(mkFile('application/pdf', 1024)).ok).toBe(true)
  })

  it('rejects PDFs over the limit with a message', () => {
    const res = isAcceptableUpload(mkFile('application/pdf', MAX_PDF_BYTES + 1))
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/too large/i)
  })

  it('rejects other types', () => {
    const res = isAcceptableUpload(mkFile('application/zip', 10))
    expect(res.ok).toBe(false)
    expect(res.error).toBeTruthy()
  })

  it('rejects files with no type', () => {
    expect(isAcceptableUpload(mkFile('', 10)).ok).toBe(false)
  })
})
