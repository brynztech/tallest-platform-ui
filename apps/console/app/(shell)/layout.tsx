// No 'use client' — Server Component
import { SidebarNav } from './_components/sidebar-nav'
import { TopNav } from './_components/top-nav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <main className="bg-background min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
