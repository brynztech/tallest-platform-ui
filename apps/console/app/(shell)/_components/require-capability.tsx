'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { ROLE_LABELS, useActingUser, useCan, type Capability } from '@brynzit/identity'

/**
 * Route-level RBAC gate.
 *
 * Until this existed, capability checks only hid the SIDEBAR LINK to a route
 * (see sidebar-nav.tsx) — the destination page itself rendered for anyone who
 * reached it, including by typing the URL directly. A recruiter could not see
 * "Admin Panel" in the nav, but `/admin` worked fine if they navigated there.
 * This closes that gap by checking the same capability at the page itself.
 *
 * A client component, not a server redirect: there is no session yet (trusted-
 * network tool, "acting user" is chosen via the identity switcher — see
 * identity-switcher.tsx), so there is no server-side identity to check against.
 * When real auth ships, only `useActingUser`'s source changes; every call site
 * of this component is unaffected.
 *
 * Renders an explanatory panel rather than silently redirecting: on a trusted
 * internal tool with no real access-control stakes yet, telling someone why a
 * page is unavailable is more useful than making it vanish, and it gives an
 * obvious way back.
 */
export function RequireCapability({
  capability,
  children,
}: {
  capability: Capability
  children: React.ReactNode
}) {
  const can = useCan()
  if (!can(capability)) {
    return <AccessRestricted capability={capability} />
  }
  return <>{children}</>
}

function AccessRestricted({ capability }: { capability: Capability }) {
  const actingUser = useActingUser()

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-lg border border-dashed p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 size-6 text-muted-foreground" />
        <p className="text-sm font-medium">This page isn&apos;t available to your role</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[actingUser.role]} does not include the{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{capability}</code> capability
          this page requires.
        </p>
        <Link
          href="/overview"
          className="mt-4 inline-flex h-9 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium shadow-sm shadow-slate-200/60 transition-colors duration-150 ease-out hover:bg-muted"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  )
}
