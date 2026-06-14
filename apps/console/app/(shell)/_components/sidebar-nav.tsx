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
  { href: '/bd/replies', label: 'Replies', badgeKey: 'replies-count' as const },
] as const

// Ops nav items — fully wired in Phase 3
const OPS_NAV = [
  { href: '/ops/clients', label: 'Clients', badgeKey: null },
  { href: '/ops/requisitions', label: 'Requisitions', badgeKey: null },
  { href: '/ops/interviews', label: 'Interviews', badgeKey: null },
] as const

// Stub sections — dimmed, not clickable
const STUB_SECTIONS = [
  { label: 'Supply', items: ['Candidates', 'Shortlists', 'Engagements'] },
  { label: 'Admin', items: ['Costs', 'Events', 'Quotas', 'Prompts'] },
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

  // Snoozed wake badge count (MSW stub — no live endpoint)
  const { data: wakeData } = useQuery({
    queryKey: ['snoozed-wake-count'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/leads/snoozed-wake-count`,
      )
      if (!res.ok) return { count: 0 }
      return res.json() as Promise<{ count: number }>
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Check every 5 min
  })

  // Reply tasks count (MSW stub — no live endpoint)
  const { data: tasksData } = useQuery({
    queryKey: ['replies-count'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/tasks`,
      )
      if (!res.ok) return { tasks: [] }
      return res.json() as Promise<{ tasks: { category: string }[] }>
    },
    staleTime: 60 * 1000,
  })

  const leadsCount = leadsData?.total ?? 0
  const wakeCount = wakeData?.count ?? 0
  const repliesCount = tasksData?.tasks?.filter((t) => t.category === 'interested').length ?? 0

  return (
    <nav
      className="flex w-56 flex-col border-r border-border bg-[var(--sidebar)] shrink-0"
      aria-label="Console navigation"
    >
      {/* Brand mark header */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-base font-semibold tracking-tight">Brynzit</span>
        {/* BD-08: Wake badge — show when snoozed leads have woken */}
        {wakeCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-auto text-xs bg-[oklch(0.769_0.188_85.87)/20] text-[oklch(0.769_0.188_85.87)] border-[oklch(0.769_0.188_85.87)/40]"
          >
            {wakeCount}
          </Badge>
        )}
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
              : item.badgeKey === 'replies-count'
                ? repliesCount
                : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent/50 text-foreground font-medium border-l-2 border-primary pl-[6px]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto min-w-[20px] text-center text-xs text-primary"
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
                'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent/50 text-foreground font-medium border-l-2 border-primary pl-[6px]'
                  : 'text-muted-foreground',
              )}
            >
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Stub sections — dimmed, cursor-not-allowed */}
      {STUB_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col px-2 py-3 opacity-40">
          <span
            className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            title="Coming in a future phase"
          >
            {section.label}
          </span>
          {section.items.map((item) => (
            <div
              key={item}
              className="flex h-9 cursor-not-allowed items-center rounded-md px-2 text-sm text-muted-foreground"
              title="Coming in a future phase"
              aria-disabled="true"
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </nav>
  )
}
