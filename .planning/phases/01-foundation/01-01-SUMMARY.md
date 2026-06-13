---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [turborepo, pnpm, typescript, tailwindcss, msw, tanstack-query, openapi-fetch, vitest]

# Dependency graph
requires: []
provides:
  - Turborepo monorepo scaffold with pnpm workspace catalog (20 pinned dependencies)
  - Three shared TypeScript configs: base (strict ES2022), nextjs (preserve jsx), library (react-jsx)
  - Prettier config with prettier-plugin-tailwindcss for Tailwind class sorting
  - packages/ui with OKLCH design token layer (@theme in globals.css, DESIGN_BRIEF.md)
  - packages/api-client with typed openapi-fetch client + live OpenAPI 3.1.0 schema snapshot (47 paths)
  - packages/mocks with domain-split MSW v2 handler architecture (5 files) + 6 candidate contract mocks
  - packages/hooks with useAsyncJob polling primitive covering all 6 backend 202 endpoints
  - Vitest config (jsdom) + 6 unit tests for FOUND-04 useAsyncJob coverage
affects: [02-api-types, 03-app-shells, 04-console-bd, 05-console-ops, 06-console-supply, 07-console-admin, 08-public-site]

# Tech tracking
tech-stack:
  added:
    - turbo@^2.9.18 (monorepo build orchestration)
    - pnpm@11.6.0 with catalog feature (version centralization)
    - openapi-typescript@^7.13.0 (type generation from OpenAPI 3.1.0)
    - openapi-fetch@^0.17.0 (type-safe fetch client)
    - msw@^2.14.6 (API mocking — browser + node)
    - vitest@^4.1.8 (unit testing with jsdom environment)
    - tailwindcss@^4.x with @theme CSS-first config
    - @tanstack/react-query@^5.101.0 (data layer for useAsyncJob)
  patterns:
    - pnpm workspace catalog for centralized version pinning (all packages use "catalog:")
    - Turborepo "tasks" key (v2 canonical, not deprecated "pipeline")
    - @theme block exclusively in packages/ui/src/styles/globals.css (D-11)
    - MSW domain-split handler files; apps never import handlers inline
    - Peer dependency declaration in all packages/* to prevent phantom dependencies
    - useAsyncJob refetchInterval-as-function pattern (TanStack Query v5)

key-files:
  created:
    - turbo.json
    - pnpm-workspace.yaml
    - package.json
    - .prettierrc
    - .prettierignore
    - packages/config/tsconfig/base.json
    - packages/config/tsconfig/nextjs.json
    - packages/config/tsconfig/library.json
    - packages/config/package.json
    - packages/ui/src/styles/globals.css
    - packages/ui/DESIGN_BRIEF.md
    - packages/ui/package.json
    - packages/api-client/openapi.json
    - packages/api-client/src/client.ts
    - packages/api-client/src/smoke-test.ts
    - packages/api-client/scripts/generate-live.sh
    - packages/api-client/package.json
    - packages/mocks/src/handlers/bd.ts
    - packages/mocks/src/handlers/ops.ts
    - packages/mocks/src/handlers/supply.ts
    - packages/mocks/src/handlers/monitoring.ts
    - packages/mocks/src/handlers/candidate.ts
    - packages/mocks/src/browser.ts
    - packages/mocks/src/node.ts
    - packages/mocks/src/index.ts
    - packages/mocks/package.json
    - packages/hooks/src/use-async-job.ts
    - packages/hooks/src/index.ts
    - packages/hooks/src/__tests__/use-async-job.test.ts
    - packages/hooks/vitest.config.ts
    - packages/hooks/package.json
  modified: []

key-decisions:
  - "pnpm workspace catalog with 'catalog:' references — single version-pin source for all 20 packages"
  - "turbo.json uses 'tasks' key (Turborepo v2 canonical); generate:api has cache:false to prevent stale type generation"
  - "DEFAULT_STATUS_MAP in useAsyncJob includes 'complete': 'complete' to fix D-08 gap — lead imports use complete not completed"
  - "openapi.json snapshot fetched from live backend at task execution time (47 paths, OpenAPI 3.1.0)"
  - "MSW domain-split handler pattern: 4 empty stubs (Phase 2-4) + 1 typed candidate contract (6 handlers)"
  - "packages/ui/src/styles/globals.css is sole owner of @theme block — app CSS files never define @theme"

patterns-established:
  - "catalog: references in all package.json files — never specify version strings directly"
  - "Peer dependency declaration in packages/* — declare what you use, rely on no hoisting"
  - "useAsyncJob endpoint with {id} interpolation or path-segment append — two URL patterns"
  - "MSW v2 http namespace (not rest) with HttpResponse.json() for all handlers"
  - "Turborepo task graph: build/lint/typecheck all dependsOn ^build; dev is persistent+uncached"

requirements-completed:
  - FOUND-01
  - FOUND-03
  - FOUND-04

# Metrics
duration: 56min
completed: 2026-06-13
---

# Phase 01 Plan 01: Monorepo Scaffold + Shared Package Foundations Summary

**Turborepo+pnpm monorepo scaffold with four @brynzit/* packages: OKLCH design tokens, typed openapi-fetch client with live schema snapshot, MSW v2 domain-split mock architecture, and useAsyncJob polling primitive with D-08 gap fix**

## Performance

- **Duration:** 56 min
- **Started:** 2026-06-13T08:40:26Z
- **Completed:** 2026-06-13T09:36:51Z
- **Tasks:** 4 (Task 1, Task 2a, Task 2b, Task 3)
- **Files modified:** 31 (all created new — greenfield)

## Accomplishments

- Root monorepo scaffold: turbo.json (v2 "tasks" key), pnpm-workspace.yaml with 20-package catalog, root package.json with both generate:api scripts, Prettier + tailwindcss class sorting plugin, three TypeScript config presets
- packages/ui: OKLCH token layer in @theme block (Brynzit blue --primary, full shadcn semantic tokens), DESIGN_BRIEF.md with contrario.ai + Linear visual references
- packages/api-client: live OpenAPI 3.1.0 schema snapshot fetched from backend (47 paths, 78KB), typed createClient<paths> with NEXT_PUBLIC_API_URL, executable generate-live.sh
- packages/mocks: MSW v2 domain-split architecture — 4 empty stubs (Phase 2-4) + candidate.ts with 6 typed contract mocks for all candidate-facing endpoints
- packages/hooks: complete useAsyncJob with correct DEFAULT_STATUS_MAP ("complete" gap fix confirmed from live backend), Vitest jsdom config, 6 unit tests covering all FOUND-04 VALIDATION.md requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Root monorepo scaffold** - `4da4371` (feat)
2. **Task 2a: packages/ui + packages/api-client scaffold** - `0f259b7` (feat)
3. **Task 2b: packages/mocks scaffold** - `3b93a7f` (feat)
4. **Task 3: packages/hooks scaffold** - `93af4c9` (feat)

## Files Created/Modified

- `turbo.json` — Turborepo v2 task graph with "tasks" key; generate:api is cache:false
- `pnpm-workspace.yaml` — workspace definition + 20-package catalog covering full stack
- `package.json` — root scripts including generate:api and generate:api:live; packageManager pnpm@11.6.0
- `.prettierrc` — prettier-plugin-tailwindcss for Tailwind class sorting in diffs
- `.prettierignore` — excludes generated types (api.d.ts), openapi.json, build outputs
- `packages/config/tsconfig/base.json` — strict ES2022, bundler moduleResolution
- `packages/config/tsconfig/nextjs.json` — extends base, jsx:preserve, Next.js plugin
- `packages/config/tsconfig/library.json` — extends base, jsx:react-jsx, declaration output
- `packages/ui/src/styles/globals.css` — @import tailwindcss + full @theme OKLCH token set
- `packages/ui/DESIGN_BRIEF.md` — brand, reference sites, token intent, two-app split
- `packages/api-client/openapi.json` — live schema snapshot (OpenAPI 3.1.0, 47 paths)
- `packages/api-client/src/client.ts` — createClient<paths> with env baseUrl
- `packages/api-client/src/smoke-test.ts` — placeholder for Plan 02 nullable assertions
- `packages/api-client/scripts/generate-live.sh` — executable curl+codegen script
- `packages/mocks/src/handlers/candidate.ts` — 6 contract mocks using MSW v2 http namespace
- `packages/mocks/src/browser.ts` — setupWorker from msw/browser
- `packages/mocks/src/node.ts` — setupServer from msw/node
- `packages/hooks/src/use-async-job.ts` — full polling hook implementation
- `packages/hooks/vitest.config.ts` — jsdom + globals:true
- `packages/hooks/src/__tests__/use-async-job.test.ts` — 6 test cases for FOUND-04

## Decisions Made

- Used live backend schema (fetched at execution time) rather than placeholder — backend was confirmed running at localhost:8000 during task execution
- DEFAULT_STATUS_MAP includes "complete": 'complete' (D-08 gap fix from RESEARCH.md Pitfall 1+7 — lead imports use `complete` not `completed`)
- DEFAULT_STATUS_MAP also includes outreach_review, enrichment_scheduled, new — all confirmed from live backend source code in RESEARCH.md
- smoke-test.ts is a placeholder (export {}) per plan spec — to be filled in Plan 02 after types are generated from the committed openapi.json

## Deviations from Plan

None — plan executed exactly as written. The "complete": 'complete' addition to DEFAULT_STATUS_MAP was explicitly called out in the plan as a critical D-08 gap fix (from RESEARCH.md Pitfall 1+7), not a deviation.

## Known Stubs

All stubs are intentional per plan design:

1. **`packages/mocks/src/handlers/bd.ts`** — `bdHandlers: HttpHandler[] = []`
   Phase 2 (Console BD) will add real handlers. Empty array is correct for Phase 1.

2. **`packages/mocks/src/handlers/ops.ts`** — `opsHandlers: HttpHandler[] = []`
   Phase 3 (Console Ops) will add real handlers.

3. **`packages/mocks/src/handlers/supply.ts`** — `supplyHandlers: HttpHandler[] = []`
   Phase 4 (Console Supply) will add real handlers.

4. **`packages/mocks/src/handlers/monitoring.ts`** — `monitoringHandlers: HttpHandler[] = []`
   Phase 4 (Console Admin) will add real handlers.

5. **`packages/api-client/src/smoke-test.ts`** — `export {}`
   Placeholder per plan. Plan 02 will fill in nullable field assertions after openapi-typescript generates api.d.ts from the committed snapshot.

None of these stubs block this plan's goals. candidate.ts has 6 real contract mock handlers; the 4 domain stubs are Phase 1 by design.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | packages/api-client/openapi.json | Backend OpenAPI schema committed to repo — acceptable for private internal tool per T-01-02 (accepted risk). Reminder: live /openapi.json and /docs should be disabled in FastAPI production config (backend team responsibility). |

## Issues Encountered

None — all tasks executed cleanly. Backend was running and returned the live schema at execution time.

## User Setup Required

None — no external service configuration required for Phase 1 package scaffold.

## Next Phase Readiness

Plan 02 (API Types + Codegen): Can now run `pnpm generate:api` against the committed openapi.json snapshot to produce packages/api-client/src/types/api.d.ts, then fill in smoke-test.ts nullable assertions.

Plan 03 (App Shells): All four @brynzit/* packages are scaffolded. apps/web and apps/console can now reference @brynzit/ui, @brynzit/api-client, @brynzit/mocks, @brynzit/hooks via workspace:* links.

Potential concern: pnpm install has not been run against the new workspace — this will happen when Plan 03 creates the app packages and runs the first install. The catalog syntax in package.json files requires pnpm 11+ to resolve correctly.

---
*Phase: 01-foundation*
*Completed: 2026-06-13*
