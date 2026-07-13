'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, UserCircle } from 'lucide-react'
import { INTERNAL_OPS_ITEMS, TOP_NAV_ITEMS } from '../_lib/recruiter-portal'
import { cn } from '@brynzit/ui/lib/utils'

export function TopNav() {
  const pathname = usePathname()
  const isInternalOps = INTERNAL_OPS_ITEMS.some((item) =>
    (item.activePrefixes ?? [item.href]).some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  )

  return (
    <header className="border-border/70 bg-background/95 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur">
      <Link href="/dashboard" className="flex min-w-[210px] items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
          B
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-4">Brynzit Console</span>
          <span className="text-muted-foreground truncate text-xs leading-4">
            {isInternalOps ? 'Internal Ops workspace' : 'Recruiter workspace'}
          </span>
        </span>
      </Link>

      {isInternalOps && (
        <span className="ml-3 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
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
        <button
          type="button"
          aria-label="Notifications"
          className="border-border bg-card text-muted-foreground hover:text-foreground focus-visible:ring-ring flex size-8 items-center justify-center rounded-lg border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2"
        >
          <Bell className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Recruiter profile"
          className="border-border bg-card text-muted-foreground hover:text-foreground focus-visible:ring-ring flex size-8 items-center justify-center rounded-full border transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2"
        >
          <UserCircle className="size-5" />
        </button>
      </div>
    </header>
  )
}
