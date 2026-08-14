# Recruiter Role Assignment

Status: implemented on `frontend-dev` · Last updated: 2026-08-14

An Account Manager or Admin assigns recruiters to a requisition from the
requisition detail page; the recruiter's **My Roles** view and dashboard show
only assigned roles. This closes the gap where assignment was read-only and
seeded by hand — see `../talent-platform/docs/recruiter-assignments.md` for the
backend half (endpoints, idempotency, tests).

## UI

`apps/console/app/(shell)/ops/requisitions/[id]/_components/assigned-recruiters-card.tsx`,
rendered between the requisition fields and the hiring-process panel.

- **Everyone** who can reach the page (`internal_ops.view`) sees the assignee
  list — read-only badges.
- **`requisition.manage` holders** (Account Manager, Admin) additionally get a
  remove (×) button per assignee and a recruiter picker + Assign button. The
  picker offers only recruiter-role users not already assigned
  (`assignableRecruiters()`); it disappears when every recruiter is assigned.
- Recruiter options come from `@brynzit/identity`'s `SEED_USERS` (the same
  no-auth seed the identity switcher uses). When real auth ships, only the user
  source changes.

## Data layer

`apps/console/app/(shell)/_lib/assignments.ts` — native fetch (these paths are
served live but the generated `api.d.ts` predates the write endpoints):

- `fetchRequisitionAssignees(reqId)` → `GET /api/v1/ops/requisitions/{id}/assignees`
- `assignRecruiter(userId, reqId)` → `POST /api/v1/ops/assignments` (idempotent)
- `unassignRecruiter(userId, reqId)` → `DELETE /api/v1/ops/assignments` (idempotent)
- Query keys: `assignmentQueryKeys.forRequisition(reqId)` for the card,
  `forUser(userId)` for My Roles/dashboard. Both are invalidated after every
  mutation so a recruiter's My Roles updates without a reload.

## Mocks

`packages/mocks/src/handlers/assignments.ts` mirrors the live contract
(idempotent POST/DELETE against an in-memory map, requisition-side assignees
GET) for `NEXT_PUBLIC_API_MOCKING=enabled` runs.

## Tests

- Frontend: `apps/console/src/__tests__/assignments.test.ts` —
  `assignableRecruiters` filtering (recruiter-role only, excludes assigned,
  empty when exhausted). Written as `.ts` due to the known new-`.tsx`-file
  Vitest transform bug (see `docs/console-admin-and-rbac.md` §5).
- Backend: `tests/ops/test_assignments.py` in `../talent-platform` — full write
  lifecycle + 404.
