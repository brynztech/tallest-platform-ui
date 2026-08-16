/**
 * Native-fetch data layer for requisition lifecycle actions (status change,
 * request-more-candidates) — not yet in this repo's generated `api.d.ts`,
 * same native-fetch-for-paths-absent-from-api.d.ts convention documented in
 * `apps/console/CLAUDE.md` gotcha #5 and used by
 * `my-roles/[id]/_lib/shortlist.ts`.
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export type RequisitionLifecycleStatus = 'open' | 'matching_complete' | 'closed' | 'filled'

/**
 * PATCHes the requisition's status. 409s if the requisition is already
 * `closed`/`filled` (terminal, no reopening supported) — the UI disables the
 * triggering controls once terminal, so this is a race-condition safety net
 * rather than a normal path; callers can treat any failure generically.
 */
export async function updateRequisitionStatus(
  reqId: string,
  status: RequisitionLifecycleStatus,
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`Failed to update requisition status: ${res.status}`)
  return (await res.json()) as { id: string; status: string }
}

export interface RequestMoreCandidatesResult {
  notified_count: number
}

/** No body. 409s if the requisition is already closed/filled (see above). */
export async function requestMoreCandidates(reqId: string): Promise<RequestMoreCandidatesResult> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/request-more-candidates`,
    { method: 'POST' },
  )
  if (!res.ok) throw new Error(`Failed to request more candidates: ${res.status}`)
  return (await res.json()) as RequestMoreCandidatesResult
}
