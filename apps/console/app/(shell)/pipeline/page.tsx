'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useActingUser, useCan } from '@brynzit/identity'
import { definePipeline } from '@brynzit/pipeline'
import { cn } from '@brynzit/ui/lib/utils'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card } from '@brynzit/ui/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { ChevronRight, Workflow } from 'lucide-react'
import {
  fetchOpsClients,
  fetchPipelineSubmissions,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
  type PipelineSubmission,
} from '../_lib/recruiter-data'
import { useScopedRequisitions } from '../_lib/use-scoped-requisitions'
import { getHiringProcess, type HiringStage } from '../ops/requisitions/[id]/_lib/hiring-process'
import { toPipelineDefinition } from './_lib/pipeline-bridge'
import { AWAITING_REVIEW_STAGE_ID, groupSubmissionsByPipelineStage } from './_lib/group-submissions'
import { CandidateProfileSheet } from '../_components/candidate-profile-sheet'
import { PipelineCandidateCard } from './_components/pipeline-candidate-card'
import { PipelineCardHead } from './_components/pipeline-card-head'
import { SubmissionNotesPopover } from './_components/submission-notes-popover'

const KANBAN_WASH = 'linear-gradient(180deg, #F6F3F4 0%, #E9F0FA 100%)'

export default function CandidatePipelinePage() {
  const searchParams = useSearchParams()
  const actingUser = useActingUser()
  const can = useCan()
  // Plain recruiters only ever see their own assigned requisitions here —
  // enforced both in this picker and server-side via acting_user_id on the
  // shortlist fetch (backend FEATURE_SPEC.md Feature 6). Managers/admins with
  // role.view_all keep the unfiltered picker.
  const canViewAll = can('role.view_all')
  // Read vs write on the board itself: recruiters watch their candidates move
  // (and are notified on every change); the Account Manager who owns the role
  // does the advancing, annotating, and removing.
  const canAdvance = can('pipeline.advance')
  const [selectedReqId, setSelectedReqId] = useState('')
  // One panel for the whole board, opened by any card's name. Same component
  // supply search / my-roles / ops requisitions use, so a candidate reads the
  // same wherever you meet them.
  const [openProfile, setOpenProfile] = useState<PipelineSubmission | null>(null)
  const stageView = searchParams.get('stage') === 'rejected' ? 'rejected' : 'active'
  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const clients = clientsQuery.data ?? []
  const {
    requisitions,
    isLoading: requisitionsLoading,
    error: requisitionsError,
  } = useScopedRequisitions(clients, clientsQuery.isSuccess)
  const activeReqId = selectedReqId || requisitions[0]?.id || ''
  const activeReq = requisitions.find((requisition) => requisition.id === activeReqId) ?? null
  const hiringProcess = activeReq ? getHiringProcess(activeReq) : { stages: [] as HiringStage[] }
  // Keyed by acting user too: the scoped (recruiter) and unscoped (manager)
  // responses differ, and identities are switchable at runtime — a shared key
  // would serve one persona's cached rows to the other within staleTime.
  const pipelineQueryKey = recruiterQueryKeys.pipeline(`${activeReqId}:${actingUser.id}`)
  const submissionsQuery = useQuery({
    queryKey: pipelineQueryKey,
    queryFn: () =>
      fetchPipelineSubmissions(
        activeReq ? [activeReq] : [],
        canViewAll ? undefined : actingUser.id,
      ),
    enabled: Boolean(activeReq),
    staleTime: RECRUITER_STALE_TIME_MS,
    // staleTime alone only affects refetch-on-remount/refocus — a candidate's
    // stage can change from another screen (e.g. an AM approving on the Ops
    // requisition page) while this page stays open, with nothing to pick
    // that up. Poll at the same 15s cadence as the BD pipeline kanban and the
    // recruiter shortlist page for this reason.
    refetchInterval: 15_000,
  })

  const submissions = submissionsQuery.data ?? []
  const grouped = useMemo(
    () => groupSubmissionsByPipelineStage(submissions, hiringProcess.stages),
    [submissions, hiringProcess.stages],
  )
  const rejectedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === 'rejected'),
    [submissions],
  )
  // Validated pipeline for the "Advance to {next stage}" button's display-only
  // computation (see _lib/pipeline-bridge.ts) — only buildable once a
  // requisition with configured stages is selected.
  const pipeline = useMemo(() => {
    if (!activeReqId || hiringProcess.stages.length === 0) return null
    return definePipeline(toPipelineDefinition(activeReqId, hiringProcess.stages))
  }, [activeReqId, hiringProcess.stages])
  const isLoading =
    clientsQuery.isLoading || requisitionsLoading || submissionsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsError || submissionsQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading candidate pipeline...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#BA4642]">
          Couldn&apos;t load pipeline from requisition shortlists.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Candidate Pipeline</h1>
            {/* Say why the actions are absent — a board with no buttons and no
                explanation reads as broken rather than as read-only. */}
            <Badge variant="secondary" className="text-xs">
              {canAdvance ? 'Can edit' : 'View only'}
            </Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {canAdvance
              ? "Columns come from the selected requisition's Ops-configured hiring process."
              : 'Track your submitted candidates as they move. Your Account Manager advances stages and adds notes — you’re notified on every change.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit gap-0.5 rounded-[10px] border border-border bg-card p-1">
            <Link
              href="/pipeline"
              aria-current={stageView === 'active' ? 'page' : undefined}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
                stageView === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              Active
            </Link>
            <Link
              href="/pipeline?stage=rejected"
              aria-current={stageView === 'rejected' ? 'page' : undefined}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
                stageView === 'rejected'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              Rejected
            </Link>
          </div>
          <div className="flex-1" />
          <Select value={activeReqId} onValueChange={setSelectedReqId} disabled={!requisitions.length}>
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Select requisition" />
            </SelectTrigger>
            <SelectContent>
              {requisitions.map((requisition) => (
                <SelectItem key={requisition.id} value={requisition.id}>
                  {requisition.client?.name ?? 'Client'} — {requisition.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild size="sm" variant="outline">
            <Link href={activeReq ? `/ops/requisitions/${activeReq.id}` : '/ops/requisitions'}>
              <Workflow className="size-4" />
              Configure
            </Link>
          </Button>
        </div>
      </div>

      {!activeReq ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-base font-semibold text-foreground">No requisitions available</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Create a requisition in Ops before building a candidate pipeline.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/ops/requisitions">Go to Requisitions</Link>
          </Button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-base font-semibold text-foreground">No shortlisted candidates yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Trigger matching or add candidates on this requisition. The board will use this role&apos;s
            configured hiring process as soon as submissions exist.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href={`/ops/requisitions/${activeReq.id}`}>Open Requisition</Link>
          </Button>
        </div>
      ) : stageView === 'rejected' ? (
        <div className="grid max-w-sm flex-1">
          <section className="rounded-xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Rejected</h2>
              <Badge variant="secondary">{rejectedSubmissions.length}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {rejectedSubmissions.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No rejected candidates</p>
              ) : (
                rejectedSubmissions.map((submission) => (
                  <CandidatePipelineCard
                    key={submission.id}
                    submission={submission}
                    onOpenProfile={setOpenProfile}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-x-auto pb-2">
          <section className="flex w-[232px] shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
                Awaiting Review
              </h2>
              <Badge variant="secondary">{grouped[AWAITING_REVIEW_STAGE_ID].length}</Badge>
            </div>
            <div
              className="flex min-h-[180px] flex-1 flex-col gap-2.5 rounded-[10px] border border-[#ECEAE4] p-2.5"
              style={{ background: KANBAN_WASH }}
            >
              {grouped[AWAITING_REVIEW_STAGE_ID].length === 0 ? (
                <p className="pt-7 text-center text-base text-[#908E8B]">No candidates</p>
              ) : (
                grouped[AWAITING_REVIEW_STAGE_ID].map((submission) => (
                  <CandidatePipelineCard
                    key={submission.id}
                    submission={submission}
                    onOpenProfile={setOpenProfile}
                  />
                ))
              )}
            </div>
          </section>

          {hiringProcess.stages.map((stage) => (
            <section key={stage.id} className="flex w-[232px] shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
                  {stage.name}
                </h2>
                <Badge variant="secondary">{grouped[stage.id].length}</Badge>
              </div>
              <div
                className="flex min-h-[180px] flex-1 flex-col gap-2.5 rounded-[10px] border border-[#ECEAE4] p-2.5"
                style={{ background: KANBAN_WASH }}
              >
                {grouped[stage.id].length === 0 ? (
                  <p className="pt-7 text-center text-base text-[#908E8B]">No candidates</p>
                ) : (
                  grouped[stage.id].map((submission) =>
                    pipeline && canAdvance ? (
                      <PipelineCandidateCard
                        key={submission.id}
                        submission={submission}
                        pipeline={pipeline}
                        pipelineQueryKey={pipelineQueryKey}
                        onOpenProfile={setOpenProfile}
                      />
                    ) : (
                      <CandidatePipelineCard
                        key={submission.id}
                        submission={submission}
                        onOpenProfile={setOpenProfile}
                      />
                    ),
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <CandidateProfileSheet
        candidateId={openProfile?.candidate_id ?? null}
        submissionId={openProfile?.id ?? null}
        requisitionId={activeReqId}
        isOpen={openProfile !== null}
        onOpenChange={(open) => {
          if (!open) setOpenProfile(null)
        }}
        source="pipeline"
      />
    </div>
  )
}

/**
 * Read-only card — the whole board for users without `pipeline.advance`, and
 * the Awaiting Review / Rejected columns for everyone. Notes stay readable
 * (following the conversation on your own candidates is the point of the
 * screen); no stage, note, or removal actions.
 */
function CandidatePipelineCard({
  submission,
  onOpenProfile,
}: {
  submission: PipelineSubmission
  onOpenProfile: (submission: PipelineSubmission) => void
}) {
  const can = useCan()
  // "Review Shortlist" opens the Ops requisition page, which is gated on
  // internal_ops.view — offering it to a recruiter just dead-ends them in the
  // Access Restricted panel, so only show it to users who can actually open it.
  const canOpenShortlist = can('internal_ops.view')
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-[0_1px_2px_rgba(22,18,12,0.04)]">
      <PipelineCardHead submission={submission} onOpenProfile={onOpenProfile} />
      <div className="flex items-center gap-2 border-t border-dashed border-border px-4 pt-3 pb-4">
        <SubmissionNotesPopover submissionId={submission.id} readOnly />
        {canOpenShortlist ? (
          <Button asChild size="sm" variant="ghost" className="min-w-0">
            <Link href={`/ops/requisitions/${submission.requisition.id}`}>
              <span className="truncate">Review Shortlist</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
