'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useActingUser, useCan } from '@brynzit/identity'
import { definePipeline } from '@brynzit/pipeline'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent } from '@brynzit/ui/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchPipelineSubmissions,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
  type PipelineSubmission,
} from '../_lib/recruiter-data'
import {
  getHiringProcess,
  stageKindLabel,
  type HiringStage,
} from '../ops/requisitions/[id]/_lib/hiring-process'
import { toPipelineDefinition } from './_lib/pipeline-bridge'
import { AWAITING_REVIEW_STAGE_ID, groupSubmissionsByPipelineStage } from './_lib/group-submissions'
import { PipelineCandidateCard } from './_components/pipeline-candidate-card'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../_lib/assignments'

export default function CandidatePipelinePage() {
  const searchParams = useSearchParams()
  const actingUser = useActingUser()
  const can = useCan()
  // Plain recruiters only ever see their own assigned requisitions here —
  // enforced both in this picker and server-side via acting_user_id on the
  // shortlist fetch (backend FEATURE_SPEC.md Feature 6). Managers/admins with
  // role.view_all keep the unfiltered picker.
  const canViewAll = can('role.view_all')
  const [selectedReqId, setSelectedReqId] = useState('')
  const stageView = searchParams.get('stage') === 'rejected' ? 'rejected' : 'active'
  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const clients = clientsQuery.data ?? []
  const requisitionsQuery = useQuery({
    queryKey: recruiterQueryKeys.requisitions(clientIdsKey(clients)),
    queryFn: () => fetchRequisitionsForClients(clients),
    enabled: clientsQuery.isSuccess,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const assignedIdsQuery = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    enabled: !canViewAll,
    staleTime: 60_000,
  })
  const requisitions = useMemo(() => {
    const all = requisitionsQuery.data ?? []
    if (canViewAll) return all
    const assigned = new Set(assignedIdsQuery.data ?? [])
    return all.filter((requisition) => assigned.has(requisition.id))
  }, [requisitionsQuery.data, canViewAll, assignedIdsQuery.data])
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
    enabled: requisitionsQuery.isSuccess && Boolean(activeReq),
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
    clientsQuery.isLoading ||
    requisitionsQuery.isLoading ||
    submissionsQuery.isLoading ||
    (!canViewAll && assignedIdsQuery.isLoading)
  const hasError =
    clientsQuery.error ||
    requisitionsQuery.error ||
    submissionsQuery.error ||
    (!canViewAll && assignedIdsQuery.error)

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
        <p className="text-sm text-destructive">
          Couldn&apos;t load pipeline from requisition shortlists.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Candidate Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Columns come from the selected requisition&apos;s Ops-configured hiring process.
          </p>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" variant={stageView === 'active' ? 'default' : 'outline'}>
              <Link href="/pipeline">Active</Link>
            </Button>
            <Button asChild size="sm" variant={stageView === 'rejected' ? 'default' : 'outline'}>
              <Link href="/pipeline?stage=rejected">Rejected</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:min-w-[360px] md:flex-row">
          <Select value={activeReqId} onValueChange={setSelectedReqId} disabled={!requisitions.length}>
            <SelectTrigger>
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
              Configure
            </Link>
          </Button>
        </div>
      </div>

      {!activeReq ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No requisitions available</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Create a requisition in Ops before building a candidate pipeline.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/ops/requisitions">Go to Requisitions</Link>
          </Button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No shortlisted candidates yet</h2>
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
          <section className="rounded-xl border border-border/80 bg-white/85 p-3 shadow-sm shadow-slate-200/70">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Rejected</h2>
              <Badge variant="secondary">{rejectedSubmissions.length}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {rejectedSubmissions.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No rejected candidates</p>
              ) : (
                rejectedSubmissions.map((submission) => (
                  <CandidatePipelineCard key={submission.id} submission={submission} />
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <div
          className="grid min-w-[900px] flex-1 gap-4 overflow-x-auto"
          style={{
            gridTemplateColumns: `repeat(${1 + hiringProcess.stages.length}, minmax(220px, 1fr))`,
          }}
        >
          <section className="rounded-xl border border-border/80 bg-white/85 p-3 shadow-sm shadow-slate-200/70">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Awaiting Review</h2>
                <p className="text-[11px] text-muted-foreground">Screened, pending AM decision</p>
              </div>
              <Badge variant="secondary">{grouped[AWAITING_REVIEW_STAGE_ID].length}</Badge>
            </div>
            <div className="flex flex-col gap-3">
              {grouped[AWAITING_REVIEW_STAGE_ID].length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No candidates awaiting review</p>
              ) : (
                grouped[AWAITING_REVIEW_STAGE_ID].map((submission) => (
                  <CandidatePipelineCard key={submission.id} submission={submission} />
                ))
              )}
            </div>
          </section>

          {hiringProcess.stages.map((stage) => (
            <section key={stage.id} className="rounded-xl border border-border/80 bg-white/85 p-3 shadow-sm shadow-slate-200/70">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{stage.name}</h2>
                  <p className="text-[11px] text-muted-foreground">{stageKindLabel(stage.kind)}</p>
                </div>
                <Badge variant="secondary">{grouped[stage.id].length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[stage.id].length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No candidates</p>
                ) : (
                  grouped[stage.id].map((submission) =>
                    pipeline ? (
                      <PipelineCandidateCard
                        key={submission.id}
                        submission={submission}
                        pipeline={pipeline}
                        pipelineQueryKey={pipelineQueryKey}
                      />
                    ) : (
                      <CandidatePipelineCard key={submission.id} submission={submission} />
                    ),
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** Read-only card — Awaiting Review and Rejected columns, no pipeline actions. */
function CandidatePipelineCard({ submission }: { submission: PipelineSubmission }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">
              {submission.candidate_name ?? submission.candidate_id}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {submission.candidate_title ?? 'Candidate'} · {submission.requisition.title}
            </p>
          </div>
          <Badge variant="outline">{submission.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {submission.requisition.client?.name ?? 'Client'} · Match score{' '}
          {submission.match_score ?? 'not scored'}
        </p>
        <Button asChild className="mt-1 w-full" size="sm" variant="outline">
          <Link href={`/ops/requisitions/${submission.requisition.id}`}>Review Shortlist</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
