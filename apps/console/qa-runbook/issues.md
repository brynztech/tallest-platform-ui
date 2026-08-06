# Console QA Issue Ledger

Last updated: 2026-08-06

## Fixed In This Pass

### QA-001: BD outreach reject returned 422 and no helpful toast

- Status: Fixed
- Area: BD Outreach Review
- Symptom: Rejecting an outreach sequence sent an empty POST body and the backend returned `422 Field required`.
- Fix: Reject now sends the required `notes` body via the generated API client and shows a clear failure toast if the backend rejects the request.
- Retest: Open `/bd/outreach`, expand a pending sequence, click `Reject Sequence`, and confirm the sequence is removed or updated without a 422. Simulate a backend failure and confirm the toast says the sequence stayed in review.

### QA-002: `/supply/engagements` showed a hard load failure

- Status: Fixed
- Area: Supply Engagement Review
- Symptom: The page rendered `Couldn't load engagement sequences.` when the live backend returned `404` for the aggregate route.
- Fix: The page now supports both array and `{ sequences }` responses and treats the current live `404` contract gap as an empty review queue.
- Retest: Open `/supply/engagements` against the live backend and confirm the page loads with either engagement cards or the empty state.

### QA-003: JD parse said parsed but fields stayed empty

- Status: Fixed
- Area: Ops Requisition Creation
- Symptom: The dialog showed `Parsed from JD` while seniority, skills, compensation, and target date were still blank.
- Fix: The dialog keeps polling while the requisition is `open` and only unlocks the parsed review fields after structured fields are present.
- Retest: Create a requisition with JD text. Confirm the parser state remains loading until parsed fields are populated, then edit and save the fields before navigating.

### QA-004: BD pipeline sheet emitted missing title warning

- Status: Fixed
- Area: BD Pipeline
- Symptom: Opening a lead sheet could trigger the Radix warning that `DialogContent` requires a `DialogTitle`.
- Fix: The sheet now renders a `SheetTitle` for all loading and loaded states.
- Retest: Open `/bd/pipeline`, click any lead card, and confirm no missing-title warning appears in the console.

### QA-005: Lead counts and BD pipeline refresh were stale after queue actions

- Status: Fixed
- Area: BD Lead Queue and Pipeline
- Symptom: Approve, reject, and snooze actions could remove cards but leave queue totals or pipeline counts stale.
- Fix: The optimistic cache update now targets the active `['leads', status]` query, adjusts the displayed total, and invalidates the pipeline after lead and outreach actions.
- Retest: Approve or reject a lead from `/bd/leads`, then check the badge count and `/bd/pipeline` without a manual hard refresh.

### QA-006: Recruiter-facing copy exposed internal Ops wording

- Status: Fixed
- Area: Recruiter Portal
- Symptom: Recruiter pages referred to `Ops requisitions` and showed an `Open Ops Requisitions` CTA.
- Fix: Recruiter-facing copy now says `client roles`, `open jobs`, and `Open My Roles`.
- Retest: Open `/jobs` as a recruiter and confirm the page does not expose internal Ops terminology.

### QA-007: Referrals navigation label was truncated

- Status: Fixed
- Area: Recruiter Sidebar
- Symptom: `Referrals and Promotions` could truncate in the sidebar.
- Fix: Sidebar and route metadata now use the shorter `Referrals` label.
- Retest: Open the recruiter sidebar and confirm the label fits without truncation.

### QA-008: Duplicate client seed data appeared in recruiter pages

- Status: Fixed
- Area: Recruiter Data Views
- Symptom: Duplicate company entries such as `TechCorp Inc` could appear in recruiter-facing client/job views.
- Fix: Shared recruiter client fetching now de-dupes clients by normalized company name before downstream pages render clients or aggregate requisitions.
- Retest: Open recruiter client and job views with duplicate backend/seed data and confirm each company appears once.

## Remaining Or Watch Items

### QA-009: Live aggregate Supply engagements endpoint remains a backend contract gap

- Status: Watch
- Area: Supply Engagement Review
- Notes: The frontend no longer hard-fails on `404`, but the live backend still does not advertise `GET /api/v1/supply/engagements` in the generated OpenAPI schema.
- Retest: Once the backend ships a real aggregate endpoint, verify the page renders all draft engagement sequences without relying on the empty-state fallback.

### QA-010: Full browser regression still needs one end-to-end pass

- Status: Remaining
- Area: Cross-console
- Notes: Static verification can catch type and lint issues, but the fixed flows should still be rerun with browser QA against the live console.
- Retest: Run the BD outreach reject, Supply engagements, Ops JD parse, BD pipeline sheet, and lead queue refresh scenarios from this ledger.
