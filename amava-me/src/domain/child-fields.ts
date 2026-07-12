export interface ChildFieldDef { key: string; label: string; type: 'text' | 'date' }

export const CHILD_FIELDS: ChildFieldDef[] = [
  { key: 'grade', label: 'Grade', type: 'text' },
  { key: 'gender', label: 'Gender', type: 'text' },
  { key: 'dob', label: 'Date of birth', type: 'date' },
  { key: 'guardianName', label: 'Guardian name', type: 'text' },
  { key: 'contact', label: 'Contact number', type: 'text' },
  { key: 'homeLanguage', label: 'Home language', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
]

/** Form input for creating/editing a child. */
export interface ChildInput {
  classId: string
  firstName: string
  surname: string
  dateStarted: string
  isSample: boolean
  fields: Record<string, string>
  /** Object key in `child-photos`. Omit to leave the stored path unchanged. */
  photoPath?: string | null
  /** Object key in `child-docs`. Omit to leave the stored path unchanged. */
  indemnityPath?: string | null
}

/** Keep only known field keys with non-blank, trimmed values. */
export function buildChildFields(input: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of CHILD_FIELDS) {
    const v = (input[f.key] ?? '').trim()
    if (v !== '') out[f.key] = v
  }
  return out
}

/** Age in whole years from an ISO date of birth, or null if blank/invalid. */
export function ageFromDob(dob: string, today: string): number | null {
  if (!dob) return null
  const b = new Date(dob), t = new Date(today)
  if (isNaN(b.getTime()) || isNaN(t.getTime())) return null
  let age = t.getFullYear() - b.getFullYear()
  const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--
  return age
}
