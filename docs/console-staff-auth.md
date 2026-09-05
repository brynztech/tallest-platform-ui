# Console Staff Auth (Frontend)

Status: implemented on `frontend-dev` · Last updated: 2026-09-04

Real, admin-managed username/password login for `apps/console`, replacing
nothing yet — it runs **alongside** `@brynzit/identity`'s acting-user switcher
(see [console-admin-and-rbac.md](console-admin-and-rbac.md)), not instead of
it. Backend side: `talent-platform`'s `docs/console-staff-auth.md`.

## Why a separate system, for now

The switcher's `useActingUser()`/`useCan()` drive every existing capability
gate in the console (nav visibility, `/admin`, `RequireCapability`). Rewiring
those to a real session is a real, separately-scoped migration — this feature
adds session-based auth (is anyone signed in at all) without touching that
migration, so nothing that already works today changes behavior.

## Mechanism

- `apiClient` (`@brynzit/api-client`) now sends `credentials: 'include'` on
  every request — required so the browser attaches the `staff_session`
  httpOnly cookie the backend sets. Existing ungated endpoint calls are
  unaffected (they never used cookies either way).
- `app/_lib/staff-auth.ts` — typed calls to `/api/v1/auth/*`, called directly
  against the backend (not proxied): that router isn't gated by
  `X-Admin-Token`, same reasoning as `bd`/`ops`/`supply`.
- `app/_lib/staff-auth-context.tsx` — `StaffAuthProvider`/`useStaffAuth()`,
  mounted in `ConsoleProviders` above `IdentityProvider`. One react-query
  fetch of `GET /auth/me` backs `status: 'loading' | 'authenticated' |
  'unauthenticated'` for the whole app.
- `app/_lib/require-staff-session.tsx` — `<RequireStaffSession>`, a client
  component (the session cookie lives on the API's cross-origin, so there is
  no cookie for a server component/middleware to read — same constraint
  `require-capability.tsx` documents for the switcher). Redirects to
  `/signin` (or a custom `signInHref`) while `status !== 'authenticated'`.
  Wraps all of `(shell)/layout.tsx`, so every existing console route
  (`/dashboard`, `/bd`, `/ops`, `/supply`, `/admin`, …) now requires a real
  session first, in addition to whatever the switcher already gated.

## Routes

| Path | Purpose |
|---|---|
| `/` | Public splash — no auth required. Centered "BrinzIT platform" + a Sign in button to `/signin`. Not gated: unauthenticated visitors are meant to land here. |
| `/signin` | Staff sign-in. |
| `/admin/signin` | Separate admin entry point (task requirement) — identical form/backend call, different branding, less discoverable. Both sign-in pages land on `/dashboard`, the real app. |
| `/dashboard` | The actual console — sidebar, top nav, everything that existed before this feature. Reached only via a real session (`RequireStaffSession` wraps all of `(shell)`). |
| `/admin/users` | Admin-only staff user management: create (username/password/role), list, change role, activate/deactivate. Gated by the real session's `role === 'admin'` — the backend's `require_role("admin")` is the actual enforcement; this is UX only. Standalone (outside `(shell)`, to dodge the switcher-gated `(shell)/admin/layout.tsx`), so it carries its own small top bar with a back-to-console link and Sign out. |

Sign-out (`(shell)/_components/sign-out-button.tsx`) does a **hard navigation**
(`window.location.href`), not `router.replace`: clearing the cached session
first would flip the current page's `RequireStaffSession` to
"unauthenticated" while still mounted, and its own `signInHref` (e.g.
`/admin/signin` on `/admin/users`) would race a client-side redirect and
could win — reproduced and fixed during this build. A full page load has no
such race.

## Tests

`e2e/staff-auth.spec.ts` (Playwright, against a real backend + Postgres, not
MSW — skips itself unless `E2E_STAFF_ADMIN_USERNAME`/`E2E_STAFF_ADMIN_PASSWORD`
are set to an existing admin's real credentials):

- `/` shows the splash and its Sign in link works; unauthenticated visitors
  hitting `/dashboard` are redirected to `/signin`
- admin signs in → `/dashboard` (the real console) → creates a user via
  `/admin/users` → that user signs in → is blocked from `/admin/users` →
  admin deactivates them → deactivated user's login fails with the same
  generic error

Run:
```
pnpm --filter @brynzit/console dev
E2E_STAFF_ADMIN_USERNAME=... E2E_STAFF_ADMIN_PASSWORD=... \
  BASE_URL=http://localhost:3000 pnpm --filter @brynzit/console exec playwright test e2e/staff-auth.spec.ts
```

## Known gaps (intentional, not yet in scope)

- The switcher and the real session are unrelated — `/admin` and every other
  switcher-gated route still checks `admin.view` from `@brynzit/identity`,
  independent of the signed-in staff user's real role. Unifying them is a
  separate, explicitly-confirmed change (see the backend doc's "Known
  limitation" for the matching JWT-revocation note).
- No password-change/reset UI yet — an admin resets by deactivating and
  recreating, or a future `PATCH` addition.
