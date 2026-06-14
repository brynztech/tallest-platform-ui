---
phase: 04-console-supply-admin
plan: "06"
subsystem: ui
tags: [supply, engagements, react-hook-form, tanstack-query, undo-toast, typescript, sheet]

# Dependency graph
requires:
  - phase: 04-04
    provides: ingest page pattern, IngestJobCard
  - phase: 04-05
    provides: admin tabs complete
  - phase: 04-01
    provides: MSW supply handlers (GET /api/v1/supply/engagements, PATCH, approve, reject)

provides:
  - apps/console/app/(shell)/supply/engagements/page.tsx — Engagements list page with useQuery + row cards
  - apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx — Sequence review/edit/approve/reject sheet with RHF useFieldArray

affects:
  - SUP-05 requirement — supply rep can review, edit, approve, or reject engagement sequences

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RHF useFieldArray for step editing — formState.isDirty (stepsDirty) determines whether to PATCH steps before POST approve"
    - "useRef<ReturnType<typeof setTimeout>> for reject undo — cleanup in useEffect return prevents T-04-06-03 memory leak"
    - "MSW-only fetch pattern for /supply/engagements — native fetch (not apiClient) because endpoint not in api.d.ts paths"
    - "apiClient.PATCH + apiClient.POST for approve with conditional pre-PATCH (typed openapi-fetch calls)"
    - "Controller + isReadOnly (pointer-events-none bg-muted/30) for non-draft step display"

key-files:
  created:
    - apps/console/app/(shell)/supply/engagements/page.tsx
    - apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx
  modified: []

key-decisions:
  - "EngagementSequenceResponse.candidate_name does not exist in api.d.ts — display uses candidate_id.slice(0,8) as Candidate XXXXXXXX label (plan interface was aspirational)"
  - "EngagementSequenceResponse.id (not sequence_id) — field name verified against api.d.ts line 1426 before implementing"
  - "staleTime: 30000 on engagements query — MSW-only endpoint, no real-time requirement"
  - "Reject undo: useRef pattern (not Map) because only one rejection can be pending at a time in the sheet context"

# Metrics
duration: 10min
completed: 2026-06-14T15:56:00Z
---

# Phase 4 Plan 06: Supply Engagements Page + EngagementSequenceSheet

**Supply engagement sequences page with RHF useFieldArray step editing, conditional PATCH-then-POST approve, and 5-second undo reject — completing SUP-05 and closing out the Phase 4 Supply workstream**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-14T15:54:00Z
- **Completed:** 2026-06-14T15:56:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint — approved)
- **Files created/modified:** 2

## Accomplishments

- Built `/supply/engagements` page: `useQuery` fetches from MSW-only `GET /api/v1/supply/engagements`, renders engagement row cards with step count, status badge (draft/approved/rejected/generating), created_at timestamp, and ChevronRight. Clicking a row opens `EngagementSequenceSheet`.
- Created `EngagementSequenceSheet`: sticky header with Engagement Sequence label + candidate short-id, action bar (Approve/Reject buttons when `status === 'draft'`, inline spinner when `status === 'generating'`), step editor cards via `useFieldArray`.
- Approve flow: if `formState.isDirty` (stepsDirty), `apiClient.PATCH /api/v1/supply/engagement/{sequence_id}` with edited steps, then `apiClient.POST /api/v1/supply/engagement/{sequence_id}/approve`. On success: invalidate `['supply-engagements']`, close sheet, Sonner toast.
- Reject flow: 5-second undo window using `useRef<ReturnType<typeof setTimeout>>`. Undo clears the timeout ref. `useEffect` cleanup on unmount prevents zombie timeouts (T-04-06-03 mitigated).
- `StepEditorCard`: `Controller`-wrapped `<Input>` (subject) and `<textarea>` (body) with `pointer-events-none bg-muted/30` when `isReadOnly` (non-draft sequences).
- TypeScript: 0 errors in new files (pre-existing `.next/types/validator.ts` errors are Next.js generated — not related to this plan). Vitest: 32 passed | 74 todo.

## Task Commits

1. **Task 1: Engagements page + EngagementSequenceSheet (SUP-05)** — `fff35af` (feat)
2. **Task 2: Human verify all Phase 4 features** — approved (checkpoint:human-verify)

**Plan metadata:** `a93d12c` (docs: complete plan)

## Files Created/Modified

- `apps/console/app/(shell)/supply/engagements/page.tsx` — engagements list with useQuery, row cards, ChevronRight, sheet trigger
- `apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx` — RHF useFieldArray, approveMutation with conditional PATCH, reject with 5s undo useRef, StepEditorCard with read-only support

## Decisions Made

- `EngagementSequenceResponse` in api.d.ts has no `candidate_name` field (only `candidate_id`) — candidate label displays as `Candidate XXXXXXXX` (first 8 chars of UUID) rather than failing with undefined
- `EngagementSequenceResponse.id` confirmed (not `sequence_id`) — api.d.ts line 1426
- `reject` uses `useRef` (single ref) rather than a `Map` — only one rejection pending at a time in the sheet (vs. ShortlistTable which has multiple rows needing a Map)

## Deviations from Plan

**1. [Rule 1 - Bug] candidate_name not available in EngagementSequenceResponse**
- **Found during:** Task 1 (before implementing page)
- **Issue:** Plan interface listed `candidate_name?: string | null` on `EngagementSequenceResponse` but api.d.ts only has `candidate_id` (no name field). MSW mock data also uses only `candidate_id`.
- **Fix:** Display `Candidate ${seq.candidate_id.slice(0, 8)}` as a readable label instead. Functionally equivalent — Supply rep sees a unique identifier per row.
- **Files modified:** apps/console/app/(shell)/supply/engagements/page.tsx, engagement-sequence-sheet.tsx
- **Committed in:** `fff35af` (Task 1 commit)

## Human Verification

Task 2 was a `checkpoint:human-verify` gate covering all Phase 4 features (SUP-01 through SUP-05, ADM-01 through ADM-05) in the running dev server.

**Outcome:** Approved by user on 2026-06-14. All Phase 4 Supply and Admin features verified functional.

## Known Stubs

None — engagement sequences are fully wired to MSW handlers. The `candidate_name` absence is an API gap, not a UI stub.

## Threat Mitigations Verified

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-04-06-01 | Step subject/body submitted as typed `EngagementStep[]` via openapi-fetch compile-time check | Verified — `apiClient.PATCH` with typed body |
| T-04-06-02 | Step content rendered in `<Input>` value prop and `<textarea>` value prop — not dangerouslySetInnerHTML | Verified — Controller renders controlled inputs |
| T-04-06-03 | useEffect cleanup in sheet unmount clears rejectTimeoutRef | Verified — useEffect return `() => { if (rejectTimeoutRef.current) clearTimeout(...) }` |
| T-04-06-04 | No auth in v1 console — accepted per design | Accepted |

## Self-Check: PASSED

- `apps/console/app/(shell)/supply/engagements/page.tsx`: exists, contains `useQuery(['supply-engagements'])`, contains `EngagementSequenceSheet`
- `apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx`: exists, contains `useFieldArray`, contains `rejectTimeoutRef`, contains `formState: { isDirty: stepsDirty }`, contains `pointer-events-none bg-muted/30`
- Task 1 commit `fff35af`: exists
- TypeScript: 0 errors in new files
- Vitest: 32 passed | 74 todo

---
*Phase: 04-console-supply-admin*
*Completed: 2026-06-14*
