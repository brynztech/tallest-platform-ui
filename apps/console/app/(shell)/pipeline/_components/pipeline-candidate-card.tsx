'use client'

import { useState } from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Pipeline } from '@brynzit/pipeline'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent } from '@brynzit/ui/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Label } from '@brynzit/ui/components/ui/label'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { ChevronRight } from 'lucide-react'
import type { PipelineSubmission } from '../../_lib/recruiter-data'
import { nextPipelineStage } from '../_lib/pipeline-bridge'
import { AdvanceStageConflictError, advanceSubmissionStage, manualRemoveFromPipeline } from '../_lib/pipeline-actions'
import { SubmissionNotesPopover } from './submission-notes-popover'

interface PipelineCandidateCardProps {
  submission: PipelineSubmission
  pipeline: Pipeline
  pipelineQueryKey: QueryKey
}

export function PipelineCandidateCard({ submission, pipeline, pipelineQueryKey }: PipelineCandidateCardProps) {
  const queryClient = useQueryClient()
  const [removeOpen, setRemoveOpen] = useState(false)
  const [reason, setReason] = useState('')

  const next = nextPipelineStage(pipeline, submission.current_stage_id ?? null)

  const advanceMutation = useMutation({
    mutationFn: () => advanceSubmissionStage(submission.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineQueryKey })
      toast.success(next ? `Advanced to ${next.label}.` : 'Advanced to the next stage.')
    },
    onError: (error) => {
      toast.error(
        error instanceof AdvanceStageConflictError && error.detail
          ? error.detail
          : "Couldn't advance — try again.",
      )
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => manualRemoveFromPipeline(submission.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineQueryKey })
      toast.success('Candidate removed from the pipeline.')
      setRemoveOpen(false)
      setReason('')
    },
    onError: () => toast.error('Failed to remove candidate.'),
  })

  const canSubmitRemove = reason.trim().length >= 3

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-2 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">
                {submission.candidate_name ?? submission.candidate_id}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {submission.candidate_title ?? 'Candidate'} · {submission.requisition.title}
              </p>
            </div>
            <Badge variant="outline">{submission.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {submission.requisition.client?.name ?? 'Client'} · Match score{' '}
            {submission.match_score ?? 'not scored'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!next || advanceMutation.isPending}
              title={next ? undefined : 'Already at the final stage'}
              onClick={() => advanceMutation.mutate()}
            >
              <ChevronRight className="mr-1 size-3.5" />
              {advanceMutation.isPending
                ? 'Advancing…'
                : next
                  ? `Advance to ${next.label}`
                  : 'Advance'}
            </Button>
            <SubmissionNotesPopover submissionId={submission.id} />
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setRemoveOpen(true)}
            >
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={removeOpen}
        onOpenChange={(open) => {
          setRemoveOpen(open)
          if (!open) setReason('')
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from pipeline</DialogTitle>
            <DialogDescription>
              {submission.candidate_name ?? 'This candidate'} will be removed from the pipeline.
              Explain why.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`remove-reason-${submission.id}`}>Reason</Label>
            <Textarea
              id={`remove-reason-${submission.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why should this candidate be removed?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={!canSubmitRemove || removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              {removeMutation.isPending ? 'Removing…' : 'Remove candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
