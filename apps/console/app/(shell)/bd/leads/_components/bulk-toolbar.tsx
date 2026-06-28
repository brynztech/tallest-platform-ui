'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { toast } from 'sonner'

type BulkActionRequest = components['schemas']['BulkActionRequest']

const REASON_LABELS: Record<string, string> = {
  NOT_ICP_FIT: 'Not a fit',
  WRONG_SENIORITY: 'Wrong seniority',
  NO_OPEN_ROLES: 'No open roles',
  COMPETITOR: 'Competitor',
  BAD_TIMING: 'Bad timing',
  ALREADY_A_CLIENT: 'Already a client',
  OTHER: 'Other',
}

const REJECTION_REASONS = Object.keys(REASON_LABELS)

interface BulkToolbarProps {
  selectedIds: string[]
  mode?: 'review' | 'suppressed'
  onClearSelection: () => void
  onBulkStart: (ids: string[]) => void // Sets cards to pending state
  onBulkSettled: () => void // Clears pending + selection
}

export function BulkToolbar({
  selectedIds,
  mode = 'review',
  onClearSelection,
  onBulkStart,
  onBulkSettled,
}: BulkToolbarProps) {
  const queryClient = useQueryClient()
  const [bulkRejectReason, setBulkRejectReason] = useState<string>('')
  // Ref to the pending delayed-fire timer so the undo handler can cancel it.
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bulkMutation = useMutation({
    mutationFn: (payload: BulkActionRequest) =>
      apiClient.POST('/api/v1/bd/leads/bulk-action', { body: payload }),
    onSettled: async () => {
      // D-10: reset to page 1 (not invalidate) to avoid cursor corruption
      await queryClient.resetQueries({ queryKey: ['leads'] })
      onBulkSettled()
    },
    onError: () => {
      toast.error('Bulk action failed. Please try again.')
      // onBulkSettled is always called by onSettled — do not call twice to
      // avoid a double resetQueries and a redundant state update flicker (WR-03).
    },
  })

  function handleBulkAction(action: 'approve' | 'reject' | 'snooze' | 'move_to_review') {
    if (action === 'reject' && !bulkRejectReason) {
      toast.error('Select a rejection reason for all leads.')
      return
    }
    onBulkStart(selectedIds)
    const payload: BulkActionRequest = {
      action,
      lead_ids: selectedIds,
      ...(action === 'reject' ? { rejection_reason: bulkRejectReason } : {}),
      ...(action === 'snooze'
        ? { due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
        : {}),
    }

    // Show the toast BEFORE firing the mutation so the "Undo" button can cancel
    // it. Mirror the same delayed-fire pattern used by single-lead actions (D-06).
    const actionLabel = action === 'move_to_review' ? 'move to review' : action
    const toastId = toast(`Bulk action: ${actionLabel} ${selectedIds.length} leads`, {
      action: {
        label: 'Undo',
        onClick: () => {
          if (pendingTimer.current) {
            clearTimeout(pendingTimer.current)
            pendingTimer.current = null
          }
          // Undo: cancel the pending mutation and restore selection state
          onBulkSettled()
          toast.dismiss(toastId)
        },
      },
      duration: 5000,
    })

    // Delay the actual API call by 300 ms to give the undo window a chance to fire
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null
      bulkMutation.mutate(payload)
    }, 300)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
      <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
      {mode === 'suppressed' ? (
        <Button size="sm" onClick={() => handleBulkAction('move_to_review')}>
          Move Selected to Review
        </Button>
      ) : (
        <>
          <Button size="sm" onClick={() => handleBulkAction('approve')}>
            Approve All
          </Button>
          <div className="flex items-center gap-2">
            <Select value={bulkRejectReason} onValueChange={setBulkRejectReason}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="Rejection reason…" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('reject')}
              disabled={!bulkRejectReason}
            >
              Reject All
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => handleBulkAction('snooze')}>
            Snooze All (1 week)
          </Button>
        </>
      )}
      <button
        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        onClick={onClearSelection}
      >
        Clear selection
      </button>
    </div>
  )
}
