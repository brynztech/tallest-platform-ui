'use client'

import { useMemo, useState } from 'react'
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { cn } from '@/lib/utils'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
]

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  // Raw fetch until generated OpenAPI types include GET /api/v1/ops/interviews.
  const {
    data: interviews = [],
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

  const { data: requisitions = [] } = useQuery({
    queryKey: ['ops-requisitions-all'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/requisitions')
      if (error) throw error
      return data ?? []
    },
  })
  const requisitionById = useMemo(
    () => new Map(requisitions.map((req) => [req.id, req])),
    [requisitions],
  )

  const candidateIds = useMemo(
    () => [...new Set(interviews.map((i) => i.candidate_id).filter((id): id is string => !!id))],
    [interviews],
  )
  const candidateQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ['supply-candidate-name', id],
      queryFn: async () => {
        const { data, error } = await apiClient.GET('/api/v1/supply/candidates/{candidate_id}', {
          params: { path: { candidate_id: id } },
        })
        if (error) throw error
        return data
      },
      staleTime: 5 * 60 * 1000,
    })),
  })
  const candidateNameById = useMemo(() => {
    const map = new Map<string, string>()
    candidateIds.forEach((id, i) => {
      const name = candidateQueries[i]?.data?.name
      if (name) map.set(id, name)
    })
    return map
  }, [candidateIds, candidateQueries])

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
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Interviews</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {interviews.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold">No interview logs</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Interviews logged from requisition pages will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const nextStates = VALID_TRANSITIONS[interview.status] ?? []
            const isTerminal = nextStates.length === 0
            const req = requisitionById.get(interview.requisition_id)
            const candidateName = interview.candidate_id
              ? (candidateNameById.get(interview.candidate_id) ?? 'Unknown candidate')
              : '—'

            return (
              <div
                key={interview.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{candidateName}</div>
                  <Link
                    href={`/ops/requisitions/${interview.requisition_id}`}
                    className="mt-0.5 block truncate text-[13px] text-muted-foreground hover:underline"
                  >
                    {req?.title ?? 'View requisition'}
                  </Link>
                </div>
                {interview.scheduled_at && (
                  <span className="w-[100px] shrink-0 text-xs text-muted-foreground">
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
                <InterviewStatusBadge status={interview.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InterviewStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'accepted' || status === 'completed'
      ? 'border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]'
      : status === 'declined'
        ? 'border-[#F0D9D6] bg-[#FAF0EE] text-[#BA4642]'
        : 'border-border bg-secondary text-muted-foreground'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] font-medium',
        tone,
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {status}
    </span>
  )
}
