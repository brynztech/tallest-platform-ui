'use client'

import { ROLE_LABELS, useActingUser } from '@brynzit/identity'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Read-only replacement for the old identity-switcher (top-right): shows who
 * is really signed in via the real session, with no way to switch — there is
 * nothing to switch between anymore. See docs/console-staff-auth.md.
 */
export function CurrentUserBadge() {
  const actingUser = useActingUser()

  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-2 pr-2.5 shadow-sm shadow-slate-200/60">
      <Avatar size="sm">
        <AvatarFallback>{initials(actingUser.name)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-semibold leading-4">{actingUser.name}</span>
        <span className="text-muted-foreground truncate text-[11px] leading-4">
          {ROLE_LABELS[actingUser.role]}
        </span>
      </span>
    </div>
  )
}
