'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, Sparkles, Clock } from 'lucide-react'
import { useCan, useActingUser } from '@brynzit/identity'
import type { HumanAction } from '@brynzit/recruiting'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import {
  describeDecision,
  fetchInternalReviewQueue,
  internalReviewQueryKeys,
  postInternalReviewDecision,
  type InternalReviewItem,
} from './_lib/internal-review'

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.round(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function AiRecommendationBadge({ item }: { item: InternalReviewItem }) {
  if (item.ai_recommendation === 'advance') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Sparkles className="size-3" />
        AI: advance{item.ai_score != null ? ` · ${item.ai_score}` : ''}
      </Badge>
    )
  }
  if (item.ai_recommendation === 'reject') {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
        <Sparkles className="size-3" />
        AI: reject{item.ai_score != null ? ` · ${item.ai_score}` : ''}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Sparkles className="size-3" />
      AI: no signal
    </Badge>
  )
}

export default function QualityReviewPage() {
  const can = useCan()
  const canApprove = can('submission.approve_gate')
  const actingUser = useActingUser()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: internalReviewQueryKeys.queue,
    queryFn: fetchInternalReviewQueue,
    staleTime: 15 * 1000,
  })

  const decisionMutation = useMutation({
    mutationFn: postInternalReviewDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internalReviewQueryKeys.queue })
    },
    onError: () => {
      toast.error('Failed to record decision — try again.')
    },
  })

  function handleDecision(item: InternalReviewItem, action: HumanAction) {
    const decision = describeDecision(action, item.ai_recommendation, actingUser.id)
    const verb = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Held'
    if (decision.overrodeAi) {
      toast.warning(`${verb} ${item.candidate_name} — overriding the AI recommendation.`, {
        description: `AI advised to ${item.ai_recommendation}. Recorded as a human override.`,
      })
    } else {
      toast(`${verb} ${item.candidate_name}.`)
    }
    decisionMutation.mutate({ submissionId: item.submission_id, action })
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">Quality Review</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Internal gate. Submissions here are awaiting BrynzIT approval before the client sees them.
        The AI pre-scores each one; the final decision is yours and any override is recorded.
      </p>

      {!canApprove && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 text-amber-600" />
          <span>
            You can view the internal review queue, but only a Quality Manager or Admin can approve
            or reject submissions.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load the review queue.</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ShieldCheck className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Queue is clear</p>
          <p className="text-sm text-muted-foreground">No submissions are awaiting internal review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.submission_id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.candidate_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.role_title} · {item.client_name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <AiRecommendationBadge item={item} />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {relativeTime(item.submitted_at)}
                  </span>
                </div>
              </div>

              {item.ai_rationale && (
                <p className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                  {item.ai_rationale}
                </p>
              )}

              {canApprove && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={decisionMutation.isPending}
                    onClick={() => handleDecision(item, 'approve')}
                  >
                    Approve to client
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decisionMutation.isPending}
                    onClick={() => handleDecision(item, 'hold')}
                  >
                    Hold
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={decisionMutation.isPending}
                    onClick={() => handleDecision(item, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
