/**
 * Native-fetch data layer for the `/pipeline` page's per-candidate stage
 * actions. None of `advance-stage`, `manual-remove`, or `notes` are in this
 * repo's generated `api.d.ts` yet — same native-fetch-for-paths-absent-from-
 * the-generated-client convention as `my-roles/[id]/_lib/shortlist.ts` (and
 * `apps/console/CLAUDE.md` gotcha #5).
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface SubmissionNote {
  id: string
  submission_id: string
  text: string
  author: string | null
  created_at: string
}

/** Thrown on advance-stage 409 (not approved / final stage / stale stage / requisition closed). */
export class AdvanceStageConflictError extends Error {
  detail: string
  constructor(detail: string) {
    super(detail || 'Could not advance stage')
    this.name = 'AdvanceStageConflictError'
    this.detail = detail
  }
}

async function conflictDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string }
    return typeof body.detail === 'string' ? body.detail : ''
  } catch {
    return ''
  }
}

/** POST .../shortlists/{submission_id}/advance-stage — no body. Returns the updated submission. */
export async function advanceSubmissionStage(submissionId: string) {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(submissionId)}/advance-stage`,
    { method: 'POST' },
  )
  if (res.status === 409) throw new AdvanceStageConflictError(await conflictDetail(res))
  if (!res.ok) throw new Error(`Failed to advance stage: ${res.status}`)
  return res.json()
}

/**
 * Lightweight POST .../shortlists/{submission_id}/manual-remove — `reason`
 * only, no `score_overrides` (now optional server-side; omitting it means no
 * scoring-feedback row is recorded, which is correct for a kanban-card
 * removal that isn't a re-scoring action — see
 * docs/recruiter-shortlist-categorization.md §9).
 */
export async function manualRemoveFromPipeline(submissionId: string, reason: string) {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(submissionId)}/manual-remove`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  )
  if (!res.ok) throw new Error(`Failed to remove candidate: ${res.status}`)
  return res.json()
}

/** GET .../shortlists/{submission_id}/notes — oldest first. */
export async function fetchSubmissionNotes(submissionId: string): Promise<SubmissionNote[]> {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(submissionId)}/notes`,
  )
  if (!res.ok) throw new Error(`Failed to load notes: ${res.status}`)
  return (await res.json()) as SubmissionNote[]
}

/** POST .../shortlists/{submission_id}/notes — { text } */
export async function addSubmissionNote(submissionId: string, text: string): Promise<SubmissionNote> {
  const res = await fetch(
    `${apiBase()}/api/v1/supply/shortlists/${encodeURIComponent(submissionId)}/notes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  )
  if (!res.ok) throw new Error(`Failed to save note: ${res.status}`)
  return (await res.json()) as SubmissionNote
}
