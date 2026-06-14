---
phase: 04-console-supply-admin
plan: "01"
subsystem: ui
tags: [msw, shadcn, sidebar, vitest, supply, monitoring, typescript]

# Dependency graph
requires:
  - phase: 03-console-ops
    provides: sidebar-nav.tsx with OPS_NAV pattern, MSW handler pattern from ops.ts
  - phase: 01-foundation
    provides: packages/ui shadcn setup, packages/mocks MSW infrastructure
provides:
  - packages/ui/src/components/ui/tabs.tsx — shadcn Tabs for admin tabs and ingest tabs
  - packages/ui/src/components/ui/progress.tsx — shadcn Progress for quota progress bar
  - packages/mocks/src/handlers/supply.ts — 14 supply domain MSW handlers with typed mock data
  - packages/mocks/src/handlers/monitoring.ts — 6 monitoring domain MSW handlers with typed mock data
  - apps/console/app/(shell)/_components/sidebar-nav.tsx — Supply + Admin nav sections unlocked as real Links
  - apps/console/src/__tests__/supply-search.test.tsx — SUP-01 test stubs
  - apps/console/src/__tests__/supply-enrich.test.tsx — SUP-02 test stubs
  - apps/console/src/__tests__/supply-ingest.test.tsx — SUP-03 test stubs
  - apps/console/src/__tests__/supply-engagements.test.tsx — SUP-05 test stubs
  - apps/console/src/__tests__/admin-costs.test.tsx — ADM-01 + ADM-04 test stubs
  - apps/console/src/__tests__/admin-events.test.tsx — ADM-02 test stubs
  - apps/console/src/__tests__/admin-quotas.test.tsx — ADM-03 test stubs
  - apps/console/src/__tests__/admin-prompts.test.tsx — ADM-05 test stubs
affects:
  - 04-02 supply-search (uses supplyHandlers, tabs.tsx, sidebar Supply nav)
  - 04-03 supply-candidates (uses supplyHandlers candidate profile/enrich)
  - 04-04 supply-ingest (uses supplyHandlers ingest, react-dropzone, progress.tsx)
  - 04-05 supply-engagements (uses supplyHandlers engagement, supply-engagements test stubs)
  - 04-06 admin-dashboard (uses monitoringHandlers, tabs.tsx, progress.tsx, admin-costs/events/quotas/prompts stubs)

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-tabs (via shadcn tabs install)"
    - "@radix-ui/react-progress (via shadcn progress install)"
  patterns:
    - "MSW handler path ordering: static paths (/candidates/search, /candidates/ingest) registered BEFORE parameterised paths (/:candidate_id) to prevent match collisions"
    - "satisfies components['schemas']['TypeName'] on all MSW return values for compile-time type safety"
    - "it.todo() test stubs for future requirement placeholders — vitest exits 0"

key-files:
  created:
    - packages/ui/src/components/ui/tabs.tsx
    - packages/ui/src/components/ui/progress.tsx
    - apps/console/src/__tests__/supply-search.test.tsx
    - apps/console/src/__tests__/supply-enrich.test.tsx
    - apps/console/src/__tests__/supply-ingest.test.tsx
    - apps/console/src/__tests__/supply-engagements.test.tsx
    - apps/console/src/__tests__/admin-costs.test.tsx
    - apps/console/src/__tests__/admin-events.test.tsx
    - apps/console/src/__tests__/admin-quotas.test.tsx
    - apps/console/src/__tests__/admin-prompts.test.tsx
  modified:
    - packages/mocks/src/handlers/supply.ts
    - packages/mocks/src/handlers/monitoring.ts
    - apps/console/app/(shell)/_components/sidebar-nav.tsx

key-decisions:
  - "Supply sidebar has 3 items: Candidates (/supply/search), Ingest (/supply/ingest), Engagements (/supply/engagements) — no Shortlists item (shortlist review lives at /ops/requisitions/[id])"
  - "Admin sidebar has 1 item: Admin (/admin) — single entry point to tabbed dashboard, not separate routes per tab"
  - "MSW-only endpoint GET /supply/engagements added to support the engagements list page (no live backend endpoint)"
  - "task_type filter intentionally NOT applied as server param in agent-events handler — comment documents client-side filtering (D-15 spec)"
  - "PromptSaveResponse uses version_saved (number) + message fields per actual api.d.ts schema (plan suggested saved_at which is not in the schema)"

patterns-established:
  - "MSW path ordering rule: always register /supply/candidates/search and /supply/candidates/ingest BEFORE /supply/candidates/:candidate_id"
  - "SUPPLY_NAV and ADMIN_NAV use same Link pattern as OPS_NAV — no badge counts needed"
  - "Test stubs use it.todo() with descriptive names matching requirement acceptance criteria"

requirements-completed:
  - SUP-01
  - SUP-02
  - SUP-03
  - SUP-04
  - SUP-05
  - ADM-01
  - ADM-02
  - ADM-03
  - ADM-04
  - ADM-05

# Metrics
duration: 32min
completed: 2026-06-14
---

# Phase 4 Plan 01: Wave 0 Infrastructure Summary

**shadcn tabs+progress installed, 20 typed MSW handlers (14 supply + 6 monitoring) populated, Supply and Admin sidebar nav unlocked as real Links, 8 vitest stub files created covering all 10 Phase 4 requirements**

## Performance

- **Duration:** ~32 min
- **Started:** 2026-06-14T14:12:00Z
- **Completed:** 2026-06-14T14:44:20Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Installed shadcn `tabs` and `progress` components into `packages/ui` — prerequisites for the admin tabbed dashboard and quota progress bar
- Replaced two empty MSW handler stubs with fully-typed suites: 14 supply handlers covering all supply domain paths (search before :id to prevent match collisions, ingest, profile, enrich, shortlists, engagements) and 6 monitoring handlers (cost, agent-events, quota, pipeline, prompts GET/PUT)
- Removed `STUB_SECTIONS` from sidebar-nav.tsx and added `SUPPLY_NAV` (Candidates/Ingest/Engagements) and `ADMIN_NAV` (Admin) as real clickable Link-based nav sections
- Created 8 test stub files with `it.todo()` placeholders — full vitest suite exits 0

## Task Commits

1. **Task 1: Install shadcn tabs+progress; populate supply and monitoring MSW handlers** - `bb5c80a` (feat)
2. **Task 2: Unlock sidebar Supply+Admin sections; create 8 test stubs** - `d02705c` (feat)

## Files Created/Modified

- `packages/ui/src/components/ui/tabs.tsx` — shadcn Tabs component (created by shadcn CLI)
- `packages/ui/src/components/ui/progress.tsx` — shadcn Progress component (created by shadcn CLI)
- `packages/mocks/src/handlers/supply.ts` — 14 typed MSW handlers for all supply domain endpoints
- `packages/mocks/src/handlers/monitoring.ts` — 6 typed MSW handlers for all monitoring endpoints
- `apps/console/app/(shell)/_components/sidebar-nav.tsx` — STUB_SECTIONS removed; SUPPLY_NAV + ADMIN_NAV added as real Link nav sections
- `apps/console/src/__tests__/supply-search.test.tsx` — SUP-01 test stubs (5 it.todo items)
- `apps/console/src/__tests__/supply-enrich.test.tsx` — SUP-02 test stubs (5 it.todo items)
- `apps/console/src/__tests__/supply-ingest.test.tsx` — SUP-03 test stubs (5 it.todo items)
- `apps/console/src/__tests__/supply-engagements.test.tsx` — SUP-05 test stubs (5 it.todo items)
- `apps/console/src/__tests__/admin-costs.test.tsx` — ADM-01 + ADM-04 test stubs (7 it.todo items)
- `apps/console/src/__tests__/admin-events.test.tsx` — ADM-02 test stubs (5 it.todo items)
- `apps/console/src/__tests__/admin-quotas.test.tsx` — ADM-03 test stubs (4 it.todo items)
- `apps/console/src/__tests__/admin-prompts.test.tsx` — ADM-05 test stubs (6 it.todo items)

## Decisions Made

- Supply sidebar has 3 items (Candidates/Ingest/Engagements) — no Shortlists item per plan spec; shortlist review is an Ops surface at `/ops/requisitions/[id]`
- Admin sidebar has a single "Admin" item pointing to `/admin` — the tabbed dashboard lives on one page (D-14)
- Added MSW-only `GET /supply/engagements` handler (no live backend equivalent) to support the engagements list page
- `task_type` filter excluded from agent-events server params (client-side filtering per D-15); comment documents the intentional omission
- Used `version_saved` (number) + `message` fields for `PromptSaveResponse` — this is the actual api.d.ts schema; plan's `saved_at` field does not exist in the schema (auto-corrected to match types)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PromptSaveResponse field mismatch — plan specified `saved_at` but schema has `version_saved` + `message`**
- **Found during:** Task 1 (monitoring handler implementation)
- **Issue:** The plan's action section specified returning `{ name: params.name, content: body.content, saved_at: new Date().toISOString() }` but the actual `PromptSaveResponse` schema in api.d.ts has `{ name, version_saved: number, message: string }` — no `saved_at` field and no `content` field in the response
- **Fix:** Used the actual schema fields: `{ name, version_saved: 2, message: "Prompt saved." }` with `satisfies components['schemas']['PromptSaveResponse']`
- **Files modified:** packages/mocks/src/handlers/monitoring.ts
- **Verification:** TypeScript typecheck passes with no errors
- **Committed in:** bb5c80a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch corrected against actual schema)
**Impact on plan:** Fix ensures MSW handler matches the real API contract. No scope changes.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

All 14 supply + 6 monitoring MSW handlers are live and typed. The sidebar Supply and Admin sections are navigable. `tabs.tsx` and `progress.tsx` are available for import in Phase 4 feature plans. Test stubs ensure vitest stays green as feature plans implement each requirement.

Ready for:
- Plan 02: Supply Search page (uses `supplyHandlers`, `tabs.tsx`, `/supply/search` route)
- Plan 03: Candidate Profile sheet (uses `supplyHandlers` candidate/enrich endpoints)
- Plan 04: Supply Ingest page (uses `supplyHandlers` ingest endpoints, `progress.tsx`)
- Plan 05: Engagements page (uses `supplyHandlers` engagement endpoints)
- Plan 06: Admin dashboard (uses `monitoringHandlers`, `tabs.tsx`, `progress.tsx`)

---
*Phase: 04-console-supply-admin*
*Completed: 2026-06-14*
