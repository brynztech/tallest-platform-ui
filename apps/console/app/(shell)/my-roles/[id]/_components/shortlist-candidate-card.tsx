'use client'

import { useState } from 'react'
import { Card, CardContent } from '@brynzit/ui/components/ui/card'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MatchEvidenceSections } from '@/(shell)/_components/match-evidence'
import { parseMatchEvidence } from '@/(shell)/_components/match-evidence-data'
import type { ShortlistSubmission, SubmissionStatus } from '../_lib/shortlist'
import { isTerminalStatus, scoreColor, statusBadgeClass, statusLabel } from '../_lib/status'
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
   * Submission History mode: the categorization action row
   * (Interested/Not Interested/No Response/Snooze/Reject) renders disabled —
   * not hidden — with a "why" tooltip ("Already submitted on …"), and the
   * note input is hidden. View Profile stays available. Kept as a boolean
   * prop rather than a second card component per this app's
   * reuse-over-duplication convention.
   */
  readOnly?: boolean
}

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
  const isInterested = submission.status === 'interested'
  // Terminal decisions hide the row entirely (nothing left to do); an
  // already-submitted candidate keeps the row visible but disabled, with a
  // tooltip explaining why (spec: disabled, not hidden).
  const showActions = !terminal
  const actionsDisabled = isPending || readOnly
  const disabledTitle =
    readOnly && submission.submitted_at
      ? `Already submitted on ${new Date(submission.submitted_at).toLocaleDateString()}`
      : undefined
  const score = submission.match_score
  const evidence = parseMatchEvidence(submission.match_rationale)

  function handleSnoozePopoverOpenChange(open: boolean) {
    setSnoozeOpen(open)
    onSnoozePopoverOpenChange?.(open)
  }

  return (
    <Card
      className={cn(
        isInterested && 'border-[oklch(0.45_0.15_145)]/50 bg-[oklch(0.45_0.15_145)]/5',
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="text-left text-sm font-medium hover:text-primary"
              onClick={onViewProfile}
            >
              {submission.candidate_name ?? shortId(submission.candidate_id)}
            </button>
            {submission.candidate_title && (
              <p className="text-xs text-muted-foreground">{submission.candidate_title}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {score != null && (
              <span className="text-sm font-semibold" style={{ color: scoreColor(score) }}>
                {score}%
              </span>
            )}
            <Badge variant="outline" className={cn('text-xs', statusBadgeClass(submission.status))}>
              {statusLabel(submission.status)}
              {submission.status === 'snoozed' && submission.snoozed_until
                ? ` until ${new Date(submission.snoozed_until).toLocaleDateString()}`
                : ''}
            </Badge>
          </div>
        </div>

        {isInterested && !submission.submitted_at && (
          <p className="text-xs text-[oklch(0.45_0.15_145)]">
            Sent to your Account Manager for review.
          </p>
        )}

        {submission.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
          </p>
        )}

        {submission.candidate_skills && submission.candidate_skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {submission.candidate_skills.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[11px]">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {evidence && (
          // Native disclosure keeps the queue dense; expand for the full
          // evidence card (matched role, career + company stats, flag
          // verdicts with quotes, screen questions).
          <details className="rounded-md border border-border px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium">
              Match evidence
              {evidence.judgmentScore != null && (
                <span className="ml-1 text-muted-foreground">
                  · judgment {Math.round(evidence.judgmentScore)}
                </span>
              )}
            </summary>
            <div className="mt-2">
              <MatchEvidenceSections evidence={evidence} />
            </div>
          </details>
        )}

        <CompensationRow
          ctc={submission.candidate_ctc ?? null}
          ectc={submission.candidate_ectc ?? null}
          onSave={readOnly ? undefined : onSaveCompensation}
        />

        {showActions && !readOnly && (
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            className="h-8 text-sm"
            aria-label="Note for this categorization"
          />
        )}

        <div className="flex flex-wrap items-center gap-2" title={disabledTitle}>
          <Button variant="outline" size="sm" onClick={onViewProfile}>
            <User className="mr-1 size-3.5" />
            View Profile
          </Button>
          {showActions && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={actionsDisabled}
                className="border-[oklch(0.45_0.15_145)]/40 text-[oklch(0.45_0.15_145)] hover:bg-[oklch(0.45_0.15_145)]/10"
                onClick={() => onAction('interested', note || undefined)}
              >
                Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actionsDisabled}
                onClick={() => onAction('not_interested', note || undefined)}
              >
                Not Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actionsDisabled}
                onClick={() => onAction('no_response', note || undefined)}
              >
                No Response
              </Button>
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
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={actionsDisabled}
                onClick={() => onAction('rejected', note || undefined)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function shortId(id: string | null) {
  if (!id) return 'Unknown candidate'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function formatComp(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
}

/**
 * Compact CTC/ECTC display with inline edit (backend FEATURE_SPEC.md
 * Feature 3). onSave omitted = display only (Submission History).
 */
function CompensationRow({
  ctc,
  ectc,
  onSave,
}: {
  ctc: number | null
  ectc: number | null
  onSave?: (ctc: number | null, ectc: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [ctcDraft, setCtcDraft] = useState('')
  const [ectcDraft, setEctcDraft] = useState('')
  const [inputError, setInputError] = useState(false)

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          CTC <span className="font-medium text-foreground">{formatComp(ctc)}</span>
        </span>
        <span>
          Expected <span className="font-medium text-foreground">{formatComp(ectc)}</span>
        </span>
        {onSave && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setCtcDraft(ctc != null ? String(ctc) : '')
              setEctcDraft(ectc != null ? String(ectc) : '')
              setEditing(true)
            }}
          >
            Edit
          </Button>
        )}
      </div>
    )
  }

  // Empty = clear the value (null). Non-empty must parse to a non-negative
  // number — otherwise Save is rejected rather than silently wiping the
  // stored value with a null.
  const parse = (raw: string): number | null | 'invalid' => {
    if (raw.trim() === '') return null
    const n = Number(raw.replace(/[,\s]/g, ''))
    return Number.isNaN(n) || n < 0 ? 'invalid' : n
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={ctcDraft}
        onChange={(e) => setCtcDraft(e.target.value)}
        placeholder="Current CTC"
        inputMode="numeric"
        className="h-7 w-32 text-xs"
        aria-label="Current CTC"
        aria-invalid={inputError || undefined}
      />
      <Input
        value={ectcDraft}
        onChange={(e) => setEctcDraft(e.target.value)}
        placeholder="Expected CTC"
        inputMode="numeric"
        className="h-7 w-32 text-xs"
        aria-label="Expected CTC"
        aria-invalid={inputError || undefined}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => {
          const nextCtc = parse(ctcDraft)
          const nextEctc = parse(ectcDraft)
          if (nextCtc === 'invalid' || nextEctc === 'invalid') {
            setInputError(true)
            return
          }
          setInputError(false)
          onSave?.(nextCtc, nextEctc)
          setEditing(false)
        }}
      >
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => {
          setInputError(false)
          setEditing(false)
        }}
      >
        Cancel
      </Button>
      {inputError && (
        <p className="w-full text-xs text-destructive">
          Enter numbers only (e.g. 1200000), or leave blank to clear.
        </p>
      )}
    </div>
  )
}
