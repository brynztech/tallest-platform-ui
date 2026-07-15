'use client'

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Separator } from '@brynzit/ui/components/ui/separator'
import {
  candidateMemorySummary,
  candidateRelationshipQueryKeys,
  fetchCandidateRelationship,
  formatRelationshipDate,
  relationshipGuardForTarget,
  type CandidateRelationshipBundle,
} from '../_lib/candidate-relationship'
import { AlertTriangle, History, ShieldCheck } from 'lucide-react'

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
    <>
      <Separator />
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          RELATIONSHIP MEMORY
        </p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error || !data ? (
          <p className="text-sm text-muted-foreground">
            Relationship history is unavailable right now.
          </p>
        ) : (
          <RelationshipMemory bundle={data} clientId={clientId} requisitionId={requisitionId} />
        )}
      </section>
    </>
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
    <div className="flex flex-col gap-4">
      {memory.total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{memory.total} submissions</Badge>
          {memory.active > 0 && <Badge variant="secondary">{memory.active} active</Badge>}
          {memory.rejected > 0 && <Badge variant="outline">{memory.rejected} rejected</Badge>}
          {memory.placed > 0 && (
            <Badge className="bg-[oklch(0.45_0.15_145)] text-white">{memory.placed} placed</Badge>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          {guard.level === 'clear' ? (
            <ShieldCheck className="mt-0.5 size-4 text-[oklch(0.45_0.15_145)]" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 text-amber-600" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{guard.title}</p>
              <Badge variant={guard.level === 'block' ? 'destructive' : guard.level === 'warn' ? 'secondary' : 'outline'}>
                {guard.level}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{guard.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Relationship status</span>
          <Badge variant={bundle.relationship.status === 'do_not_contact' ? 'destructive' : 'secondary'}>
            {bundle.relationship.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Contact preference</span>
          <span className="text-right">{bundle.relationship.contact_preference ?? 'Not set'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Next allowed contact</span>
          <span className="text-right">
            {formatRelationshipDate(bundle.relationship.next_allowed_contact_at)}
          </span>
        </div>
      </div>

      {bundle.relationship.recruiter_notes && (
        <div className="rounded-lg border bg-background p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Recruiter note</p>
          <p className="text-sm">{bundle.relationship.recruiter_notes}</p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Submission history</p>
        </div>
        {bundle.submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prior submissions recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bundle.submissions.slice(0, 4).map((submission) => (
              <div key={submission.id} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {submission.client_name ?? 'Client'} · {submission.role_title ?? 'Role'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {submission.current_stage_name ?? submission.status}
                      {submission.rejection_stage ? ` · rejected at ${submission.rejection_stage}` : ''}
                    </p>
                  </div>
                  <Badge variant={submission.status === 'rejected' ? 'outline' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </div>
                {submission.rejection_reason && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {submission.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {recentTimeline.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Recent timeline</p>
          <div className="flex flex-col gap-2">
            {recentTimeline.map((event) => (
              <div key={event.id} className="rounded-lg bg-muted/20 p-3">
                <p className="text-sm font-medium">{event.title}</p>
                {event.body && <p className="mt-1 text-xs text-muted-foreground">{event.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatRelationshipDate(event.occurred_at)} · {event.visibility}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
