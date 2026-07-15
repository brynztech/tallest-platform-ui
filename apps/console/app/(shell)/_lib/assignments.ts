export const assignmentQueryKeys = {
  forUser: (userId: string) => ['assignments', userId] as const,
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
