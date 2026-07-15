/**
 * Role assignment visibility. Recruiters work only their assigned roles;
 * managers/admins see everything. This encapsulates the `role.view_assigned`
 * vs `role.view_all` distinction in one tested place.
 */

export interface AssignmentFilter {
  /** Ids of items assigned to the acting user. */
  assignedIds: string[]
  /** True when the acting user may view all items regardless of assignment. */
  canViewAll: boolean
}

/** Whether an id is in the assigned set. */
export function isAssigned(assignedIds: string[], id: string): boolean {
  return assignedIds.includes(id)
}

/**
 * Filter a list of identifiable items to those visible to the acting user:
 * everything when `canViewAll`, otherwise only assigned items.
 */
export function visibleByAssignment<T extends { id: string }>(
  items: T[],
  { assignedIds, canViewAll }: AssignmentFilter,
): T[] {
  if (canViewAll) return items
  const assigned = new Set(assignedIds)
  return items.filter((item) => assigned.has(item.id))
}
