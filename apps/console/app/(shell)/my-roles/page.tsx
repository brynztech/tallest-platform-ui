'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Briefcase } from 'lucide-react'
import { useActingUser, useCan } from '@brynzit/identity'
import { visibleByAssignment } from '@brynzit/recruiting'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import {
  fetchOpsClients,
  fetchRequisitionsForClients,
  recruiterQueryKeys,
} from '../_lib/recruiter-data'
import { assignmentQueryKeys, fetchAssignedRequisitionIds } from '../_lib/assignments'

export default function MyRolesPage() {
  const actingUser = useActingUser()
  const can = useCan()
  const canViewAll = can('role.view_all')

  const { data: clients = [] } = useQuery({
    queryKey: recruiterQueryKeys.clients,
    queryFn: fetchOpsClients,
    staleTime: 60_000,
  })

  const { data: requisitions = [], isLoading: reqsLoading } = useQuery({
    queryKey: ['my-roles', 'requisitions', clients.map((c) => c.id).sort().join(',')],
    queryFn: () => fetchRequisitionsForClients(clients),
    enabled: clients.length > 0,
    staleTime: 30_000,
  })

  const { data: assignedIds = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: assignmentQueryKeys.forUser(actingUser.id),
    queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
    enabled: !canViewAll,
    staleTime: 60_000,
  })

  const isLoading = reqsLoading || (!canViewAll && assignmentsLoading)
  const visible = visibleByAssignment(requisitions, { assignedIds, canViewAll })

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-2 flex items-center gap-2">
        <Briefcase className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">My Roles</h1>
        <Badge variant="outline" className="ml-1">
          {canViewAll ? 'All roles' : 'Assigned to you'}
        </Badge>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        {canViewAll
          ? `You can see every open role (${actingUser.name}, ${roleNote(true)}).`
          : `Roles assigned to you as ${actingUser.name}. Focus your sourcing here.`}
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Briefcase className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No roles assigned yet</p>
          <p className="text-sm text-muted-foreground">
            An account manager assigns roles to you; they will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((requisition) => (
            <Link
              key={requisition.id}
              href={canViewAll ? `/ops/requisitions/${requisition.id}` : `/my-roles/${requisition.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{requisition.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {requisition.client?.name ?? 'Unknown client'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {requisition.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function roleNote(canViewAll: boolean): string {
  return canViewAll ? 'manager view' : 'recruiter view'
}
