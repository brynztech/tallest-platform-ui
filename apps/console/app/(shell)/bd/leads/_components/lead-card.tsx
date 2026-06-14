'use client'

import { useState } from 'react'
import type { LeadQueueItemExtended } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { RejectPopover } from './reject-popover'
import { SnoozePopover } from './snooze-popover'

type LeadQueueItem = LeadQueueItemExtended

function icpBadgeClass(score: number | null) {
  if (score === null || score === undefined) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-primary text-primary-foreground'
  if (score >= 60) return 'bg-[oklch(0.769_0.188_85.87)] text-black'
  return 'bg-muted text-muted-foreground'
}

interface LeadCardProps {
  lead: LeadQueueItem
  isSelected: boolean
  isLeaving: boolean
  isProcessing: boolean
  isFocused: boolean
  onSelect: (id: string, checked: boolean) => void
  onOpenDetail: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onSnooze: (id: string, dueAt: string) => void
  onPopoverOpenChange?: (open: boolean) => void
}

export function LeadCard({
  lead,
  isSelected,
  isLeaving,
  isProcessing,
  isFocused,
  onSelect,
  onOpenDetail,
  onApprove,
  onReject,
  onSnooze,
  onPopoverOpenChange,
}: LeadCardProps) {
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false)

  function handleRejectOpenChange(open: boolean) {
    setIsRejectOpen(open)
    onPopoverOpenChange?.(open || isSnoozeOpen)
  }

  function handleSnoozeOpenChange(open: boolean) {
    setIsSnoozeOpen(open)
    onPopoverOpenChange?.(open || isRejectOpen)
  }

  return (
    <div
      data-lead-id={lead.id}
      data-focused={isFocused || undefined}
      role="article"
      aria-label={`${lead.company_name ?? 'Unknown Company'} — ICP score ${lead.icp_score ?? 'N/A'}`}
      tabIndex={0}
      onClick={() => onOpenDetail(lead.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDetail(lead.id)
      }}
      className={cn(
        'relative cursor-pointer rounded-xl border bg-card px-4 py-3 transition-all',
        'focus:outline-none',
        isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isLeaving && 'animate-out slide-out-to-right-4 fade-out duration-200 opacity-0 pointer-events-none',
        isProcessing && !isLeaving && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Pending-overlay spinner badge */}
      {isProcessing && !isLeaving && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border">
          <svg className="h-3 w-3 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Row 1: checkbox, ICP badge, company name, domain */}
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(lead.id, !!checked)}
            aria-label={`Select ${lead.company_name ?? 'lead'}`}
            className="size-4"
          />
        </div>
        <Badge className={cn('shrink-0 text-xs font-semibold px-2.5 py-1', icpBadgeClass(lead.icp_score ?? null))}>
          {lead.icp_score ?? '—'}
        </Badge>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="text-base font-semibold truncate">{lead.company_name ?? 'Unknown Company'}</span>
          {lead.canonical_domain && (
            <span className="text-xs text-muted-foreground truncate mt-0.5">{lead.canonical_domain}</span>
          )}
        </div>
      </div>

      {/* Row 2: contact name + title */}
      <div className="ml-7 mt-1 flex gap-2 text-sm">
        <span>{lead.contact_name ?? '—'}</span>
        {lead.contact_title && (
          <span className="text-xs text-muted-foreground truncate">{lead.contact_title}</span>
        )}
      </div>

      {/* Row 3: open roles + suggested angle (BD-01 / ROADMAP SC1) */}
      {(lead.open_roles_summary || lead.suggested_angle) && (
        <div className="ml-7 mt-1.5 flex flex-col gap-0.5">
          {lead.open_roles_summary && (
            <span className="text-xs text-muted-foreground">{lead.open_roles_summary}</span>
          )}
          {lead.suggested_angle && (
            <span className="line-clamp-1 text-xs italic text-muted-foreground/80">{lead.suggested_angle}</span>
          )}
        </div>
      )}

      {/* Row 4: updated date */}
      <div className="ml-7 mt-2 flex gap-4 text-xs text-muted-foreground">
        <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
      </div>

      {/* Action bar (stopPropagation to prevent card body click) */}
      <div className="mt-3 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" onClick={() => onApprove(lead.id)}>
          Approve Lead
        </Button>
        <RejectPopover
          leadId={lead.id}
          open={isRejectOpen}
          onOpenChange={handleRejectOpenChange}
          onReject={onReject}
          trigger={
            <Button size="sm" variant="outline" data-reject-trigger>
              Reject Lead
            </Button>
          }
        />
        <SnoozePopover
          leadId={lead.id}
          open={isSnoozeOpen}
          onOpenChange={handleSnoozeOpenChange}
          onSnooze={onSnooze}
          trigger={
            <Button size="sm" variant="ghost" aria-label="Snooze lead" data-snooze-trigger>
              <Clock className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
