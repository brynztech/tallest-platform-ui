'use client'

import { useState } from 'react'
import { Card, CardContent } from '@brynzit/ui/components/ui/card'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  /**
   * Submission History mode: hides the note input and the categorization
   * action row (Interested/Not Interested/No Response/Snooze/Reject) — a
   * submitted candidate is out of the recruiter's hands. View Profile stays
   * available. Kept as a boolean prop rather than a second card component
   * per this app's reuse-over-duplication convention.
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
  readOnly = false,
}: ShortlistCandidateCardProps) {
  const [note, setNote] = useState('')
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const terminal = isTerminalStatus(submission.status)
  const isInterested = submission.status === 'interested'
  const showActions = !terminal && !readOnly
  const score = submission.match_score

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

        {showActions && (
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            className="h-8 text-sm"
            aria-label="Note for this categorization"
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onViewProfile}>
            <User className="mr-1 size-3.5" />
            View Profile
          </Button>
          {showActions && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="border-[oklch(0.45_0.15_145)]/40 text-[oklch(0.45_0.15_145)] hover:bg-[oklch(0.45_0.15_145)]/10"
                onClick={() => onAction('interested', note || undefined)}
              >
                Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onAction('not_interested', note || undefined)}
              >
                Not Interested
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onAction('no_response', note || undefined)}
              >
                No Response
              </Button>
              <RecruiterSnoozePopover
                open={snoozeOpen}
                onOpenChange={handleSnoozePopoverOpenChange}
                onSnooze={onSnooze}
                trigger={
                  <Button size="sm" variant="outline" disabled={isPending}>
                    <Clock className="mr-1 size-3.5" />
                    Snooze
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={isPending}
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
