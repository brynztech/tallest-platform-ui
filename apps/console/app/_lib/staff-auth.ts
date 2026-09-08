/**
 * Staff (console) auth — typed client for /api/v1/auth/*.
 *
 * Called directly against the backend (not through a Next.js proxy route):
 * this router is deliberately not gated by the admin service token, same
 * reasoning as bd/ops/supply (see the backend's tests/test_router_auth.py).
 * Its session is an httpOnly cookie, sent automatically once the shared
 * apiClient is configured with credentials: 'include'.
 */
import { apiClient, type components } from '@brynzit/api-client'

export type StaffUser = components['schemas']['StaffUserOut']
export type AssignableRecruiter = components['schemas']['RecruiterOut']
export type StaffAuditLogEntry = components['schemas']['StaffAuditLogOut']

// Mirrors platform/staff_auth.py's STAFF_ROLES — kept in sync by hand, four
// stable values.
export const STAFF_ROLES = ['recruiter', 'account_manager', 'quality_manager', 'admin'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  recruiter: 'Recruiter',
  account_manager: 'Account Manager',
  quality_manager: 'Quality Manager',
  admin: 'Admin',
}

function errorDetail(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'detail' in error) {
    const detail = (error as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  return fallback
}

/** Null (not thrown) for "no session" — every caller treats that as normal. */
export async function fetchCurrentStaffUser(): Promise<StaffUser | null> {
  const { data, error, response } = await apiClient.GET('/api/v1/auth/me')
  if (response.status === 401) return null
  if (error) throw new Error(errorDetail(error, 'Could not load the current user.'))
  return data
}

export async function staffLogin(username: string, password: string): Promise<StaffUser> {
  const { data, error } = await apiClient.POST('/api/v1/auth/login', {
    body: { username, password },
  })
  if (error) throw new Error(errorDetail(error, 'Invalid username or password.'))
  return data
}

export async function staffLogout(): Promise<void> {
  await apiClient.POST('/api/v1/auth/logout')
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await apiClient.GET('/api/v1/auth/users')
  if (error) throw new Error(errorDetail(error, 'Could not load users.'))
  return data
}

/** Active recruiters only, minimal fields — backs the requisition-assignment
 * picker. Reachable by account_manager/quality_manager/admin (the
 * recruiters.assign scope), narrower than listStaffUsers (users.manage,
 * admin only) — see the backend's platform/staff_auth.py::ROLE_SCOPES. */
export async function listAssignableRecruiters(): Promise<AssignableRecruiter[]> {
  const { data, error } = await apiClient.GET('/api/v1/auth/users/recruiters')
  if (error) throw new Error(errorDetail(error, 'Could not load recruiters.'))
  return data
}

export async function createStaffUser(body: {
  username: string
  password: string
  role: StaffRole
}): Promise<StaffUser> {
  const { data, error } = await apiClient.POST('/api/v1/auth/users', { body })
  if (error) throw new Error(errorDetail(error, 'Could not create the user.'))
  return data
}

export async function updateStaffUser(
  userId: string,
  body: { role?: StaffRole; is_active?: boolean },
): Promise<StaffUser> {
  const { data, error } = await apiClient.PATCH('/api/v1/auth/users/{user_id}', {
    params: { path: { user_id: userId } },
    body,
  })
  if (error) throw new Error(errorDetail(error, 'Could not update the user.'))
  return data
}

/** Newest-first, admin only (users.manage). Login activity only for now. */
export async function listStaffAuditLog(filters?: {
  actorStaffId?: string
  start?: string
  end?: string
}): Promise<StaffAuditLogEntry[]> {
  const { data, error } = await apiClient.GET('/api/v1/auth/audit-log', {
    params: {
      query: {
        actor_staff_id: filters?.actorStaffId,
        start: filters?.start,
        end: filters?.end,
      },
    },
  })
  if (error) throw new Error(errorDetail(error, 'Could not load the audit log.'))
  return data
}
