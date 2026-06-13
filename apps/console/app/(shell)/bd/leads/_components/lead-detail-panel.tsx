'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@brynzit/ui/components/ui/sheet'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { RejectPopover } from './reject-popover'
import { SnoozePopover } from './snooze-popover'

function icpBadgeClass(score: number | null) {
  if (score === null || score === undefined) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-primary text-primary-foreground'
  if (score >= 60) return 'bg-[oklch(0.769_0.188_85.87)] text-black'
  return 'bg-muted text-muted-foreground'
}

interface LeadDetailPanelProps {
  leadId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onSnooze: (id: string, dueAt: string) => void
}

export function LeadDetailPanel({
  leadId,
  isOpen,
  onOpenChange,
  onApprove,
  onReject,
  onSnooze,
}: LeadDetailPanelProps) {
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
        params: { path: { lead_id: leadId! } },
      })
      if (error) throw error
      return data
    },
    enabled: !!leadId && isOpen,
    staleTime: 30 * 1000,
  })

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[560px] max-w-[90vw] overflow-y-auto bg-card border-l border-border p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <>
              <Badge className={cn('text-xs font-semibold px-2.5 py-1', icpBadgeClass(data?.icp_score ?? null))}>
                {data?.icp_score ?? '—'}
              </Badge>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-semibold leading-tight">
                  {data?.contact.company_name ?? 'Unknown Company'}
                </SheetTitle>
                {data?.canonical_domain && (
                  <a
                    href={`https://${data.canonical_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {data.canonical_domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action bar */}
        {leadId && (
          <div className="flex items-center gap-2 border-b border-border px-6 py-3">
            <Button
              size="sm"
              onClick={() => {
                onApprove(leadId)
                onOpenChange(false)
              }}
            >
              Approve Lead
            </Button>
            <RejectPopover
              leadId={leadId}
              open={isRejectOpen}
              onOpenChange={setIsRejectOpen}
              onReject={(id, reason) => {
                onReject(id, reason)
                onOpenChange(false)
              }}
              trigger={<Button size="sm" variant="outline">Reject Lead</Button>}
            />
            <SnoozePopover
              leadId={leadId}
              open={isSnoozeOpen}
              onOpenChange={setIsSnoozeOpen}
              onSnooze={(id, dueAt) => {
                onSnooze(id, dueAt)
                onOpenChange(false)
              }}
              trigger={<Button size="sm" variant="outline">Snooze</Button>}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : data ? (
            <>
              {/* Contact section */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Contact</h3>
                <div className="flex flex-col gap-1 text-sm">
                  <span>{data.contact.name ?? '—'}</span>
                  <span className="text-muted-foreground">{data.contact.title ?? '—'}</span>
                  {data.contact.email && (
                    <a href={`mailto:${data.contact.email}`} className="text-primary hover:underline">
                      {data.contact.email}
                    </a>
                  )}
                  {data.contact.linkedin_url && (
                    <a
                      href={data.contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <Separator />
              {/* Company info */}
              {(data.contact.tech_stack || data.contact.funding_stage || data.contact.headcount) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Company</h3>
                  <div className="flex flex-col gap-1 text-sm">
                    {data.contact.funding_stage && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-28">Funding stage</span>
                        <span>{data.contact.funding_stage}</span>
                      </div>
                    )}
                    {data.contact.headcount && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-28">Headcount</span>
                        <span>{data.contact.headcount}</span>
                      </div>
                    )}
                    {data.contact.open_roles_summary && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-28">Open roles</span>
                        <span>{data.contact.open_roles_summary}</span>
                      </div>
                    )}
                    {data.contact.tech_stack && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-28">Tech stack</span>
                        <span>{data.contact.tech_stack}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* ICP breakdown */}
              {data.icp_breakdown && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">ICP Breakdown</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(data.icp_breakdown as Record<string, number>).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-semibold">{Math.round(Number(val) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
