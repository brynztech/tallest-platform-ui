'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { INTERNAL_OPS_ITEMS, TOP_NAV_ITEMS } from '../_lib/recruiter-portal'
import { cn } from '@brynzit/ui/lib/utils'
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
    <header className="flex h-14 shrink-0 items-center border-b border-border/70 bg-white/90 px-4 shadow-sm shadow-slate-200/70 backdrop-blur">
      <Link href="/dashboard" className="flex min-w-[210px] items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20">
          B
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-4">Brynzit Console</span>
          <span className="text-muted-foreground truncate text-xs leading-4">
            {isInternalOps ? 'Internal operations' : 'Recruiter portal'}
          </span>
        </span>
      </Link>

      {isInternalOps && (
        <span className="ml-3 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          Internal Ops
        </span>
      )}

      <nav className="mx-auto flex items-center gap-5" aria-label="Recruiter top navigation">
        {TOP_NAV_ITEMS.map((item) => {
          const activePrefixes = item.activePrefixes ?? [item.href]
          const isActive = activePrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out',
                isActive && 'bg-primary/10 text-primary',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <CurrentUserBadge />
        <SignOutButton />
      </div>
    </header>
  )
}
