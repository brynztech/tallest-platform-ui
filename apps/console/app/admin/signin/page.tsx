import { StaffSignInForm } from '../../_components/staff-sign-in-form'

// Separate entry point from /signin (task requirement) — same backend login,
// just a distinct, less-discoverable URL. Lands on /dashboard like the
// regular sign-in; admin-only tools live at /admin/users, gated by this real
// session's role (not the switcher's admin.view — see docs/console-staff-auth.md).
export default function AdminSignInPage() {
  return <StaffSignInForm title="Admin sign in" subtitle="Brynzit Console" redirectTo="/dashboard" />
}
