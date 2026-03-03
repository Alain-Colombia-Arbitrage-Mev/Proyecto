export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const ALLOWED_MIME_TYPES = new Set([
  'text/plain', 'text/markdown', 'text/csv', 'application/json',
  'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const IMAGE_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
])

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
}
