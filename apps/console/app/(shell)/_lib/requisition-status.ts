/**
 * Operator-facing requisition status. `matching_complete` is an internal
 * pipeline step after the first search — it is still an open role.
 */

export function requisitionStatusLabel(status: string): string {
  switch (status) {
    case 'open':
    case 'matching_complete':
      return 'Open'
    case 'closed':
      return 'Closed'
    case 'filled':
      return 'Filled'
    case 'draft':
      return 'Draft'
    default:
      return status
  }
}

/** Live (not draft, not terminal) — used for "open roles" counts and badge tone. */
export function isLiveRequisitionStatus(status: string): boolean {
  return status === 'open' || status === 'matching_complete'
}
