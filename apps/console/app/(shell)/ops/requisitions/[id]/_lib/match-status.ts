const MATCHABLE_REQUISITION_STATUSES = new Set(['open', 'matching_complete'])

export function canTriggerCandidateMatch(status: string): boolean {
  return MATCHABLE_REQUISITION_STATUSES.has(status)
}

export function candidateMatchButtonLabel(status: string, isPending: boolean): string {
  if (isPending) return 'Matching...'
  return status === 'matching_complete' ? 'Re-run Candidate Match' : 'Trigger Candidate Match'
}
