/**
 * Identity domain types.
 *
 * This package is intentionally headless and domain-agnostic: it models "who is
 * acting and what may they do" so it can be reused across ventures. Recruiting
 * concepts (clients, submissions, etc.) never leak in here.
 */

/** A role a user holds within a workspace. */
export type Role = 'recruiter' | 'account_manager' | 'quality_manager' | 'admin'

/**
 * A discrete permission a role may hold. Capabilities are action-oriented and
 * checked at every gate in the UI (nav visibility, buttons, route guards).
 *
 * Naming convention: `<subject>.<action>`.
 */
export type Capability =
  | 'role.view_assigned'
  | 'role.view_all'
  | 'client.manage'
  | 'requisition.manage'
  | 'pipeline.configure'
  | 'candidate.shortlist'
  | 'candidate.bookmark'
  | 'candidate.submit'
  | 'submission.approve_gate'
  | 'submission.override_ai'
  | 'candidate.hard_block'
  | 'internal_ops.view'
  | 'admin.view'

/** A person acting inside a workspace. */
export interface User {
  id: string
  name: string
  email: string
  role: Role
  /** Optional short job title shown under the name. */
  title?: string
  /** Optional avatar image URL; initials are used as a fallback. */
  avatarUrl?: string
}

/**
 * The tenant scope every domain record belongs to. There is exactly one
 * workspace today; the concept exists so multi-tenant SaaS needs no data-model
 * change later.
 */
export interface Workspace {
  id: string
  name: string
}
