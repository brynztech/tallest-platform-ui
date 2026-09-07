'use client'

import { cn } from '@brynzit/ui/lib/utils'
import type { PipelineSubmission } from '../../_lib/recruiter-data'
import { matchScoreToneClass, statusToneClass } from '../../_lib/status-tone'

/**
 * The identity block shared by both pipeline cards (the editable
 * `PipelineCandidateCard` and the read-only one on the page). Only the action
 * footer differs between them, so this is the whole card above that divider.
 *
 * The name is the button that opens the candidate panel — the same
 * `CandidateProfileSheet` supply search, my-roles and ops requisitions open, so
 * a candidate looks identical wherever you meet them.
 */
export function PipelineCardHead({
  submission,
  onOpenProfile,
}: {
  submission: PipelineSubmission
  onOpenProfile: (submission: PipelineSubmission) => void
}) {
  const hasCandidate = Boolean(submission.candidate_id)
  const name = submission.candidate_name ?? submission.candidate_id

  return (
    <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-2">
        {hasCandidate ? (
          <button
            type="button"
            onClick={() => onOpenProfile(submission)}
            className="min-w-0 text-left text-[15px] leading-snug font-semibold text-foreground hover:underline"
          >
            {name}
          </button>
        ) : (
          <h3 className="min-w-0 text-[15px] leading-snug font-semibold text-foreground">{name}</h3>
        )}
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap',
            statusToneClass(submission.status),
          )}
        >
          <span className="size-[5px] rounded-full bg-current" />
          {submission.status}
        </span>
      </div>
      {/* Role and client are fixed by the requisition picker above the
          board — repeating them on every card is noise, not information. */}
      <p className="text-[13px] text-muted-foreground">
        {submission.candidate_title ?? 'Candidate'}
      </p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        <span>Match score</span>
        {submission.match_score != null ? (
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                'size-1.5 rounded-full bg-current',
                matchScoreToneClass(submission.match_score),
              )}
            />
            <strong className={cn('font-semibold', matchScoreToneClass(submission.match_score))}>
              {submission.match_score}
            </strong>
          </span>
        ) : (
          <strong className="font-semibold text-foreground">not scored</strong>
        )}
      </div>
    </div>
  )
}
