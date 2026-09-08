'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActingUser, useCan } from '@brynzit/identity'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { UserPlus, X } from 'lucide-react'
import {
  assignableRecruiters,
  assignRecruiter,
  assignmentQueryKeys,
  fetchAssignedRequisitionIds,
  fetchRequisitionAssignees,
  unassignRecruiter,
} from '@/(shell)/_lib/assignments'
import { listAssignableRecruiters } from '../../../../_lib/staff-auth'

/**
 * Who works this role. Everyone with access to this page can see the list
 * (recruiters.view is granted to every role — see
 * platform/staff_auth.py::ROLE_SCOPES); adding/removing recruiters requires
 * requisition.manage (AM + Admin).
 */
export function AssignedRecruitersCard({ reqId }: { reqId: string }) {
  const can = useCan()
  const canManage = can('requisition.manage')
  const actingUser = useActingUser()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')

  const { data: assigneeIds = [] } = useQuery({
    queryKey: assignmentQueryKeys.forRequisition(reqId),
    queryFn: () => fetchRequisitionAssignees(reqId),
    // Another manager can assign/unassign a recruiter here at any time —
    // refetch-on-focus (overriding the app default of false) picks that up
    // on tab switch instead of only on a hard refresh.
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })

  const { data: allRecruiters = [] } = useQuery({
    queryKey: ['staff-auth', 'recruiters'],
    queryFn: listAssignableRecruiters,
  })

  // "N roles" per assignee — how many other requisitions they're on, not just this one.
  const { data: roleCounts = {} } = useQuery({
    queryKey: ['recruiter-role-counts', assigneeIds.join(',')],
    enabled: assigneeIds.length > 0,
    queryFn: async () => {
      const counts = await Promise.all(
        assigneeIds.map(async (userId) => [userId, (await fetchAssignedRequisitionIds(userId)).length] as const),
      )
      return Object.fromEntries(counts)
    },
  })

  function userName(userId: string) {
    return allRecruiters.find((r) => r.id === userId)?.username ?? userId
  }

  const invalidate = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.forRequisition(reqId) })
    // Keeps the recruiter's My Roles / dashboard views in sync.
    queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.forUser(userId) })
  }

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignRecruiter(userId, reqId, actingUser.id),
    onSuccess: (_data, userId) => {
      invalidate(userId)
      setSelectedUserId('')
      toast(`${userName(userId)} assigned to this role.`)
    },
    onError: () => toast.error('Failed to assign recruiter — try again.'),
  })

  const unassignMutation = useMutation({
    mutationFn: (userId: string) => unassignRecruiter(userId, reqId),
    onSuccess: (_data, userId) => {
      invalidate(userId)
      toast(`${userName(userId)} removed from this role.`)
    },
    onError: () => toast.error('Failed to remove recruiter — try again.'),
  })

  const candidates = assignableRecruiters(allRecruiters, assigneeIds)

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Assigned recruiters</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        Only these recruiters see this role in their pipeline.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {assigneeIds.length === 0 && (
          <p className="text-sm text-muted-foreground">No recruiters assigned yet.</p>
        )}
        {assigneeIds.map((userId) => {
          const count = roleCounts[userId]
          const name = userName(userId)
          return (
            <span
              key={userId}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1.5 pl-1.5 text-[13px]"
            >
              <Avatar className="size-6">
                <AvatarFallback className="bg-[#E5E3DC] text-[11px] font-medium text-muted-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{name}</span>
              {count != null && (
                <span className="text-muted-foreground">{count} role{count === 1 ? '' : 's'}</span>
              )}
              {canManage && (
                <button
                  type="button"
                  aria-label={`Remove ${userName(userId)}`}
                  className="ml-1 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                  disabled={unassignMutation.isPending}
                  onClick={() => unassignMutation.mutate(userId)}
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          )
        })}
        {canManage && candidates.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedUserId || assignMutation.isPending}
              onClick={() => assignMutation.mutate(selectedUserId)}
            >
              <UserPlus className="mr-1 size-4" />
              Assign
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
