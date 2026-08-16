const MATCHABLE_REQUISITION_STATUSES = new Set(['open', 'matching_complete'])
const TERMINAL_REQUISITION_STATUSES = new Set(['closed', 'filled'])

export function canTriggerCandidateMatch(status: string): boolean {
  return MATCHABLE_REQUISITION_STATUSES.has(status)
}

export function candidateMatchButtonLabel(status: string, isPending: boolean): string {
  if (isPending) return 'Matching...'
  return status === 'matching_complete' ? 'Re-run Candidate Match' : 'Trigger Candidate Match'
}

/**
 * `closed`/`filled` are terminal — no reopening supported. Used to hide/
 * disable Close Position and Request More Candidates once a requisition has
 * reached either state. Note `canTriggerCandidateMatch` above already
 * excludes both (it only allows `open`/`matching_complete`), so Run Match's
 * own disabled check doesn't need to reference this — kept separate rather
 * than duplicated.
 */
export function isRequisitionTerminal(status: string): boolean {
  return TERMINAL_REQUISITION_STATUSES.has(status)
}
