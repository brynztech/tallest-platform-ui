import type { User, Workspace } from './types'

/**
 * The single workspace for v1. Multi-tenant SaaS adds more later without a
 * data-model change.
 */
export const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_brynzit',
  name: 'Brynzit',
}

/**
 * Seed users for the trusted-network / no-auth phase. These stand in for real
 * accounts so the team can exercise every role (and the internal gate) before
 * authentication exists. Replaced by session-derived users when auth ships.
 *
 * Static module constant — no fetch, available immediately on first render.
 */
export const SEED_USERS: readonly User[] = [
  {
    id: 'usr_recruiter',
    name: 'Priya Recruiter',
    email: 'priya@brynzit.com',
    role: 'recruiter',
    title: 'Recruiter',
  },
  {
    id: 'usr_account_manager',
    name: 'Sam Account',
    email: 'sam@brynzit.com',
    role: 'account_manager',
    title: 'Account Manager',
  },
  {
    id: 'usr_quality_manager',
    name: 'Meera Quality',
    email: 'meera@brynzit.com',
    role: 'quality_manager',
    title: 'Quality Manager',
  },
  {
    id: 'usr_admin',
    name: 'Admin',
    email: 'admin@brynzit.com',
    role: 'admin',
    title: 'Administrator',
  },
] as const

/** The user selected on first load before any stored preference is read. */
export const DEFAULT_USER_ID = SEED_USERS[0].id
