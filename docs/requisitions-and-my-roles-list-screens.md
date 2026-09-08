# Requisitions & My Roles list screens

Both `apps/console/app/(shell)/ops/requisitions/page.tsx` and
`apps/console/app/(shell)/my-roles/page.tsx` were rebuilt onto the same
structural pattern: a page-level stat-tile row, a segmented list filter, and
a card-per-row list with per-requisition counts. Previously both pages
rendered a bare title/client/status row with no counts at all.

## Shared pieces (new)

- `(shell)/_components/segmented-control.tsx` — the bordered-pill filter
  control, extracted here since this was its third hand-rolled call site
  (pipeline's Active/Rejected toggle and the shortlist card's
  screening-outcome row are the other two — not migrated to it, out of scope
  for this pass).
- `(shell)/_components/pipeline-stat-tile.tsx` — the eyebrow-label + big
  number + optional colored dot tile, and the 4-tile row wrapper.
- `(shell)/_lib/requisition-pipeline-stats.ts` — fetches
  `GET /ops/requisitions/pipeline-stats` (see the backend repo's
  `docs/requisitions-pipeline-stats.md`) once per page load, returns a `Map`
  keyed by requisition id. `statsFor()` defaults a missing entry to zero — the
  endpoint is sparse.
- `(shell)/_lib/requisition-health.ts` — `computeRequisitionHealth(createdAt,
  status)`, entirely client-side, no backend field. ≤30 days open = on
  track, ≤60 = at risk, beyond = stalled; a paused/closed/filled/draft
  requisition is always stalled regardless of age (product call — it isn't
  progressing full stop, age doesn't matter).
- `(shell)/_lib/requisition-intake.ts` — reads `green_flags`/`red_flags`/
  `generated_jd` out of `Requisition.intake_details` (a loosely-typed JSONB
  blob already returned by the existing requisition endpoints — no backend
  change was needed for these three).

## Deliberately dropped from the reference design

- **"Owner"** — no such concept exists in the schema (`Assignment` has no
  primary/owner flag). Cards show a recruiter *count* only.
- **"Updated Nh ago by X"** — no requisition-edit attribution exists anywhere
  in the codebase (not even the staff audit log, which is login-only today).
  Not shown at all, rather than fabricated.
- **My Roles' footer funnel** — simplified to two real buckets (`screened` /
  `not yet screened`, derived from `shortlist_total` and `not_yet_screened`)
  instead of the reference's four — an "in interview" bucket would need
  classifying `Submission.current_stage_id` against the per-requisition
  hiring-process config, which is real, separate work.

## New Requisition dialog

`ops/requisitions/_components/create-requisition-wizard.tsx`'s **first step
only** (`step === 'form'`) was restyled to match the reference: two-column
Client/Role title and Website/Seniority rows, "Requirement brief" (renamed
from "Requirement paragraph"), and Reference memo / Resdex memo / extra
green-red flags collapsed behind an "Optional context" disclosure. The
preview/assign/done steps are unchanged — not shown in the reference, not
touched.

**Seniority is a new, real field**, not cosmetic: on generate, it's patched
via `PATCH /ops/requisitions/{id}` *after* generation succeeds (generation
writes its own inferred seniority — patching first would get silently
overwritten). On upload, it's patched immediately after parsing, since a
structured upload skips the existing flat-review patch path entirely.

## Verification

Typecheck, build, and the full vitest suite pass. Both pages and the dialog
were exercised against the real running backend in a real browser (a session
JWT minted directly via `platform.staff_auth.create_session_token`, no
password needed) with real seeded data — not simulated.
