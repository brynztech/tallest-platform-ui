---
phase: 03-console-ops
plan: "05"
subsystem: ui
tags: [tanstack-query, useMutation, openapi-fetch, msw, requisitions, ops]

# Dependency graph
requires:
  - phase: 03-console-ops
    plan: "03"
    provides: requisition detail hub page with placeholder Trigger Candidate Match button
  - phase: 03-console-ops
    plan: "04a"
    provides: ShortlistTable + CandidateDetailPanel with ops-shortlist query key
provides:
  - Trigger Candidate Match button wired to POST /api/v1/ops/requisitions/{req_id}/match
  - matchMutation with isPending guard, success invalidation, and error toast
affects:
  - 03-VERIFICATION.md (SC-3/OPS-04 gap now closed)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useMutation + useQueryClient for fire-and-forget POST triggers with query invalidation on success"
    - "Button disabled={mutation.isPending} + conditional label text for async feedback"

key-files:
  created: []
  modified:
    - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
    - apps/console/src/__tests__/ops-shortlist.test.tsx

key-decisions:
  - "Invalidate ops-shortlist query (not refetch) on match success — shortlist data arrives async so triggering a refresh is the right signal"
  - "Double-trigger prevention via isPending disable satisfies T-03-17 threat mitigation without additional server-side guards in v1"

patterns-established:
  - "Match trigger pattern: useMutation → POST → onSuccess invalidateQueries + toast → onError toast.error"

requirements-completed:
  - OPS-04

# Metrics
duration: 8min
completed: 2026-06-14
---

# Phase 3 Plan 05: Gap Closure (SC-3/OPS-04) Summary

**useMutation wired to POST /api/v1/ops/requisitions/{req_id}/match on the Trigger Candidate Match button, closing the SC-3/OPS-04 gap with isPending guard, shortlist query invalidation, and error toast**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-14T15:48:00Z
- **Completed:** 2026-06-14T15:56:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Wired matchMutation calling apiClient.POST to the Trigger Candidate Match button onClick
- Added isPending guard on button disable state and dynamic label ("Matching…" vs default)
- Shortlist query (key: ['ops-shortlist', id]) invalidated on success to trigger refresh
- toast.error('Failed to trigger match — try again.') on error; success toast on trigger
- Added 2 it.todo stubs for match trigger behavior in ops-shortlist.test.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire match trigger mutation in requisition detail page + add test stub** - `9908991` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` - Added useMutation, useQueryClient, toast imports; matchMutation; wired button onClick + isPending state
- `apps/console/src/__tests__/ops-shortlist.test.tsx` - Added 2 it.todo stubs for POST match trigger behavior

## Decisions Made
- Invalidate via queryClient.invalidateQueries (not re-fetch directly) since match is async — the shortlist will populate after the background job completes
- isPending disable satisfies the T-03-17 double-trigger threat mitigation defined in the plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SC-3/OPS-04 gap is now fully closed: Trigger Candidate Match button fires POST /match, shows pending state, invalidates shortlist, and surfaces errors
- Phase 3 verification gap count is now 0 — all 4 observable truths satisfied
- Ready for re-verification to confirm 4/4 score

---
*Phase: 03-console-ops*
*Completed: 2026-06-14*
