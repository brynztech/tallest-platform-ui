// No 'use client' — Server Component
import { AssistantWidget } from './assistant/_components/assistant-widget'
import { SidebarNav } from './_components/sidebar-nav'
import { TopNav } from './_components/top-nav'
import { RequireStaffSession } from '../_lib/require-staff-session'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStaffSession>
      <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,var(--color-background),oklch(0.965_0.012_261))]">
        <TopNav />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SidebarNav />
          <main className="min-w-0 flex-1 overflow-y-auto bg-transparent">{children}</main>
        </div>
        <AssistantWidget />
      </div>
    </RequireStaffSession>
  )
}
