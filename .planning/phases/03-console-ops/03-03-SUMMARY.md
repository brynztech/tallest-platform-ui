---
phase: 03-console-ops
plan: "03"
subsystem: ui

tags: [react, tanstack-query, use-async-job, zod, react-hook-form, msw, next-js, shadcn]

# Dependency graph
requires:
  - phase: 03-console-ops
    plan: "01"
    provides: Ops MSW handler suite (ops.ts), Textarea component, Ops sidebar unlocked, Wave-0 test stubs

provides:
  - Global requisitions list page (/ops/requisitions) — MSW-only fetch with client filter, create dialog
  - Create Requisition dialog — 3-phase flow: input → parsing (skeletons) → complete/failed
  - useAsyncJob JD parse integration — statusMap override { open: complete, filled: complete, closed: complete, parsing: pending }
  - Requisition detail hub page (/ops/requisitions/{id}) — 4 section headings with Wave 3 placeholders
  - RequisitionFields card — skills badges, edit dialog with raw fetch PATCH
  - ops.ts expanded: PATCH /api/v1/ops/requisitions/:req_id MSW-only handler (21 handlers total)
  - 2 passing tests in ops-jd-parse.test.tsx (useAsyncJob statusMap + status badge mapping)

affects: [03-04a-shortlist-interviews, 03-04b-placements, requisition detail hub is scaffold for Wave 3]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useAsyncJob with domain-specific statusMap override — 'open' not in DEFAULT_STATUS_MAP; always pass statusMap for JD parse flow
    - 3-phase dialog pattern — input (before create) → skeleton shimmer (polling) → animate-in fields (complete/failed)
    - raw fetch PATCH for MSW-only endpoints — same pattern as MSW-only GET list, applicable when api.d.ts has patch? never
    - React.use(params) for Next.js 16 async params in 'use client' page components
    - animate-in cascade stagger — animationDelay 0/50/100/150ms inline style for cascading field reveal

key-files:
  created:
    - apps/console/app/(shell)/ops/requisitions/page.tsx
    - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
    - apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx
  modified:
    - apps/console/src/__tests__/ops-jd-parse.test.tsx
    - packages/mocks/src/handlers/ops.ts

key-decisions:
  - "No PATCH /api/v1/ops/requisitions/{req_id} in api.d.ts — raw fetch PATCH used with new MSW-only handler; same pattern as MSW-only GET list"
  - "React.use(params) is the correct Next.js 16 pattern for 'use client' dynamic route pages — params is a Promise"
  - "skills typed as unknown in RequisitionResponse — cast to string[] | null at use site in RequisitionFields component"
  - "Parsed fields use defaultValue (not value) to avoid controlled/uncontrolled conflict — fields are display-only post-parse"
  - "PATCH MSW handler added to ops.ts as handler 11b — total handler count is 21"

patterns-established:
  - "MSW-only PATCH: add comment '// NOTE: MSW-only — no live PATCH endpoint (api.d.ts patch?: never)' and use raw fetch"
  - "3-phase dialog with async polling: !reqId → isParsing skeleton → phase complete/failed fields"
  - "React.use(params) in 'use client' page: use() from react, params typed as Promise<{ id: string }>"

requirements-completed: [OPS-02, OPS-03]

# Metrics
duration: ~25min
completed: 2026-06-14
---

# Phase 3 Plan 03: Requisitions + JD Parse Summary

**Global requisitions list with MSW-only fetch, 3-phase create dialog (input → skeleton polling → animate-in fields) using useAsyncJob statusMap override, and scrollable requisition detail hub with RequisitionFields card**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-14T14:20:00Z
- **Completed:** 2026-06-14T14:45:00Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments

- Global requisitions list page with MSW-only raw fetch, client filter Select, create dialog, and empty states (with/without filter)
- Create Requisition dialog with complete 3-phase JD parse flow: input phase → skeleton shimmer during polling → parsed fields animate in with 0/50/100/150ms cascade stagger on complete; toast error + field unlock on failed
- useAsyncJob with domain-specific statusMap `{ open: 'complete', filled: 'complete', closed: 'complete', parsing: 'pending' }` — critical override since 'open' is not in DEFAULT_STATUS_MAP
- Requisition detail hub page with React.use(params) for Next.js 16 async params, 4 section headings (Details/Shortlist/Interviews/Placements), Wave 3 placeholders
- RequisitionFields card with skills badges (flex-wrap), 2x2 field grid, edit dialog using raw fetch PATCH (MSW-only)
- MSW ops.ts expanded to 21 handlers (PATCH /api/v1/ops/requisitions/:req_id added)
- ops-jd-parse.test.tsx: 2 passing tests (useAsyncJob open→complete + status badge mapping)

## Task Commits

Each task was committed atomically:

1. **Task 1: Global requisitions list page + create-requisition dialog with JD parse flow** - `4d75746` (feat)
2. **Task 2: Requisition detail hub page + RequisitionFields card + update jd-parse test** - `b1b1ba3` (feat)

**Plan metadata:** (committed with SUMMARY below)

## Files Created/Modified

- `apps/console/app/(shell)/ops/requisitions/page.tsx` — Global list page: MSW-only fetch, client filter, create dialog with 3-phase JD parse, useAsyncJob with statusMap override
- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` — Requisition detail hub: React.use(params), useQuery, 4 section headings with Wave 3 placeholders
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` — Fields card: skills badges, edit dialog, raw fetch PATCH (MSW-only)
- `apps/console/src/__tests__/ops-jd-parse.test.tsx` — Added 'Requisition status badge logic (OPS-03)' describe block with 1 passing test; removed corresponding todo
- `packages/mocks/src/handlers/ops.ts` — Added PATCH handler 11b for requisition update (21 handlers total)

## Decisions Made

- No PATCH `/api/v1/ops/requisitions/{req_id}` in api.d.ts — used raw fetch PATCH with new MSW-only handler instead of `apiClient.PATCH` (which would be a TypeScript error)
- `React.use(params)` is the correct Next.js 16 `'use client'` pattern for dynamic route pages — params is a Promise that must be unwrapped
- `skills` field is `unknown` in `RequisitionResponse` — cast to `string[] | null` at use site (no schema change needed)
- Parsed fields use `defaultValue` not `value` to avoid controlled/uncontrolled React conflict after polling completes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added PATCH MSW handler for requisition update**
- **Found during:** Task 2 (RequisitionFields edit dialog)
- **Issue:** Plan specified using `apiClient.PATCH('/api/v1/ops/requisitions/{req_id}', ...)` but api.d.ts has `patch?: never` — TypeScript compile error; no live PATCH endpoint exists
- **Fix:** Added PATCH handler 11b to packages/mocks/src/handlers/ops.ts; component uses raw fetch with `method: 'PATCH'` so MSW intercepts it; same pattern as MSW-only GET list
- **Files modified:** packages/mocks/src/handlers/ops.ts, apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx
- **Verification:** TypeScript check exits 0; pnpm run test exits 0 with 19 passing
- **Committed in:** b1b1ba3 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Next.js 16 async params handling**
- **Found during:** Task 2 (requisition detail page)
- **Issue:** Plan spec used `params: { id: string }` synchronously — in Next.js 16 App Router, params is a Promise and must be unwrapped; synchronous access causes runtime errors
- **Fix:** Changed signature to `params: Promise<{ id: string }>` and used `React.use(params)` to unwrap — the correct Next.js 16 pattern for `'use client'` components
- **Files modified:** apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
- **Verification:** TypeScript check exits 0; no runtime Promise warning
- **Committed in:** b1b1ba3 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 2 missing critical, 1 Rule 1 bug)
**Impact on plan:** Both auto-fixes required for TypeScript correctness and Next.js 16 runtime correctness. No scope creep.

## Issues Encountered

- vitest running via `pnpm --filter @brynzit/console` from the monorepo root resolves to the main repo files (not worktree files). Tests must be run with `pnpm run --filter @brynzit/console test` from the worktree root to get worktree file resolution. This is a worktree-specific behavior documented for future plans.

## Known Stubs

The following are intentional Wave 3 stubs (to be filled by Plan 03-04):

- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`: Section 2 (Shortlist), Section 3 (Interviews), and Section 4 (Placements) are placeholder empty states. Plan 03-04 will import ShortlistTable, InterviewsSection, and PlacementsSection components into this file.
- `setSelectedCandidateId`, `setIsCandidatePanelOpen`, `setIsPlacementOpen`, `setApprovedCandidateId` — state declared for Wave 3 components, currently unused (TypeScript suppressed via unnamed destructure `const [, setter]`)

These stubs are intentional: the hub page establishes the scroll structure and shared state for Wave 3 to wire in.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/ops/requisitions` page renders list, filter dropdown, create dialog with full JD parse flow — ready for browser verification
- `/ops/requisitions/{id}` hub page structure established — Plan 03-04 can import shortlist/interview/placement sections
- 21 MSW handlers in ops.ts — all Wave 3 section endpoints already mocked
- 19 passing tests across all 8 test files (up from 18)

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/console/app/(shell)/ops/requisitions/page.tsx | FOUND |
| apps/console/app/(shell)/ops/requisitions/[id]/page.tsx | FOUND |
| apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx | FOUND |
| apps/console/src/__tests__/ops-jd-parse.test.tsx (2 passing tests) | FOUND |
| packages/mocks/src/handlers/ops.ts (PATCH handler added) | FOUND |
| Commit 4d75746 (Task 1) | FOUND |
| Commit b1b1ba3 (Task 2) | FOUND |

---
*Phase: 03-console-ops*
*Completed: 2026-06-14*
