---
phase: 04-console-supply-admin
plan: "04"
subsystem: ui
tags: [supply, ingest, linkedin, csv, resume, react-dropzone, react-hook-form, zod, tanstack-query, polling, typescript]

# Dependency graph
requires:
  - phase: 04-02
    provides: supply search page, CandidateProfileSheet, sidebar Supply nav unlocked
  - phase: 04-01
    provides: supplyHandlers MSW suite, vitest stub infrastructure

provides:
  - apps/console/app/(shell)/supply/ingest/page.tsx — ingest page with LinkedIn/CSV/Resume tabs and Recent Jobs section
  - apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx — status card for all ingest job states (queued/processing/done/failed)
  - apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx — LinkedIn URL form with RHF + Zod + apiClient.POST
  - apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx — CSV dropzone with native fetch multipart upload
  - apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx — Resume dropzone with native fetch + manual setInterval polling

affects:
  - 04-05 supply-engagements (sidebar Ingest nav now live, ingest types established)
  - packages/mocks/src/handlers/supply.ts (ingest endpoints should be present)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-tab ingest page: single /supply/ingest page with LinkedIn/CSV/Resume tabs — all ingest paths in one destination (D-08)"
    - "Persistent local jobs array: useState<IngestJob[]> with addJob/updateJob helpers — no API list endpoint (RESEARCH.md A4)"
    - "Native fetch for multipart CSV/resume upload: no Content-Type header — browser sets multipart/form-data boundary automatically"
    - "Manual setInterval polling for resume 202: poll GET /supply/candidates/{id} every 3s until name/email populated, 60s timeout clears interval"
    - "LinkedIn ingest is synchronous: apiClient.POST JSON → 201 → onJobAdded with status done immediately (no polling)"
    - "IngestJob status variants: queued/processing/done/failed — each mapped to Badge variant with OKLCH green for done"

key-files:
  created:
    - apps/console/app/(shell)/supply/ingest/page.tsx
    - apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx
    - apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx
    - apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx
    - apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx
  modified: []

key-decisions:
  - "ResumeUploadResponse.candidate_id can be null on 202 — when null, job card shows 'awaiting candidate ID' and transitions to queued; polling only starts when candidate_id is available"
  - "CsvIngestResponse uses skipped_duplicates field (not duplicates) — verified against api.d.ts schema"
  - "LinkedIn URL validation uses both z.string().url() and a refine() check for linkedin.com/www.linkedin.com prefix per threat model T-04-04-01"
  - "setInterval polling max 20 attempts (60s / 3s) per threat model T-04-04-05 DoS mitigation"

patterns-established:
  - "Ingest job card pattern: local IngestJob[] state in parent page, child forms call onJobAdded/onJobUpdated callbacks — decoupled async state from upload UI"

requirements-completed: [SUP-03]

# Metrics
duration: 12min
completed: 2026-06-14
---

# Phase 4 Plan 04: Supply Ingest Page Summary

**Three-path candidate ingest UI: LinkedIn (sync via apiClient), CSV (native fetch multipart), and Resume (native fetch + manual setInterval polling to done) — all surfaced in a persistent Recent Jobs section with IngestJobCard status cards**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-14T20:28:00Z
- **Completed:** 2026-06-14T20:40:00Z
- **Tasks:** 2
- **Files created/modified:** 5

## Accomplishments

- Built `/supply/ingest` page with 3-tab navigation (LinkedIn | CSV | Resume) and persistent Recent Jobs section below a Separator — matches BD's `/bd/imports` page pattern (D-08, D-09)
- Created `IngestJobCard` with all 4 status variants: `queued` (outline badge), `processing` (secondary badge + inline spinner SVG), `done` (OKLCH green badge), `failed` (destructive badge) — plus "View Profile →" link for done + candidateId
- `LinkedInForm`: RHF + Zod v4 validation (`z.string().url()` + linkedin.com refine), `apiClient.POST` with JSON body, `onJobAdded` with `status: 'done'` immediately (no polling) per PATTERNS.md anti-pattern note
- `CsvForm`: `react-dropzone` (.csv only), native `fetch` with `FormData` — NO `Content-Type` header set (browser sets boundary), `onJobAdded` with done + `skipped_duplicates` count from `CsvIngestResponse`
- `ResumeForm`: `react-dropzone` (PDF/DOC/DOCX), native `fetch` to `/supply/resumes/upload` (202), immediate `onJobAdded` with `status: 'processing'`, `setInterval` polls `GET /supply/candidates/{id}` every 3s until `name/email` populated, `onJobUpdated` to done or failed on 60s timeout — threat T-04-04-05 mitigated with 20-attempt max
- TypeScript: 0 errors. Vitest: 32 passed | 74 todo (all stubs remain green)

## Task Commits

1. **Task 1: Ingest page shell with tabs and IngestJobCard** — `84cf05d` (feat)
2. **Task 2: LinkedInForm, CsvForm, and ResumeForm components (SUP-03)** — `62d53a4` (feat)

## Files Created/Modified

- `apps/console/app/(shell)/supply/ingest/page.tsx` — page with Tabs (defaultValue="linkedin"), jobs state + addJob/updateJob helpers, Recent Jobs section with IngestJobCard list
- `apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx` — exports `IngestJob` type and `IngestJobCard` component with all 4 status badge variants
- `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx` — RHF + zodResolver + apiClient.POST, synchronous done job card
- `apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx` — react-dropzone + native fetch FormData, synchronous done job card with import count
- `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` — react-dropzone + native fetch 202 + manual setInterval polling, async done/failed job card

## Decisions Made

- `ResumeUploadResponse.candidate_id` can be null immediately after 202 — when null, job transitions to `queued` with "processing in background" text; polling skipped (no candidate_id to poll with)
- `CsvIngestResponse` schema uses `skipped_duplicates` (not `duplicates`) — verified against api.d.ts before implementing
- LinkedIn URL validation applies both `z.string().url()` and a `.refine()` for `linkedin.com`/`www.linkedin.com` prefix per threat model T-04-04-01
- `setInterval` max 20 attempts (60s / 3s interval) to bound polling duration per threat model T-04-04-05 DoS mitigation

## Deviations from Plan

None — plan executed exactly as written with one minor schema discovery:

**1. [Rule 1 - Bug] CsvIngestResponse field name is skipped_duplicates not duplicates**
- **Found during:** Task 2 (CsvForm implementation)
- **Issue:** Plan pseudocode used `data.duplicates` but api.d.ts defines `skipped_duplicates` on `CsvIngestResponse`
- **Fix:** Used `data.skipped_duplicates` in progressText
- **Files modified:** apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx
- **Committed in:** `62d53a4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — field name correction from schema inspection)
**Impact on plan:** Minor schema alignment — no functional impact.

## Known Stubs

- `ResumeForm` null candidate_id path: when `ResumeUploadResponse.candidate_id` is null, the job card transitions to `queued` status after 2s with "Resume submitted — processing in background". Polling is skipped because there is no candidate_id to poll. This path is uncommon (backend usually returns a candidate_id with 202) but gracefully handled.

## Threat Mitigations Verified

| Threat ID | Mitigation | Verified |
|-----------|-----------|---------|
| T-04-04-01 | linkedin_url validated with z.string().url() + refine(linkedin.com prefix) | Zod schema in linkedin-form.tsx lines 16–23 |
| T-04-04-02 | react-dropzone accept: { 'text/csv': ['.csv'] } restricts CSV file selection | csv-form.tsx useDropzone config |
| T-04-04-03 | react-dropzone accept for PDF/DOC/DOCX only | resume-form.tsx useDropzone config |
| T-04-04-05 | setInterval with 20 max attempts (60s / 3s); clearInterval on success or timeout | resume-form.tsx startPolling function |

## Self-Check: PASSED

- `apps/console/app/(shell)/supply/ingest/page.tsx`: exists, contains `<Tabs defaultValue="linkedin"`, contains `jobs, setJobs` state, contains `addJob` and `updateJob` helpers
- `apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx`: exists, all 4 status variants present
- `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx`: exists, zodResolver and z.string().url() present, status: 'done' in onSuccess
- `apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx`: exists, FormData + native fetch present, NO apiClient.POST, NO Content-Type header
- `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx`: exists, setInterval present, status: 'processing' in onJobAdded, status: 'done' in onJobUpdated
- Task 1 commit `84cf05d`: exists
- Task 2 commit `62d53a4`: exists
- TypeScript: 0 errors
- Vitest: 32 passed | 74 todo

---
*Phase: 04-console-supply-admin*
*Completed: 2026-06-14*
