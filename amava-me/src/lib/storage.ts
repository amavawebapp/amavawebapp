import { supabase } from './supabase'

/**
 * Private-bucket helpers. These are ONLINE-ONLY: if the network is unavailable
 * the underlying Supabase call throws and we surface a clear Error so callers
 * can show a "needs internet" message. Never used on an offline code path.
 */

/** Slugify a filename to keep object keys safe (ASCII, no spaces/slashes). */
function safeFilename(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || 'file'
}

/** Build a unique object key, e.g. `child-photos/<uuid>-photo.jpg`. */
export function randomPath(prefix: string, filename: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}/${id}-${safeFilename(filename)}`
}

/** Upload a blob to a private bucket (upsert). Throws when offline/on error. */
export async function uploadFile(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType, upsert: true })
  if (error) throw new Error(`Upload failed (needs internet): ${error.message}`)
}

/** Create a short-lived signed URL for a private object. Throws when offline. */
export async function signedUrl(
  bucket: string,
  path: string,
  ttlSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds)
  if (error || !data?.signedUrl) {
    throw new Error(
      `Could not create link (needs internet): ${error?.message ?? 'unknown error'}`,
    )
  }
  return data.signedUrl
}
