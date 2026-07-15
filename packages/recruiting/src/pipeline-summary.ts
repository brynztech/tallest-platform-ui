/**
 * Pipeline summary — aggregate submission statuses into a real, at-a-glance
 * breakdown for dashboards. Reflects live record state (not vanity counters):
 * every number corresponds to real submissions in that state.
 *
 * Statuses mirror the backend `supply_submissions.status` vocabulary.
 */

export interface PipelineSummary {
  total: number
  /** `shortlisted` — submitted, awaiting the internal quality gate. */
  awaitingInternalReview: number
  /** `approved` — passed internal review, visible to the client. */
  approvedToClient: number
  /** `rejected` — rejected internally or by the client. */
  rejected: number
  /** `hold` — paused for a later decision. */
  onHold: number
}

/** Count submission statuses into a pipeline breakdown. */
export function summarizePipeline(statuses: readonly string[]): PipelineSummary {
  const summary: PipelineSummary = {
    total: statuses.length,
    awaitingInternalReview: 0,
    approvedToClient: 0,
    rejected: 0,
    onHold: 0,
  }
  for (const status of statuses) {
    switch (status) {
      case 'shortlisted':
        summary.awaitingInternalReview += 1
        break
      case 'approved':
        summary.approvedToClient += 1
        break
      case 'rejected':
        summary.rejected += 1
        break
      case 'hold':
        summary.onHold += 1
        break
      default:
        break
    }
  }
  return summary
}
