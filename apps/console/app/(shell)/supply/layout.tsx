import { RequireCapability } from '../_components/require-capability'

// Kept in sync with ROUTE_CAPABILITIES['/supply'] in ../_lib/route-capabilities.ts
// (asserted by a test). Covers /supply/search, /supply/ingest, and
// /supply/engagements (the last has no nav link at all today, but was
// reachable by direct URL with no gate before this).
export default function SupplyLayout({ children }: { children: React.ReactNode }) {
  return <RequireCapability capability="internal_ops.view">{children}</RequireCapability>
}
