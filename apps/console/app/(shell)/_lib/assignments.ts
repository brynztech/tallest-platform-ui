import type { AssignableRecruiter } from '../../_lib/staff-auth'

export const assignmentQueryKeys = {
  forUser: (userId: string) => ['assignments', userId] as const,
  forRequisition: (reqId: string) => ['requisition-assignees', reqId] as const,
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

/** Requisition ids assigned to a user (empty for users with no assignments). */
export async function fetchAssignedRequisitionIds(userId: string): Promise<string[]> {
  const response = await fetch(
    `${apiBase()}/api/v1/ops/assignments?user_id=${encodeURIComponent(userId)}`,
  )
  if (!response.ok) throw new Error(`Failed to load assignments: ${response.status}`)
  const data = (await response.json()) as { requisition_ids: string[] }
  return data.requisition_ids
}

/** User ids assigned to a requisition (empty if none). */
export async function fetchRequisitionAssignees(reqId: string): Promise<string[]> {
  const response = await fetch(
    `${apiBase()}/api/v1/ops/requisitions/${encodeURIComponent(reqId)}/assignees`,
  )
  if (!response.ok) throw new Error(`Failed to load assignees: ${response.status}`)
  const data = (await response.json()) as { user_ids: string[] }
  return data.user_ids
}

/** Assign a recruiter to a requisition (idempotent on the backend). */
export async function assignRecruiter(
  userId: string,
  reqId: string,
  assignedBy?: string,
): Promise<void> {
  const response = await fetch(`${apiBase()}/api/v1/ops/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // assigned_by: who made this assignment — drives the backend's
    // CTC/ECTC assigner-visibility rule (backend FEATURE_SPEC.md Feature 3).
    body: JSON.stringify({ user_id: userId, requisition_id: reqId, assigned_by: assignedBy }),
  })
  if (!response.ok) throw new Error(`Failed to assign recruiter: ${response.status}`)
}

/** Unassign a recruiter from a requisition (idempotent on the backend). */
export async function unassignRecruiter(userId: string, reqId: string): Promise<void> {
  const params = `user_id=${encodeURIComponent(userId)}&requisition_id=${encodeURIComponent(reqId)}`
  const response = await fetch(`${apiBase()}/api/v1/ops/assignments?${params}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error(`Failed to unassign recruiter: ${response.status}`)
}

/** Recruiters who can still be assigned: not already assigned. Role/active
 * filtering already happened server-side (GET /auth/users/recruiters). */
export function assignableRecruiters(
  recruiters: readonly AssignableRecruiter[],
  assignedIds: readonly string[],
): AssignableRecruiter[] {
  const assigned = new Set(assignedIds)
  return recruiters.filter((r) => !assigned.has(r.id))
}
