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
    <div className="flex items-center gap-2 rounded-full border border-border py-1 pr-2.5 pl-1">
      <Avatar className="size-7">
        <AvatarFallback className="bg-[#E5E3DC] text-[11px] font-medium text-muted-foreground">
          {initials(actingUser.name)}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] leading-[1.2] font-medium text-foreground">
          {actingUser.name}
        </span>
        <span className="text-muted-foreground truncate text-[11px] leading-[1.2]">
          {ROLE_LABELS[actingUser.role]}
        </span>
      </span>
    </div>
  )
}
