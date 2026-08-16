/**
 * Real stage-column grouping for the `/pipeline` kanban page, replacing
 * `stageForSubmissionStatus()` (`ops/requisitions/[id]/_lib/hiring-process.ts`),
 * which only ever bucketed every non-rejected submission into `stages[0]` or
 * `stages[1]` regardless of how many stages a requisition configures. See
 * docs/recruiter-shortlist-categorization.md §8.
 */
import type { HiringStage } from '../../ops/requisitions/[id]/_lib/hiring-process'
import type { PipelineSubmission } from '../../_lib/recruiter-data'

/**
 * Column key for submissions the recruiter has screened as `interested` but
 * that haven't been approved/rejected by the Account Manager yet — not real
 * pipeline-stage tracking, so it's kept as its own read-only column, separate
 * from and before the requisition's configured hiring-process stages.
 */
export const AWAITING_REVIEW_STAGE_ID = 'awaiting-review'

/**
 * Buckets a requisition's shortlist submissions into pipeline-kanban columns.
 *
 * - `interested` -> the `AWAITING_REVIEW_STAGE_ID` column (read-only here;
 *   approve/reject still happens on `/ops/requisitions/[id]`'s ShortlistTable).
 * - `approved` -> the column matching `current_stage_id`, defaulting to the
 *   first configured stage when null/not-yet-advanced, or when a stale
 *   `current_stage_id` no longer matches any configured stage.
 * - `rejected` (and anything else `fetchPipelineSubmissions` might return) ->
 *   excluded; the page's separate `?stage=rejected` toggle renders those from
 *   its own filter, unchanged.
 */
export function groupSubmissionsByPipelineStage(
  submissions: PipelineSubmission[],
  stages: HiringStage[],
): Record<string, PipelineSubmission[]> {
  const groups: Record<string, PipelineSubmission[]> = { [AWAITING_REVIEW_STAGE_ID]: [] }
  for (const stage of stages) groups[stage.id] = []

  for (const submission of submissions) {
    if (submission.status === 'interested') {
      groups[AWAITING_REVIEW_STAGE_ID].push(submission)
      continue
    }
    if (submission.status !== 'approved') continue

    const preferred = submission.current_stage_id ?? stages[0]?.id
    const stageId = preferred && groups[preferred] ? preferred : stages[0]?.id
    if (stageId) groups[stageId].push(submission)
  }

  return groups
}
