'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SEED_USERS, useActingUser, useCan } from '@brynzit/identity'
import { toast } from 'sonner'
import { Badge } from '@brynzit/ui/components/ui/badge'
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
  fetchRequisitionAssignees,
  unassignRecruiter,
} from '@/(shell)/_lib/assignments'

function userName(userId: string) {
  return SEED_USERS.find((u) => u.id === userId)?.name ?? userId
}

/**
 * Who works this role. Everyone with access to this page can see the list;
 * adding/removing recruiters requires requisition.manage (AM + Admin).
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
  })

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

  const candidates = assignableRecruiters(SEED_USERS, assigneeIds)

  return (
    <div className="mb-6">
      <h2 className="mb-2 text-base font-semibold">Assigned Recruiters</h2>
      <div className="flex flex-wrap items-center gap-2">
        {assigneeIds.length === 0 && (
          <p className="text-muted-foreground text-sm">No recruiters assigned yet.</p>
        )}
        {assigneeIds.map((userId) => (
          <Badge key={userId} variant="secondary" className="gap-1 text-xs">
            {userName(userId)}
            {canManage && (
              <button
                type="button"
                aria-label={`Remove ${userName(userId)}`}
                className="text-muted-foreground hover:text-foreground"
                disabled={unassignMutation.isPending}
                onClick={() => unassignMutation.mutate(userId)}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {canManage && candidates.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="Select recruiter" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
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
