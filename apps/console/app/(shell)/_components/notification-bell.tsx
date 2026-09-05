'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActingUser } from '@brynzit/identity'
import { Bell, Check } from 'lucide-react'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { cn } from '@brynzit/ui/lib/utils'
import {
  fetchUnreadNotifications,
  markNotificationRead,
  notificationQueryKey,
  type NotificationResponse,
} from '../_lib/notifications'

/** requisition_assigned's payload carries where to send the click — see
 * ops/services/assignments.py::_notify_new_assignee. Other event types have
 * no destination yet and just render as plain text. */
function notificationHref(notification: NotificationResponse): string | null {
  if (notification.notification_type !== 'requisition_assigned') return null
  const requisitionId = notification.payload?.requisition_id
  return typeof requisitionId === 'string' ? `/my-roles/${requisitionId}` : null
}

/**
 * Shell-level notification bell — works regardless of which page is open
 * since it lives in top-nav.tsx, part of the shell layout.
 */
export function NotificationBell() {
  const actingUser = useActingUser()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: notifications = [] } = useQuery({
    queryKey: notificationQueryKey(actingUser.id),
    queryFn: () => fetchUnreadNotifications(actingUser.id),
    // Deliberately slower than the 15s data-freshness polls elsewhere (BD
    // pipeline, recruiter shortlist) — this is a lower-urgency alert badge,
    // not live work data, so a 30s cadence is plenty.
    refetchInterval: 30_000,
  })

  const readMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKey(actingUser.id) })
    },
  })

  const unreadCount = notifications.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm shadow-slate-200/60 transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1.5 -top-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={4} className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => notifications.forEach((n) => readMutation.mutate(n.id))}
            >
              Mark all read
            </button>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No new notifications.
            </p>
          ) : (
            notifications.map((n) => {
              const href = notificationHref(n)
              return (
              <div
                key={n.id}
                className="flex items-start justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-0"
              >
                <div
                  className={cn('min-w-0', href && 'cursor-pointer')}
                  role={href ? 'button' : undefined}
                  tabIndex={href ? 0 : undefined}
                  onClick={
                    href
                      ? () => {
                          readMutation.mutate(n.id)
                          router.push(href)
                        }
                      : undefined
                  }
                >
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Mark as read"
                  className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={readMutation.isPending}
                  onClick={() => readMutation.mutate(n.id)}
                >
                  <Check className="size-4" />
                </button>
              </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
