# Requisition Lifecycle & Notifications

Status: implemented on `frontend-dev` · Last updated: 2026-08-16

Two console-facing additions: (1) an Account Manager/Admin can close or fill
a requisition, and ask an assigned recruiter for more candidates on a
still-open one; (2) a real notification bell in the shell top nav, replacing
what was a dead, non-functional button. This is the frontend half of the
backend feature documented at
`../talent-platform/docs/requisition-lifecycle-and-notifications.md` — read
that doc first for the full API contract (the closed/filled 409 gate's exact
placement, the `ops_notifications` model/indexes, idempotent read semantics);
this doc covers the console UI built on top of it.

## 1. Close Position + Request More Candidates

`apps/console/app/(shell)/ops/requisitions/[id]/_components/lifecycle-controls.tsx`
(`RequisitionLifecycleControls`), rendered next to the status badge in
`page.tsx`'s header — self-gated on `useCan()('requisition.manage')` (AM +
Admin), same pattern as the moved `AssignedRecruitersCard`.

- **Request More Candidates** — calls `requestMoreCandidates(reqId)`
  (`_lib/lifecycle.ts`, `POST .../request-more-candidates`, no body). Toasts
  the notified-recruiter count, e.g. "Notified 1 recruiter." or "No recruiter
  is currently assigned to this role." when `notified_count === 0`. Disabled
  once the requisition is `closed`/`filled`.
- **Close Position** — opens a `Dialog` (from `@brynzit/ui`, not a native
  `confirm()` — this app's convention for hard-to-reverse actions, see
  `docs/recruiter-shortlist-categorization.md`'s Submit Applications section
  for the same pattern) offering both terminal choices, **Mark Filled** and
  **Mark Closed**, plus Cancel. Confirming calls
  `updateRequisitionStatus(reqId, status)` (`PATCH .../status`), toasts
  success, and invalidates the `['ops-requisition', reqId]` query. Disabled
  once already `closed`/`filled` (backend enforces no-reopen with a 409;
  matches).
- Once `closed`/`filled`: both controls hide behind the same
  `isRequisitionTerminal(status)` check
  (`_lib/match-status.ts`), and the existing **Run Match** button on this
  page needed no change — `canTriggerCandidateMatch` already only allows
  `open`/`matching_complete`, so closed/filled were already excluded.
  `isRequisitionTerminal` is kept as its own function rather than folded into
  `canTriggerCandidateMatch`, since the two checks answer different
  questions (matchable vs. terminal) even though they happen to be exact
  complements for the four known statuses — covered by
  `apps/console/src/__tests__/requisition-lifecycle.test.ts`.
- `my-roles/[id]/page.tsx`'s locally-duplicated `MATCHABLE_STATUSES` set
  needed no change — it already only lists `open`/`matching_complete`, by
  construction excluding `closed`/`filled` the same way.

### Data layer

`ops/requisitions/[id]/_lib/lifecycle.ts` — native `fetch`, not `apiClient`
(neither `/status` nor `/request-more-candidates` are in the generated
`api.d.ts` yet), same convention as `my-roles/[id]/_lib/shortlist.ts`:

- `updateRequisitionStatus(reqId, status)` → `PATCH
  /api/v1/ops/requisitions/{req_id}/status`
- `requestMoreCandidates(reqId)` → `POST
  /api/v1/ops/requisitions/{req_id}/request-more-candidates`

Neither throws a dedicated error class for the closed/filled 409 — unlike
`UnscreenedCandidatesError` on the submit-applications endpoint (which needs
a specific user-facing message), both controls here are already
disabled once terminal, so a 409 on this path is a race-condition safety
net, not a normal flow; a generic "try again" toast on any failure is
enough.

**Not touched**: the backend's closed/filled gate on match-trigger
(`POST .../match`) and assignment-create (`POST /ops/assignments`) — the
existing `matchMutation`/`assignRecruiter` mutations already have generic
`onError` toasts, and neither this page's Run Match button nor
`AssignedRecruitersCard` (moved, not modified — see
`docs/recruiter-shortlist-categorization.md`) needed new gating beyond what
already existed, since both are visually blocked well before a real 409
would occur.

## 2. Notification bell

`apps/console/app/(shell)/_components/notification-bell.tsx`
(`NotificationBell`), replacing `top-nav.tsx`'s previously dead `<Bell>`
button (no `onClick`, no badge). Works regardless of which page is open,
since `top-nav.tsx` is part of the shell layout; `actingUser` comes from
`useActingUser()` (`@brynzit/identity`), same source every other shell-level
identity-aware component uses.

- Polls `GET /api/v1/ops/notifications?user_id={actingUser.id}&unread_only=true`
  every **30s** (`_lib/notifications.ts::fetchUnreadNotifications`) —
  deliberately slower than the 15s data-freshness polls elsewhere (BD
  pipeline, recruiter shortlist): this is a lower-urgency alert badge, not
  live work data.
- Badge = unread count, rendered with the existing `Badge` component
  (`variant="destructive"`, matching the error-red status color already used
  elsewhere) absolutely positioned over the bell icon — no new visual
  language, reuses the same primitive the rest of the app already ships.
  Caps the displayed number at "9+".
- Clicking the bell opens a `Popover` (same primitive as the BD snooze
  popover) listing notifications — message + `toLocaleString()` timestamp —
  each with its own mark-read button
  (`POST /api/v1/ops/notifications/{id}/read`,
  `_lib/notifications.ts::markNotificationRead`), plus a single "Mark all
  read" action when there's more than one unread. Either path invalidates the
  notification query so the badge and list update immediately.
- No pure-logic helper was extracted for the bell itself — the unread count
  is just `notifications.length` (the backend already filters
  `unread_only=true` server-side) and the "9+" cap is a one-line ternary, both
  trivial enough not to warrant a separate tested function.

### Data layer

`apps/console/app/(shell)/_lib/notifications.ts` — native `fetch`, same
convention as above (`GET /ops/notifications`, `POST
/ops/notifications/{id}/read` aren't in `api.d.ts` yet):

- `fetchUnreadNotifications(userId)`, `markNotificationRead(notificationId)`,
  `notificationQueryKey(userId)`.

## 3. JD parse failure is now visible

Creating a requisition with pasted JD text POSTs
`/api/v1/ops/requisitions/{req_id}/parse-jd` from the `createMutation`
`onSuccess` in `apps/console/app/(shell)/ops/requisitions/page.tsx`.

There were two failure paths and only one of them told the user anything:

| Path | Detection | Before | Now |
|---|---|---|---|
| Parse starts, then stalls | `useAsyncJob` phase → `failed` | `toast.error` | unchanged |
| POST itself fails (non-2xx) | `error` truthy on the POST | silent `router.push` | `toast.error` + `router.push` |

The second path is the one that mattered in production. The endpoint is
declared `202` but `parse_jd_for_requisition` is awaited inline, so an LLM
failure surfaces as a **500 on the POST** — `useAsyncJob` never starts, the
phase never reaches `failed`, and the recruiter landed on a requisition with
empty `title`/`seniority`/`skills` and no indication anything had gone wrong.
The only trace was a `status="error"` row in Admin → Agent Events.

Both paths reuse the same copy — *"JD parsing failed — fill fields manually."*
— because the recruiter's next action is identical either way. The
requisition is always created; only enrichment is lost.

Root cause of the production incident was backend-side (Groq retired the
pinned model); see `../talent-platform/docs/platform-hardening.md`
§ Provider model retirement.

## MSW mocks

New `packages/mocks/src/handlers/notifications.ts` (registered in
`index.ts`/`browser.ts`/`node.ts` alongside the other handler modules) backs
`GET /ops/notifications` and `POST /ops/notifications/{id}/read` with an
in-memory seeded list (one unread notification for `usr_recruiter`) —
idempotent read (marking an already-read notification read again is a
no-op), `unread_only`/`user_id` filtering, matching the live contract.
Exports `addNotification(userId, requisitionId, message)` so other handlers
can create real notifications.

`packages/mocks/src/handlers/ops.ts` gains the status-PATCH and
request-more-candidates handlers, both checking a small
`currentRequisitionStatus(id)` helper against the existing
`requisitionOverrides` map (seeded: `req000000002` starts `filled`,
everything else `open`) for the closed/filled 409. Request-more-candidates
looks up assignees via `assignments.ts`'s now-exported `assigneesFor(reqId)`
and calls `addNotification` for each — so in
`NEXT_PUBLIC_API_MOCKING=enabled` dev mode, an AM clicking "Request More
Candidates" on the seeded `req000000001` (which has `usr_recruiter`
assigned) makes that recruiter's bell light up end to end, no manual seeding
needed.

## Tests

`apps/console/src/__tests__/requisition-lifecycle.test.ts` — pure-logic only
(`.ts`, not `.tsx`, per the known Vitest/JSX transform bug for new `.tsx`
files, `apps/console/CLAUDE.md` gotcha #3): `isRequisitionTerminal` and its
complementarity with `canTriggerCandidateMatch` across all four known
statuses. No render test for the lifecycle controls, the bell, or the
popover.

## Verification

`pnpm --filter @brynzit/console exec tsc --noEmit` and
`pnpm --filter @brynzit/console exec vitest run` both clean.
