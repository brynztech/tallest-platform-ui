/**
 * Native-fetch data layer for the recruiter shortlist categorization page.
 *
 * Uses native `fetch`, not `apiClient`, because `snoozed_until` (and the
 * `include_pending` query param) are not yet in this repo's generated
 * `api.d.ts` — consistent with this app's documented convention of native
 * fetch for paths absent from the generated client (see
 * `apps/console/CLAUDE.md` gotcha #5, originally about multipart uploads,
 * same rationale applies here).
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

/** Recruiter-settable + backend-terminal statuses a submission can carry. */
export type SubmissionStatus =
  | 'shortlisted'
  | 'interested'
  | 'not_interested'
  | 'no_response'
  | 'snoozed'
  | 'approved'
  | 'rejected'

export interface ShortlistSubmission {
  id: string
  requisition_id: string
  candidate_id: string | null
  match_score: number | null
  match_rationale: Record<string, unknown> | null
  status: string
  supply_notes: string | null
  snoozed_until: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  candidate_name: string | null
  candidate_email: string | null
  candidate_title: string | null
  candidate_skills: string[] | null
}

export interface ShortlistResponse {
  requisition_id: string
  submissions: ShortlistSubmission[]
  total: number
}

export class SubmissionConflictError extends Error {
  constructor() {
    super('Submission already decided')
    this.name = 'SubmissionConflictError'
  }
}

/** Always passes include_pending=true — the recruiter's full working set (contract requirement). */
export async function fetchRecruiterShortlist(requisitionId: string): Promise<ShortlistResponse> {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(requisitionId)}?include_pending=true`,
  )
  if (!res.ok) throw new Error(`Failed to load shortlist: ${res.status}`)
  return (await res.json()) as ShortlistResponse
}

export interface PatchSubmissionBody {
  status: SubmissionStatus
  notes?: string
  snoozed_until?: string
}

/** Throws SubmissionConflictError on 409 (already approved/rejected) so callers can toast + refetch. */
export async function patchSubmissionStatus(
  submissionId: string,
  body: PatchSubmissionBody,
): Promise<ShortlistSubmission> {
  const res = await fetch(`${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(submissionId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) throw new SubmissionConflictError()
  if (!res.ok) throw new Error(`Failed to update submission: ${res.status}`)
  return (await res.json()) as ShortlistSubmission
}

export interface TriggerMatchResult {
  requisition_id: string
  status: string
}

export class MatchNotAssignedError extends Error {
  constructor() {
    super('Not assigned to this requisition')
    this.name = 'MatchNotAssignedError'
  }
}

export async function triggerRecruiterMatch(
  requisitionId: string,
  actingUserId: string,
): Promise<TriggerMatchResult> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(requisitionId)}/match?acting_user_id=${encodeURIComponent(actingUserId)}`,
    { method: 'POST' },
  )
  if (res.status === 403) throw new MatchNotAssignedError()
  if (!res.ok) throw new Error(`Failed to trigger match: ${res.status}`)
  return (await res.json()) as TriggerMatchResult
}

export interface SubmitInterestedResult {
  submitted_count: number
}

/** Thrown on 409 — a raw "shortlisted" (unscreened) submission is still present. */
export class UnscreenedCandidatesError extends Error {
  constructor() {
    super('Unscreened candidates remain on the shortlist')
    this.name = 'UnscreenedCandidatesError'
  }
}

/**
 * Marks every currently-interested-and-not-yet-submitted candidate as
 * submitted to the Account Manager. No body. Idempotent — a repeat call with
 * nothing new to submit returns { submitted_count: 0 }, not an error.
 */
export async function submitInterestedCandidates(
  requisitionId: string,
): Promise<SubmitInterestedResult> {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(requisitionId)}/submit`,
    { method: 'POST' },
  )
  if (res.status === 409) throw new UnscreenedCandidatesError()
  if (!res.ok) throw new Error(`Failed to submit candidates: ${res.status}`)
  return (await res.json()) as SubmitInterestedResult
}

/**
 * Client-side mirror of the backend's submit gate (fast feedback before a
 * 409 round-trip), same precedent as isFutureSnoozeDate pre-validating the
 * snooze-date rule elsewhere in this file's sibling code: enabled only when
 * there's at least one "interested" candidate and nothing is still raw
 * "shortlisted" (unscreened).
 */
export function canSubmitApplications(submissions: ShortlistSubmission[]): boolean {
  const hasUnscreened = submissions.some((s) => s.status === 'shortlisted')
  if (hasUnscreened) return false
  return submissions.some((s) => s.status === 'interested')
}
