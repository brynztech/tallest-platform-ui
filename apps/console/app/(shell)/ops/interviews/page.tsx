'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint (api.d.ts get?: never line 548)
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ops-interviews-global', statusFilter],
    queryFn: async () => {
      const url = new URL(
        '/api/v1/ops/interviews',
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
      )
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch interviews')
      return res.json() as Promise<components['schemas']['InterviewResponse'][]>
    },
  })

  const patchMutation = useMutation({
    mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
      apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
        params: { path: { interview_id: interviewId } },
        body: { status } satisfies components['schemas']['PatchInterviewRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews-global'] })
    },
    onError: () => {
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['ops-interviews-global'] })
    },
  })

  if (isLoading)
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  if (error)
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          Couldn&apos;t load interviews. Check your connection or refresh the page.
        </p>
      </div>
    )

  return (
    <div>
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="flex-1 text-xl font-semibold">Interviews</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
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

      {/* Interview list */}
      <div className="px-4 py-4">
        {data.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-2">
            <h2 className="text-xl font-semibold">No interviews</h2>
            <p className="text-sm text-muted-foreground">
              Interviews scheduled from requisition pages will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((interview) => {
              const nextStates = VALID_TRANSITIONS[interview.status] ?? []
              const isTerminal = nextStates.length === 0
              return (
                <div
                  key={interview.id}
                  className="mb-2 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span className="w-[180px] truncate text-sm">{interview.candidate_id ?? '—'}</span>
                  <Link
                    href={`/ops/requisitions/${interview.requisition_id}`}
                    className="flex-1 truncate text-sm text-primary"
                  >
                    View Requisition →
                  </Link>
                  {interview.scheduled_at && (
                    <span className="w-[120px] text-xs text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleDateString()}
                    </span>
                  )}
                  <Select
                    value={interview.status}
                    disabled={isTerminal}
                    onValueChange={(newStatus) =>
                      patchMutation.mutate({ interviewId: interview.id, status: newStatus })
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={interview.status}>{interview.status}</SelectItem>
                      {nextStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
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
    </div>
  )
}
