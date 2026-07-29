import { RequireCapability } from '../_components/require-capability'

// Kept in sync with ROUTE_CAPABILITIES['/bd'] in ../_lib/route-capabilities.ts
// (asserted by a test). Covers every /bd/* route (leads, imports, outreach,
// pipeline, replies) — the whole section is hidden in the sidebar without
// internal_ops.view, so it is gated here at the same boundary.
export default function BdLayout({ children }: { children: React.ReactNode }) {
  return <RequireCapability capability="internal_ops.view">{children}</RequireCapability>
}
