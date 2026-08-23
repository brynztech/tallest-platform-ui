'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Send, ShieldAlert, Zap } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../../_lib/assignments'
import { requisitionStatusLabel } from '../../_lib/requisition-status'
import { CandidateProfileSheet } from '@/(shell)/_components/candidate-profile-sheet'
import { ResdexCriteria } from '@/(shell)/_components/resdex-criteria'
import { fetchJd } from '@/(shell)/ops/requisitions/[id]/_lib/jd'
import { JdPreview } from '@/(shell)/ops/requisitions/[id]/_components/jd-preview'
import { AssignedRecruitersCard } from './_components/assigned-recruiters-card'
import { ShortlistCandidateCard } from './_components/shortlist-candidate-card'
import {
  fetchRecruiterShortlist,
  patchSubmissionStatus,
  submitInterestedCandidates,
  triggerRecruiterMatch,
  updateCandidateCompensation,
  canSubmitApplications,
  MatchNotAssignedError,
  SubmissionConflictError,
  UnscreenedCandidatesError,
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
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

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

  const shortlistQueryKey = ['recruiter-shortlist', id, actingUser.id] as const
  const { data: shortlist, isLoading: shortlistLoading } = useQuery({
    queryKey: shortlistQueryKey,
    // Recruiters send their own id so the backend enforces assignment scoping
    // (403 if unassigned) — managers with role.view_all have no assignment
    // rows, so they use the unscoped legacy-caller convention.
    queryFn: () => fetchRecruiterShortlist(id, canViewAll ? undefined : actingUser.id),
    enabled,
    // Matching runs as an async background job — light polling keeps the
    // shortlist current without a manual refresh, matching the BD pipeline
    // kanban's existing 15s-poll precedent (bd/pipeline/page.tsx).
    refetchInterval: 15_000,
  })
  const submissions = shortlist?.submissions ?? []

  const { data: jd } = useQuery({
    queryKey: ['ops-requisition-jd', id],
    queryFn: () => fetchJd(id),
    enabled,
    staleTime: 5 * 60 * 1000,
  })

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

  // ---- Compensation (CTC/ECTC) ----
  const compensationMutation = useMutation({
    mutationFn: (vars: { candidateId: string; ctc: number | null; ectc: number | null }) =>
      // Same scoping convention as the shortlist fetch: managers with
      // role.view_all have no assignment rows, so they use the trusted
      // unscoped call; recruiters are checked server-side.
      updateCandidateCompensation(vars.candidateId, canViewAll ? undefined : actingUser.id, {
        ctc: vars.ctc,
        ectc: vars.ectc,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
      toast('Compensation updated.')
    },
    onError: () => {
      toast.error('Failed to update compensation — try again.')
    },
  })

  // ---- Submit Applications ----
  const submitMutation = useMutation({
    mutationFn: () => submitInterestedCandidates(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
      setSubmitDialogOpen(false)
      toast(
        data.submitted_count === 0
          ? 'Nothing new to submit — your Account Manager already has these candidates.'
          : `${data.submitted_count} candidate${data.submitted_count === 1 ? '' : 's'} submitted to your Account Manager.`,
      )
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: shortlistQueryKey })
      setSubmitDialogOpen(false)
      if (err instanceof UnscreenedCandidatesError) {
        toast.error('Screen every candidate before submitting.')
      } else {
        toast.error('Failed to submit candidates — try again.')
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
  const canSubmit = canSubmitApplications(submissions)
  const activeSubmissions = submissions.filter((s) => !s.submitted_at)
  const submittedSubmissions = submissions.filter((s) => s.submitted_at)
  // Why the Submit button is disabled — surfaced as a native title tooltip
  // (this app's existing disabled-button-explanation convention, see
  // pipeline-candidate-card.tsx).
  const lastSubmittedAt = submittedSubmissions
    .map((s) => s.submitted_at)
    .filter(Boolean)
    .sort()
    .at(-1)
  // "Already submitted" only when there is genuinely nothing actionable left;
  // if screened-out actives remain, the actionable truth is "mark one
  // Interested", even when a prior batch was already submitted.
  const submitDisabledReason = canSubmit
    ? undefined
    : submissions.some((s) => s.status === 'shortlisted')
      ? 'Screen every candidate before submitting.'
      : activeSubmissions.length === 0 && submittedSubmissions.length > 0
        ? `Already submitted on ${new Date(lastSubmittedAt as string).toLocaleDateString()}.`
        : 'Mark at least one candidate Interested first.'

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
          {requisitionStatusLabel(req.status)}
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

      {jd ? (
        <div className="mb-6 space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <JdPreview jd={jd} />
          </div>
          <ResdexCriteria criteria={jd.resdex_search_criteria} />
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          No generated job description on this role yet.
        </p>
      )}

      {/* Assignment logically precedes running a search — placed above Run Match. */}
      <AssignedRecruitersCard reqId={id} />

      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          disabled={!canMatch || matchMutation.isPending}
          onClick={() => matchMutation.mutate()}
        >
          <Zap className="mr-1 size-4" />
          {matchMutation.isPending ? 'Starting match…' : 'Run Match'}
        </Button>

        {/* Visually distinct from Run Match — this is a final, deliberate
            action (notifies the Account Manager), so it gets its own solid
            success-green treatment plus a confirm step rather than firing
            on a single click. */}
        {/* Disabled buttons swallow pointer events, so the explanatory title
            lives on a wrapper span — the tooltip still shows on hover. */}
        <span title={submitDisabledReason}>
          <Button
            size="sm"
            className="bg-[oklch(0.45_0.15_145)] text-white hover:bg-[oklch(0.45_0.15_145)]/90"
            disabled={!canSubmit}
            onClick={() => setSubmitDialogOpen(true)}
          >
            <Send className="mr-1 size-4" />
            Submit Applications
          </Button>
        </span>
      </div>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit candidates to your Account Manager?</DialogTitle>
            <DialogDescription>
              Every candidate marked Interested that hasn&apos;t already been submitted
              will be sent for final review. You won&apos;t be able to un-submit from here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[oklch(0.45_0.15_145)] text-white hover:bg-[oklch(0.45_0.15_145)]/90"
              disabled={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <h2 className="mb-2 text-base font-semibold">Shortlist</h2>
      {activeSubmissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Candidates appear here when matching finishes. Search starts when the
          role is published; use Run Match to search again.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {activeSubmissions.map((submission) => (
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
              onSaveCompensation={(ctc, ectc) =>
                submission.candidate_id &&
                compensationMutation.mutate({ candidateId: submission.candidate_id, ctc, ectc })
              }
            />
          ))}
        </div>
      )}

      {submittedSubmissions.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-base font-semibold">Submission History</h2>
          <div className="flex flex-col gap-3">
            {submittedSubmissions.map((submission) => (
              <ShortlistCandidateCard
                key={submission.id}
                submission={submission}
                isPending={false}
                readOnly
                onViewProfile={() => openProfile(submission.candidate_id, submission.id)}
                onAction={() => {}}
                onSnooze={() => {}}
              />
            ))}
          </div>
        </>
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
