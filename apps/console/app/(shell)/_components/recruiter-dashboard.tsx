'use client'

import type React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@brynzit/ui/components/ui/card'
import { BriefcaseBusiness, CalendarDays, ClipboardList, UsersRound } from 'lucide-react'
import {
  clientIdsKey,
  fetchOpsClients,
  fetchOpsInterviews,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'

export function RecruiterDashboard({ title = 'Dashboard' }: { title?: string }) {
  const clientsQuery = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const clients = clientsQuery.data ?? []

  const requisitionsQuery = useQuery({
    queryKey: recruiterQueryKeys.requisitions(clientIdsKey(clients)),
    enabled: clientsQuery.isSuccess,
    queryFn: () => fetchRequisitionsForClients(clients),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const interviewsQuery = useQuery({
    queryKey: recruiterQueryKeys.interviews('all'),
    queryFn: () => fetchOpsInterviews('all'),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const requisitions = requisitionsQuery.data ?? []
  const interviews = interviewsQuery.data ?? []
  const openRequisitions = requisitions.filter((requisition) => requisition.status === 'open')
  const scheduledInterviews = interviews.filter((interview) => interview.status === 'scheduled')

  const isLoading =
    clientsQuery.isLoading || requisitionsQuery.isLoading || interviewsQuery.isLoading
  const hasError = clientsQuery.error || requisitionsQuery.error || interviewsQuery.error

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
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="text-muted-foreground text-sm">
            Live summary from Ops clients, requisitions, interviews, and shortlist entry points.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/ops/requisitions">Browse Requisitions</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/supply/search">Find Candidates</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clients"
          value={clients.length}
          description="Loaded from Ops clients."
          icon={<UsersRound className="size-4" />}
        />
        <MetricCard
          label="Requisitions"
          value={requisitions.length}
          description={`${openRequisitions.length} open right now.`}
          icon={<BriefcaseBusiness className="size-4" />}
        />
        <MetricCard
          label="Interviews"
          value={interviews.length}
          description={`${scheduledInterviews.length} currently scheduled.`}
          icon={<CalendarDays className="size-4" />}
        />
        <MetricCard
          label="Shortlists"
          value="Per requisition"
          description="Open a requisition to review API-backed submissions."
          icon={<ClipboardList className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Access</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm md:flex-row md:items-center">
          <p className="flex-1">
            Brynzit does not expose a global submissions board yet. Candidate pipeline work is
            available from each requisition&apos;s shortlist, interviews, and placement panels.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/ops/requisitions">Open Requisitions</Link>
          </Button>
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
