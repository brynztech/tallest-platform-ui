'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, type components } from '@brynzit/api-client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import {
  fetchOpsInterviews,
  formatShortDate,
  recruiterQueryKeys,
  RECRUITER_STALE_TIME_MS,
} from '../_lib/recruiter-data'
import { toast } from 'sonner'

const validTransitions: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

export default function CalendarPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const queryClient = useQueryClient()
  const interviewsQuery = useQuery({
    queryKey: recruiterQueryKeys.interviews(statusFilter),
    queryFn: () => fetchOpsInterviews(statusFilter),
    staleTime: RECRUITER_STALE_TIME_MS,
  })

  const patchMutation = useMutation({
    mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
      apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
        params: { path: { interview_id: interviewId } },
        body: { status } satisfies components['schemas']['PatchInterviewRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'ops-interviews'] })
      queryClient.invalidateQueries({ queryKey: ['ops-interviews-global'] })
    },
    onError: () => {
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'ops-interviews'] })
    },
  })

  const interviews = interviewsQuery.data ?? []

  if (interviewsQuery.isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading interview calendar...</p>
      </div>
    )
  }

  if (interviewsQuery.error) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Couldn&apos;t load Ops interviews.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Interview schedule and status transitions loaded from Ops interviews.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No interviews found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Interview records created from requisition pages will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const nextStates = validTransitions[interview.status] ?? []
            return (
              <div
                key={interview.id}
                className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{interview.candidate_id ?? 'Candidate'}</p>
                  <Link
                    href={`/ops/requisitions/${interview.requisition_id}`}
                    className="text-sm text-primary"
                  >
                    View requisition
                  </Link>
                </div>
                <span className="w-[140px] text-sm text-muted-foreground">
                  {formatShortDate(interview.scheduled_at)}
                </span>
                <Select
                  value={interview.status}
                  disabled={nextStates.length === 0 || patchMutation.isPending}
                  onValueChange={(status) => patchMutation.mutate({ interviewId: interview.id, status })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={interview.status}>{interview.status}</SelectItem>
                    {nextStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
