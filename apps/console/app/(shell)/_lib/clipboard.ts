/** Copy operator-facing text. Returns false when the clipboard is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
