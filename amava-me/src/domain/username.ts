/** Map a login input to the auth email: bare username -> username@amava.local; an email passes through. */
export function loginIdentifierToEmail(input: string): string {
  const v = input.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@amava.local`
}

/** null if a valid username, else an error message. */
export function validateUsername(input: string): string | null {
  const v = input.trim().toLowerCase()
  if (!/^[a-z0-9._-]{3,30}$/.test(v)) {
    return 'Username must be 3–30 letters, numbers, dot, underscore or hyphen (no spaces).'
  }
  return null
}
