import { RequireCapability } from '../_components/require-capability'

// Kept in sync with ROUTE_CAPABILITIES['/ops'] in ../_lib/route-capabilities.ts
// (asserted by a test). Covers /ops/clients, /ops/clients/[id],
// /ops/requisitions, /ops/requisitions/[id], /ops/interviews, and
// /ops/quality-review as the blanket minimum — quality-review nests a
// stricter layout on top of this one (see ops/quality-review/layout.tsx),
// exactly as Next.js layouts compose.
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <RequireCapability capability="internal_ops.view">{children}</RequireCapability>
}
