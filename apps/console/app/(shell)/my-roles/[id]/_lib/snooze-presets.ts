/**
 * Snooze date math for the recruiter shortlist categorization UI.
 *
 * Modeled directly on `bd/leads/_components/snooze-popover.tsx`'s
 * `getPresetDate` (week/month/quarter) — same `d.setMonth(d.getMonth() + N)`
 * approach, but with 3/6/9-month presets instead, per the recruiter shortlist
 * contract (candidates come back into rotation on a longer cadence than BD
 * leads).
 */
export const SNOOZE_PRESET_MONTHS = [3, 6, 9] as const
export type SnoozePresetMonths = (typeof SNOOZE_PRESET_MONTHS)[number]

/** ISO datetime string N months from now. */
export function getSnoozePresetDate(months: SnoozePresetMonths): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export function snoozePresetLabel(months: SnoozePresetMonths): string {
  return `${months} months`
}

/**
 * Validates a custom snooze date input (`<input type="date">` value) is a
 * real, future date. Mirrors the backend's own `snoozed_until` validation
 * (must be a future, UTC-aware timestamp) so the UI can't submit a PATCH the
 * backend will just 422 back.
 */
export function isFutureSnoozeDate(dateInput: string, now: Date = new Date()): boolean {
  if (!dateInput) return false
  const parsed = new Date(dateInput)
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > now.getTime()
}
