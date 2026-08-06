'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { cn } from '@brynzit/ui/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

// api.d.ts field names: sequence_id (not id), step_index (not step_number), scheduled_day (not scheduled_at)
type OutreachSequenceResponse = components['schemas']['OutreachSequenceResponse']
type OutreachStepResponse = components['schemas']['demand__outreach_config__OutreachStepResponse']

interface StepEditorProps {
  step: OutreachStepResponse
  sequenceId: string
  onStepChange: (stepIndex: number, subject: string, body: string) => void
}

function StepEditor({ step, sequenceId, onStepChange }: StepEditorProps) {
  const [subject, setSubject] = useState(step.subject ?? step.original_subject ?? '')
  const [body, setBody] = useState(step.body ?? step.original_body ?? '')
  const [isDirty, setIsDirty] = useState(false)

  const saveStep = useMutation({
    mutationFn: () =>
      apiClient.PATCH('/api/v1/bd/outreach/{sequence_id}', {
        params: { path: { sequence_id: sequenceId } },
        body: { steps: [{ step_index: step.step_index, subject, body }] },
      }),
    onSuccess: () => {
      setIsDirty(false)
      onStepChange(step.step_index, subject, body)
    },
    onError: () => {
      toast.error('Failed to save step. Try again.')
    },
  })

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step {step.step_index} — Day {step.scheduled_day}
        </span>
        {isDirty && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => saveStep.mutate()}
            disabled={saveStep.isPending}
          >
            {saveStep.isPending ? 'Saving…' : 'Save'}
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Subject</label>
          <Input
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setIsDirty(true)
            }}
            className="text-sm"
            placeholder="Subject line"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Body</label>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setIsDirty(true)
            }}
            rows={5}
            className={cn(
              'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
              'resize-none',
            )}
            placeholder="Email body"
          />
        </div>
      </div>
    </div>
  )
}

interface SequenceEditorProps {
  sequence: OutreachSequenceResponse
  leadName?: string
  onApproved: (id: string) => void
  onRejected: (id: string) => void
}

export function SequenceEditor({ sequence, leadName, onApproved, onRejected }: SequenceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: () =>
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/outreach/${sequence.sequence_id}/approve`,
        { method: 'POST' },
      ).then((r) => {
        if (!r.ok) throw new Error('Approve failed')
        return r.json()
      }),
    onSuccess: () => {
      toast('Sequence approved', {
        description: `${leadName ?? 'Sequence'} outreach approved.`,
      })
      onApproved(sequence.sequence_id)
      queryClient.invalidateQueries({ queryKey: ['outreach-sequences'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
    onError: () => {
      toast.error('Failed to approve sequence.')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/v1/bd/outreach/{sequence_id}/reject', {
        params: { path: { sequence_id: sequence.sequence_id } },
        body: {
          notes: `Rejected from console review${leadName ? ` for ${leadName}` : ''}.`,
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast('Sequence rejected', {
        description: `${leadName ?? 'Sequence'} outreach rejected.`,
      })
      onRejected(sequence.sequence_id)
      queryClient.invalidateQueries({ queryKey: ['outreach-sequences'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
    },
    onError: () => {
      toast.error('Failed to reject sequence.', {
        description: 'The sequence stayed in review so no outreach state was lost.',
      })
    },
  })

  function handleStepChange(stepIndex: number, subject: string, body: string) {
    // Step state is managed locally in StepEditor — this callback is for parent awareness
    void stepIndex
    void subject
    void body
  }

  const stepCount = sequence.steps.length

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Collapsed header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/30"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-semibold">
          {leadName ?? `Sequence ${sequence.sequence_id.slice(0, 8)}`}
        </span>
        <span className="text-xs text-muted-foreground">{stepCount}-step sequence</span>
        <Badge variant="secondary" className="ml-2 text-xs capitalize">
          {sequence.status ?? 'pending_review'}
        </Badge>
        <span className="ml-2 text-xs text-muted-foreground">
          {new Date(sequence.created_at).toLocaleDateString()}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="flex flex-col gap-4 p-5">
            {sequence.steps.map((step) => (
              <StepEditor
                key={step.step_index}
                step={step}
                sequenceId={sequence.sequence_id}
                onStepChange={handleStepChange}
              />
            ))}
          </div>
          <Separator />
          <div className="flex items-center gap-3 px-5 py-4">
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Approve Sequence
            </Button>
            <Button
              variant="outline"
              className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Reject Sequence
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
