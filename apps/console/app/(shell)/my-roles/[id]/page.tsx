'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import { ShieldAlert, Zap } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../../_lib/assignments'
import { CandidateProfileSheet } from '@/(shell)/_components/candidate-profile-sheet'
import { AssignedRecruitersCard } from './_components/assigned-recruiters-card'
import { ShortlistCandidateCard } from './_components/shortlist-candidate-card'
import {
  fetchRecruiterShortlist,
  patchSubmissionStatus,
  triggerRecruiterMatch,
  MatchNotAssignedError,
  SubmissionConflictError,
  type SubmissionStatus,
} from './_lib/shortlist'

// Requisition statuses that can still be (re-)matched — mirrors
// ops/requisitions/[id]/_lib/match-status.ts's canTriggerCandidateMatch;
// duplicated as a one-liner rather than importing across a sibling route's
// private _lib (App Router route-segment folders are conventionally private
// to their own segment).
const MATCHABLE_STATUSES = new Set(['open', 'matching_complete'])

export default function MyRoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const actingUser = useActingUser()
  const can = useCan()
  const canViewAll = can('role.view_all')
  const canViewOps = can('internal_ops.view')
  const queryClient = useQueryClient()

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [isCandidatePanelOpen, setIsCandidatePanelOpen] = useState(false)

  // ---- Assignment-scoped access check ----
  const { data: assignedIds = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    enabled: !canViewAll,
    staleTime: 60_000,
  })
  const assignmentsResolved = canViewAll || !assignmentsLoading
  const hasAccess = canViewAll || assignedIds.includes(id)

  // ---- Requisition + shortlist (only fetched once access is resolved) ----
  const enabled = assignmentsResolved && hasAccess

  const {
    data: req,
    isLoading: reqLoading,
    error: reqError,
  } = useQuery({
    queryKey: ['ops-requisition', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/requisitions/{req_id}', {
        params: { path: { req_id: id } },
      })
      if (error) throw error
      return data
    },
    enabled,
  })

  const { data: clientsData } = useQuery({
    queryKey: ['ops-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients', {})
      if (error) throw error
      return data
    },
    staleTime: 60_000,
    enabled: enabled && !!req?.client_id,
  })

  const shortlistQueryKey = ['recruiter-shortlist', id] as const
  const { data: shortlist, isLoading: shortlistLoading } = useQuery({
    queryKey: shortlistQueryKey,
    queryFn: () => fetchRecruiterShortlist(id),
    enabled,
    // Matching runs as an async background job — light polling keeps the
    // shortlist current without a manual refresh, matching the BD pipeline
    // kanban's existing 15s-poll precedent (bd/pipeline/page.tsx).
    refetchInterval: 15_000,
  })
  const submissions = shortlist?.submissions ?? []

  // ---- Run Match ----
  const matchMutation = useMutation({
    mutationFn: () => triggerRecruiterMatch(id, actingUser.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
      toast('Match started — shortlist will update shortly.')
    },
    onError: (err) => {
      if (err instanceof MatchNotAssignedError) {
        toast.error("You're not assigned to this role.")
      } else {
        toast.error('Failed to start match — try again.')
      }
    },
  })

  // ---- Categorize / snooze ----
  const actionMutation = useMutation({
    mutationFn: (vars: { submissionId: string; status: SubmissionStatus; notes?: string; snoozedUntil?: string }) =>
      patchSubmissionStatus(vars.submissionId, {
        status: vars.status,
        notes: vars.notes,
        snoozed_until: vars.snoozedUntil,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
    },
    onError: (err) => {
      if (err instanceof SubmissionConflictError) {
        toast.error('This candidate has already been decided and can no longer be edited.')
        queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
      } else {
        toast.error('Failed to update candidate — try again.')
      }
    },
  })

  function openProfile(candidateId: string | null, submissionId: string) {
    setSelectedCandidateId(candidateId)
    setSelectedSubmissionId(submissionId)
    setIsCandidatePanelOpen(true)
  }

  // ---- Render: assignment-scoped access gate ----
  if (!assignmentsResolved) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">This role isn&apos;t assigned to you</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only recruiters assigned to this requisition (or managers with full visibility) can
            open it. An account manager assigns roles on the Ops side.
          </p>
          <Link
            href="/my-roles"
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium shadow-sm shadow-slate-200/60 transition-colors duration-150 ease-out hover:bg-muted"
          >
            Back to My Roles
          </Link>
        </div>
      </div>
    )
  }

  if (reqLoading || shortlistLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (reqError || !req) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Requisition not found.</p>
      </div>
    )
  }

  const clientName = clientsData?.find((c) => c.id === req.client_id)?.name ?? req.client_id ?? 'Unknown client'
  const canMatch = MATCHABLE_STATUSES.has(req.status)
  const skills = (req.skills as string[] | null) ?? []

  return (
    <div className="overflow-y-auto px-6 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{req.title}</h1>
          {canViewOps ? (
            <Link href={`/ops/clients/${req.client_id}`} className="text-sm text-primary">
              {clientName}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{clientName}</p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {req.status}
        </Badge>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        {req.seniority && <Badge variant="outline">{req.seniority}</Badge>}
        {skills.slice(0, 8).map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>

      {/* Assignment logically precedes running a search — placed above Run Match. */}
      <AssignedRecruitersCard reqId={id} />

      <Button
        variant="default"
        size="sm"
        className="mb-6"
        disabled={!canMatch || matchMutation.isPending}
        onClick={() => matchMutation.mutate()}
      >
        <Zap className="mr-1 size-4" />
        {matchMutation.isPending ? 'Starting match…' : 'Run Match'}
      </Button>

      <h2 className="mb-2 text-base font-semibold">Shortlist</h2>
      {submissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No candidates yet. Run a match above to populate this list.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((submission) => (
            <ShortlistCandidateCard
              key={submission.id}
              submission={submission}
              isPending={actionMutation.isPending && actionMutation.variables?.submissionId === submission.id}
              onViewProfile={() => openProfile(submission.candidate_id, submission.id)}
              onAction={(status, notes) =>
                actionMutation.mutate({ submissionId: submission.id, status, notes })
              }
              onSnooze={(snoozedUntil) =>
                actionMutation.mutate({
                  submissionId: submission.id,
                  status: 'snoozed',
                  snoozedUntil,
                })
              }
            />
          ))}
        </div>
      )}

      <CandidateProfileSheet
        candidateId={selectedCandidateId}
        submissionId={selectedSubmissionId}
        isOpen={isCandidatePanelOpen}
        onOpenChange={setIsCandidatePanelOpen}
        source="shortlist"
        requisitionId={id}
      />
    </div>
  )
}
