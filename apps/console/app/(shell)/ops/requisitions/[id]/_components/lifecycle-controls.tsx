'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCan } from '@brynzit/identity'
import { toast } from 'sonner'
import { Bell, Lock } from 'lucide-react'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import {
  requestMoreCandidates,
  updateRequisitionStatus,
  type RequisitionLifecycleStatus,
} from '../_lib/lifecycle'
import { isRequisitionTerminal } from '../_lib/match-status'

/**
 * AM/Admin-gated (requisition.manage) control cluster next to the status
 * badge: Request More Candidates, and Close Position (offering the two
 * terminal choices, Closed or Filled, behind a confirm dialog — this is a
 * terminal, no-reopen action, so a native `confirm()` isn't acceptable per
 * this app's conventions; a lightweight Dialog from @brynzit/ui is used
 * instead, same primitive this app already ships).
 */
export function RequisitionLifecycleControls({
  reqId,
  status,
}: {
  reqId: string
  status: string
}) {
  const can = useCan()
  const canManage = can('requisition.manage')
  const queryClient = useQueryClient()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const terminal = isRequisitionTerminal(status)

  const notifyMutation = useMutation({
    mutationFn: () => requestMoreCandidates(reqId),
    onSuccess: (data) => {
      toast(
        data.notified_count === 0
          ? 'No recruiter is currently assigned to this role.'
          : `Notified ${data.notified_count} recruiter${data.notified_count === 1 ? '' : 's'}.`,
      )
    },
    onError: () => toast.error('Failed to request more candidates — try again.'),
  })

  const statusMutation = useMutation({
    mutationFn: (next: RequisitionLifecycleStatus) => updateRequisitionStatus(reqId, next),
    onSuccess: (_data, next) => {
      queryClient.invalidateQueries({ queryKey: ['ops-requisition', reqId] })
      toast(`Requisition marked ${next}.`)
      setCloseDialogOpen(false)
    },
    onError: () => toast.error('Failed to update requisition status — try again.'),
  })

  if (!canManage) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={terminal || notifyMutation.isPending}
        onClick={() => notifyMutation.mutate()}
      >
        <Bell className="mr-1 size-4" />
        Request More Candidates
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={terminal}
        onClick={() => setCloseDialogOpen(true)}
      >
        <Lock className="mr-1 size-4" />
        Close Position
      </Button>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this position?</DialogTitle>
            <DialogDescription>
              This is terminal — the requisition can&apos;t be reopened once marked Closed
              or Filled. Run Match, Request More Candidates, and further status changes
              will no longer be available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              variant="default"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate('filled')}
            >
              Mark Filled
            </Button>
            <Button
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate('closed')}
            >
              Mark Closed
            </Button>
            <Button variant="ghost" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
