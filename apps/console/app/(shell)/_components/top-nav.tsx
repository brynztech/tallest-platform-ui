'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@brynzit/ui/lib/utils'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { INTERNAL_OPS_ITEMS, TOP_NAV_ITEMS } from '../_lib/recruiter-portal'
import { CurrentUserBadge } from './current-user-badge'
import { NotificationBell } from './notification-bell'
import { SignOutButton } from './sign-out-button'

export function TopNav() {
  const pathname = usePathname()
  const isInternalOps = INTERNAL_OPS_ITEMS.some((item) =>
    (item.activePrefixes ?? [item.href]).some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  )

  return (
    <header className="flex h-16 shrink-0 items-center gap-6 border-b border-[#ECEAE4] bg-card px-6">
      <Link href="/dashboard" className="flex flex-col gap-0.5 leading-tight">
        <span className="text-base font-semibold text-foreground">Brynzit Console</span>
        <span className="text-xs text-muted-foreground">
          {isInternalOps ? 'Internal operations' : 'Recruiter portal'}
        </span>
      </Link>

      {isInternalOps && <Badge variant="outline">Internal Ops</Badge>}

      <nav aria-label="Recruiter top navigation" className="flex items-center gap-1">
        {TOP_NAV_ITEMS.map((item) => {
          const activePrefixes = item.activePrefixes ?? [item.href]
          const isActive = activePrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground',
                isActive && 'bg-secondary font-medium text-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <CurrentUserBadge />
        <SignOutButton />
      </div>
    </header>
  )
}
