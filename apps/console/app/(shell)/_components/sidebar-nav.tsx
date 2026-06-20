'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@brynzit/ui/lib/utils'

// BD nav items — fully wired
const BD_NAV = [
  { href: '/bd/leads', label: 'Leads', badgeKey: 'leads-count' as const },
  { href: '/bd/outreach', label: 'Outreach', badgeKey: null },
  { href: '/bd/pipeline', label: 'Pipeline', badgeKey: null },
  { href: '/bd/imports', label: 'Imports', badgeKey: null },
  { href: '/bd/replies', label: 'Replies', badgeKey: null },
] as const

// Ops nav items — fully wired in Phase 3
const OPS_NAV = [
  { href: '/ops/clients', label: 'Clients', badgeKey: null },
  { href: '/ops/requisitions', label: 'Requisitions', badgeKey: null },
  { href: '/ops/interviews', label: 'Interviews', badgeKey: null },
] as const

// Supply nav items — unlocked in Phase 4
// NOTE: no Shortlists route in Supply nav; shortlist review lives at /ops/requisitions/[id]
const SUPPLY_NAV = [
  { href: '/supply/search', label: 'Candidates' },
  { href: '/supply/ingest', label: 'Ingest' },
  { href: '/supply/engagements', label: 'Engagements' },
] as const

// Admin nav items — unlocked in Phase 4
const ADMIN_NAV = [
  { href: '/admin', label: 'Admin' },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  // Lead queue count for badge (stale 60s — badge doesn't need to be fresh)
  const { data: leadsData } = useQuery({
    queryKey: ['leads-count'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
        params: { query: { status: 'review_queue', limit: 1 } },
      })
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })

  const leadsCount = leadsData?.total ?? 0

  return (
    <nav
      className="flex w-56 shrink-0 flex-col border-r border-border/70 bg-[var(--color-sidebar)]/95 shadow-2xl shadow-black/20"
      aria-label="Console navigation"
    >
      {/* Brand mark header */}
      <div className="flex h-14 items-center border-b border-border/70 px-4">
        <span className="text-base font-semibold tracking-[-0.03em]">Brynzit</span>
      </div>

      {/* BD section */}
      <div className="flex flex-col px-2 py-3">
        <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          BD
        </span>
        {BD_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const badgeCount =
            item.badgeKey === 'leads-count'
              ? leadsCount
              : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition-[background-color,color,box-shadow] duration-150',
                'hover:bg-accent/70 hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/14 text-foreground font-medium shadow-[inset_2px_0_0_var(--color-primary)]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto min-w-[20px] border-primary/20 bg-primary/10 text-center text-xs text-primary"
                >
                  {badgeCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>

      {/* Ops section */}
      <div className="flex flex-col px-2 py-3">
        <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ops
        </span>
        {OPS_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition-[background-color,color,box-shadow] duration-150',
                'hover:bg-accent/70 hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/14 text-foreground font-medium shadow-[inset_2px_0_0_var(--color-primary)]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Supply section — unlocked in Phase 4 */}
      <div className="flex flex-col px-2 py-3">
        <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Supply
        </span>
        {SUPPLY_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition-[background-color,color,box-shadow] duration-150',
                'hover:bg-accent/70 hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/14 text-foreground font-medium shadow-[inset_2px_0_0_var(--color-primary)]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Admin section — unlocked in Phase 4 */}
      <div className="flex flex-col px-2 py-3">
        <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </span>
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-2 text-sm transition-[background-color,color,box-shadow] duration-150',
                'hover:bg-accent/70 hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/14 text-foreground font-medium shadow-[inset_2px_0_0_var(--color-primary)]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
