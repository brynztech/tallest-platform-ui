import {
  applyInternalDecision,
  type AiRecommendation,
  type HumanAction,
  type InternalDecision,
} from '@brynzit/recruiting'

/** A submission awaiting the internal quality gate. */
export type InternalReviewItem = {
  submission_id: string
  candidate_id: string
  candidate_name: string
  requisition_id: string
  role_title: string
  client_id: string
  client_name: string
  ai_recommendation: AiRecommendation
  ai_score: number | null
  ai_rationale: string | null
  submitted_by: string | null
  submitted_at: string
}

export type InternalReviewQueueResponse = {
  items: InternalReviewItem[]
}

export const internalReviewQueryKeys = {
  queue: ['internal-review-queue'] as const,
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export async function fetchInternalReviewQueue(): Promise<InternalReviewItem[]> {
  const response = await fetch(`${apiBase()}/api/v1/supply/internal-review-queue`)
  if (!response.ok) throw new Error(`Failed to load internal review queue: ${response.status}`)
  const data = (await response.json()) as InternalReviewQueueResponse
  return data.items
}

export async function postInternalReviewDecision(input: {
  submissionId: string
  action: HumanAction
  reason?: string
}): Promise<void> {
  const response = await fetch(
    `${apiBase()}/api/v1/supply/internal-review-queue/${input.submissionId}/decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: input.action, reason: input.reason }),
    },
  )
  if (!response.ok) throw new Error(`Decision failed: ${response.status}`)
}

/**
 * Describe the outcome of a human action against the AI recommendation, using
 * the shared domain logic. The `overrodeAi` flag drives the "overriding AI"
 * indicator in the UI (spec D4).
 */
export function describeDecision(
  action: HumanAction,
  aiRecommendation: AiRecommendation,
  actorId: string,
): InternalDecision {
  return applyInternalDecision({ action, aiRecommendation, actorId })
}
