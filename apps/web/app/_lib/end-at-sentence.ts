/** The backend cuts the summary at a fixed length, often mid-sentence. Show it up to the
 *  last full sentence, or the last whole word, so it never stops mid-thought. */
export function endAtSentence(text: string): string {
  const trimmed = text.trim()
  if (/[.!?]["')\]]?$/.test(trimmed)) return trimmed
  const lastStop = Math.max(trimmed.lastIndexOf('. '), trimmed.lastIndexOf('! '), trimmed.lastIndexOf('? '), trimmed.lastIndexOf('.\n'))
  if (lastStop > 0) return trimmed.slice(0, lastStop + 1)
  const lastSpace = trimmed.lastIndexOf(' ')
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed).replace(/[,;:\-–]+$/, '') + '…'
}
