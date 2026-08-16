import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// MSW contract mocks — per-user requisition notifications (e.g. "Account
// Manager requested more candidates"). Mirrors the live backend contract:
// GET by user (optionally unread-only), idempotent mark-read.
interface NotificationRecord {
  id: string
  user_id: string
  requisition_id: string
  message: string
  created_at: string
  read_at: string | null
}

// Seed: one unread notification for the recruiter seed user so the bell has
// something to show out of the box in NEXT_PUBLIC_API_MOCKING=enabled dev.
const NOTIFICATIONS: NotificationRecord[] = [
  {
    id: '00000000-0000-0000-0000-notif0000001',
    user_id: 'usr_recruiter',
    requisition_id: '00000000-0000-0000-0000-req000000001',
    message: 'Your Account Manager requested more candidates for Senior Backend Engineer.',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read_at: null,
  },
]

/** Exported so the request-more-candidates mock (handlers/ops.ts) can notify every assignee. */
export function addNotification(userId: string, requisitionId: string, message: string): void {
  NOTIFICATIONS.push({
    id: crypto.randomUUID(),
    user_id: userId,
    requisition_id: requisitionId,
    message,
    created_at: new Date().toISOString(),
    read_at: null,
  })
}

function toResponse({ user_id: _user_id, ...rest }: NotificationRecord) {
  return rest
}

export const notificationHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/ops/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id') ?? ''
    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    let list = NOTIFICATIONS.filter((n) => n.user_id === userId)
    if (unreadOnly) list = list.filter((n) => n.read_at === null)
    return HttpResponse.json(list.map(toResponse))
  }),

  http.post(`${API_BASE}/api/v1/ops/notifications/:notification_id/read`, ({ params }) => {
    const id = params.notification_id as string
    const notification = NOTIFICATIONS.find((n) => n.id === id)
    if (!notification) {
      return HttpResponse.json({ detail: 'Notification not found.' }, { status: 404 })
    }
    // Idempotent — marking an already-read notification read again is a no-op.
    if (!notification.read_at) notification.read_at = new Date().toISOString()
    return HttpResponse.json(toResponse(notification))
  }),
]
