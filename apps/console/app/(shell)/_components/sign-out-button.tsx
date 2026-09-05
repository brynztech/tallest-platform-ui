'use client'

import { LogOut } from 'lucide-react'
import { staffLogout } from '../../_lib/staff-auth'

/** Real session sign-out — separate from the acting-user switcher, which has
 * no session to sign out of. Lives in top-nav.tsx, part of the shell layout,
 * and admin/users/page.tsx's own bar (that route sits outside the shell). */
export function SignOutButton() {
  return (
    <button
      type="button"
      aria-label="Sign out"
      title="Sign out"
      className="flex size-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm shadow-slate-200/60 transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={async () => {
        await staffLogout()
        // Hard navigation, not router.replace: clearing the query cache
        // first would flip the current page's RequireStaffSession to
        // "unauthenticated" while it's still mounted, and its own
        // signInHref (e.g. /admin/signin on admin/users) would race a
        // client-side replace and could win. A full page load has no such
        // race — the whole React tree (and its stale session state) is gone
        // before anything re-fetches.
        window.location.href = '/signin'
      }}
    >
      <LogOut className="size-4" />
    </button>
  )
}
