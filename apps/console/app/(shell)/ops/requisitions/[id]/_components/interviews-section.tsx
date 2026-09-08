'use client'

import { useState } from 'react'
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
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

interface InterviewsSectionProps {
  reqId: string
  /** Shortlisted/approved candidates to populate the candidate selector */
  candidates: Array<{ id: string; name: string }>
  /** Pre-select this candidate in the scheduling form (e.g. the approved one) */
  defaultCandidateId?: string | null
}

export function InterviewsSection({ reqId, candidates, defaultCandidateId }: InterviewsSectionProps) {
  const queryClient = useQueryClient()
  const [scheduledDate, setScheduledDate] = useState('')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    defaultCandidateId ?? candidates[0]?.id ?? '',
  )

  // Sync selector when defaultCandidateId arrives from parent (e.g. after approval)
  const effectiveCandidateId =
    selectedCandidateId || defaultCandidateId || candidates[0]?.id || ''

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
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: components['schemas']['CreateInterviewRequest']) =>
      apiClient.POST('/api/v1/ops/interviews', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
      toast('Interview logged.')
    },
    onError: () => {
      toast.error('Failed to schedule interview.')
    },
  })

  return (
    <div>
      {interviews.length === 0 ? (
        <p className="py-4 text-[15px] text-[#908E8B]">No interviews logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const nextStates = VALID_TRANSITIONS[interview.status] ?? []
            const isTerminal = nextStates.length === 0

            return (
              <div
                key={interview.id}
                className="flex h-10 items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
              >
                <span className="flex-1 text-sm">
                  {interview.candidate_id
                    ? (candidates.find((c) => c.id === interview.candidate_id)?.name ??
                      `${interview.candidate_id.slice(0, 8)}…`)
                    : '—'}
                </span>
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

      {/* Log Interview form — always visible */}
      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border bg-[#F8F7F3] p-3">
        {candidates.length > 0 ? (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Candidate *</Label>
            <Select value={effectiveCandidateId} onValueChange={setSelectedCandidateId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Label htmlFor="candidate_id_input" className="text-xs text-muted-foreground">
              Candidate ID
            </Label>
            <Input
              id="candidate_id_input"
              placeholder="UUID (optional)"
              value={effectiveCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-[200px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="interview_date" className="text-xs text-muted-foreground">
            Interview Date *
          </Label>
          <Input
            id="interview_date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Button
          size="sm"
          disabled={!effectiveCandidateId || createMutation.isPending || !scheduledDate}
          onClick={() => {
            createMutation.mutate(
              {
                requisition_id: reqId,
                candidate_id: effectiveCandidateId || null,
                scheduled_at: new Date(scheduledDate).toISOString(),
              },
              {
                onSuccess: () => setScheduledDate(''),
              },
            )
          }}
        >
          <CalendarPlus className="mr-1 size-4" />
          Log interview
        </Button>

        <p className="w-full text-xs text-muted-foreground">
          A candidate and a date are required.
        </p>
      </div>
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
    <span className={cn('inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] font-medium', tone)}>
      <span className="size-[5px] rounded-full bg-current" />
      {status}
    </span>
  )
}
