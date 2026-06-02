export interface OrderedRow { id: string; sortOrder: number }
export type Direction = 'up' | 'down'

/** Returns the two rows whose sort_order should swap, or [] at a boundary / unknown id. */
export function reorder(items: OrderedRow[], id: string, direction: Direction): OrderedRow[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
  const idx = sorted.findIndex(i => i.id === id)
  if (idx < 0) return []
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= sorted.length) return []
  const a = sorted[idx], b = sorted[swapWith]
  return [
    { id: a.id, sortOrder: b.sortOrder },
    { id: b.id, sortOrder: a.sortOrder },
  ]
}

export interface ScalePoint { value: number; label: string; description: string }

/** null if valid, else an error message. */
export function validateScale(scaleMax: number, descriptors: ScalePoint[]): string | null {
  if (!Number.isInteger(scaleMax) || scaleMax < 2 || scaleMax > 10) {
    return 'A scale must have between 2 and 10 points.'
  }
  if (descriptors.length !== scaleMax) {
    return 'Provide exactly one descriptor per point.'
  }
  if (descriptors.some(d => d.label.trim() === '')) {
    return 'Each point needs a label.'
  }
  return null
}

export function validateThreshold(n: number, scaleMax: number): string | null {
  if (!Number.isInteger(n)) return 'The threshold must be a whole number.'
  if (n < 1 || n > scaleMax - 1) return `The threshold must be between 1 and ${scaleMax - 1}.`
  return null
}
