'use client'

import Link from 'next/link'
import { RequireStaffSession } from '../../_lib/require-staff-session'
import { useStaffAuth } from '../../_lib/staff-auth-context'
import { SignOutButton } from '../../(shell)/_components/sign-out-button'
import { UserManagementPanel } from './_components/user-management-panel'

// Standalone (outside the (shell) route group) so it isn't nested under
// (shell)/admin/layout.tsx's switcher-driven admin.view gate — see
// docs/console-staff-auth.md. That means no shared TopNav, so this small bar
// replaces it: a way back to the app and a way to sign out.
export default function AdminUsersPage() {
  return (
    <RequireStaffSession signInHref="/admin/signin">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-white/90 px-4 shadow-sm shadow-slate-200/70">
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to console
        </Link>
        <SignOutButton />
      </header>
      <AdminOnlyGate />
    </RequireStaffSession>
  )
}

// Checked against the REAL session role (platform.staff_auth.require_role
// enforces this server-side too — this is UX, not the security boundary).
function AdminOnlyGate() {
  const { user } = useStaffAuth()

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm font-medium">This page isn&apos;t available to your role.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only admins can manage staff users.
        </p>
      </div>
    )
  }

  return <UserManagementPanel />
}
