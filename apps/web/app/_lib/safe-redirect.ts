/** Accepts only same-site paths, so a `?redirect=` can never send someone to another origin. */
export function safeRedirect(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}
