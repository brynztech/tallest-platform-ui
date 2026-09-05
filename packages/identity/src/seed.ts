import type { Workspace } from './types'

/**
 * The single workspace for v1. Multi-tenant SaaS adds more later without a
 * data-model change.
 */
export const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_brynzit',
  name: 'Brynzit',
}
