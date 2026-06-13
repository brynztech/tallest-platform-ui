'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Separator } from '@brynzit/ui/components/ui/separator'

// Display labels for SCREAMING_SNAKE_CASE enum values (from UI-SPEC copywriting contract)
const REASON_LABELS: Record<string, string> = {
  NOT_ICP_FIT: 'Not a fit',
  WRONG_SENIORITY: 'Wrong seniority',
  NO_OPEN_ROLES: 'No open roles',
  COMPETITOR: 'Competitor',
  BAD_TIMING: 'Bad timing',
  ALREADY_A_CLIENT: 'Already a client',
  OTHER: 'Other',
}

interface RejectPopoverProps {
  leadId: string
  trigger: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onReject: (leadId: string, reason: string) => void
}

export function RejectPopover({ leadId, trigger, open, onOpenChange, onReject }: RejectPopoverProps) {
  const { data } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/rejection-reasons')
      if (error) throw error
      return data
    },
    staleTime: Infinity, // Static data — never refetch
  })

  const reasons = data?.reasons ?? []

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={4} className="w-64 p-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rejection reason
        </div>
        <Separator />
        <div className="mt-1 flex flex-col">
          {reasons.map((reason) => (
            <button
              key={reason}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => {
                onReject(leadId, reason)
                onOpenChange(false)
              }}
            >
              {REASON_LABELS[reason] ?? reason}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
