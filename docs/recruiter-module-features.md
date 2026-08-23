# Recruiter Module — Six-Feature Extension (console)

Landed 2026-08-23. Backend counterpart and API contract:
`../../talent-platform/docs/recruiter-module-features.md` (plus `FEATURE_SPEC.md` /
`API_CHANGES.md` / `NOTIFICATION_EVENTS.md` at that repo's root). Frontend test plan:
[../TEST_PLAN.md](../TEST_PLAN.md).

## What changed in this repo

- **JD upload intake** — `create-requisition-wizard.tsx` gained an "Upload existing JD" mode
  (client-side type/size validation → `uploadJdDocument` in `_lib/create-requisition.ts` →
  editable review of parsed seniority/skills/comp + title choice → edits PATCHed on publish).
  Generate mode unchanged.
- **Submit state** — `my-roles/[id]`: submitted cards render categorization actions disabled
  (not hidden) with an "Already submitted on {date}" title; the Submit Applications button
  carries a per-state disabled reason. Segmentation stays server-driven (`submitted_at`).
- **CTC/ECTC** — `CompensationRow` in `shortlist-candidate-card.tsx` (display + inline edit
  with validation); data layer `updateCandidateCompensation` in `my-roles/[id]/_lib/shortlist.ts`.
  Comp fields added to `SubmissionResponseExtended` and `ShortlistSubmission`.
- **Notifications** — no UI change needed; `NotificationResponse` gained optional
  `notification_type`/`payload` (bell keeps rendering `message`; payload enables future
  deep-linking).
- **Pipeline scoping** — `/pipeline` filters its requisition picker to the acting user's
  assignments for non-`role.view_all` users and sends `acting_user_id` on shortlist fetches
  (server enforces 403); query keys include the acting user to prevent persona-switch cache
  leaks. `assignRecruiter` now records `assigned_by`.
- **Mocks** — new MSW handlers: ops 11a (`jd/upload`), supply 7b (`compensation`).

## Conventions followed

Native fetch for endpoints absent from the generated `api.d.ts` (apps/console/CLAUDE.md gotcha
\#5); `useActingUser`/`useCan` for every role decision; native `title` for disabled-button
explanations (no Tooltip primitive exists in this repo — deliberate reuse of the existing
precedent in `pipeline-candidate-card.tsx`); scoped calls omit `acting_user_id` for
`role.view_all` users, who have no assignment rows.

## Round 2 — Document previews + JD-derived hiring process (2026-08-23)

- `jd-panel.tsx`: three faces — generated preview (canonical when present), uploaded-JD
  exact-text preview (badge "uploaded", Download original, "Generate formatted version"
  prefilled with the uploaded text), generation form.
- `candidate-profile-sheet.tsx`: "View Resume" opens the stored file via a presigned URL
  (`_lib/documents.ts`, fetched on click, popup-blocker-safe); older candidates show
  "file not stored — parsed profile only".
- Wizard review step shows the JD-extracted hiring process (mirrors backend mapping).
- Terraform (`infra/terraform/ec2-basic`): documents bucket + IAM; instances AMI-pinned via
  lifecycle ignore_changes.
- MSW: handlers for resume-url, jd/original-url, interview_process in the upload mock.

## Round 4 — Requisition scoping everywhere + pipeline read/write capability (2026-08-23)

- **`useScopedRequisitions`** (`app/(shell)/_lib/`): one hook returning the requisitions the
  acting user may act on — assignment-filtered for recruiters (via `visibleByAssignment` from
  `@brynzit/recruiting`), unfiltered for `role.view_all`. Now the single source for `/submit`,
  `/clients`, `/cross-list`, and `/pipeline`; `/jobs` and `/rewards` intentionally keep the full
  browse list. Fixes recruiters seeing every client's roles in the Submit Candidate picker.
- **`pipeline.advance` capability** (`packages/identity`): held by account_manager /
  quality_manager / admin, not recruiter. `/pipeline` renders the read-only
  `CandidatePipelineCard` for every column without it, with a "View only" badge and copy naming
  who advances stages. Recruiters watch their submitted candidates move and are notified on
  every change (backend NOTIFICATION_EVENTS.md); the AM who owns the role drives the stages.
  UI gating only — the backend has no role concept to enforce against (see backend
  FEATURE_SPEC.md Feature 6).

## Round 5 — Read-only pipeline polish + folder ingest (2026-08-23)

- **Pipeline read-only card**: "Review Shortlist" now renders only for users holding
  `internal_ops.view` — it opens the Ops requisition page, so offering it to a recruiter just
  dead-ended them in the Access Restricted panel. Notes are readable instead:
  `SubmissionNotesPopover` gained a `readOnly` prop that hides the composer, so recruiters follow
  the conversation on their candidates without being able to write.
- **Supply ingest folder upload**: the resume form has an "Upload files" / "Upload folder"
  toggle. Folder mode uses the native `webkitdirectory` input (no dependency added) and filters
  through `_lib/resume-files.ts` — `webkitdirectory` returns every file under the folder
  recursively, so unsupported types and dotfiles are dropped and reported ("12 resumes found ·
  3 other files skipped") rather than silently queued. The accept map is now defined once and
  shared with the dropzone. Upload/poll path is unchanged: one job card per resume.
