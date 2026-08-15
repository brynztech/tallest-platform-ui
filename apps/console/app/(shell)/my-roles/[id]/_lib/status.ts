/**
 * Status → label/badge-class mapping for the recruiter shortlist categorization UI.
 *
 * Status vocabulary (backend `supply/services/shortlisting.py::update_submission_status`):
 *   shortlisted (initial, un-screened)
 *   → interested | not_interested | no_response | snoozed (intermediate, recruiter-set)
 *   → approved | rejected (terminal — a further PATCH 409s)
 *
 * `approved` is the Account Manager/Quality Manager's own action (existing
 * Ops shortlist table) — never offered as a recruiter action here, but still
 * rendered read-only if a candidate the recruiter is looking at has already
 * been approved.
 *
 * Colors reuse the exact de facto palette from `design-system/tokens.json`'s
 * `status_colors` (green/amber/red) rather than inventing new ones.
 */

export const RECRUITER_ACTIONABLE_STATUSES = [
  'interested',
  'not_interested',
  'no_response',
  'rejected',
] as const
export type RecruiterActionableStatus = (typeof RECRUITER_ACTIONABLE_STATUSES)[number]

const SUCCESS_GREEN = 'oklch(0.45 0.15 145)'
const WARNING_AMBER = 'oklch(0.65 0.16 70)'
const ERROR_RED = 'oklch(0.58 0.2 25)'

export function isTerminalStatus(status: string): boolean {
  return status === 'approved' || status === 'rejected'
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'shortlisted':
      return 'Not yet screened'
    case 'interested':
      return 'Interested'
    case 'not_interested':
      return 'Not Interested'
    case 'no_response':
      return 'No Response'
    case 'snoozed':
      return 'Snoozed'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

/** Tailwind class fragment for the status badge (border/bg/text), or '' for the default secondary look. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'interested':
    case 'approved':
      return `border-[${SUCCESS_GREEN}]/40 bg-[${SUCCESS_GREEN}]/15 text-[${SUCCESS_GREEN}]`
    case 'snoozed':
      return `border-[${WARNING_AMBER}]/40 bg-[${WARNING_AMBER}]/15 text-[${WARNING_AMBER}]`
    case 'not_interested':
    case 'rejected':
      return `border-[${ERROR_RED}]/40 bg-[${ERROR_RED}]/10 text-[${ERROR_RED}]`
    default:
      return ''
  }
}

/** Fit-score color, same green/amber/red gradient used by shortlist-table.tsx's scoreColor(). */
export function scoreColor(score: number): string {
  if (score >= 75) return SUCCESS_GREEN
  if (score >= 50) return WARNING_AMBER
  return ERROR_RED
}
