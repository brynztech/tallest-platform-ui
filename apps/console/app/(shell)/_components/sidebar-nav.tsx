'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  PanelLeftClose,
  Search,
  Send,
  ShieldCheck,
  Share2,
  UploadCloud,
  UsersRound,
} from 'lucide-react'
import {
  INTERNAL_OPS_ITEMS,
  SIDEBAR_PRIMARY_ITEMS,
  SIDEBAR_STAGE_ITEMS,
} from '../_lib/recruiter-portal'
import { cn } from '@brynzit/ui/lib/utils'

const PRIMARY_ICONS = [Send, UsersRound, LayoutDashboard, CalendarDays, Inbox, Share2, Bot] as const
const INTERNAL_OPS_ICONS = [
  PanelLeftClose,
  UsersRound,
  ClipboardList,
  CalendarDays,
  Search,
  UploadCloud,
  ShieldCheck,
] as const

export function SidebarNav() {
  const pathname = usePathname()
  const isSubmitActive = pathname === '/submit' || pathname.startsWith('/supply/ingest')

  return (
    <nav
      className="border-border/60 bg-card flex w-56 shrink-0 flex-col border-r"
      aria-label="Recruiter portal navigation"
    >
      <div className="flex flex-col gap-2 p-3">
        <Link
          href="/submit"
          className={cn(
            'bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold shadow-sm transition-colors duration-150 ease-out',
            isSubmitActive && 'ring-primary/30 ring-2 ring-offset-2',
          )}
        >
          <Send className="size-4" />
          Submit Candidate
        </Link>

        <div className="mt-3 flex flex-col gap-1">
          {SIDEBAR_PRIMARY_ITEMS.slice(1).map((item, index) => {
            const Icon = PRIMARY_ICONS[index + 1]
            const activePrefixes = item.activePrefixes ?? [item.href]
            const isActive = activePrefixes.some(
              (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
            )
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<Icon className="size-4" />}
                isActive={isActive}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 py-2">
        <span className="text-muted-foreground px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide">
          Candidate Stages
        </span>
        {SIDEBAR_STAGE_ITEMS.map((item) => {
          const isActive = pathname === '/pipeline'
          return (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<UsersRound className="size-4" />}
              isActive={isActive}
            />
          )
        })}
      </div>

      <div className="px-3 py-2">
        <SidebarLink
          href="/rewards"
          label="Referrals and Promotions"
          icon={<CircleDollarSign className="size-4" />}
          isActive={pathname === '/rewards'}
          variant="outline"
        />
      </div>

      <div className="border-border/60 mt-auto flex flex-col gap-1 border-t px-3 py-3">
        <span className="text-muted-foreground px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide">
          Internal Ops
        </span>
        {INTERNAL_OPS_ITEMS.map((item, index) => {
          const Icon = INTERNAL_OPS_ICONS[index]
          const activePrefixes = item.activePrefixes ?? [item.href]
          const isActive = activePrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
          return (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<Icon className="size-4" />}
              isActive={isActive}
              compact
            />
          )
        })}
      </div>
    </nav>
  )
}

function SidebarLink({
  href,
  label,
  icon,
  isActive,
  variant = 'default',
  compact = false,
}: {
  href: string
  label: string
  icon: React.ReactNode
  isActive: boolean
  variant?: 'default' | 'outline'
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-9 items-center gap-3 rounded-xl px-3 text-sm transition-[background-color,border-color,color,box-shadow] duration-150 ease-out',
        compact && 'h-8 text-xs',
        variant === 'outline' && 'border-primary/40 text-primary hover:bg-primary/5 border',
        variant === 'default' && 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        isActive && variant === 'default' && 'bg-primary/10 text-primary font-medium',
        isActive && variant === 'outline' && 'bg-primary/10 font-medium',
      )}
    >
      <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  )
}
