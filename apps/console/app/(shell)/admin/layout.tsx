import { RequireCapability } from '../_components/require-capability'

// Kept in sync with ROUTE_CAPABILITIES['/admin'] in ../_lib/route-capabilities.ts
// (asserted by a test) and with the sidebar's own admin.view check.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireCapability capability="admin.view">{children}</RequireCapability>
}
