---
phase: 01-foundation
plan: "04"
subsystem: walking-skeleton
tags:
  - shadcn
  - msw
  - tanstack-query
  - openapi-fetch
  - vitest
  - turbo

dependency_graph:
  requires:
    - 01-01  # packages/ui, packages/api-client, packages/mocks, packages/hooks
    - 01-02  # api.d.ts generated types
    - 01-03  # app shells
  provides:
    - packages/ui shadcn/ui design system (9 components, new-york style)
    - packages/mocks/src/handlers/bd.ts real MSW handler for rejection-reasons
    - apps/console/app/(shell)/bd/leads/page.tsx walking skeleton page
    - packages/api-client/src/__tests__/smoke-domains.test.ts 4-domain live tests
    - packages/api-client/vitest.config.ts
  affects:
    - All future console phases (use packages/ui components)
    - Phase 2 (BD console) — extends bd.ts handlers, replaces skeleton page

tech_stack:
  added:
    - "shadcn/ui (new-york style) in packages/ui via CLI install"
    - "class-variance-authority@^0.7.1 (cva for button variants)"
    - "clsx@^2.1.1 + tailwind-merge@^3.3.1 (cn() utility)"
    - "radix-ui@^1.5.0 (umbrella Radix primitives package)"
    - "sonner@^2.0.7 (toast notification for shadcn sonner component)"
    - "next-themes@^0.4.6 (theme provider for sonner)"
    - "vitest in @brynzit/api-client devDeps for smoke tests"
  patterns:
    - "shadcn CLI installed into packages/ui with tsconfig @/* -> ./src/* path alias"
    - "cn() utility in src/lib/utils.ts using clsx + tailwind-merge"
    - "MSW handler returns {reasons: string[]} matching RejectionReasonsResponse schema"
    - "Walking skeleton page: useQuery + apiClient.GET in 'use client' component"
    - "Smoke tests: createClient<paths> with exact path key strings from generated types"
    - "Per-test timeout override for slow Qdrant search (30s)"

key_files:
  created:
    - packages/ui/components.json
    - packages/ui/src/lib/utils.ts
    - packages/ui/src/components/ui/button.tsx
    - packages/ui/src/components/ui/badge.tsx
    - packages/ui/src/components/ui/card.tsx
    - packages/ui/src/components/ui/skeleton.tsx
    - packages/ui/src/components/ui/separator.tsx
    - packages/ui/src/components/ui/sonner.tsx
    - packages/ui/src/components/ui/input.tsx
    - packages/ui/src/components/ui/label.tsx
    - packages/ui/src/components/ui/avatar.tsx
    - apps/console/app/(shell)/bd/leads/page.tsx
    - packages/api-client/src/__tests__/smoke-domains.test.ts
    - packages/api-client/vitest.config.ts
  modified:
    - packages/ui/package.json
    - packages/ui/tsconfig.json
    - packages/mocks/src/handlers/bd.ts
    - packages/api-client/package.json
    - pnpm-lock.yaml

decisions:
  - "shadcn CLI failed on packages/ui (not a Next.js app) — manually created components.json then ran shadcn add successfully"
  - "tsconfig.json in packages/ui updated with @/* -> ./src/* path alias to make shadcn @/lib/utils imports resolve"
  - "utils.ts created manually since shadcn CLI did not generate it for library (non-app) context"
  - "MSW handler response shape is {reasons: string[]} matching RejectionReasonsResponse schema (not plain string[])"
  - "Supply domain smoke test uses /api/v1/supply/candidates/search with q param and 30s per-test timeout (Qdrant takes ~7s)"
  - "Rejection reason enum values corrected from plan's snake_case to live backend's SCREAMING_SNAKE_CASE (NOT_ICP_FIT, etc.)"

metrics:
  duration: "~37 minutes (11:12 to 14:52 UTC)"
  completed: "2026-06-13"
  tasks_completed: 4
  tasks_total: 4
  files_created: 14
  files_modified: 5
---

# Phase 01 Plan 04: Walking Skeleton — shadcn init, MSW handler, verification page, 4-domain smoke test Summary

**One-liner:** shadcn/ui new-york initialized into packages/ui with 9 components; MSW rejection-reasons handler wired with live enum values; walking skeleton page at /bd/leads uses typed apiClient + TanStack Query; 4-domain live backend smoke tests all pass; turbo run build exits 0.

## Performance

- **Duration:** ~37 minutes
- **Started:** 2026-06-13T11:12:58Z
- **Completed:** 2026-06-13T14:52:40Z
- **Tasks:** 4 (3 auto tasks + 1 checkpoint; all complete)
- **Files modified:** 19 total (14 created, 5 modified)

## Accomplishments

### Task 1: shadcn/ui init + 9 components

- `packages/ui/components.json` created with `"style": "new-york"`, `"cssVariables": true`, `"iconLibrary": "lucide"`
- `packages/ui/src/lib/utils.ts` with `cn()` using `clsx` + `tailwind-merge`
- 9 components installed via `npx shadcn@4.11.0 add` into `src/components/ui/`: button, badge, card, skeleton, separator, sonner, input, label, avatar
- `packages/ui/tsconfig.json` updated with `@/*` → `./src/*` path alias so shadcn `@/lib/utils` imports resolve
- `packages/ui/package.json` updated with: class-variance-authority, clsx, tailwind-merge, radix-ui, sonner, next-themes
- `packages/ui/src/styles/globals.css` verified unchanged — `--primary: oklch(0.546 0.215 261.3)` (Brynzit brand blue) preserved

### Task 2: MSW handler + walking skeleton page

- `packages/mocks/src/handlers/bd.ts`: replaced empty stub with real `http.get('/api/v1/bd/rejection-reasons')` handler returning `{reasons: string[]}` matching `RejectionReasonsResponse` schema
- `apps/console/app/(shell)/bd/leads/page.tsx`: `'use client'` page with `useQuery` + `apiClient.GET('/api/v1/bd/rejection-reasons')`, renders list of rejection reasons, shows mock vs live source

### Task 3: Live smoke tests + turbo build

- `packages/api-client/src/__tests__/smoke-domains.test.ts`: 4 typed tests, one per domain:
  - BD: `GET /api/v1/bd/rejection-reasons` — asserts `reasons` array non-empty
  - Ops: `GET /api/v1/ops/clients` — asserts array response
  - Supply: `GET /api/v1/supply/candidates/search` with `q: 'engineer', top_k: 1` — 30s per-test timeout (Qdrant)
  - Monitoring: `GET /api/v1/monitoring/cost` — asserts defined response
- All 4 path strings are exact typed keys from `paths` interface — no `as any` casts
- `packages/api-client/vitest.config.ts`: node env, 10s default testTimeout
- `packages/api-client/package.json`: `test:live` script + `vitest: "catalog:"` devDep
- `turbo run build` exits 0 — console shows `/bd/leads` route
- `pnpm --filter @brynzit/hooks test -- --run` exits 0 (6/6 tests pass)
- `pnpm --filter @brynzit/api-client test:live -- --run` exits 0 (4/4 domain tests pass)

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | shadcn/ui init + 9 Phase 1 components | 01fc004 | packages/ui/components.json, src/lib/utils.ts, src/components/ui/* (9 files) |
| 2 | MSW rejection-reasons handler + walking skeleton | afc23b7 | packages/mocks/src/handlers/bd.ts, apps/console/app/(shell)/bd/leads/page.tsx |
| 3 | 4-domain smoke test + turbo build green | 7f4ff46 | packages/api-client/src/__tests__/smoke-domains.test.ts, vitest.config.ts, package.json |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] shadcn CLI failed on packages/ui (non-app directory)**
- **Found during:** Task 1 — `npx shadcn@latest init --cwd=packages/ui` failed with "We could not detect a supported framework"
- **Issue:** shadcn CLI requires a Next.js app directory; packages/ui is a shared library package
- **Fix:** Manually created `components.json` with new-york config, added `@/* -> ./src/*` path alias to `tsconfig.json`, then ran `npx shadcn@4.11.0 add` successfully — CLI accepted the existing `components.json` and created components in `src/components/ui/`
- **Files modified:** packages/ui/components.json (created), packages/ui/tsconfig.json
- **Commit:** 01fc004

**2. [Rule 3 - Blocker] shadcn CLI did not generate src/lib/utils.ts for library context**
- **Found during:** Task 1 — shadcn add created component files but not `src/lib/utils.ts`; components import `@/lib/utils`
- **Fix:** Created `src/lib/utils.ts` manually with standard `cn()` implementation using `clsx` + `tailwind-merge`; added both packages to `package.json` dependencies
- **Files modified:** packages/ui/src/lib/utils.ts (created), packages/ui/package.json
- **Commit:** 01fc004

**3. [Rule 1 - Bug] MSW response shape must be {reasons: string[]} not string[]**
- **Found during:** Task 2 — reading api.d.ts found `RejectionReasonsResponse: { reasons: string[] }`, not a plain string array
- **Fix:** Updated MSW handler to return `{reasons: [...]}` object, updated page to read `data?.reasons`
- **Files modified:** packages/mocks/src/handlers/bd.ts, apps/console/app/(shell)/bd/leads/page.tsx
- **Commit:** afc23b7

**4. [Rule 1 - Bug] Rejection reason enum values corrected from plan's lowercase to live backend's SCREAMING_SNAKE_CASE**
- **Found during:** Task 3 — ran live smoke tests and verified actual backend response: `NOT_ICP_FIT`, `WRONG_SENIORITY`, `NO_OPEN_ROLES`, `COMPETITOR`, `BAD_TIMING`, `ALREADY_A_CLIENT`, `OTHER`
- **Fix:** Updated MSW handler values to match live backend
- **Files modified:** packages/mocks/src/handlers/bd.ts
- **Commit:** 7f4ff46

**5. [Rule 1 - Bug] Supply smoke test timed out at 10s (Qdrant semantic search takes ~7s)**
- **Found during:** Task 3 — first smoke test run showed supply domain test timed out at 10000ms
- **Fix:** Added per-test timeout of 30000ms (30s) for the supply domain test using Vitest's 3rd argument
- **Files modified:** packages/api-client/src/__tests__/smoke-domains.test.ts
- **Commit:** 7f4ff46

## Success Criteria Verification

- [x] `turbo run build` exits 0 (ROADMAP SC-1) — 7 packages, Tasks 2 successful
- [x] `packages/ui/components.json` exists with `"style": "new-york"` + 9 component files
- [x] `packages/mocks/src/handlers/bd.ts` has real GET handler returning 7 rejection reason enum values
- [x] `apps/console/app/(shell)/bd/leads/page.tsx` renders rejection reasons via `apiClient.GET` + `useQuery`
- [x] `pnpm --filter @brynzit/hooks test -- --run` exits 0 with 6/6 tests (ROADMAP SC-4)
- [x] 4 contract YAML files in `.planning/contracts/` (ROADMAP SC-5) — from Plan 02
- [x] `packages/api-client/src/__tests__/smoke-domains.test.ts` exists with 4 domain tests, all typed paths, no `as any`
- [x] `packages/api-client/vitest.config.ts` exists with `testTimeout: 10000`
- [x] `packages/api-client/package.json` has `test:live` script + `vitest` devDep
- [x] `pnpm --filter @brynzit/api-client typecheck` exits 0 (ROADMAP SC-6 typing proof)
- [x] Live smoke tests pass — 4/4 domains verified against http://localhost:8000

## Known Stubs

None — the walking skeleton page renders real data from MSW mock (or live backend). No hardcoded placeholder values flow to UI rendering.

## Threat Flags

No new threat surface introduced beyond what the plan's threat model covers:
- T-04-01 (MSW only active when `NEXT_PUBLIC_API_MOCKING=enabled`) — implemented and documented in bd.ts comment
- T-04-02 (walking skeleton reveals mock vs live source) — accepted per plan, Phase 2 replaces this page

## Task 4: Human visual verification checkpoint

**Status:** APPROVED (auto-approved by orchestrator — auto mode active)

**Verification result:** All automated checks passed:
- 6/6 hooks unit tests pass (`pnpm --filter @brynzit/hooks test -- --run`)
- All apps typecheck clean (`turbo run typecheck`)
- `turbo run build` exits 0
- 4/4 domain live smoke tests pass against localhost:8000

**Walking skeleton code confirmed correct:**
- Typed `apiClient.GET('/api/v1/bd/rejection-reasons')` call in leads page
- 7 rejection reasons in MSW handler (SCREAMING_SNAKE_CASE matching live backend)
- `QueryClientProvider` at console app root

**Plan complete** — all 4 tasks done (3 auto + 1 checkpoint).

## Self-Check: PASSED

Files verified:
- packages/ui/components.json: FOUND (contains "new-york")
- packages/ui/src/lib/utils.ts: FOUND (contains clsx)
- packages/ui/src/components/ui/button.tsx: FOUND
- packages/ui/src/components/ui/badge.tsx: FOUND
- packages/ui/src/components/ui/card.tsx: FOUND
- packages/ui/src/components/ui/skeleton.tsx: FOUND
- packages/ui/src/components/ui/separator.tsx: FOUND
- packages/ui/src/components/ui/sonner.tsx: FOUND
- packages/ui/src/components/ui/input.tsx: FOUND
- packages/ui/src/components/ui/label.tsx: FOUND
- packages/ui/src/components/ui/avatar.tsx: FOUND
- apps/console/app/(shell)/bd/leads/page.tsx: FOUND
- packages/api-client/src/__tests__/smoke-domains.test.ts: FOUND
- packages/api-client/vitest.config.ts: FOUND

Commits verified:
- 01fc004: feat(01-04): shadcn/ui init into packages/ui + 9 Phase 1 components
- afc23b7: feat(01-04): MSW rejection-reasons handler + walking skeleton page
- 7f4ff46: feat(01-04): 4-domain live smoke test + turbo build green

Checkpoint Task 4: auto-approved by orchestrator (auto mode active) — all automated checks confirmed passing.
