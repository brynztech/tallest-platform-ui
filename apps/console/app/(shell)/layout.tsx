// No 'use client' — Server Component
import { AssistantWidget } from './assistant/_components/assistant-widget'
import { SidebarNav } from './_components/sidebar-nav'
import { TopNav } from './_components/top-nav'
import { RequireStaffSession } from '../_lib/require-staff-session'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStaffSession>
      <div className="brynz-page-wash relative flex h-dvh min-h-0 flex-col overflow-hidden">
        <TopNav />
        <div className="flex min-h-0 flex-1">
          <SidebarNav />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
        <AssistantWidget />
      </div>
    </RequireStaffSession>
  )
}
