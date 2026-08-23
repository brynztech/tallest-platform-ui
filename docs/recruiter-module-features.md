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
