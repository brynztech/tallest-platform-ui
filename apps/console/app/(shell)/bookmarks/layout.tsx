import { RequireCapability } from '../_components/require-capability'

// Kept in sync with ROUTE_CAPABILITIES['/bookmarks'] in
// ../_lib/route-capabilities.ts (asserted by a test) and with the sidebar's
// own conditional nav link. Every current role happens to hold
// candidate.bookmark, so this is a no-op today — kept for consistency with the
// sidebar's own conditional, and so a future role without it is enforced here
// automatically rather than only in the nav.
export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return <RequireCapability capability="candidate.bookmark">{children}</RequireCapability>
}
