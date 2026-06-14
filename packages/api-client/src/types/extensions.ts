import type { components } from './api'

/**
 * LeadQueueItem extended with fat-card fields proposed in
 * .planning/contracts/bd-lead-queue-item-fat-card.yaml (BD-01 / ROADMAP SC1).
 *
 * These fields are absent from the current generated api.d.ts because the backend
 * has not yet shipped them. The MSW mock returns them so the UI renders correctly
 * in dev. When the backend ships and pnpm generate:api is rerun, the generated
 * type will include these fields natively and this extension can be removed.
 */
export type LeadQueueItemExtended = components['schemas']['LeadQueueItem'] & {
  open_roles_count?: number | null
  open_roles_summary?: string | null
  suggested_angle?: string | null
}
