/**
 * Brynz status tones — the single source of truth for "this thing has a state"
 * colouring across the console. See app/CLAUDE.md §2 for the hues and the rule
 * that colour means state, never decoration.
 *
 * Submission vocabulary matches supply/services/internal_review.py's
 * `_ACTION_STATUS` plus the manual-remove path (backend
 * `supply_submissions.status`). Availability vocabulary matches
 * `TalentPoolSummary.availability_status`.
 */

export const SUCCESS_TONE = 'border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]'
export const DANGER_TONE = 'border-[#F0D9D6] bg-[#FAF0EE] text-[#BA4642]'
export const WARNING_TONE = 'border-[#E8CEAE] bg-[#F4E8DA] text-[#905300]'
export const INFO_TONE = 'border-[#D4DFE9] bg-[#EFF3F4] text-[#386CA0]'
export const NEUTRAL_TONE = 'border-border bg-secondary text-secondary-foreground'

const STATUS_TONE: Record<string, string> = {
  approved: SUCCESS_TONE,
  interested: SUCCESS_TONE,
  placed: SUCCESS_TONE,
  rejected: DANGER_TONE,
  not_interested: DANGER_TONE,
  do_not_contact: DANGER_TONE,
  removed: NEUTRAL_TONE,
  snoozed: WARNING_TONE,
  hold: WARNING_TONE,
  submitted: NEUTRAL_TONE,
  in_process: INFO_TONE,
  active: SUCCESS_TONE,
}

/** Border/bg/text classes for a status pill (pair with a `bg-current` dot). */
export function statusToneClass(status: string): string {
  return STATUS_TONE[status] ?? NEUTRAL_TONE
}

const AVAILABILITY_TONE: Record<string, string> = {
  available: SUCCESS_TONE,
  open_to_offers: INFO_TONE,
  not_looking: NEUTRAL_TONE,
}

/** Border/bg/text classes for a candidate availability pill. */
export function availabilityToneClass(status: string | null | undefined): string {
  return (status && AVAILABILITY_TONE[status]) || NEUTRAL_TONE
}

/** Text color class for a match/fit score, reusing the 75/50 split already
 * established by my-roles/[id]/_lib/status.ts's scoreColor(). */
export function matchScoreToneClass(score: number): string {
  if (score >= 75) return 'text-[#317A4F]'
  if (score >= 50) return 'text-[#905300]'
  return 'text-[#BA4642]'
}

/** Free-form backend statuses are snake_case; render them as words. */
export function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ')
}
