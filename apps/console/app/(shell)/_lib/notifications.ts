/**
 * Native-fetch data layer for the shell-level notification bell — not yet in
 * this repo's generated `api.d.ts`, same native-fetch-for-paths-absent-from-
 * api.d.ts convention documented in `apps/console/CLAUDE.md` gotcha #5 and
 * used by `ops/requisitions/[id]/_lib/lifecycle.ts`.
 */

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export interface NotificationResponse {
  id: string
  requisition_id: string
  message: string
  /** Event discriminator — see ../talent-platform/NOTIFICATION_EVENTS.md. */
  notification_type?: string
  /** Deep-link data (submission_id, candidate_id, …) per event type. */
  payload?: Record<string, unknown> | null
  created_at: string
  read_at: string | null
}

export function notificationQueryKey(userId: string) {
  return ['ops-notifications', userId] as const
}

export async function fetchUnreadNotifications(userId: string): Promise<NotificationResponse[]> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/notifications?user_id=${encodeURIComponent(userId)}&unread_only=true`,
  )
  if (!res.ok) throw new Error(`Failed to load notifications: ${res.status}`)
  return (await res.json()) as NotificationResponse[]
}

/** Idempotent — marking an already-read notification read again is a no-op, not an error. */
export async function markNotificationRead(notificationId: string): Promise<NotificationResponse> {
  const res = await fetch(
    `${apiBase()}/api/v1/ops/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'POST' },
  )
  if (!res.ok) throw new Error(`Failed to mark notification read: ${res.status}`)
  return (await res.json()) as NotificationResponse
}
