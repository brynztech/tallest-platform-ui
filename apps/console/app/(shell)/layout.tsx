// No 'use client' — Server Component
import { SidebarNav } from './_components/sidebar-nav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background bg-[radial-gradient(circle_at_80%_0%,oklch(0.22_0.035_35_/_0.35),transparent_34%)]">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto bg-background/70">{children}</main>
    </div>
  )
}
