'use client'

import { useState } from 'react'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CandidateShortlistCard } from '@/(shell)/_components/candidate-shortlist-card'
import { parseMatchEvidence } from '@/(shell)/_components/match-evidence-data'
import type { ShortlistSubmission, SubmissionStatus } from '../_lib/shortlist'
import { isTerminalStatus, statusLabel } from '../_lib/status'
import { RecruiterSnoozePopover } from './recruiter-snooze-popover'

interface ShortlistCandidateCardProps {
  submission: ShortlistSubmission
  isPending: boolean
  onAction: (status: SubmissionStatus, notes?: string) => void
  onSnooze: (snoozedUntil: string) => void
  onViewProfile: () => void
  onSnoozePopoverOpenChange?: (open: boolean) => void
  /** Save CTC/ECTC for this candidate. Omitted (e.g. Submission History) = no edit affordance. */
  onSaveCompensation?: (ctc: number | null, ectc: number | null) => void
  /**
   * Submission History mode: the outcome row renders disabled — not
   * hidden — with a "why" tooltip ("Already submitted on …"), and the note
   * input is hidden. View Profile stays available.
   */
  readOnly?: boolean
}

// Segmented "screening outcome" control — matches the mockup's labels
// exactly (lowercase second word), distinct from statusLabel()'s badge-case
// text used for the header pill. "Not yet screened" (shortlisted) has no
// onClick: it's the implicit starting state, never a target you click *to*.
const OUTCOME_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: 'shortlisted', label: 'Not yet screened' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'no_response', label: 'No response' },
]

export function ShortlistCandidateCard({
  submission,
  isPending,
  onAction,
  onSnooze,
  onViewProfile,
  onSnoozePopoverOpenChange,
  onSaveCompensation,
  readOnly = false,
}: ShortlistCandidateCardProps) {
  const [note, setNote] = useState('')
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const terminal = isTerminalStatus(submission.status)
  // Terminal decisions hide the row entirely (nothing left to do); an
  // already-submitted candidate keeps the row visible but disabled, with a
  // tooltip explaining why (spec: disabled, not hidden).
  const showActions = !terminal
  const actionsDisabled = isPending || readOnly
  const disabledTitle =
    readOnly && submission.submitted_at
      ? `Already submitted on ${new Date(submission.submitted_at).toLocaleDateString()}`
      : undefined
  const evidence = parseMatchEvidence(submission.match_rationale)

  function handleSnoozePopoverOpenChange(open: boolean) {
    setSnoozeOpen(open)
    onSnoozePopoverOpenChange?.(open)
  }

  return (
    <CandidateShortlistCard
      name={submission.candidate_name ?? shortId(submission.candidate_id)}
      title={submission.candidate_title}
      yearsExperience={submission.total_years_experience ?? null}
      skills={submission.candidate_skills ?? []}
      matchScore={submission.match_score}
      evidence={evidence}
      status={submission.status}
      statusLabel={statusLabel(submission.status)}
      ctc={submission.candidate_ctc ?? null}
      ectc={submission.candidate_ectc ?? null}
      onSaveCompensation={readOnly ? undefined : onSaveCompensation}
      compensationExtraField={
        showActions && !readOnly ? (
          <div>
            <Label htmlFor={`recruiter-note-${submission.id}`}>Recruiter note</Label>
            <Input
              id={`recruiter-note-${submission.id}`}
              className="mt-1.5 h-9"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you learned on the call."
              aria-label="Note for this categorization"
            />
          </div>
        ) : undefined
      }
      onViewProfile={onViewProfile}
      actions={
        <div className="flex w-full flex-col gap-2" title={disabledTitle}>
          <div className="flex flex-wrap items-center gap-2">
            {showActions ? (
              <>
                <span className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
                  Screening outcome
                </span>
                <div className="inline-flex w-fit gap-0.5 rounded-[10px] border border-border bg-card p-1">
                  {OUTCOME_OPTIONS.map((option) => {
                    const selected = submission.status === option.value
                    const clickable = option.value !== 'shortlisted'
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!clickable || actionsDisabled}
                        onClick={clickable ? () => onAction(option.value, note || undefined) : undefined}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                          selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                          !clickable && 'cursor-default',
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <div className="flex-1" />
                <RecruiterSnoozePopover
                  open={snoozeOpen}
                  onOpenChange={handleSnoozePopoverOpenChange}
                  onSnooze={onSnooze}
                  trigger={
                    <Button size="sm" variant="outline" disabled={actionsDisabled}>
                      <Clock className="mr-1 size-3.5" />
                      Snooze
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={actionsDisabled}
                  onClick={() => onAction('rejected', note || undefined)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <div className="flex-1" />
            )}
            <Button size="sm" variant="outline" onClick={onViewProfile}>
              <User className="mr-1 size-3.5" />
              View profile
            </Button>
          </div>
        </div>
      }
    />
  )
}

function shortId(id: string | null) {
  if (!id) return 'Unknown candidate'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}
