'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { cn } from '@brynzit/ui/lib/utils'
import {
  candidateMemorySummary,
  candidateRelationshipQueryKeys,
  fetchCandidateRelationship,
  formatRelationshipDate,
  relationshipGuardForTarget,
  type CandidateRelationshipBundle,
} from '../_lib/candidate-relationship'
import { humanizeStatus, statusToneClass } from '../_lib/status-tone'
import { AlertTriangle, FileText, Mail, ShieldCheck } from 'lucide-react'

/** Uppercase eyebrow above a section (app/CLAUDE.md §3.7), with an optional
 * plain-language count beside it. */
function Eyebrow({ children, meta }: { children: React.ReactNode; meta?: string }) {
  return (
    <p className="flex items-baseline gap-2 text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
      {children}
      {meta ? <span className="normal-case text-muted-foreground">{meta}</span> : null}
    </p>
  )
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap',
        statusToneClass(status),
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {humanizeStatus(status)}
    </span>
  )
}

export function CandidateRelationshipSection({
  candidateId,
  clientId,
  requisitionId,
}: {
  candidateId: string | null
  clientId?: string | null
  requisitionId?: string | null
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: candidateRelationshipQueryKeys.bundle(candidateId),
    enabled: Boolean(candidateId),
    staleTime: 30 * 1000,
    queryFn: () => fetchCandidateRelationship(candidateId!),
  })

  if (!candidateId) return null

  return (
    <section className="flex flex-col gap-2.5">
      <Eyebrow>Relationship memory</Eyebrow>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : error || !data ? (
        <p className="text-sm text-muted-foreground">
          Relationship history is unavailable right now.
        </p>
      ) : (
        <RelationshipMemory bundle={data} clientId={clientId} requisitionId={requisitionId} />
      )}
    </section>
  )
}

function RelationshipMemory({
  bundle,
  clientId,
  requisitionId,
}: {
  bundle: CandidateRelationshipBundle
  clientId?: string | null
  requisitionId?: string | null
}) {
  const guard = relationshipGuardForTarget({ bundle, clientId, requisitionId })
  const memory = candidateMemorySummary(bundle)
  const recentTimeline = bundle.timeline.slice(0, 4)

  return (
    <div className="flex flex-col gap-5">
      {/* Contact guard */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4">
        {guard.level === 'clear' ? (
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#317A4F]" />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#905300]" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-foreground">{guard.title}</p>
            <StatusPill status={guard.level} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{guard.description}</p>
        </div>
      </div>

      {/* Key/value facts */}
      <div className="flex flex-col">
        <FactRow label="Relationship status">
          <StatusPill status={bundle.relationship.status} />
        </FactRow>
        <FactRow label="Contact preference">
          <span className="text-[13px] text-foreground">
            {bundle.relationship.contact_preference ?? 'Not set'}
          </span>
        </FactRow>
        <FactRow label="Next allowed contact" last>
          <span className="text-[13px] text-foreground">
            {formatRelationshipDate(bundle.relationship.next_allowed_contact_at)}
          </span>
        </FactRow>
      </div>

      {bundle.relationship.recruiter_notes && (
        <div className="rounded-xl border border-border p-4">
          <Eyebrow>Recruiter note</Eyebrow>
          <p className="mt-2 text-[13px] text-foreground">{bundle.relationship.recruiter_notes}</p>
        </div>
      )}

      {/* Submission history */}
      <div className="flex flex-col gap-2.5">
        <Eyebrow
          meta={
            memory.total > 0
              ? `${memory.total} submission${memory.total === 1 ? '' : 's'}`
              : undefined
          }
        >
          Submission history
        </Eyebrow>
        {bundle.submissions.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No prior submissions recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bundle.submissions.slice(0, 4).map((submission) => (
              <div
                key={submission.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-muted px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    {submission.client_name ?? 'Client'} · {submission.role_title ?? 'Role'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {submission.current_stage_name ?? humanizeStatus(submission.status)}
                    {submission.rejection_stage ? ` · rejected at ${submission.rejection_stage}` : ''}
                  </p>
                  {submission.rejection_reason && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {submission.rejection_reason}
                    </p>
                  )}
                  {/* Same underlying field as rejection_reason when this
                      submission was rejected — don't show the note twice. */}
                  {submission.recruiter_note && submission.recruiter_note !== submission.rejection_reason && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      “{submission.recruiter_note}”
                    </p>
                  )}
                </div>
                <StatusPill status={submission.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent timeline */}
      {recentTimeline.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Eyebrow>Recent timeline</Eyebrow>
          <div className="flex flex-col gap-3">
            {recentTimeline.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-muted-foreground">
                  {event.visibility === 'internal' ? (
                    <FileText className="size-4" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] font-medium text-foreground">{event.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#386CA0]" />
                    {event.body ? <span>{event.body} · </span> : null}
                    <span>{formatRelationshipDate(event.occurred_at)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FactRow({
  label,
  children,
  last = false,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        !last && 'border-b border-[#ECEAE4]',
      )}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
