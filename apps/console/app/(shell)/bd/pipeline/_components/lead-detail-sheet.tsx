'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@brynzit/ui/components/ui/sheet'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { cn } from '@brynzit/ui/lib/utils'
import { toast } from 'sonner'
import {
  Building2,
  Globe,
  Mail,
  Link,
  Users,
  Briefcase,
  Layers,
  TrendingUp,
  Clock,
  AlertTriangle,
  ExternalLink,
  X,
  ChevronRight,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  discovered: 'Discovered',
  icp_scored: 'ICP Scored',
  review_queue: 'In Review',
  outreach_approved: 'Outreach Approved',
  outreach_generation: 'Generating Outreach',
  outreach_review: 'Outreach Review',
  outreach_sent: 'Outreach Sent',
  interested: 'Replied',
  converted: 'Converted',
  failed: 'Failed',
  suppressed: 'Suppressed',
}

function icpColor(score: number | null) {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score >= 80) return 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
  if (score >= 60) return 'bg-[oklch(0.76_0.16_82)] text-black'
  return 'bg-muted text-muted-foreground'
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  href?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate text-sm font-medium text-primary hover:underline"
          >
            {value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="truncate text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  )
}

function IcpBreakdownRow({ label, value }: { label: string; value: unknown }) {
  const display =
    typeof value === 'number'
      ? value.toString()
      : typeof value === 'boolean'
        ? value ? 'Yes' : 'No'
        : String(value ?? '—')
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs capitalize text-muted-foreground">
        {label.replace(/_/g, ' ')}
      </span>
      <span className="text-xs font-medium">{display}</span>
    </div>
  )
}

interface LeadDetailSheetProps {
  leadId: string | null
  onClose: () => void
  onRejectSuccess: () => void
}

export function LeadDetailSheet({ leadId, onClose, onRejectSuccess }: LeadDetailSheetProps) {
  const queryClient = useQueryClient()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) return null
      const { data, error } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
        params: { path: { lead_id: leadId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!leadId,
  })

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
          lead_ids: [leadId!],
          rejection_reason: selectedReason,
        },
      }),
    onSuccess: (response) => {
      if (response.data?.failed) {
        toast.error('Rejection failed.')
      } else {
        toast.success('Lead rejected and suppressed.')
        queryClient.invalidateQueries({ queryKey: ['pipeline'] })
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        onRejectSuccess()
        onClose()
      }
    },
    onError: () => {
      toast.error('Rejection failed — please try again.')
    },
  })

  const open = !!leadId

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5">
          <div className="min-w-0 flex-1">
            <SheetTitle
              className={cn(
                'truncate text-base font-semibold leading-tight',
                (isLoading || !lead) && 'sr-only',
              )}
            >
              {lead?.contact?.company_name ?? lead?.canonical_domain ?? 'Lead details'}
            </SheetTitle>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <SheetDescription className="mt-0.5 flex items-center gap-2">
                  {lead?.canonical_domain && (
                    <a
                      href={`https://${lead.canonical_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="h-3 w-3" />
                      {lead.canonical_domain}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </SheetDescription>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isLoading && lead && (
              <Badge className={cn('px-2.5 py-1 text-sm font-semibold tabular-nums', icpColor(lead.icp_score))}>
                {lead.icp_score ?? '—'}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : lead ? (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-md text-xs">
                  {STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
                {lead.enrichment_status && (
                  <Badge variant="outline" className="rounded-md text-xs text-muted-foreground">
                    Enrichment: {lead.enrichment_status}
                  </Badge>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </p>
                <div className="space-y-2.5">
                  <DetailRow icon={Building2} label="Name" value={lead.contact?.name} />
                  <DetailRow icon={Briefcase} label="Title" value={lead.contact?.title} />
                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={lead.contact?.email}
                    href={lead.contact?.email ? `mailto:${lead.contact.email}` : undefined}
                  />
                  <DetailRow
                    icon={Link}
                    label="LinkedIn"
                    value={lead.contact?.linkedin_url}
                    href={lead.contact?.linkedin_url ?? undefined}
                  />
                </div>
              </div>

              <Separator className="opacity-60" />

              {/* Company */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </p>
                <div className="space-y-2.5">
                  <DetailRow icon={Users} label="Headcount" value={lead.contact?.headcount?.toString()} />
                  <DetailRow icon={TrendingUp} label="Funding Stage" value={lead.contact?.funding_stage} />
                  <DetailRow icon={Layers} label="Tech Stack" value={lead.contact?.tech_stack} />
                  {lead.contact?.open_roles_summary && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Open Roles</p>
                        <p className="text-sm">{lead.contact.open_roles_summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ICP Breakdown */}
              {lead.icp_breakdown && Object.keys(lead.icp_breakdown).length > 0 && (
                <>
                  <Separator className="opacity-60" />
                  <div className="space-y-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      ICP Breakdown
                    </p>
                    {Object.entries(lead.icp_breakdown).map(([k, v]) => (
                      <IcpBreakdownRow key={k} label={k} value={v} />
                    ))}
                  </div>
                </>
              )}

              {/* Active Sequence */}
              {lead.active_sequence && (
                <>
                  <Separator className="opacity-60" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active Outreach
                    </p>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">
                          {lead.active_sequence.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {lead.active_sequence.outreach_angle && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Angle: {lead.active_sequence.outreach_angle}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Meta */}
              <Separator className="opacity-60" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Added {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {lead.rejection_reason && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Rejection reason: {lead.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Reject footer */}
        {lead && lead.status !== 'suppressed' && (
          <div className="border-t border-border/60 px-6 py-4">
            {showRejectForm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Reject this lead?</p>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(reasons?.reasons ?? []).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={!selectedReason || rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate()}
                  >
                    {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRejectForm(false)
                      setSelectedReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setShowRejectForm(true)}
              >
                <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                Reject & Suppress Lead
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
