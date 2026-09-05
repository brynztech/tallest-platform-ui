'use client'

import { IdentityProvider, type Role, type User } from '@brynzit/identity'
import { useStaffAuth } from './staff-auth-context'

// Rendered only during the brief window before a real session resolves.
// Never actually consumed: every route that reads useActingUser()/useCan()
// sits behind RequireStaffSession, which blocks rendering until
// status === 'authenticated' — this exists purely so IdentityProvider always
// has a well-typed User to hand out, with the least-privileged role as the
// safe default if something ever slips through.
const PLACEHOLDER_USER: User = { id: '', name: '', email: '', role: 'recruiter' }

/**
 * Bridges the real backend session (staff-auth-context.tsx) into
 * @brynzit/identity, which is intentionally headless and takes the acting
 * user as a prop rather than sourcing it itself. StaffUserOut has no
 * name/email fields — username stands in for both until the backend grows
 * them (nothing currently reads User.email).
 */
export function IdentityBridge({ children }: { children: React.ReactNode }) {
  const { user } = useStaffAuth()

  const actingUser: User = user
    ? { id: user.id, name: user.username, email: '', role: user.role as Role }
    : PLACEHOLDER_USER

  return <IdentityProvider actingUser={actingUser}>{children}</IdentityProvider>
}
