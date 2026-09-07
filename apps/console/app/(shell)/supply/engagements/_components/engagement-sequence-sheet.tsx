'use client'

import { useEffect, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Control } from 'react-hook-form'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@brynzit/ui/components/ui/sheet'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { cn } from '@brynzit/ui/lib/utils'
import { X } from 'lucide-react'

type EngagementSequenceResponse = components['schemas']['EngagementSequenceResponse']
type EngagementStep = components['schemas']['EngagementStep']

interface StepForm {
  steps: EngagementStep[]
}

interface StepEditorCardProps {
  index: number
  control: Control<StepForm>
  isReadOnly: boolean
  scheduledDay: number
}

function StepEditorCard({ index, control, isReadOnly, scheduledDay }: StepEditorCardProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step {index + 1} — Day {scheduledDay}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Subject</label>
          <Controller
            name={`steps.${index}.subject`}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                className={cn('text-sm', isReadOnly && 'pointer-events-none bg-muted/30')}
              />
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Body</label>
          <Controller
            name={`steps.${index}.body`}
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={5}
                className={cn(
                  'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none',
                  isReadOnly && 'pointer-events-none bg-muted/30',
                )}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

interface EngagementSequenceSheetProps {
  sequence: EngagementSequenceResponse | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EngagementSequenceSheet({
  sequence,
  isOpen,
  onOpenChange,
}: EngagementSequenceSheetProps) {
  const queryClient = useQueryClient()
  // T-04-06-03: useRef cleanup prevents zombie timeouts on sheet unmount
  const rejectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    control,
    reset,
    getValues,
    formState: { isDirty: stepsDirty },
  } = useForm<StepForm>({
    defaultValues: { steps: sequence?.steps ?? [] },
  })

  const { fields } = useFieldArray({ control, name: 'steps' })

  // Reset form when sequence changes
  useEffect(() => {
    reset({ steps: sequence?.steps ?? [] })
  }, [sequence?.id, reset]) // eslint-disable-line react-hooks/exhaustive-deps

  // T-04-06-03: Cleanup reject timeout on unmount
  useEffect(() => {
    return () => {
      if (rejectTimeoutRef.current) {
        clearTimeout(rejectTimeoutRef.current)
      }
    }
  }, [])

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!sequence) throw new Error('No sequence selected')

      if (stepsDirty) {
        // PATCH steps first if edited
        const { error: patchError } = await apiClient.PATCH(
          '/api/v1/supply/engagement/{sequence_id}',
          {
            params: { path: { sequence_id: sequence.id } },
            body: { steps: getValues('steps') },
          },
        )
        if (patchError) throw new Error('Failed to update steps')
      }

      // POST approve
      const { error: approveError } = await apiClient.POST(
        '/api/v1/supply/engagement/{sequence_id}/approve',
        {
          params: { path: { sequence_id: sequence.id } },
        },
      )
      if (approveError) throw new Error('Failed to approve sequence')
    },
    onSuccess: () => {
      toast('Sequence approved.')
      queryClient.invalidateQueries({ queryKey: ['supply-engagements'] })
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Approval failed — try again.')
    },
  })

  function handleReject() {
    if (!sequence) return

    toast('Sequence rejected.', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          if (rejectTimeoutRef.current) {
            clearTimeout(rejectTimeoutRef.current)
            rejectTimeoutRef.current = null
          }
        },
      },
    })

    rejectTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await apiClient.POST(
          '/api/v1/supply/engagement/{sequence_id}/reject',
          {
            params: { path: { sequence_id: sequence.id } },
          },
        )
        if (error) throw new Error('Rejection failed')
        queryClient.invalidateQueries({ queryKey: ['supply-engagements'] })
        onOpenChange(false)
      } catch {
        toast.error('Rejection failed — try again.')
      }
      rejectTimeoutRef.current = null
    }, 5000)
  }

  const candidateLabel = sequence
    ? `Candidate ${sequence.candidate_id.slice(0, 8)}`
    : 'Unknown candidate'

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // The header carries its own close button; without this, Radix stacks
        // its default X on top of it.
        showCloseButton={false}
        className="w-[600px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <SheetDescription className="sr-only">Review engagement sequence.</SheetDescription>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Engagement Sequence
              </p>
              <SheetTitle className="mt-0.5 text-xl font-semibold">{candidateLabel}</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Action bar — only when draft */}
        {sequence?.status === 'draft' && (
          <div className="flex gap-2 border-b border-border px-6 py-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              Approve Sequence
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="text-destructive hover:text-destructive"
              disabled={approveMutation.isPending}
            >
              Reject Sequence
            </Button>
          </div>
        )}

        {/* Generating state */}
        {sequence?.status === 'generating' && (
          <div className="flex gap-2 border-b border-border px-6 py-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg
                className="size-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating…
            </span>
          </div>
        )}

        {/* Step editor cards */}
        <div className="flex flex-col gap-4 px-6 py-4">
          {fields.map((field, index) => (
            <StepEditorCard
              key={field.id}
              index={index}
              control={control}
              isReadOnly={sequence?.status !== 'draft'}
              scheduledDay={field.scheduled_day}
            />
          ))}

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No steps in this sequence.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
