# Recruiter Role Assignment

Status: implemented on `frontend-dev` · Last updated: 2026-09-05

An Account Manager or Admin assigns recruiters to a requisition from the
requisition detail page; the recruiter's **My Roles** view and dashboard show
only assigned roles. This closes the gap where assignment was read-only and
seeded by hand — see `../talent-platform/docs/recruiter-assignments.md` for the
backend half (endpoints, idempotency, tests) and
`../talent-platform/docs/console-staff-auth.md` for how real staff identity now
flows into it.

## UI

`apps/console/app/(shell)/my-roles/[id]/_components/assigned-recruiters-card.tsx`
(also rendered on `ops/requisitions/[id]`, which imports the same component).

- **Everyone** who can reach the page (`internal_ops.view`) sees the assignee
  list — read-only badges.
- **`requisition.manage` holders** (Account Manager, Admin) additionally get a
  remove (×) button per assignee and a recruiter picker + Assign button. The
  picker offers only active recruiters not already assigned
  (`assignableRecruiters()`); it disappears when every recruiter is assigned.
- Recruiter options come from `GET /api/v1/auth/users/recruiters` (the
  `recruiters.view` scope — every role can read this minimal, active-only
  list). Replaced `@brynzit/identity`'s old `SEED_USERS` fake directory once
  real staff auth shipped.
- Assigning a recruiter creates an in-app notification for them (see the
  backend's `NOTIFICATION_EVENTS.md`, `requisition_assigned`) — clicking it in
  the bell (`notification-bell.tsx`) jumps straight to `/my-roles/{reqId}`.

## Data layer

`apps/console/app/(shell)/_lib/assignments.ts` — native fetch (these paths are
served live but the generated `api.d.ts` predates the write endpoints):

- `fetchRequisitionAssignees(reqId)` → `GET /api/v1/ops/requisitions/{id}/assignees`
- `assignRecruiter(userId, reqId)` → `POST /api/v1/ops/assignments` (idempotent)
- `unassignRecruiter(userId, reqId)` → `DELETE /api/v1/ops/assignments` (idempotent)
- Query keys: `assignmentQueryKeys.forRequisition(reqId)` for the card,
  `forUser(userId)` for My Roles/dashboard.

**Freshness**: these two assignment queries use a short `staleTime` (15s) and
`refetchOnWindowFocus: true`, overriding the app-wide default of `false`
(`console-providers.tsx`'s `QueryClient`) — someone else can assign you a role
at any time from a different session, so an already-open My Roles/requisition
tab needs to pick that up on tab-focus, not only on a hard refresh or the next
full remount. Every mutation also invalidates both keys for the immediate
mutating-tab case. `my-roles/page.tsx` duplicates this query inline rather
than calling `useScopedRequisitions()` (the shared hook other recruiter-portal
pages use) — the freshness options had to be set in both places since React
Query treats each `useQuery()` call as its own observer even when the cache
key is shared.

## Mocks

`packages/mocks/src/handlers/assignments.ts` mirrors the live contract
(idempotent POST/DELETE against an in-memory map, requisition-side assignees
GET) for `NEXT_PUBLIC_API_MOCKING=enabled` runs.

## Tests

- Frontend: `apps/console/src/__tests__/assignments.test.ts` —
  `assignableRecruiters` filtering (excludes already-assigned; role/active
  filtering is server-side now, not this helper's job). Written as `.ts` due
  to the known new-`.tsx`-file Vitest transform bug (see
  `docs/console-admin-and-rbac.md` §5).
- Backend: `tests/ops/test_assignments.py` in `../talent-platform` — full write
  lifecycle + 404 + 409, plus the `requisition_assigned` notification (fires
  once per new assignee, resolves the assigner's name when `assigned_by` is a
  real staff id, falls back to a generic message otherwise, does not
  duplicate on an idempotent re-assign).
