import { hasInternalGate, type Pipeline } from '@brynzit/pipeline'

/**
 * Recruiting domain: the Submission (a candidate on a role) and its lifecycle.
 *
 * This is domain logic, not a generic kit. It depends on the generic pipeline
 * engine to decide whether a role is mediated (routes through an internal gate)
 * or direct.
 */

/** Lifecycle status of a submission. */
export type SubmissionStatus =
  | 'in_internal_review'
  | 'internal_rejected'
  | 'submitted_to_client'
  | 'client_interviewing'
  | 'offer'
  | 'placed'
  | 'client_rejected'
  | 'paused'
  | 'withdrawn'

/** Statuses that represent a rejection somewhere in the process. */
export const REJECTED_STATUSES: readonly SubmissionStatus[] = [
  'internal_rejected',
  'client_rejected',
]

/** Statuses from which no further movement happens. */
export const TERMINAL_STATUSES: readonly SubmissionStatus[] = [
  'internal_rejected',
  'client_rejected',
  'placed',
  'withdrawn',
]

/** What the AI advises for a submission. Advisory only (spec D4). */
export type AiRecommendation = 'advance' | 'reject' | 'unknown'

/** A human decision at the internal gate. */
export type HumanAction = 'approve' | 'reject' | 'hold'

/** Whether the role routes submissions through an internal quality gate (D3). */
export function requiresInternalApproval(pipeline: Pipeline): boolean {
  return hasInternalGate(pipeline)
}

/**
 * The status a freshly-submitted candidate lands in. Mediated roles wait for
 * internal review; direct roles go straight to the client (spec D3).
 */
export function initialStatusOnSubmit(mediated: boolean): SubmissionStatus {
  return mediated ? 'in_internal_review' : 'submitted_to_client'
}

/**
 * Whether a human action contradicts the AI recommendation (spec D4). Approving
 * a candidate the AI wanted to reject — or rejecting one the AI wanted to
 * advance — is an override. `hold` and `unknown` AI are never overrides.
 */
export function isAiOverride(ai: AiRecommendation, action: HumanAction): boolean {
  if (ai === 'unknown') return false
  if (action === 'approve') return ai === 'reject'
  if (action === 'reject') return ai === 'advance'
  return false
}

/** A recorded human decision at the internal gate. */
export interface InternalDecision {
  action: HumanAction
  actorId: string
  at: string
  reason?: string
  /** True when the decision contradicts the AI recommendation. */
  overrodeAi: boolean
  /** The resulting submission status. */
  nextStatus: SubmissionStatus
}

export interface InternalDecisionInput {
  action: HumanAction
  actorId: string
  aiRecommendation: AiRecommendation
  at?: string
  reason?: string
}

/**
 * Apply a human decision at the internal gate. Pure: returns the recorded
 * decision (including override flag and next status); performs no I/O.
 *
 * - `approve` → `submitted_to_client`
 * - `reject`  → `internal_rejected`
 * - `hold`    → `paused`
 */
export function applyInternalDecision(input: InternalDecisionInput): InternalDecision {
  const { action, actorId, aiRecommendation, at, reason } = input
  const nextStatus: SubmissionStatus =
    action === 'approve'
      ? 'submitted_to_client'
      : action === 'reject'
        ? 'internal_rejected'
        : 'paused'

  return {
    action,
    actorId,
    at: at ?? new Date().toISOString(),
    ...(reason !== undefined ? { reason } : {}),
    overrodeAi: isAiOverride(aiRecommendation, action),
    nextStatus,
  }
}
