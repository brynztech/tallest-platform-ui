# Recruiter Shortlist Categorization

Status: implemented on `frontend-dev` · Last updated: 2026-08-15

A recruiter-facing requisition detail page where a recruiter runs AI matching
on a role assigned to them, then screens/categorizes each shortlisted
candidate (Interested / Not Interested / No Response / Snoozed / Rejected)
before anything reaches the Account Manager/Quality Manager for final
client-facing approval. This is the frontend half of the backend feature
documented at `../talent-platform/docs/recruiter-shortlist-categorization.md`
(status vocabulary, snooze state machine, `include_pending` visibility split,
`MAX_SHORTLIST_SIZE`) — read that doc first for the API contract; this doc
covers the console UI built on top of it.

## Route

`apps/console/app/(shell)/my-roles/[id]/page.tsx` — separate from the
existing Account-Manager/Ops-facing `/ops/requisitions/[id]` (gated behind
`internal_ops.view`, with client/hiring-process/interviews/placements
sections a recruiter should never manage). `/my-roles/[id]` is intentionally
a different page, not a retrofit of that one — a recruiter never sees the
Ops sections, and the Ops page's AM-facing behavior is unchanged.

`/my-roles` itself has **no capability gate** (every role can reach it — see
`app/(shell)/_lib/route-capabilities.ts`'s comment listing every recruiter-
portal route this applies to), and `/my-roles/[id]` deliberately keeps that:
it is **not** added to `route-capabilities.ts`. Enforcement is
assignment-based, not capability-based, done entirely inside the component —
see below. Don't mistake the absence of a `route-capabilities.ts` entry for a
gap; it's the intended design for this route.

`app/(shell)/my-roles/page.tsx`'s list now links a recruiter (`!canViewAll`)
to `/my-roles/{id}` instead of `/ops/requisitions/{id}` — the latter 403s via
`RequireCapability` for anyone without `internal_ops.view`, which is every
recruiter, so the existing link was effectively dead for its main audience.
Account Managers/Admins (`canViewAll`) keep the original `/ops/requisitions`
link, unchanged.

## Assignment-scoped access (client-side, not a route-capabilities gate)

`page.tsx`:

```
const { data: assignedIds = [] } = useQuery({
  queryKey: assignmentQueryKeys.forUser(actingUser.id),
  queryFn: () => fetchAssignedRequisitionIds(actingUser.id),
  enabled: !canViewAll,
})
const hasAccess = canViewAll || assignedIds.includes(id)
```

- `canViewAll` (the `role.view_all` capability — Account Manager, Quality
  Manager, Admin) bypasses the check entirely, same as `/my-roles` and the
  recruiter dashboard (`_components/recruiter-dashboard.tsx`).
- Otherwise, the requisition id in the URL must be in
  `fetchAssignedRequisitionIds(actingUser.id)` (existing helper,
  `app/(shell)/_lib/assignments.ts:13`, backed by
  `GET /api/v1/ops/assignments?user_id=`).
- Everything else on the page — the requisition `useQuery` and the shortlist
  `useQuery` — is gated with `enabled: assignmentsResolved && hasAccess`, so
  a recruiter who isn't assigned triggers **no other network calls**, only
  the assignments check itself.
- Without access, the page renders a restricted-access card (same visual
  language as `_components/require-capability.tsx`'s `AccessRestricted`
  panel — a dashed card, `ShieldAlert` icon, explanatory copy, a link back)
  but is its own small block inline in `page.tsx` rather than reusing that
  component directly, since `RequireCapability` is capability-keyed
  (`Capability` enum) and this check is assignment-keyed — a different
  input, same look.

This mirrors this app's documented no-real-auth-in-v1 RBAC model — see
`docs/console-admin-and-rbac.md` §4: there is no server session, so every
gate (capability or, here, assignment) is a client component check against
the "acting user" from the identity switcher. When real auth ships, only the
user source changes; the gate shape here is unaffected.

## Data layer — native fetch, not `apiClient`

`app/(shell)/my-roles/[id]/_lib/shortlist.ts` uses native `fetch`, not the
generated `apiClient`, because `snoozed_until` and the `include_pending`
query param are not yet in this repo's generated `api.d.ts`
(`PatchSubmissionRequest` there is still just `{ status: string; notes?:
string }`, and `SubmissionResponse` has no `snoozed_until` field) — same
native-fetch-for-paths-absent-from-api.d.ts convention documented in
`apps/console/CLAUDE.md` gotcha #5 (there, about multipart uploads; here,
about a field/param the OpenAPI codegen hasn't picked up yet).

- `fetchRecruiterShortlist(reqId)` → `GET /api/v1/supply/shortlists/{id}?include_pending=true`
  — always passes `include_pending=true`, giving the recruiter their full
  working set (not-yet-screened + already-screened-out), as opposed to the
  Account-Manager-facing `ShortlistTable`/`MatchmakerPanel` on
  `/ops/requisitions/[id]`, which call the same endpoint with no param
  (`include_pending=false` default) and only see
  `interested`/`approved`/`rejected`. That AM-page default change is
  intentional and already deployed on the backend — this frontend change
  does not touch it.
- `patchSubmissionStatus(submissionId, body)` → `PATCH
  /api/v1/supply/shortlists/{submission_id}`. Throws `SubmissionConflictError`
  on `409` (already `approved`/`rejected`) so the page can toast and refetch
  instead of leaving a stale status rendered.
- `triggerRecruiterMatch(reqId, actingUserId)` → `POST
  /api/v1/ops/requisitions/{id}/match?acting_user_id=`. Throws
  `MatchNotAssignedError` on `403`.

## Categorization UI

`_components/shortlist-candidate-card.tsx` — one card per submission
(`Card`/`CardContent` from `@brynzit/ui`, same primitive
`ops/requisitions/[id]/_components/shortlist-table.tsx` builds on):

- Candidate name/title, `match_score` colored via the same green
  (≥75) / amber (50–74) / red (<50) gradient as `shortlist-table.tsx`'s
  `scoreColor()` — reimplemented as a small pure function in
  `_lib/status.ts` using the exact `tokens.json` `status_colors` oklch
  values, not new ones.
- A status badge (`_lib/status.ts::statusLabel`/`statusBadgeClass`), reusing
  the same three de facto status colors for Interested/Approved (green),
  Snoozed (amber), Not Interested/Rejected (red).
- **Recruiter actions**: `Interested`, `Not Interested`, `No Response`,
  `Snooze`, `Reject` — each PATCHes with that status (optional inline note
  input, not a full form, per the existing `shortlist-table.tsx` reason-field
  precedent). **`approved` is never offered here** — it stays the Account
  Manager/Quality Manager's own action on the existing `ShortlistTable`,
  unchanged and out of scope for this page.
- Once a submission is `approved` or `rejected` (terminal, backend-enforced),
  the action row disappears — a further PATCH would 409.
- **Interested** candidates get a distinct green border/background and the
  caption "Sent to your Account Manager for review" so the recruiter
  understands what happens next.
- **View Profile** opens the existing `CandidateProfileSheet` (`source=
  "shortlist"`, `submissionId`) unmodified — full candidate profile plus
  `CandidateRelationshipSection`'s prior-submission/placement history, so a
  recruiter can see if this candidate was already placed or rejected
  elsewhere before categorizing.

### Snooze popover

`_components/recruiter-snooze-popover.tsx` is `bd/leads/_components/
snooze-popover.tsx` adapted: same preset-buttons + custom-date-fallback
shape and `d.setMonth(d.getMonth() + N)` date math, but **3 / 6 / 9 month**
presets (`_lib/snooze-presets.ts::SNOOZE_PRESET_MONTHS`) instead of BD's
week/month/quarter — shortlisted candidates come back into rotation on a
longer cadence than BD leads. Confirming a preset or a valid custom date
calls `onSnooze(snoozedUntil)`, which PATCHes
`{ status: "snoozed", snoozed_until: <ISO string> }`. The custom-date "Set"
button is disabled unless the typed date is actually in the future
(`isFutureSnoozeDate`), so the UI can't submit a PATCH the backend would just
`422` back for a missing/past `snoozed_until`.

### 409 handling

Every action/snooze mutation's `onError` checks
`err instanceof SubmissionConflictError`: on a 409 it toasts "This candidate
has already been decided and can no longer be edited." and invalidates the
shortlist query so the card re-renders with the real, current status instead
of silently keeping a stale one on screen.

### Run Match

A single "Run Match" button calls `triggerRecruiterMatch`, disabled while
pending or when the requisition's status isn't matchable (`open` /
`matching_complete` — the same set as
`ops/requisitions/[id]/_lib/match-status.ts::canTriggerCandidateMatch`,
duplicated as a one-line `Set` in `page.tsx` rather than imported across a
sibling route's private `_lib`: App Router route-segment `_lib`/`_components`
folders are conventionally private to their own segment, and re-exporting a
two-function module across that boundary wasn't worth the coupling). On
`403` it toasts "You're not assigned to this role."; on success it toasts and
invalidates the shortlist query. The shortlist query itself polls every 15s
(`refetchInterval: 15_000`) the whole time the page is mounted — the same
static-interval precedent as `bd/pipeline/page.tsx` — so a shortlist that
fills in from an async match run shows up without a manual refresh. No
`useAsyncJob` here: that hook expects a single job resource with a `.status`
field to poll by id, and the shortlist is a list with no such per-job
resource — a plain interval is the simpler fit.

## Submit Applications + Submission History

Once a recruiter has screened everyone on the shortlist, they send the
`interested` candidates to their Account Manager for final review with a
**Submit Applications** button next to Run Match.

- `_lib/shortlist.ts::submitInterestedCandidates(requisitionId)` — POSTs to
  `/api/v1/supply/shortlists/{requisition_id}/submit` (no body). Returns
  `{ submitted_count }`. Throws a new `UnscreenedCandidatesError` on `409`
  (a raw `shortlisted` submission still exists), mirroring the existing
  `SubmissionConflictError`/`MatchNotAssignedError` pattern in the same file.
- `ShortlistSubmission` gained `submitted_at: string | null`.
- `_lib/shortlist.ts::canSubmitApplications(submissions)` — pure client-side
  mirror of the backend's gate (fast feedback before a round-trip, same
  precedent as `isFutureSnoozeDate` pre-validating the snooze rule): enabled
  only when at least one submission is `interested` and none is still raw
  `shortlisted`. Covered by `apps/console/src/__tests__/my-role-detail.test.ts`.
- The button is visually distinct from Run Match (solid success-green,
  `Send` icon) and, because this notifies the Account Manager and can't be
  undone from the recruiter's side, requires a confirm step via a `Dialog`
  from `@brynzit/ui` before firing — not a single accidental click.
- On success: toasts the count (e.g. "3 candidates submitted to your Account
  Manager."). On `UnscreenedCandidatesError`: toasts "Screen every candidate
  before submitting." Either way, the shortlist query is invalidated.
- **Submission History** renders below the active shortlist: submissions
  with `submitted_at != null` are filtered out of the active list (so a
  submitted candidate's action buttons don't linger — its `status` typically
  stays `interested`, which isn't itself terminal) and rendered instead in
  History using `ShortlistCandidateCard`'s new `readOnly` prop, which hides
  the note input and the categorization action row (View Profile stays).
  Status keeps updating live via the same polled shortlist query if the
  Account Manager later approves/rejects it — no extra fetch needed.
  - **Reuse decision**: added `readOnly?: boolean` to `ShortlistCandidateCard`
    rather than a second card component. The prop surface stays a single
    boolean (no new required props, defaults to `false`), and the component
    already branches on `isTerminalStatus`/`isInterested` internally, so one
    more boolean condition (`showActions = !terminal && !readOnly`) reads
    cleanly rather than forking ~140 lines of near-identical markup.

## MSW mocks

`packages/mocks/src/handlers/supply.ts` — the shortlist GET/PATCH handlers
are now backed by a small in-memory `shortlistStore` (keyed by
`requisition_id`) instead of returning a fixed literal every call, so:

- `GET .../shortlists/{id}?include_pending=true` returns every submission
  except `removed`; omitted/`false` filters down to
  `interested`/`approved`/`rejected` only — matching the real backend split.
- `PATCH .../shortlists/{submission_id}` writes back into the same store (so
  a subsequent GET reflects it), 409s if the existing status is already
  `approved`/`rejected`, and stores/clears `snoozed_until` based on whether
  the new status is `snoozed`.

A new handler, `POST .../shortlists/:requisition_id/submit`, writes into the
same `shortlistStore`: 409s if any submission for that requisition is still
`shortlisted`, otherwise stamps `submitted_at` on every currently-`interested`
submission that doesn't already have one and returns the count — idempotent,
same as the live contract (a repeat call with nothing new submits 0).

`packages/mocks/src/handlers/ops.ts`'s match-trigger handler now reads
`acting_user_id` off the query string and 403s via a new
`isUserAssignedToRequisition(userId, reqId)` export from
`packages/mocks/src/handlers/assignments.ts` (same seeded `ASSIGNMENTS` map
`GET /ops/assignments` already uses — `usr_recruiter` is seeded assigned to
`00000000-0000-0000-0000-req000000001`). Response shape on success is now
`{ requisition_id, status: "matching_scheduled" }` (previously `{ status:
"processing" }`), matching the live contract. Omitting `acting_user_id`
(the existing AM-page caller) skips the check, unchanged.

## Tests

`apps/console/src/__tests__/my-role-detail.test.ts` — pure-logic only
(`.ts`, not `.tsx`, per the known Vitest/JSX transform bug for new `.tsx`
files, `apps/console/CLAUDE.md` gotcha #3 / `docs/console-admin-and-rbac.md`
§5): `getSnoozePresetDate`/`snoozePresetLabel`/`isFutureSnoozeDate` from
`_lib/snooze-presets.ts`, `isTerminalStatus`/`statusLabel`/
`statusBadgeClass`/`scoreColor` from `_lib/status.ts`, and
`canSubmitApplications` from `_lib/shortlist.ts`. No render test for the page
or its components.

## Verification

`pnpm --filter @brynzit/console exec tsc --noEmit` and
`pnpm --filter @brynzit/console exec vitest run` both clean.
