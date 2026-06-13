// No 'use client' — Server Component
import { SidebarNav } from './_components/sidebar-nav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
