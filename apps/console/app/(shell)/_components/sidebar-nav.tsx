'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Bookmark,
  Bot,
  Briefcase,
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
import { useCan } from '@brynzit/identity'
import { capabilityForRoute } from '../_lib/route-capabilities'

const PRIMARY_ICONS = [Send, UsersRound, LayoutDashboard, CalendarDays, Inbox, Share2, Bot] as const
const INTERNAL_OPS_ICONS = [
  PanelLeftClose,
  UsersRound,
  ClipboardList,
  CalendarDays,
  Search,
  UploadCloud,
  ShieldCheck,
  Bot,
] as const

function SidebarDivider() {
  return <div className="mx-1 my-3 h-px shrink-0 bg-[#ECEAE4]" />
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 pb-1 text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">
      {children}
    </span>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const can = useCan()
  const canSeeInternalOps = can('internal_ops.view')
  const isSubmitActive = pathname === '/submit' || pathname.startsWith('/supply/ingest')

  // Reads the SAME map the route-level guards in each layout.tsx enforce (see
  // _lib/route-capabilities.ts), so a nav link and its destination page can no
  // longer disagree about who may see a route — which is exactly how a
  // recruiter previously found "Admin Panel" hidden from the nav while
  // `/admin` rendered fine if they typed the URL directly.
  function canAccessRoute(href: string): boolean {
    const required = capabilityForRoute(href)
    return required === null || can(required)
  }

  return (
    <nav
      aria-label="Recruiter portal navigation"
      className="flex h-full w-[232px] shrink-0 flex-col overflow-y-auto border-r border-[#ECEAE4] p-3"
    >
      <div className="flex flex-col gap-1">
        <Link
          href="/submit"
          aria-current={isSubmitActive ? 'page' : undefined}
          className={cn(
            'mb-3 flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90',
            isSubmitActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
        >
          <Send className="size-4" />
          Submit Candidate
        </Link>

        <div className="flex flex-col gap-1">
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
                icon={<Icon className="size-[18px]" />}
                isActive={isActive}
              />
            )
          })}
        </div>
      </div>

      <SidebarDivider />

      <div className="flex flex-col gap-1">
        <SidebarSectionLabel>Candidate Stages</SidebarSectionLabel>
        {SIDEBAR_STAGE_ITEMS.map((item) => {
          const requestedStage = searchParams.get('stage')
          const isRejectedItem = item.href.includes('stage=rejected')
          const isActive =
            pathname === '/pipeline' &&
            (isRejectedItem ? requestedStage === 'rejected' : requestedStage !== 'rejected')
          return (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<UsersRound className="size-[18px]" />}
              isActive={isActive}
            />
          )
        })}
      </div>

      <SidebarDivider />

      <div className="flex flex-col gap-1">
        <SidebarSectionLabel>My Work</SidebarSectionLabel>
        <SidebarLink
          href="/my-roles"
          label="My Roles"
          icon={<Briefcase className="size-[18px]" />}
          isActive={pathname === '/my-roles'}
        />
        {canAccessRoute('/bookmarks') && (
          <SidebarLink
            href="/bookmarks"
            label="Bookmarks"
            icon={<Bookmark className="size-[18px]" />}
            isActive={pathname === '/bookmarks'}
          />
        )}
        <SidebarLink
          href="/rewards"
          label="Referrals"
          icon={<CircleDollarSign className="size-[18px]" />}
          isActive={pathname === '/rewards'}
        />
      </div>

      {canSeeInternalOps && (
        <div className="mt-auto flex flex-col">
          <SidebarDivider />
          <div className="flex flex-col gap-1">
            <SidebarSectionLabel>Internal Ops</SidebarSectionLabel>
            {INTERNAL_OPS_ITEMS.map((item, index) => {
              const Icon = INTERNAL_OPS_ICONS[index]
              if (!canAccessRoute(item.href)) return null
              const activePrefixes = item.activePrefixes ?? [item.href]
              const isActive = activePrefixes.some(
                (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
              )
              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<Icon className="size-[18px]" />}
                  isActive={isActive}
                />
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

function SidebarLink({
  href,
  label,
  icon,
  isActive,
}: {
  href: string
  label: string
  icon: React.ReactNode
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-3 rounded-md px-3 text-[15px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground',
        isActive && 'bg-secondary font-semibold text-foreground',
      )}
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}
