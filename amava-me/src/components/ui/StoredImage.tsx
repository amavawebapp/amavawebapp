import { useEffect, useState, type ReactNode } from 'react'
import { signedUrl } from '../../lib/storage'

/**
 * Renders an image stored in a private bucket. Resolves a signed URL in an
 * effect (cached in-memory by `bucket+path` to avoid refetching), and shows
 * `fallback` while loading, when there is no path, or on any failure — so it
 * degrades gracefully offline and never throws.
 */

// Module-level cache of resolved signed URLs, keyed by `bucket|path`.
const urlCache = new Map<string, string>()

interface Props {
  bucket: string
  path?: string | null
  alt: string
  /** Pixel width/height (square). */
  size?: number
  /** Border radius in px; defaults to a circle. */
  radius?: number
  /** Shown while loading, with no path, or on error. */
  fallback: ReactNode
}

export function StoredImage({ bucket, path, alt, size = 46, radius, fallback }: Props) {
  const cacheKey = path ? `${bucket}|${path}` : ''
  const [url, setUrl] = useState<string | null>(() => (cacheKey ? urlCache.get(cacheKey) ?? null : null))

  useEffect(() => {
    if (!cacheKey) { setUrl(null); return }
    const cached = urlCache.get(cacheKey)
    if (cached) { setUrl(cached); return }
    let alive = true
    setUrl(null)
    signedUrl(bucket, path!)
      .then(u => { if (alive) { urlCache.set(cacheKey, u); setUrl(u) } })
      .catch(() => { if (alive) setUrl(null) })
    return () => { alive = false }
  }, [bucket, path, cacheKey])

  const r = radius ?? size / 2

  if (!url) return <>{fallback}</>
  return (
    <img
      src={url}
      alt={alt}
      onError={() => { urlCache.delete(cacheKey); setUrl(null) }}
      style={{
        width: size, height: size, flex: `0 0 ${size}px`,
        borderRadius: r, objectFit: 'cover', display: 'block',
        background: 'var(--surface-2)',
      }}
    />
  )
}
