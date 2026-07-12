/** Client-side upload gate + image shrinking, so we never push huge files. */

/** Hard cap for PDF uploads (no client-side PDF shrinking is possible). */
export const MAX_PDF_BYTES = 5 * 1024 * 1024

export interface UploadCheck {
  ok: boolean
  error?: string
}

/**
 * Validate a file before upload: accept images and PDFs only; reject PDFs
 * over MAX_PDF_BYTES. Images are shrunk client-side so they need no size cap.
 */
export function isAcceptableUpload(file: File): UploadCheck {
  const type = file.type || ''
  if (type.startsWith('image/')) return { ok: true }
  if (type === 'application/pdf') {
    if (file.size > MAX_PDF_BYTES) {
      const mb = Math.round(MAX_PDF_BYTES / (1024 * 1024))
      return { ok: false, error: `PDF is too large (max ${mb} MB).` }
    }
    return { ok: true }
  }
  return { ok: false, error: 'Only images or PDF files can be uploaded.' }
}

/**
 * Downscale an image so its long edge is <= maxEdge and re-encode as JPEG.
 * Non-images (e.g. PDFs) are returned unchanged. Defensive: if the DOM/canvas
 * or image decoding is unavailable (e.g. in a non-browser test env), the
 * original file is returned so callers never crash.
 */
export async function compressImage(
  file: File,
  maxEdge = 1600,
  quality = 0.8,
): Promise<Blob> {
  if (!file.type?.startsWith('image/')) return file
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const longEdge = Math.max(width, height)
    const scale = longEdge > maxEdge ? maxEdge / longEdge : 1
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    return blob ?? file
  } catch {
    return file
  }
}
