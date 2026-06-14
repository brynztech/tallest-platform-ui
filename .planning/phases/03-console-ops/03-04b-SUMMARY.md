---
phase: 03-console-ops
plan: "04b"
subsystem: ui

tags: [react, tanstack-query, shadcn, msw, sheet-slide-over, react-hook-form, zod, ops-domain]

# Dependency graph
requires:
  - phase: 03-console-ops
    plan: "04a"
    provides: approvedCandidateId state in page.tsx, ShortlistTable, CandidateDetailPanel
  - phase: 03-console-ops
    plan: "02"
    provides: Ops MSW handler suite including interviews POST/PATCH and placements POST endpoints

provides:
  - InterviewsSection: MSW-only fetch with VALID_TRANSITIONS gate, inline PATCH Select, toast.error on 409
  - PlacementPanel: Sheet slide-over with react-hook-form + Zod, retention_flag_90d checkbox, POST /ops/placements
  - PlacementsSection: live GET /ops/requisitions/{id}/placements, fee/billing/retention badge
  - Global /ops/interviews page: MSW-only fetch with status filter dropdown, inline PATCH Select
  - Requisition detail page fully wired: all 4 sections (Shortlist, Interviews, Placements + slide-overs)

affects: [future-phases — OPS-05/06 complete; full recruiting lifecycle navigable end-to-end]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MSW-only raw fetch pattern — GET /api/v1/ops/interviews has get?: never in api.d.ts; use raw fetch() with URL + searchParams
    - VALID_TRANSITIONS Record<string, string[]> — frontend UX gate; backend 409 is authoritative; isTerminal = nextStates.length === 0
    - PlacementPanel null-coalesce for nullable req.client_id — req.client_id is string|null; use ?? '' when prop expects string
    - Sheet slide-over Zod + RHF pattern — zodResolver, Controller+Checkbox for boolean fields, setValueAs for numeric inputs

key-files:
  created:
    - apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx
    - apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx
    - apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx
    - apps/console/app/(shell)/ops/interviews/page.tsx
  modified:
    - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
    - apps/console/src/__tests__/ops-interviews.test.tsx
    - apps/console/src/__tests__/ops-placements.test.tsx

key-decisions:
  - "InterviewsSection uses raw fetch() for the list query — GET /api/v1/ops/interviews has get?: never in the generated api.d.ts (Pitfall 3); raw fetch with ?requisition_id= param is the correct pattern"
  - "VALID_TRANSITIONS frontend gate is UX-level only — backend 409 is the authoritative state machine guard; frontend prevents nonsensical UI states but does not replace backend enforcement"
  - "req.client_id is string|null in RequisitionResponse — PlacementPanel clientId prop needs ?? '' null-coalesce at the usage boundary"
  - "placement-panel.tsx billing_status is a free-form string (Pitfall 4) — used z.string().min(1) not an enum, with helper text for common values"

patterns-established:
  - "MSW-only fetch pattern: use raw fetch() + URL + searchParams when openapi-fetch endpoint has get?: never"
  - "VALID_TRANSITIONS state machine gate: Record<string, string[]> with empty array for terminal states; isTerminal = nextStates.length === 0"

requirements-completed:
  - OPS-05
  - OPS-06

# Metrics
duration: ~21min
completed: 2026-06-14
---

# Phase 3 Plan 04b: Interviews + Placement Vertical Slice Summary

**Interviews state machine (VALID_TRANSITIONS + 409 toast), placement Sheet slide-over (Zod + RHF + retention_flag_90d), placements list with fee/billing/90-day badge, global /ops/interviews page with status filter — full recruiting lifecycle wired end-to-end**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-06-14T09:00:00Z
- **Completed:** 2026-06-14T09:21:45Z
- **Tasks:** 1 completed
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments

- `interviews-section.tsx`: MSW-only fetch via raw `fetch()` (GET has `get?: never` in api.d.ts), VALID_TRANSITIONS map gate, inline Select per row, PATCH on change, `toast.error('Invalid status transition.')` on error (409 guard), "Schedule Interview" button gated on `approvedCandidateId`
- `placement-panel.tsx`: Sheet slide-over cloned from lead-detail-panel.tsx pattern, react-hook-form + Zod v4 `placementSchema`, Controller + Checkbox for `retention_flag_90d` boolean, pre-filled read-only fields (candidate/req/client), POST `/ops/placements`, success toast `Placement logged for [name].`
- `placements-section.tsx`: live GET `/ops/requisitions/{id}/placements` via `apiClient.GET`, fee display with USD formatting, billing_status text, "90-day retention" Badge when flag is true
- `ops/interviews/page.tsx`: global interviews view, MSW-only fetch with `?status=` filter param, status filter Select in sticky toolbar, inline PATCH Select per row with VALID_TRANSITIONS
- `page.tsx`: wired all 4 sections (`ShortlistTable` from 03-04a + `InterviewsSection` + `PlacementsSection` + `PlacementPanel`); `isPlacementOpen` state activated (was `[, setIsPlacementOpen]`); `req.client_id ?? ''` null-coalesce for TypeScript
- `ops-interviews.test.tsx`: 4 passing tests (VALID_TRANSITIONS map assertions)
- `ops-placements.test.tsx`: 5 passing tests (Zod schema + retention flag defaults + optional fee)

## Task Commits

1. **Task 1: InterviewsSection + PlacementPanel + PlacementsSection + global interviews page + wire req detail** - `5195da3` (feat)

**Plan metadata:** (committed with SUMMARY below)

## Files Created/Modified

- `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx` — MSW-only fetch, VALID_TRANSITIONS gate, PATCH Select, 409 toast.error
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx` — Sheet slide-over, Zod + RHF form, retention_flag_90d Checkbox, POST /ops/placements
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx` — GET list, fee USD display, billing_status, 90-day retention Badge
- `apps/console/app/(shell)/ops/interviews/page.tsx` — global interviews, MSW-only fetch, status filter Select, inline PATCH
- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` — wired all 4 sections, activated isPlacementOpen state, null-coalesced client_id
- `apps/console/src/__tests__/ops-interviews.test.tsx` — 4 passing tests: VALID_TRANSITIONS assertions
- `apps/console/src/__tests__/ops-placements.test.tsx` — 5 passing tests: Zod schema + retention defaults + optional fee

## Decisions Made

- `req.client_id` is `string | null` in the generated `RequisitionResponse` schema — `PlacementPanel` clientId prop expects `string`; used `?? ''` at the call site (Rule 1 auto-fix)
- Raw `fetch()` for interviews list queries because `GET /api/v1/ops/interviews` has `get?: never` in api.d.ts — cannot use `apiClient.GET` for this endpoint
- `billing_status` uses `z.string().min(1)` not an enum — the API schema confirms it's a free-form string with no enum constraint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: req.client_id is string|null, PlacementPanel.clientId expects string**
- **Found during:** Task 1 (page.tsx wiring)
- **Issue:** `RequisitionResponse.client_id` is typed `string | null` in api.d.ts; passing it directly to `PlacementPanel.clientId: string` causes TS2322
- **Fix:** Applied `req.client_id ?? ''` null-coalesce at the call site; empty string renders as blank in the pre-filled read-only input (acceptable UX)
- **Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`
- **Verification:** `pnpm --filter @brynzit/console exec tsc --noEmit` exits 0
- **Committed in:** 5195da3

---

**Total deviations:** 1 auto-fixed (Rule 1 TypeScript type bug)
**Impact on plan:** Minimal — null client_id renders as blank in the pre-filled read-only input; form functionality unaffected.

## Issues Encountered

None — all verification checks passed first attempt after the TypeScript fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full OPS lifecycle end-to-end navigable: clients → requisitions → shortlist → interviews → placements
- OPS-05 (interview state machine) and OPS-06 (placement logging) complete
- Phase 3 Wave 3 complete (03-04a + 03-04b both done)
- Ready for Phase 4 (Supply section) or Phase 5 (public site)

## Threat Flags

No new security-relevant surface beyond plan's threat_model:
- T-03-13 mitigated: VALID_TRANSITIONS map limits Select options; backend 409 is authoritative state machine guard
- T-03-14 mitigated: `placementSchema` validates billing_status (required min 1), retention_flag_90d (boolean), fee_usd (positive if provided) via react-hook-form resolver
- T-03-15 accepted: MSW-only raw fetch — internal trusted-network tool; no user PII in URL params (req_id UUID only)

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx | FOUND |
| apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx | FOUND |
| apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx | FOUND |
| apps/console/app/(shell)/ops/interviews/page.tsx | FOUND |
| apps/console/app/(shell)/ops/requisitions/[id]/page.tsx (wired) | FOUND |
| apps/console/src/__tests__/ops-interviews.test.tsx (4 passing tests) | FOUND |
| apps/console/src/__tests__/ops-placements.test.tsx (5 passing tests) | FOUND |
| Commit 5195da3 (Task 1) | FOUND |
| `grep -c "Invalid status transition" interviews-section.tsx` returns 1 | PASSED |
| `grep -c "retention_flag_90d" placement-panel.tsx` returns 5 | PASSED |
| `grep -c "MSW-only" ops/interviews/page.tsx` returns 1 | PASSED |
| `grep -c "90-day retention" placements-section.tsx` returns 1 | PASSED |
| `pnpm --filter @brynzit/console exec tsc --noEmit` exits 0 | PASSED |
| `pnpm --filter @brynzit/console run test` — 29 passing, 0 failing | PASSED |

---
*Phase: 03-console-ops*
*Completed: 2026-06-14*
