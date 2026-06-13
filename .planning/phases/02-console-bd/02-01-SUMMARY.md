---
phase: 02-console-bd
plan: "01"
subsystem: ui

tags: [next-themes, sidebar, msw, vitest, shadcn, dnd-kit, react-dropzone, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: MSWProvider, QueryClientProvider, apiClient, packages/ui, packages/mocks skeleton

provides:
  - Shell sidebar layout (Server Component) with SidebarNav client component
  - BD nav items fully wired (Leads, Outreach, Pipeline, Imports, Replies) with badge counts
  - Ops/Supply/Admin dimmed stub sections (opacity-40, cursor-not-allowed, aria-disabled)
  - BD-08 snoozed wake badge in sidebar header
  - ThemeProvider(forcedTheme=dark) + Toaster in root layout (Sonner dark-mode fix)
  - Complete BD MSW handler suite: 14 handlers for all Phase 2 BD endpoints
  - Vitest infrastructure in apps/console with 4 Wave 0 test stub files (16 todos)
  - 7 new shadcn components in packages/ui (popover, sheet, checkbox, dropdown-menu, dialog, table, select)
  - @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, react-dropzone in console deps

affects: [02-02-lead-queue, 02-03-async-flows, 02-04-pipeline, all subsequent Phase 2 plans]

# Tech tracking
tech-stack:
  added:
    - next-themes@^0.4.6 (console app + packages/ui)
    - @dnd-kit/core@^6.3.1
    - @dnd-kit/sortable@^7.0.2
    - @dnd-kit/utilities@^3.2.2
    - react-dropzone@^15.0.0
    - vitest@catalog (console devDep)
    - "@testing-library/react@catalog (console devDep)"
    - "@vitejs/plugin-react@^4.7.0 (console devDep)"
    - "@types/node@catalog (packages/mocks devDep — pre-existing gap)"
    - "@types/react@catalog (packages/ui devDep — pre-existing gap)"
  patterns:
    - ThemeProvider wraps ConsoleProviders in root layout for correct Sonner dark-mode theming
    - SidebarNav is 'use client' wrapped by Server Component shell layout
    - Sidebar badge counts use staleTime=60s + refetchInterval=5min (T-02-04 DoS mitigation)
    - MSW-only stubs noted with comments for endpoints without live backend coverage
    - satisfies operator used for all MSW handler return types against api.d.ts schemas

key-files:
  created:
    - apps/console/app/(shell)/_components/sidebar-nav.tsx
    - apps/console/vitest.config.ts
    - apps/console/src/__tests__/lead-queue.test.tsx
    - apps/console/src/__tests__/async-flows.test.tsx
    - apps/console/src/__tests__/pipeline.test.tsx
    - apps/console/src/__tests__/keyboard-ux.test.tsx
    - packages/ui/src/components/ui/popover.tsx
    - packages/ui/src/components/ui/sheet.tsx
    - packages/ui/src/components/ui/checkbox.tsx
    - packages/ui/src/components/ui/dropdown-menu.tsx
    - packages/ui/src/components/ui/dialog.tsx
    - packages/ui/src/components/ui/table.tsx
    - packages/ui/src/components/ui/select.tsx
  modified:
    - apps/console/app/(shell)/layout.tsx
    - apps/console/app/layout.tsx
    - apps/console/package.json
    - apps/console/tsconfig.json
    - packages/mocks/src/handlers/bd.ts
    - packages/mocks/package.json
    - packages/ui/package.json
    - pnpm-lock.yaml

key-decisions:
  - "SidebarNav uses 'use client' wrapped by RSC shell layout — badge count queries need React hooks"
  - "ThemeProvider forcedTheme=dark: console always renders dark, suppresses hydration warning"
  - "MSW handler type corrections: OutreachSequenceResponse uses sequence_id+step_index (not id+step_number); BulkActionResponse.errors is BulkActionError[] (not string[]); LeadFatCardResponse uses contact: ContactDetail (not flat fields)"
  - "tsconfig.json @/* paths extended to include ../../packages/ui/src/* for cross-project @/lib/utils resolution"
  - "@types/react added to packages/ui so badge.tsx React import resolves when compiled from console context"

patterns-established:
  - "Sidebar nav pattern: 'use client' component (hooks needed) inside RSC layout — standard Next.js App Router split"
  - "MSW stubs for no-live-endpoint handlers documented inline with '// NOTE: No live backend endpoint'"
  - "BDTaskSummary.context_json used for task-specific fields (lead_id, classification) vs flat fields in plan spec"

requirements-completed: [BD-08, CUX-01, CUX-03]

# Metrics
duration: 38min
completed: 2026-06-13
---

# Phase 2 Plan 01: Prerequisites — Sidebar, MSW Handlers, Vitest Infrastructure Summary

**Functional sidebar with BD nav + badge counts, complete 14-handler MSW BD suite, Vitest wave-0 stubs, and ThemeProvider dark-mode fix all ready for Phase 2 feature plans**

## Performance

- **Duration:** ~38 min
- **Started:** 2026-06-13T17:40:00Z
- **Completed:** 2026-06-13T18:18:00Z
- **Tasks:** 3 completed
- **Files modified:** 20

## Accomplishments

- Shell sidebar with BD nav fully wired (badge counts from useQuery), Ops/Supply/Admin dimmed stubs, BD-08 snoozed wake badge in header
- Complete BD MSW handler suite (14 handlers) covering all Phase 2 endpoints: leads, lead detail, bulk-action, imports, pipeline, outreach CRUD, BD tasks, snoozed wake count
- Vitest infrastructure with jsdom environment and 4 Wave-0 test stub files (16 todos) — all pass on `vitest run`
- Root layout updated with ThemeProvider(forcedTheme=dark) + Toaster(bottom-right) for Sonner dark-mode fix

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages, shadcn components, vitest config, test stubs** - `23e90c9` (chore)
2. **Task 2: Expand BD MSW handlers** - `1259305` (feat)
3. **Task 3: Shell layout — sidebar nav + ThemeProvider dark-mode fix** - `e5e085e` (feat)

## Files Created/Modified

- `apps/console/app/(shell)/_components/sidebar-nav.tsx` - 'use client' sidebar with BD nav, badge counts, dimmed stubs
- `apps/console/app/(shell)/layout.tsx` - RSC shell layout importing SidebarNav
- `apps/console/app/layout.tsx` - Root layout with ThemeProvider(forcedTheme=dark) + Toaster
- `apps/console/vitest.config.ts` - Vitest config with jsdom environment
- `apps/console/src/__tests__/lead-queue.test.tsx` - 5 todos for Plans 02-02/02-04
- `apps/console/src/__tests__/async-flows.test.tsx` - 3 todos for Plan 02-03
- `apps/console/src/__tests__/pipeline.test.tsx` - 3 todos for Plan 02-04
- `apps/console/src/__tests__/keyboard-ux.test.tsx` - 5 todos for Plans 02-02/02-04
- `packages/mocks/src/handlers/bd.ts` - All 14 BD MSW handlers (12 new + 1 existing + snoozed-wake-count)
- `packages/ui/src/components/ui/{checkbox,dialog,dropdown-menu,popover,select,sheet,table}.tsx` - 7 new shadcn components

## Decisions Made

- `ThemeProvider forcedTheme="dark"` on the console: avoids any FOUC or theme flicker; console is always dark
- `SidebarNav` is `'use client'` (needs `usePathname`, `useQuery`) wrapped by RSC `(shell)/layout.tsx` — standard App Router split
- MSW handler type corrections required against actual `api.d.ts` schemas: `OutreachSequenceResponse` uses `sequence_id` (not `id`) and `step_index` (not `step_number`); BDTaskSummary uses `category` + `context_json` for task-specific data
- `apps/console/tsconfig.json` paths extended to `../../packages/ui/src/*` so `@/lib/utils` in shadcn components resolves when compiled from console context

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected OutreachSequenceResponse field names against api.d.ts**
- **Found during:** Task 2 (Expand BD MSW handlers)
- **Issue:** Plan spec used `id` but schema uses `sequence_id`; plan used `step_number` but schema uses `step_index`; plan used `scheduled_at` but schema uses `scheduled_day`
- **Fix:** Updated all outreach mock data to use correct field names from `api.d.ts`
- **Files modified:** packages/mocks/src/handlers/bd.ts
- **Verification:** `tsc --noEmit` passes on packages/mocks
- **Committed in:** 1259305 (Task 2 commit)

**2. [Rule 1 - Bug] Corrected BulkActionResponse.errors type**
- **Found during:** Task 2 (Expand BD MSW handlers)
- **Issue:** Plan spec had `errors: []` as string[] but schema defines `errors: BulkActionError[]`
- **Fix:** Mock returns `errors: []` which is valid for both (empty array)
- **Files modified:** packages/mocks/src/handlers/bd.ts
- **Verification:** TypeScript satisfies check passes
- **Committed in:** 1259305 (Task 2 commit)

**3. [Rule 1 - Bug] Corrected LeadFatCardResponse structure**
- **Found during:** Task 2 (Expand BD MSW handlers)
- **Issue:** Plan spec had flat `company_name` at root and missing `import_id`; actual schema has `contact: ContactDetail` nested object and requires `import_id`
- **Fix:** Updated mock to use `contact: { id, name, title, email, ... }` structure and added `import_id: null`
- **Files modified:** packages/mocks/src/handlers/bd.ts
- **Verification:** `tsc --noEmit` satisfies check passes
- **Committed in:** 1259305 (Task 2 commit)

**4. [Rule 3 - Blocking] Fixed missing @types/node in packages/mocks**
- **Found during:** Task 2 (MSW handlers typecheck)
- **Issue:** `packages/mocks` had no `@types/node` in devDeps causing pre-existing `process` type errors
- **Fix:** `pnpm --filter @brynzit/mocks add -D @types/node`
- **Files modified:** packages/mocks/package.json, pnpm-lock.yaml
- **Verification:** `tsc --noEmit` on packages/mocks exits 0
- **Committed in:** 1259305 (Task 2 commit)

**5. [Rule 3 - Blocking] Fixed tsconfig @/lib/utils path resolution for packages/ui cross-project compilation**
- **Found during:** Task 3 (console typecheck)
- **Issue:** `apps/console/tsconfig.json` resolves packages/ui source through workspace symlink, but badge.tsx's `@/lib/utils` couldn't resolve in console's path context
- **Fix:** Added `../../packages/ui/src/*` as secondary path mapping for `@/*` in console's tsconfig
- **Files modified:** apps/console/tsconfig.json
- **Verification:** `pnpm --filter @brynzit/console typecheck` exits 0
- **Committed in:** e5e085e (Task 3 commit)

**6. [Rule 3 - Blocking] Added @types/react to packages/ui devDeps**
- **Found during:** Task 3 (console typecheck)
- **Issue:** badge.tsx `import * as React from "react"` couldn't resolve React types when compiled from console context (packages/ui had no @types/react)
- **Fix:** `pnpm --filter @brynzit/ui add -D @types/react @types/react-dom`
- **Files modified:** packages/ui/package.json, pnpm-lock.yaml
- **Verification:** `pnpm --filter @brynzit/console typecheck` exits 0
- **Committed in:** e5e085e (Task 3 commit)

---

**Total deviations:** 6 auto-fixed (3 Rule 1 type bugs, 3 Rule 3 blocking)
**Impact on plan:** All auto-fixes required for type safety and correctness. No scope creep. MSW mock data now correctly matches live API schema.

## Issues Encountered

- Stash pop during pre-existing typecheck error investigation reverted layout.tsx and shell layout.tsx — re-applied before committing Task 3

## Known Stubs

The following MSW-only handlers have no corresponding live backend endpoint:
- `/api/v1/bd/tasks` — BD tasks list (context_json contains classification data)
- `/api/v1/bd/outreach` — Outreach sequence list (sequences accessed per-lead in live API)
- `/api/v1/bd/leads/snoozed-wake-count` — Wake badge count

These are intentional MSW stubs documented in RESEARCH.md Open Questions 1-3. Future plans will either wire the live endpoint when it ships or keep the mock.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Shell sidebar and layout ready — Plan 02-02 (lead queue) can use as scaffold
- All BD MSW handlers registered and typed — Plans 02-02, 02-03, 02-04 can use immediately
- Vitest wave-0 stubs in place — todos will be filled in by each feature plan
- shadcn components (popover, sheet, checkbox, dropdown-menu, dialog, table, select) available for lead queue and slide-over UI

---
*Phase: 02-console-bd*
*Completed: 2026-06-13*
