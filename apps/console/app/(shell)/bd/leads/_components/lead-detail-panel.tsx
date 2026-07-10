'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@brynzit/ui/components/ui/sheet'
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

type IcpSignalBreakdown = {
  score?: unknown
  weight?: unknown
  source?: unknown
  delta?: unknown
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
        className="w-[560px] max-w-[92vw] overflow-y-auto border-l border-border/70 bg-[oklch(0.17_0.014_62)] p-0 shadow-2xl shadow-black/35 sm:max-w-[560px]"
      >
        {isLoading && <SheetTitle className="sr-only">Lead detail</SheetTitle>}
        <SheetDescription className="sr-only">
          Full lead details including ICP breakdown, contact information, and actions.
        </SheetDescription>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border/60 bg-card/92 px-6 py-5 backdrop-blur-xl">
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex items-start gap-3">
              <Badge className={cn('shrink-0 px-2.5 py-1 text-xs font-semibold', icpBadgeClass(data?.icp_score ?? null))}>
                {data?.icp_score ?? '—'}
              </Badge>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-2xl font-semibold leading-tight tracking-[-0.045em]">
                  {data?.contact.company_name ?? 'Unknown Company'}
                </SheetTitle>
                {data?.canonical_domain && (
                  <a
                    href={`https://${data.canonical_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {data.canonical_domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        {leadId && (
          <div className="flex items-center gap-2 border-b border-border/60 bg-background/25 px-6 py-3">
            <Button
              size="sm"
              className="rounded-full px-3 shadow-sm shadow-primary/15"
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
              trigger={<Button size="sm" variant="outline" className="rounded-full bg-background/30 px-3">Reject Lead</Button>}
            />
            <SnoozePopover
              leadId={leadId}
              open={isSnoozeOpen}
              onOpenChange={setIsSnoozeOpen}
              onSnooze={(id, dueAt) => {
                onSnooze(id, dueAt)
                onOpenChange(false)
              }}
              trigger={<Button size="sm" variant="outline" className="rounded-full bg-background/30 px-3">Snooze</Button>}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : data ? (
            <>
              {/* Contact section */}
              <div className="rounded-[1.25rem] border border-border/55 bg-background/28 p-4 shadow-sm shadow-black/10">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Contact
                </h3>
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">{data.contact.name ?? '—'}</span>
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
              {/* Company info */}
              {(data.contact.tech_stack || data.contact.funding_stage || data.contact.headcount) && (
                <div className="rounded-[1.25rem] border border-border/55 bg-background/28 p-4 shadow-sm shadow-black/10">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Company
                  </h3>
                  <div className="flex flex-col gap-2 text-sm">
                    {data.contact.funding_stage && (
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-28">Funding stage</span>
                        <span className="font-medium">{data.contact.funding_stage}</span>
                      </div>
                    )}
                    {data.contact.headcount && (
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-28">Headcount</span>
                        <span className="font-medium">{data.contact.headcount}</span>
                      </div>
                    )}
                    {data.contact.open_roles_summary && (
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-28">Open roles</span>
                        <span className="font-medium">{data.contact.open_roles_summary}</span>
                      </div>
                    )}
                    {data.contact.tech_stack && (
                      <div className="flex gap-3">
                        <span className="text-muted-foreground w-28">Tech stack</span>
                        <span className="font-medium">{data.contact.tech_stack}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* ICP breakdown */}
              {data.icp_breakdown && (
                <>
                  <Separator className="bg-border/60" />
                  <div className="rounded-[1.25rem] border border-border/55 bg-background/28 p-4 shadow-sm shadow-black/10">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      ICP Breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(data.icp_breakdown as Record<string, IcpSignalBreakdown>).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-right font-semibold">
                            {formatIcpBreakdownValue(val)}
                          </span>
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

function formatIcpBreakdownValue(value: IcpSignalBreakdown) {
  const delta = toNumber(value?.delta)
  if (delta !== null) return `${delta > 0 ? '+' : ''}${delta} pts`

  const score = toNumber(value?.score)
  if (score === null) return '—'

  const weight = toNumber(value?.weight)
  if (weight === null) return `${Math.round(score)}%`

  return `${Math.round(score)}% · ${(score * weight).toFixed(1)} pts`
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
