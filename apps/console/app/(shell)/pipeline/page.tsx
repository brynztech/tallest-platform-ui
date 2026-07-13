'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchPipelineSubmissions,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
  requisitionIdsKey,
  type PipelineSubmission,
} from '../_lib/recruiter-data'

const pipelineStages = [
  { id: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted'] },
  { id: 'approved', label: 'Approved', statuses: ['approved'] },
  { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
  { id: 'other', label: 'Other', statuses: [] },
] as const

export default function CandidatePipelinePage() {
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
  const requisitions = requisitionsQuery.data ?? []
  const submissionsQuery = useQuery({
    queryKey: recruiterQueryKeys.pipeline(requisitionIdsKey(requisitions)),
    queryFn: () => fetchPipelineSubmissions(requisitions),
    enabled: requisitionsQuery.isSuccess && requisitions.length > 0,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const submissions = submissionsQuery.data ?? []
  const grouped = useMemo(() => groupSubmissions(submissions), [submissions])
  const isLoading =
    clientsQuery.isLoading || requisitionsQuery.isLoading || submissionsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error || submissionsQuery.error

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
            Aggregated from existing Supply shortlists across Ops requisitions.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/ops/requisitions">Open Requisitions</Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No shortlisted candidates yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Trigger matching from a requisition or add candidates to a shortlist. Once the Supply
            shortlist endpoint returns submissions, they appear here automatically.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/ops/requisitions">Go to Requisitions</Link>
          </Button>
        </div>
      ) : (
        <div className="grid min-w-[900px] flex-1 grid-cols-4 gap-4 overflow-x-auto">
          {pipelineStages.map((stage) => (
            <section key={stage.id} className="rounded-xl border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <Badge variant="secondary">{grouped[stage.id].length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[stage.id].length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No candidates</p>
                ) : (
                  grouped[stage.id].map((submission) => (
                    <article key={submission.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {submission.candidate_name ?? submission.candidate_id}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {submission.candidate_title ?? 'Candidate'} ·{' '}
                            {submission.requisition.title}
                          </p>
                        </div>
                        <Badge variant="outline">{submission.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {submission.requisition.client?.name ?? 'Client'} · Match score{' '}
                        {submission.match_score ?? 'not scored'}
                      </p>
                      <Button asChild className="mt-3 w-full" size="sm" variant="outline">
                        <Link href={`/ops/requisitions/${submission.requisition.id}`}>
                          Review Shortlist
                        </Link>
                      </Button>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function groupSubmissions(submissions: PipelineSubmission[]) {
  const groups: Record<(typeof pipelineStages)[number]['id'], PipelineSubmission[]> = {
    shortlisted: [],
    approved: [],
    rejected: [],
    other: [],
  }

  for (const submission of submissions) {
    if (submission.status === 'shortlisted') groups.shortlisted.push(submission)
    else if (submission.status === 'approved') groups.approved.push(submission)
    else if (submission.status === 'rejected') groups.rejected.push(submission)
    else groups.other.push(submission)
  }

  return groups
}
