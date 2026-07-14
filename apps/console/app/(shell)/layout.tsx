// No 'use client' — Server Component
import { SidebarNav } from './_components/sidebar-nav'
import { TopNav } from './_components/top-nav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,var(--color-background),oklch(0.965_0.012_261))]">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 overflow-y-auto bg-transparent">{children}</main>
      </div>
    </div>
  )
}
