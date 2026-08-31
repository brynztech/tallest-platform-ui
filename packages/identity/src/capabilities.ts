import type { Capability, Role } from './types'

/**
 * Every capability that exists, in display order. Used to derive the admin set
 * (admin holds all capabilities) so the two never drift.
 */
export const ALL_CAPABILITIES: readonly Capability[] = [
  'role.view_assigned',
  'role.view_all',
  'client.manage',
  'requisition.manage',
  'pipeline.configure',
  'pipeline.advance',
  'candidate.shortlist',
  'candidate.bookmark',
  'candidate.submit',
  'submission.approve_gate',
  'submission.override_ai',
  'candidate.hard_block',
  'internal_ops.view',
  'admin.view',
  'assistant.view',
] as const

/** Human-readable role labels for UI. */
export const ROLE_LABELS: Record<Role, string> = {
  recruiter: 'Recruiter',
  account_manager: 'Account Manager',
  quality_manager: 'Quality Manager',
  admin: 'Admin',
}

/**
 * Single source of truth: role -> capabilities.
 *
 * This is a static module constant (no network, instantly available on both
 * server and client), so capability checks are effectively free and require no
 * caching layer.
 *
 * Note on the internal gate: recruiters intentionally do NOT hold
 * `submission.approve_gate`. When a role's pipeline has its internal gate
 * turned off, a recruiter submits directly — that is pipeline configuration,
 * not an approval capability. The gate approval capability governs the explicit
 * internal review step only.
 *
 * Note on the pipeline board: recruiters intentionally do NOT hold
 * `pipeline.advance` either. Once a candidate is submitted, moving them
 * between stages, annotating them, and dropping them belongs to whoever owns
 * the client relationship (the Account Manager who set the role up) — the
 * recruiter watches their candidates progress and is notified on every change
 * (see the backend's NOTIFICATION_EVENTS.md). `/pipeline` therefore renders
 * read-only for recruiters.
 */
export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  recruiter: [
    'role.view_assigned',
    'candidate.shortlist',
    'candidate.bookmark',
    'candidate.submit',
    'submission.override_ai',
    'assistant.view',
  ],
  account_manager: [
    'role.view_all',
    'client.manage',
    'requisition.manage',
    'pipeline.configure',
    'pipeline.advance',
    'candidate.shortlist',
    'candidate.bookmark',
    'candidate.submit',
    'submission.override_ai',
    'candidate.hard_block',
    'internal_ops.view',
    'assistant.view',
  ],
  quality_manager: [
    'role.view_all',
    'pipeline.configure',
    'pipeline.advance',
    'candidate.shortlist',
    'candidate.bookmark',
    'candidate.submit',
    'submission.approve_gate',
    'submission.override_ai',
    'candidate.hard_block',
    'internal_ops.view',
    'assistant.view',
  ],
  admin: ALL_CAPABILITIES,
}

/**
 * Pure capability check. Prefer the `useCan()` hook inside components; use this
 * directly in non-React code, tests, or (later) server-side enforcement.
 */
export function hasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability)
}
