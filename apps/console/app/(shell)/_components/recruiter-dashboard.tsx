'use client'

import type React from 'react'
import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useActingUser, useCan } from '@brynzit/identity'
import { summarizePipeline, visibleByAssignment } from '@brynzit/recruiting'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchOpsInterviews,
  fetchPipelineSubmissions,
  fetchPlacementsForRequisitions,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  requisitionIdsKey,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../_lib/assignments'

export function RecruiterDashboard({ title = 'Dashboard' }: { title?: string }) {
  const can = useCan()
  const actingUser = useActingUser()
  const canViewAll = can('role.view_all')

  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })
  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data])

  const requisitionsQuery = useQuery({
    queryKey: recruiterQueryKeys.requisitions(clientIdsKey(clients)),
    enabled: clientsQuery.isSuccess,
    queryFn: () => fetchRequisitionsForClients(clients),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  // Recruiters see only their assigned roles ("my work"); managers see all.
  const assignmentsQuery = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    enabled: !canViewAll,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const allRequisitions = useMemo(
    () => requisitionsQuery.data ?? [],
    [requisitionsQuery.data],
  )
  const assignedIds = assignmentsQuery.data ?? []
  const visibleReqs = useMemo(
    () => visibleByAssignment(allRequisitions, { assignedIds, canViewAll }),
    [allRequisitions, assignedIds, canViewAll],
  )
  const visibleReqIds = useMemo(() => new Set(visibleReqs.map((r) => r.id)), [visibleReqs])

  const interviewsQuery = useQuery({
    queryKey: recruiterQueryKeys.interviews('all'),
    queryFn: () => fetchOpsInterviews('all'),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const pipelineQuery = useQuery({
    queryKey: recruiterQueryKeys.pipeline(requisitionIdsKey(visibleReqs)),
    enabled: visibleReqs.length > 0,
    queryFn: () => fetchPipelineSubmissions(visibleReqs),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const placementsQuery = useQuery({
    queryKey: recruiterQueryKeys.placements(requisitionIdsKey(visibleReqs)),
    enabled: visibleReqs.length > 0,
    queryFn: () => fetchPlacementsForRequisitions(visibleReqs),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const interviews = useMemo(() => interviewsQuery.data ?? [], [interviewsQuery.data])
  const scopedInterviews = useMemo(
    () =>
      canViewAll
        ? interviews
        : interviews.filter((i) => i.requisition_id && visibleReqIds.has(i.requisition_id)),
    [canViewAll, interviews, visibleReqIds],
  )

  const pipeline = useMemo(
    () => summarizePipeline((pipelineQuery.data ?? []).map((s) => s.status)),
    [pipelineQuery.data],
  )
  const placements = placementsQuery.data ?? []

  const openRequisitions = visibleReqs.filter((r) => r.status === 'open')
  const scheduledInterviews = scopedInterviews.filter((i) => i.status === 'scheduled')

  const isLoading = clientsQuery.isLoading || requisitionsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading recruiter overview...</p>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">
          Couldn&apos;t load recruiter overview from the current Ops data.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
            <Badge variant={canViewAll ? 'secondary' : 'outline'}>
              {canViewAll ? 'All roles' : 'My work'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {canViewAll
              ? 'Live pipeline across every role — from Ops requisitions, shortlists, interviews, and placements.'
              : `Live pipeline for the roles assigned to ${actingUser.name}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/my-roles">My Roles</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/supply/search">Find Candidates</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open roles"
          value={openRequisitions.length}
          description={`${visibleReqs.length} total ${canViewAll ? '' : 'assigned '}role${visibleReqs.length === 1 ? '' : 's'}.`}
          icon={<BriefcaseBusiness className="size-4" />}
        />
        <MetricCard
          label="Awaiting internal review"
          value={pipeline.awaitingInternalReview}
          description="Submissions pending the quality gate."
          icon={<ShieldCheck className="size-4" />}
        />
        <MetricCard
          label="Approved to client"
          value={pipeline.approvedToClient}
          description={`${pipeline.total} submission${pipeline.total === 1 ? '' : 's'} in pipeline.`}
          icon={<CheckCircle className="size-4" />}
        />
        <MetricCard
          label="Interviews scheduled"
          value={scheduledInterviews.length}
          description={`${scopedInterviews.length} interview${scopedInterviews.length === 1 ? '' : 's'} tracked.`}
          icon={<CalendarDays className="size-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Placements"
          value={placements.length}
          description="Confirmed hires on your roles."
          icon={<Trophy className="size-4" />}
        />
        {canViewAll && (
          <MetricCard
            label="Clients"
            value={clients.length}
            description="Active client accounts."
            icon={<UsersRound className="size-4" />}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where to act</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm md:flex-row md:items-center">
          <p className="flex-1">
            Every number above reflects live records. Open a role to review its AI Matchmaker
            suggestions and shortlist, or clear the internal quality-review queue.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/my-roles">Open roles</Link>
            </Button>
            {can('submission.approve_gate') && (
              <Button asChild variant="outline" size="sm">
                <Link href="/ops/quality-review">Quality review</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: number | string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <p className="text-2xl font-semibold tracking-[-0.03em]">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  )
}
