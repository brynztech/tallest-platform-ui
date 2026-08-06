# Brynzit Console QA Plan

Status: draft manual QA plan for `apps/console`

This file defines the end-to-end QA scenarios we should run against the console after the
backend seed data and environment are stable. It is based on the current console routes,
role/capability model, and implemented UI flows.

## Scope

Console only. Public candidate-site QA belongs in `apps/web`.

Primary source areas:

- Shell/navigation: `app/(shell)/layout.tsx`, `app/(shell)/_components/sidebar-nav.tsx`
- RBAC: `app/(shell)/_lib/route-capabilities.ts`, `@brynzit/identity`
- Job source admin: `app/(shell)/admin/_components/admin-job-sources-tab.tsx`
- BD lead/outreach: `app/(shell)/bd/leads`, `app/(shell)/bd/outreach`, `app/(shell)/bd/replies`, `app/(shell)/bd/pipeline`
- Ops clients/requisitions: `app/(shell)/ops/clients`, `app/(shell)/ops/requisitions`
- Supply: `app/(shell)/supply/ingest`, `app/(shell)/supply/search`, `app/(shell)/supply/engagements`, requisition shortlists
- Quality gate: `app/(shell)/ops/quality-review`
- Tracking: `app/(shell)/ops/interviews`, placements on requisition detail pages, recruiter pipeline

## Personas

Use the identity switcher in the top-right of the console.

- **Recruiter**: can browse jobs, submit candidates, shortlist/bookmark, view assigned role pipeline, and use public recruiter workspace routes. Must not see Internal Ops or Admin.
- **Account Manager**: can manage clients, requisitions, hiring process, internal ops views, candidate shortlist operations, and view quality review in read-only mode. Must not access Admin.
- **Quality Manager**: can view Internal Ops and approve/reject Quality Review submissions, but is not the Admin persona.
- **Admin**: can access everything, including Admin tabs, job-source ingestion, costs, events, quotas, prompts, candidates, and RBAC-protected routes.

## Test Data Prerequisites

Before running the full flow, seed or create:

- At least one tracked job-source company with visible open jobs.
- At least three BD leads: one reviewable lead, one outreach-generation/review lead, and one replied lead.
- At least one client with contact fields.
- At least one open requisition with seniority, skills, compensation, target start date, and hiring process stages.
- At least three candidates with different skills, locations, seniority, and resume/profile completeness.
- At least one shortlisted candidate, one candidate pending quality review, one interview, and one placement.

If a prerequisite is missing, create it through the relevant flow rather than editing mock data directly, unless the test explicitly says it is a seed/setup check.

## Global Smoke Checks

- App loads `/dashboard` without console errors.
- Top nav shows the correct workspace subtitle when switching between recruiter and Internal Ops routes.
- Sidebar selection never shifts the Internal Ops group downward.
- `main` scrolls independently; top nav and sidebar remain stable on long pages.
- Loading, empty, error, active, hover, and disabled states are visible and readable.
- Direct URL access respects route capabilities.
- All destructive or irreversible actions have a confirmation, undo window, or clear toast.

## Route Discoverability And Known Coverage Gaps

These are implemented routes or capability boundaries that QA should explicitly include even when they
are not visible from the current sidebar.

- `/bd/imports`, `/bd/pipeline`, `/bd/outreach`, and `/bd/replies` are gated Internal Ops routes but only `/bd/leads` appears in the sidebar today.
- `/supply/engagements` is implemented and gated but is not currently linked in the sidebar.
- `client.manage`, `requisition.manage`, and `candidate.hard_block` exist in `@brynzit/identity`, but the current UI mostly gates client/requisition CRUD at `internal_ops.view`; QA should flag any mismatch between expected policy and actual access.
- Several existing automated tests include `it.todo` placeholders. Treat this manual QA plan as the source of truth until those are promoted to executable coverage.

## Flow 1: Admin Runs Job Discovery

Persona: Admin

Goal: get jobs into the system and control which ones are visible/prospectable.

Steps:

1. Switch to Admin.
2. Open `/admin?tab=job-sources`.
3. In **Tracked companies**, click **Add starter list**.
4. Confirm companies appear with source, board token, domain, and active status.
5. Open **Add company**, select a source, enter board token, website URL, and display name, then add it.
6. Confirm invalid or incomplete company forms keep **Add company** disabled or show a clear error.
7. Click **Run job search now**.
8. Confirm the button changes to **Running...**, progress updates every polling interval, and counts for fetched/new/updated/closed/out-of-scope jobs are visible.
9. If a run is already active, confirm the UI does not start a duplicate run and shows the backend error clearly.
10. Refresh during an active run.
11. Confirm the page re-adopts the active run and keeps showing progress.
12. In **What candidates can see**, change max age, countries, minimum quality, listed-pay requirement, and blocked title patterns.
13. Confirm the preview updates before saving and warns if rules would hide too many jobs.
14. Save rules.
15. Confirm version/update metadata changes and the saved rules persist after refresh.
16. Confirm **Recent runs** shows status, duration, trigger, new/updated/closed counts, and error count.

Expected result:

- Admin can ingest jobs, inspect run progress, tune visibility rules, and review crawl history.
- Job visibility changes are previewed before commit.
- Candidates/recruiters should not see jobs hidden by current visibility rules.

Regression focus:

- Admin tab switching must keep working after a hard refresh on `/admin?tab=job-sources`.
- Events/admin tabs must not freeze the browser when switching away and back.

## Flow 2: Prospect Client Qualification

Persona: Account Manager or Admin

Goal: filter prospectful clients from BD leads and move them into the right next step.

Steps:

1. Open `/bd/leads`.
2. Confirm lead cards show company, domain, ICP score, contact, title, open-role summary, suggested angle, updated date, and status.
3. Switch between lead status tabs.
4. Open a lead detail panel and confirm the deeper context matches the lead card.
5. Approve a reviewable lead.
6. Confirm the card exits optimistically and the lead leaves the review queue.
7. Reject a lead with a rejection reason.
8. Confirm the reason is required and the card leaves the queue after submission.
9. Snooze a lead.
10. Confirm snooze date is shown in toast/state and the lead no longer blocks the immediate review queue.
11. Select multiple reviewable leads and use the bulk toolbar.
12. Confirm partial failures or non-reviewable states are surfaced clearly.
13. Use keyboard shortcuts: `j`, `k`, `Enter`, `a`, `r`, `s`, `?`.
14. Confirm shortcuts do not fire while an input, popover, sheet, or dialog is focused.

Expected result:

- BD users can identify prospectful companies and move them to approved, rejected, snoozed, or review states without losing context.
- Bulk and keyboard actions are fast, reversible where appropriate, and do not corrupt queue state.

## Flow 3: BD Pipeline And Cold Outreach

Persona: Account Manager or Admin

Goal: track approved prospects through outreach generation, review, delivery, and replies.

Steps:

1. Open `/bd/imports`.
2. Upload or drop a CSV import file.
3. Confirm the import job shows queued/running/completed/failed status and links to the right lead queue status when finished.
4. Open `/bd/pipeline`.
5. Confirm the Kanban columns load and poll for live pipeline updates.
6. Drag or move a lead between allowed pipeline stages.
7. Confirm success toast and that the board refreshes.
8. Open a lead detail sheet from the pipeline and reject from within the sheet.
9. Confirm the pipeline and lead queue both refresh.
10. Open `/bd/outreach`.
11. Confirm leads in `outreach_generation` show **Generating outreach** and poll into editable review cards.
12. Expand a pending sequence.
13. Edit each email step subject/body and save.
14. Confirm dirty-state save buttons appear only after editing.
15. Approve a sequence.
16. Confirm it disappears from the review list and a success toast appears.
17. Reject a sequence.
18. Confirm it disappears from the review list and a rejection toast appears.
19. Open `/bd/replies`.
20. Confirm replies are classified as interested, OOO, not now, or unsubscribe.
21. For interested replies, mark handled and confirm the task leaves the queue.
22. For OOO/not-now replies, snooze and confirm the task leaves the queue.
23. For unsubscribe replies, click unsubscribe and confirm destructive styling plus toast.

Expected result:

- Cold outreach can be reviewed before delivery.
- Reply triage routes interested companies forward while respecting unsubscribe/snooze cases.

Known v1 limitation to verify:

- Some reply actions are UI-only in the current implementation; QA should note whether backend persistence is expected before sign-off.

## Flow 4: Client Onboarding

Persona: Account Manager or Admin

Goal: create and maintain client records that later own requisitions and placements.

Steps:

1. Open `/ops/clients`.
2. Click **New Client**.
3. Try submitting an empty form.
4. Confirm name is required.
5. Enter invalid primary contact email.
6. Confirm email validation appears.
7. Create a valid client with name, contact name, and contact email.
8. Confirm success toast and navigation to `/ops/clients/{id}`.
9. On the client detail page, confirm left panel shows client fields and requisitions, right panel shows notes.
10. Add or edit notes if note controls are present in the seeded build.
11. Refresh the page.
12. Confirm client fields, requisitions, and notes reload correctly.

Expected result:

- Account Manager can onboard a client and reach a stable client workspace for notes and requisitions.

## Flow 5: Requisition Creation And JD Parsing

Persona: Account Manager or Admin

Goal: create a role for a client and extract structured fields from a job description.

Steps:

1. Open `/ops/requisitions`.
2. Filter by a specific client.
3. Confirm list updates and empty state is client-specific.
4. Click **New Requisition**.
5. Try submitting without a client or title.
6. Confirm validation.
7. Select a client and enter a title.
8. Paste a full job description with seniority, skills, compensation, and target start date.
9. Click **Create Requisition**.
10. Confirm parsing state appears with skeleton fields and disabled conflicting actions.
11. Confirm parsed seniority, skills, compensation, and target date appear when parsing completes.
12. Edit the parsed fields.
13. Click **Save & Go to Requisition**.
14. Confirm the requisition detail page shows the saved values.
15. Repeat once with no JD text.
16. Confirm the user navigates directly to the requisition detail page.
17. Simulate or observe parse failure if available.
18. Confirm the user can manually fill fields and continue.

Expected result:

- Requisition creation works with and without JD parsing.
- Parsed values are reviewable and correctable before entering the role workspace.

## Flow 6: Hiring Process Configuration

Persona: Account Manager, Quality Manager, or Admin

Goal: configure the per-role pipeline that candidates will follow.

Steps:

1. Open a requisition detail page.
2. Confirm **Hiring Process** shows current stages, stage order, stage kind, and Direct/Mediated badge.
3. Click **Edit Process** as Account Manager or Admin.
4. Add a stage.
5. Rename a stage.
6. Change stage kind between internal review, client screen, technical, final, and offer.
7. Move stages up/down.
8. Remove a stage while preserving at least one stage.
9. Toggle **Route through internal quality review** on.
10. Save.
11. Confirm the badge changes to **Mediated** and the stage list persists after refresh.
12. Toggle the internal quality review off.
13. Save.
14. Confirm the badge changes to **Direct** and recruiter pipeline columns update for this requisition.

Expected result:

- Ops can configure the exact client hiring process per requisition.
- The recruiter-facing pipeline columns reflect the configured process.
- Mediated roles route candidates through quality review before client visibility.

## Flow 7: Candidate Ingest And Submission

Personas: Recruiter, Account Manager, Admin

Goal: add candidates into the system and tie submissions to a live requisition.

Steps:

1. As Recruiter, open `/jobs`.
2. Confirm jobs are loaded from Ops requisitions with company, role, seniority, compensation, status, and target start.
3. Click **Submit** on a job.
4. Confirm `/submit?requisition_id=...` opens and preselects the selected requisition.
5. Use each candidate ingest tab: LinkedIn, CSV, Resume.
6. Submit a LinkedIn URL or profile payload.
7. Confirm a recent ingest job appears with status.
8. Submit a CSV ingest.
9. Confirm a recent ingest job appears with status.
10. Upload a resume.
11. Confirm upload/parse status progresses and errors are visible if parsing fails.
12. Open `/supply/ingest` as Internal Ops.
13. Repeat the same three ingest paths without a requisition context.

Expected result:

- Recruiters can submit candidates in the context of a role.
- Internal Ops can ingest supply globally.
- Async ingest and resume parsing states are visible and recoverable.

## Flow 8: Candidate Search And Matching

Persona: Account Manager, Quality Manager, or Admin

Goal: find candidates that match a role and inspect candidate fit.

Steps:

1. Open `/supply/search`.
2. Confirm no search runs until filters are submitted.
3. Search by title/query.
4. Add skills, location, seniority, and limit filters.
5. Confirm result count and filter chips appear.
6. Remove one chip.
7. Confirm results refresh with the updated filters.
8. Open a candidate result card.
9. Confirm the candidate profile sheet loads.
10. Use keyboard navigation: `j`, `k`, `Enter`, `?`.
11. Confirm shortcuts do not fire while inputs or sheets are focused.
12. Open a requisition detail page.
13. Click **Trigger Match**.
14. Confirm toast and that requisition/shortlist queries refresh.
15. Confirm disabled state prevents triggering match when requisition status is not eligible.

Expected result:

- Search supports targeted sourcing.
- Match generation populates or refreshes the requisition shortlist.

## Flow 8A: Supply Engagement Review

Persona: Account Manager, Quality Manager, or Admin

Goal: review candidate engagement sequences generated from supply profiles.

Route note: `/supply/engagements` is implemented but not currently linked in the sidebar, so QA must navigate directly.

Steps:

1. Open `/supply/engagements` directly.
2. Confirm the route is blocked for Recruiter and allowed for Internal Ops roles.
3. Confirm the toolbar shows **Engagements** and pending draft count when sequences exist.
4. Confirm empty state explains that sequences are generated from candidate profiles in search results.
5. Open a sequence row.
6. Confirm the sheet shows candidate sequence details and all generated steps.
7. For a draft sequence, edit supported fields if present in the sheet.
8. Approve the sequence.
9. Confirm status changes to approved and the list refreshes.
10. Reject another sequence.
11. Confirm status changes to rejected and the list refreshes.
12. Verify generated/pending statuses use non-destructive styling and rejected status does not look like an error unless the backend reports one.

Expected result:

- Internal Ops can review candidate engagement sequences outside the BD client-prospect outreach flow.
- The direct URL route behaves consistently with other gated Supply routes.

## Flow 9: Shortlist Review And Calibration

Persona: Account Manager, Quality Manager, or Admin

Goal: review AI-generated candidate shortlist and provide human calibration.

Steps:

1. Open a requisition with shortlist entries.
2. Confirm each row shows candidate, rationale, fit score, status, and actions.
3. Expand **Show why**.
4. Confirm matched skills, gaps, and missing must-haves are visible when present.
5. Expand score breakdown.
6. Confirm component scores are readable and total does not exceed 100.
7. Click candidate name.
8. Confirm candidate profile sheet opens with the correct candidate/submission.
9. Click **Add candidate**.
10. Search candidates, select one, enter reason/rationale, set score components, and add to shortlist.
11. Confirm candidate appears and success toast fires.
12. Edit an existing candidate score with a reason.
13. Confirm updated score persists after refresh.
14. Remove a candidate with a reason and component feedback.
15. Confirm candidate is removed or marked appropriately after refresh.
16. Approve a candidate.
17. Confirm a 5-second undo toast appears.
18. Click Undo.
19. Confirm status is restored.
20. Approve again and let the timer complete.
21. Confirm candidate becomes approved and is available for interview/placement flows.

Expected result:

- Human shortlist changes are captured with reasons and score breakdowns.
- Approve/reject operations have a real undo window.

## Flow 10: Quality Review Gate

Personas: Account Manager, Quality Manager, Admin

Goal: verify mediated submissions require the right human gate.

Steps:

1. Configure a requisition as **Mediated**.
2. Add or approve a shortlisted candidate so the submission enters quality review.
3. As Account Manager, open `/ops/quality-review`.
4. Confirm the page is view-only and shows the banner explaining that only Quality Manager or Admin can approve/reject.
5. Confirm Approve/Hold/Reject buttons are not visible.
6. Switch to Quality Manager.
7. Confirm Approve/Hold/Reject controls are visible.
8. Review AI recommendation, score, rationale, candidate, role, client, and submitted time.
9. Approve a candidate aligned with AI recommendation.
10. Confirm normal success toast and queue refresh.
11. Reject or hold a candidate against the AI recommendation.
12. Confirm override warning toast records the human override.
13. Switch to Admin and repeat an approve/reject action.

Expected result:

- Account Manager can inspect quality queue but cannot make final gate decisions.
- Quality Manager and Admin can decide and override AI with explicit audit feedback.

## Flow 11: Interviews And Candidate Pipeline Tracking

Personas: Recruiter, Account Manager, Admin

Goal: track each candidate through the client-specific hiring pipeline.

Steps:

1. On a requisition detail page, ensure at least one candidate is approved or shortlisted.
2. In **Interviews**, select a candidate and date.
3. Click **Log Interview**.
4. Confirm the interview appears on the requisition page.
5. Change status from scheduled to accepted.
6. Confirm transition persists.
7. Change status from accepted to completed.
8. Confirm completed is terminal/disabled.
9. Open `/ops/interviews`.
10. Filter by scheduled, accepted, declined, and completed.
11. Confirm global interview list matches requisition-level entries.
12. Open `/pipeline` as Recruiter.
13. Select the requisition.
14. Confirm columns match the configured hiring process.
15. Switch between Active and Rejected.
16. Confirm candidate cards show candidate name/title, requisition, client, match score, and status.
17. Click **Review Shortlist**.
18. Confirm navigation returns to the correct requisition detail page.

Expected result:

- Interview state is consistent between requisition detail and global interviews.
- Recruiter pipeline follows the Ops-configured stages for each role.

## Flow 12: Placement And Billing Tracking

Persona: Account Manager or Admin

Goal: log confirmed hires and billing/retention details.

Steps:

1. Open a requisition with an approved candidate.
2. Click **Log Placement**.
3. Confirm candidate, requisition ID, and client ID are prefilled/read-only.
4. Try submitting with empty billing status.
5. Confirm billing status validation.
6. Enter placement fee, billing status, retention flag, and notes.
7. Click **Log Placement**.
8. Confirm success toast and panel closes.
9. Confirm placement appears in the placements section.
10. Refresh and confirm placement persists.
11. Return to `/dashboard` or `/overview`.
12. Confirm placement counts update where dashboard metrics are wired to live records.

Expected result:

- Confirmed hires can be logged with billing and retention metadata.
- Placement state is visible on the requisition and reflected in overview metrics where supported.

## Flow 13: Recruiter Workspace

Persona: Recruiter

Goal: verify recruiter-facing routes remain useful without Internal Ops access.

Steps:

1. Switch to Recruiter.
2. Confirm sidebar hides Internal Ops and Admin.
3. Open `/dashboard` and `/overview`.
4. Confirm dashboard metric cards load and explain where to act.
5. Open `/jobs`.
6. Confirm jobs list loads and **Submit** works.
7. Open `/clients`.
8. Confirm client list or client-facing view is accessible as expected.
9. Open `/my-roles`.
10. Confirm assigned roles or empty state renders clearly.
11. Open `/bookmarks`.
12. Confirm bookmarks route is accessible for the current recruiter role.
13. Open `/rewards`.
14. Confirm referrals/promotions view renders without requiring Internal Ops.
15. Directly navigate to `/admin`, `/bd/leads`, `/ops/clients`, and `/supply/search`.
16. Confirm access-restricted panel appears and names the missing capability.

Expected result:

- Recruiters can run their assigned work without accidentally entering internal ops tooling.
- Direct URL access cannot bypass RBAC.

## Flow 14: Admin Monitoring And Controls

Persona: Admin

Goal: verify the operational control plane.

Steps:

1. Open `/admin`.
2. Visit each tab: Overview, Costs, Events, Quotas, Pipeline, Prompts, Candidates, Job sources.
3. Confirm URL query param updates on tab change.
4. Refresh on each tab and confirm the same tab remains selected.
5. In Costs, confirm cost breakdown loads and empty/error states are clear.
6. In Events, confirm event table loads, filters work, and the tab does not freeze.
7. In Quotas, confirm quota data loads and warnings/errors are visible.
8. In Pipeline, confirm pipeline/agent status data loads.
9. In Prompts, confirm prompt versions or empty state load.
10. In Candidates, confirm candidate admin data loads.
11. In Job sources, rerun Flow 1.

Expected result:

- Admin can monitor cost, quotas, pipeline events, prompts, candidates, and job ingestion without route or tab instability.

## Flow 15: RBAC Matrix

Run direct URL checks for each persona.

| Route | Recruiter | Account Manager | Quality Manager | Admin |
|---|---|---|---|---|
| `/dashboard`, `/overview` | allowed | allowed | allowed | allowed |
| `/jobs`, `/clients`, `/pipeline`, `/submit` | allowed | allowed | allowed | allowed |
| `/bookmarks` | allowed | allowed | allowed | allowed |
| `/bd/leads`, `/bd/outreach`, `/bd/replies`, `/bd/pipeline` | blocked | allowed | allowed | allowed |
| `/ops/clients`, `/ops/requisitions`, `/ops/interviews` | blocked | allowed | allowed | allowed |
| `/ops/quality-review` | blocked | read-only | approve/reject | approve/reject |
| `/supply/search`, `/supply/ingest`, `/supply/engagements` | blocked | allowed | allowed | allowed |
| `/admin` | blocked | blocked | blocked unless role gains `admin.view` | allowed |

Expected result:

- Sidebar visibility and direct URL access match the same route capability rules.
- Restricted pages show a useful blocked state with a path back to Overview.

## Flow 16: Cross-Cutting UX And Reliability

Run these checks across all long flows.

- Refresh during active polling states: job search, outreach generation, JD parsing, resume parsing.
- Hard refresh on deep links: client detail, requisition detail, admin tab, pipeline stage view.
- Back/forward through tabs and filters.
- Network failure: stop backend or force one failing request; confirm actionable error states.
- Empty state: run against no clients, no requisitions, no candidates, no interviews, no placements.
- Loading state: confirm skeleton/spinner text appears and does not cause layout jumps.
- Keyboard: tab order reaches all controls; `Enter`/`Space` activate expected buttons; shortcut overlays do not steal input focus.
- Accessibility: labels exist for required inputs; dialogs/sheets have titles/descriptions; destructive actions are identifiable.
- Visual: active nav does not shift layout; cards/tables remain readable at the team’s laptop viewport; no public-site styling leaks into console screens.
- Data consistency: after a mutation, refresh the page and confirm state persists from the backend.
- Toast consistency: every mutation has success/failure feedback and does not leave stale local state.

## Suggested Test Order

1. Admin job-source setup.
2. Prospect lead qualification and outreach.
3. Client onboarding.
4. Requisition creation and hiring process configuration.
5. Candidate ingest/search/matching.
6. Shortlist calibration.
7. Supply engagement review.
8. Quality review gate.
9. Interview and candidate pipeline tracking.
10. Placement logging.
11. Recruiter workspace and RBAC matrix.
12. Admin monitoring tabs.
13. Cross-cutting reliability checks.

## Existing Automated Coverage To Consult

These tests already cover parts of the manual plan and should be used as regression references:

- `src/__tests__/route-capabilities.test.ts`
- `e2e/rbac.spec.ts`
- `src/__tests__/recruiter-portal.test.tsx`
- `src/__tests__/lead-queue.test.tsx`
- `src/__tests__/pipeline.test.tsx`
- `src/__tests__/ops-clients.test.tsx`
- `src/__tests__/ops-jd-parse.test.tsx`
- `src/__tests__/ops-shortlist.test.tsx`
- `src/__tests__/hiring-process.test.tsx`
- `src/__tests__/ops-interviews.test.tsx`
- `src/__tests__/ops-placements.test.tsx`
- `src/__tests__/supply-ingest.test.tsx`
- `src/__tests__/supply-search.test.tsx`
- `src/__tests__/supply-engagements.test.tsx`
- `src/__tests__/internal-review.test.ts`
- `src/__tests__/admin-costs.test.tsx`
- `src/__tests__/admin-events.test.tsx`
- `src/__tests__/admin-events-tab.test.tsx`
- `src/__tests__/admin-quotas.test.tsx`
- `src/__tests__/admin-prompts.test.tsx`
- `src/__tests__/admin-job-sources.test.tsx`
- `e2e/admin-tabs.spec.ts`

Coverage note:

- Some listed test files currently include planned `it.todo` cases rather than complete executable coverage. Manual QA should not treat the presence of a filename as proof that the full flow is automated.
