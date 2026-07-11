'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@brynzit/ui/components/ui/dialog'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { toast } from 'sonner'
import type { KanbanLeadItem } from './kanban-board'

interface QuickRejectDialogProps {
  lead: KanbanLeadItem | null
  onClose: () => void
  onSuccess: () => void
}

export function QuickRejectDialog({ lead, onClose, onSuccess }: QuickRejectDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')

  const { data: reasons } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/rejection-reasons')
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })

  const rejectMutation = useMutation({
    mutationFn: () =>
      apiClient.POST('/api/v1/bd/leads/bulk-action', {
        body: {
          action: 'reject',
          lead_ids: [lead!.id],
          rejection_reason: selectedReason,
        },
      }),
    onSuccess: (response) => {
      if (response.data?.failed) {
        toast.error('Rejection failed.')
      } else {
        toast.success(`${lead?.company_name ?? 'Lead'} rejected and suppressed.`)
        onSuccess()
        handleClose()
      }
    },
    onError: () => {
      toast.error('Rejection failed — please try again.')
    },
  })

  function handleClose() {
    setSelectedReason('')
    onClose()
  }

  return (
    <Dialog open={!!lead} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Reject Lead</DialogTitle>
          <DialogDescription>
            Reject{' '}
            <span className="font-medium text-foreground">
              {lead?.company_name ?? 'this lead'}
            </span>
            ? It will be suppressed from the pipeline.
          </DialogDescription>
        </DialogHeader>

        <Select value={selectedReason} onValueChange={setSelectedReason}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a rejection reason…" />
          </SelectTrigger>
          <SelectContent>
            {(reasons?.reasons ?? []).map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!selectedReason || rejectMutation.isPending}
            onClick={() => rejectMutation.mutate()}
          >
            {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
