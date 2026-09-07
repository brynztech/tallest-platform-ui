'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@brynzit/ui/components/ui/button'
import { staffLogout } from '../../_lib/staff-auth'

/** Real session sign-out — separate from the acting-user switcher, which has
 * no session to sign out of. Lives in top-nav.tsx, part of the shell layout,
 * and admin/users/page.tsx's own bar (that route sits outside the shell). */
export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Sign out"
      title="Sign out"
      className="text-muted-foreground hover:text-foreground"
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
    </Button>
  )
}
