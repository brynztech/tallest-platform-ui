'use client'

import { useState } from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Pipeline } from '@brynzit/pipeline'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card } from '@brynzit/ui/components/ui/card'
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
import { PipelineCardHead } from './pipeline-card-head'
import { SubmissionNotesPopover } from './submission-notes-popover'

interface PipelineCandidateCardProps {
  submission: PipelineSubmission
  pipeline: Pipeline
  pipelineQueryKey: QueryKey
  onOpenProfile: (submission: PipelineSubmission) => void
}

export function PipelineCandidateCard({
  submission,
  pipeline,
  pipelineQueryKey,
  onOpenProfile,
}: PipelineCandidateCardProps) {
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
      <Card className="gap-0 overflow-hidden py-0 shadow-[0_1px_2px_rgba(22,18,12,0.04)]">
        <PipelineCardHead submission={submission} onOpenProfile={onOpenProfile} />

        <div className="flex flex-col gap-2 border-t border-dashed border-border px-4 pt-3 pb-4">
          <Button
            size="sm"
            className="w-full min-w-0 gap-1 px-2 text-[11px]"
            disabled={!next || advanceMutation.isPending}
            title={next ? undefined : 'Already at the final stage'}
            onClick={() => advanceMutation.mutate()}
          >
            <span className="min-w-0 truncate">
              {advanceMutation.isPending
                ? 'Advancing…'
                : next
                  ? `Advance to ${next.label}`
                  : 'Advance'}
            </span>
            <ChevronRight className="size-3.5" />
          </Button>
          <div className="flex items-center gap-2">
            <SubmissionNotesPopover submissionId={submission.id} />
            <Button size="sm" variant="ghost" onClick={() => setRemoveOpen(true)}>
              Remove
            </Button>
          </div>
        </div>
      </Card>

      <Dialog
        open={removeOpen}
        onOpenChange={(open) => {
          setRemoveOpen(open)
          if (!open) setReason('')
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Remove from pipeline
            </DialogTitle>
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
              variant="outline"
              className="border-[#F0D9D6] bg-[#FAF0EE] text-[#BA4642] hover:bg-[#f6e4e1] hover:text-[#BA4642]"
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
