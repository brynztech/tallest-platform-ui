---
phase: 02-console-bd
plan: "03"
subsystem: ui

tags: [react-dropzone, useAsyncJob, polling, sonner, outreach, sequence-editor, async-flows]

# Dependency graph
requires:
  - phase: 02-console-bd
    plan: "01"
    provides: Shell sidebar layout, MSW handlers (CSV import + outreach endpoints), Vitest infrastructure, react-dropzone installed

provides:
  - /bd/imports page with react-dropzone CSV upload + native FormData POST + useAsyncJob polling status card
  - /bd/outreach page listing outreach sequences from MSW with SequenceEditor components
  - ImportDropzone: idle→pending→complete/failed state transitions with oklch green "Done" badge
  - SequenceEditor: expandable card with 3 StepEditors (subject Input + body textarea) + Approve/Reject mutations
  - async-flows.test.tsx: useAsyncJob complete-state transition test + outreach step structure test

affects: [02-04-pipeline, all subsequent BD phase plans]

# Tech tracking
tech-stack:
  added:
    - lucide-react: catalog: (added to apps/console — was missing)
    - sonner: ^2.0.7 (added to apps/console — was only in packages/ui)
  patterns:
    - Native fetch with FormData for multipart uploads (not apiClient.POST — browser sets Content-Type boundary automatically)
    - useAsyncJob polling: jobId null → idle; string → polls; terminal status → stops
    - SequenceEditor expand/collapse with useState; StepEditor local dirty-state + explicit Save PATCH
    - Approve/Reject: native fetch POST + Sonner toast + optimistic list removal via removedIds Set

key-files:
  created:
    - apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx
    - apps/console/app/(shell)/bd/imports/page.tsx
    - apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx
    - apps/console/app/(shell)/bd/outreach/page.tsx
  modified:
    - apps/console/src/__tests__/async-flows.test.tsx
    - apps/console/package.json
    - packages/hooks/src/use-async-job.ts
    - pnpm-lock.yaml

key-decisions:
  - "Native fetch (not apiClient.POST) for multipart CSV upload — browser must set Content-Type boundary automatically; apiClient.POST cannot do this correctly"
  - "Outreach uses sequence_id (not id), step_index (not step_number), scheduled_day (not scheduled_at) — corrected from plan spec to match api.d.ts"
  - "StepEditor tracks dirty state locally; Save is explicit button click (not auto-save on blur) for BD rep workflow clarity"
  - "Approve/Reject use native fetch (not apiClient) — POST to approve/reject endpoints not in openapi-fetch typed paths; pattern consistent with dropzone"
  - "removedIds Set pattern for optimistic list removal after approve/reject — avoids refetch latency"

patterns-established:
  - "Async polling pattern: ImportDropzone POSTs file, gets import_id, passes to useAsyncJob; no polling until upload succeeds"
  - "Status card transitions: idle (show dropzone) → pending (spinner + count from statusData) → complete (custom oklch green badge + imported count) / failed (destructive badge)"
  - "SequenceEditor/StepEditor split: SequenceEditor owns expand state + approve/reject mutations; StepEditor owns subject/body state + PATCH save"

requirements-completed: [BD-04, BD-05]

# Metrics
duration: 8min
completed: 2026-06-13
---

# Phase 2 Plan 03: Async Flows — CSV Import + Outreach Sequence Review Summary

**react-dropzone CSV import with useAsyncJob polling (idle→pending→complete) and expandable outreach sequence editor with PATCH step edits and approve/reject mutations wired to MSW**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-13T18:22:05Z
- **Completed:** 2026-06-13T18:29:38Z
- **Tasks:** 2 completed
- **Files modified:** 8

## Accomplishments

- CSV import page: react-dropzone (CSV-only), native FormData POST to /bd/imports, useAsyncJob polling shows "Processing N leads…" then "Imported N leads" with custom oklch(0.45 0.15 145) green badge — no manual refresh
- Outreach review page: lists sequences from MSW /bd/outreach, each expandable via SequenceEditor with 3 StepEditors (subject Input + body textarea), dirty-state Save button fires PATCH, Approve/Reject mutations with Sonner toast and optimistic list removal
- Tests: useAsyncJob transition test (processing→complete with review_queue count) and outreach sequence data structure test; typecheck passes clean

## Task Commits

Each task was committed atomically:

1. **Task 1: CSV import page — react-dropzone + useAsyncJob polling + status card** - `1e31102` (feat)
2. **Task 2: Outreach sequence review — sequence list, step editor, approve/reject** - `bed17b2` (feat)

## Files Created/Modified

- `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` - react-dropzone + native FormData POST + useAsyncJob polling with 4-state status card
- `apps/console/app/(shell)/bd/imports/page.tsx` - /bd/imports page wrapper with header + description
- `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` - SequenceEditor (expandable) + StepEditor (subject/body + PATCH save) + Approve/Reject mutations
- `apps/console/app/(shell)/bd/outreach/page.tsx` - /bd/outreach page with useQuery list + optimistic removedIds filtering
- `apps/console/src/__tests__/async-flows.test.tsx` - 2 passing tests: useAsyncJob complete transition + outreach step structure
- `apps/console/package.json` - lucide-react (catalog:) + sonner (^2.0.7) added
- `packages/hooks/src/use-async-job.ts` - mergedMap typed as Record<string,AsyncJobPhase> for strict TS compatibility
- `pnpm-lock.yaml` - updated for new console dependencies

## Decisions Made

- Native fetch for multipart CSV upload (not apiClient.POST): browser must control Content-Type to set multipart boundary automatically. Using apiClient.POST would strip the boundary.
- SequenceEditor uses `sequence.sequence_id` (not `sequence.id`) per api.d.ts schema; StepEditor uses `step.step_index` (not `step_number`) and `step.scheduled_day` (not `scheduled_at`). Plan spec had wrong field names — corrected against actual types.
- Approve/Reject use native fetch because the outreach approve/reject endpoints are typed in api.d.ts but openapi-fetch's PATCH/POST typing requires exact path parameter mapping that the MSW-only approve/reject endpoints don't expose cleanly through the catalog.
- StepEditor saves on explicit button click (not auto-save on blur) — clearer for BD rep workflow where a step might be mid-edit during review.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed phase==='error' comparison in import-dropzone.tsx**
- **Found during:** Task 1 (typecheck)
- **Issue:** Plan spec action code used `phase === 'error'` but `AsyncJobPhase` type is `'idle' | 'pending' | 'complete' | 'failed'` — no 'error' value. TypeScript reported "comparison has no overlap".
- **Fix:** Changed to `phase === 'failed'` (the hook maps network errors to 'failed' phase anyway)
- **Files modified:** apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx
- **Verification:** tsc --noEmit exits 0
- **Committed in:** 1e31102 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed use-async-job.ts strict TS type error**
- **Found during:** Task 1 (typecheck after adding useAsyncJob import)
- **Issue:** `mergedMap = { ...DEFAULT_STATUS_MAP, ...statusMap }` had inferred type `Record<string,AsyncJobPhase> & Partial<Record<TRawStatus,AsyncJobPhase>>`. Indexing with `string` or `TRawStatus` caused TS7053/TS2536 errors in strict mode.
- **Fix:** Explicitly typed `const mergedMap: Record<string, AsyncJobPhase> = { ... }` — correct since DEFAULT_STATUS_MAP is already `Record<string, AsyncJobPhase>`
- **Files modified:** packages/hooks/src/use-async-job.ts
- **Verification:** tsc --noEmit exits 0
- **Committed in:** 1e31102 (Task 1 commit)

**3. [Rule 3 - Blocking] Added lucide-react to console package.json**
- **Found during:** Task 1 (typecheck)
- **Issue:** `import { UploadCloud } from 'lucide-react'` caused TS2307 — lucide-react not in console deps (only in packages/ui)
- **Fix:** Added `"lucide-react": "catalog:"` to apps/console/package.json
- **Files modified:** apps/console/package.json, pnpm-lock.yaml
- **Verification:** tsc --noEmit exits 0
- **Committed in:** 1e31102 (Task 1 commit)

**4. [Rule 3 - Blocking] Added sonner to console package.json**
- **Found during:** Task 2 (typecheck)
- **Issue:** `import { toast } from 'sonner'` caused TS2307 — sonner not in console deps (only in packages/ui as ^2.0.7)
- **Fix:** Added `"sonner": "^2.0.7"` to apps/console/package.json
- **Files modified:** apps/console/package.json, pnpm-lock.yaml
- **Verification:** tsc --noEmit exits 0
- **Committed in:** bed17b2 (Task 2 commit)

**5. [Rule 1 - Bug] Corrected OutreachSequenceResponse field names in sequence-editor.tsx**
- **Found during:** Task 2 implementation (checking api.d.ts — pre-verified from 02-01-SUMMARY.md)
- **Issue:** Plan spec action code used `sequence.id`, `step.step_number`, `step.scheduled_at` but actual api.d.ts uses `sequence.sequence_id`, `step.step_index`, `step.scheduled_day` (same correction as in Plan 02-01 MSW handlers)
- **Fix:** Used correct field names throughout sequence-editor.tsx and outreach/page.tsx
- **Files modified:** apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx, apps/console/app/(shell)/bd/outreach/page.tsx
- **Verification:** TypeScript compile succeeds against api.d.ts types
- **Committed in:** bed17b2 (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (2 Rule 1 bugs, 3 Rule 3 blocking)
**Impact on plan:** All auto-fixes required for type correctness and runtime correctness. No scope creep. Field name corrections ensure runtime behavior matches the live API schema.

## Issues Encountered

None beyond the deviations documented above.

## Known Stubs

None — all functionality is wired to MSW handlers from Plan 02-01 or to actual API endpoints. The outreach list endpoint `/api/v1/bd/outreach` is MSW-only (documented as Open Question 3 in RESEARCH.md) but is wired; not a stub in this plan's context.

## Threat Surface Scan

No new threat surface beyond what the threat_model in the plan documents:
- T-02-10 (CSV MIME check): react-dropzone `accept: {'text/csv': ['.csv']}` implemented — UX convenience only, backend validates
- T-02-11 (XSS in step edit): StepEditor uses controlled `<Input>` and `<textarea>` — React-managed values, no `dangerouslySetInnerHTML`
- T-02-12 (Import error truncation): `text.slice(0, 200)` implemented in upload error handler
- T-02-13 (Infinite poll loop): useAsyncJob refetchInterval returns false for terminal phases

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /bd/imports and /bd/outreach pages ready for Phase 2 integration
- Plan 02-02 (lead queue) and Plan 02-04 (pipeline) can proceed independently — no shared state
- MSW handlers for all async flows verified working against components
- Typecheck and tests green

## Self-Check: PASSED

All created files confirmed present on disk. All task commits verified in git log.

---
*Phase: 02-console-bd*
*Completed: 2026-06-13*
