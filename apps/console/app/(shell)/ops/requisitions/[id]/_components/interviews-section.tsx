'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { CalendarPlus } from 'lucide-react'

// Valid transitions per D-13 from CONTEXT.md
const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [], // terminal
  completed: [], // terminal
}

interface InterviewsSectionProps {
  reqId: string
  approvedCandidateId: string | null
}

export function InterviewsSection({ reqId, approvedCandidateId }: InterviewsSectionProps) {
  const queryClient = useQueryClient()

  // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint (api.d.ts get?: never line 548)
  const { data: interviews = [] } = useQuery({
    queryKey: ['ops-interviews', reqId],
    queryFn: async () => {
      const url = new URL(
        '/api/v1/ops/interviews',
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
      )
      url.searchParams.set('requisition_id', reqId)
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
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    },
    onError: () => {
      // Pitfall 5: backend returns 409 on invalid state transitions
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: components['schemas']['CreateInterviewRequest']) =>
      apiClient.POST('/api/v1/ops/interviews', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
      toast('Interview created.')
    },
    onError: () => {
      toast.error('Failed to create interview.')
    },
  })

  return (
    <div>
      {interviews.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No interviews scheduled. Use &apos;Schedule Interview&apos; above to create one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const nextStates = VALID_TRANSITIONS[interview.status] ?? []
            const isTerminal = nextStates.length === 0

            return (
              <div
                key={interview.id}
                className="flex h-10 items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
              >
                <span className="flex-1 text-sm">{interview.candidate_id ?? '—'}</span>
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
                <InterviewStatusBadge status={interview.status} />
              </div>
            )
          })}
        </div>
      )}

      {approvedCandidateId && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              requisition_id: reqId,
              candidate_id: approvedCandidateId,
            })
          }
        >
          <CalendarPlus className="mr-1 size-4" />
          Schedule Interview
        </Button>
      )}
    </div>
  )
}

function InterviewStatusBadge({ status }: { status: string }) {
  if (status === 'accepted' || status === 'completed') {
    return (
      <Badge
        variant="outline"
        className="border-[oklch(0.45_0.15_145)]/40 bg-[oklch(0.45_0.15_145)]/20 text-xs text-[oklch(0.45_0.15_145)]"
      >
        {status}
      </Badge>
    )
  }
  if (status === 'declined') {
    return (
      <Badge variant="outline" className="border-amber-500 text-xs text-amber-600">
        {status}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-xs">
      {status}
    </Badge>
  )
}
