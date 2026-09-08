/**
 * CTC/ECTC input parsing for candidate-shortlist-card.tsx's CompensationRow.
 * Kept JSX-free in its own .ts module — this app's vitest cannot transform
 * .tsx imports for logic tests (console CLAUDE.md gotcha #3), same reason as
 * match-evidence-data.ts.
 *
 * Accepts a plain rupee figure ("4800000") or lakhs shorthand ("48L",
 * matching the field's own "₹48L" placeholder) — anything else is rejected
 * rather than silently coerced (e.g. `Number('')` would otherwise be `0`).
 */
const COMP_PATTERN = /^([\d,]+(?:\.\d+)?)\s*(l)?$/i

export function parseComp(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const match = COMP_PATTERN.exec(trimmed)
  if (!match) return 'invalid'
  const n = Number(match[1].replace(/,/g, ''))
  if (Number.isNaN(n) || n < 0) return 'invalid'
  return match[2] ? Math.round(n * 100_000) : n
}
