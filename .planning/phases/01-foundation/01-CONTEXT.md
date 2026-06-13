# Phase 1: Foundation - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Bootstrap the entire monorepo from scratch: Turborepo + pnpm workspace scaffolding, two Next.js 16.2 app shells (`apps/web`, `apps/console`), four shared packages (`packages/ui`, `packages/api-client`, `packages/mocks`, `packages/hooks`), a typed API client generated from the live FastAPI backend schema, MSW contract mock architecture, and the `useAsyncJob` polling primitive. No feature UI ships in Phase 1 — only the infrastructure every subsequent phase builds on.

**Requirements in scope:** FOUND-01, FOUND-02, FOUND-03, FOUND-04

</domain>

<decisions>
## Implementation Decisions

### Monorepo Package Structure
- **D-01:** Six packages in total — `apps/web`, `apps/console`, `packages/ui`, `packages/api-client`, `packages/mocks`, `packages/hooks`. The `packages/hooks` package is new (not in early architecture notes) — it owns the `useAsyncJob` primitive and any future shared React hooks. This is preferable to adding hooks to `packages/ui` (which is a design system, not a data layer) or to `packages/mocks` (wrong concern separation).
- **D-02:** npm scope is `@brynzit/*` — package names are `@brynzit/ui`, `@brynzit/api-client`, `@brynzit/mocks`, `@brynzit/hooks`. (Claude's discretion — scope chosen to match the brand name; consistent with PITFALLS.md references.)

### OpenAPI Codegen Connectivity
- **D-03:** Two `pnpm` scripts in the root `package.json`:
  - `generate:api` — reads from `packages/api-client/openapi.json` (snapshot file, committed to this repo). Use this in CI and when the backend is not running.
  - `generate:api:live` — fetches the schema from the running backend (e.g. `http://localhost:8000/api/v1/openapi.json`), regenerates types, **and updates `packages/api-client/openapi.json`** in place. Developers run this when they know the backend schema has changed.
- **D-04:** Snapshot file lives at `packages/api-client/openapi.json` — next to the generated types, keeping the schema and its output co-located.
- **D-05:** No CI enforcement of snapshot freshness. Updating the snapshot is a manual developer responsibility. TypeScript compilation against the snapshot will catch any drift at the point when generated types are used — this is the indirect safety net.

### `useAsyncJob` Hook Interface
- **D-06:** Hook signature: `useAsyncJob<TData, TRawStatus extends string = string>(options: UseAsyncJobOptions<TData, TRawStatus>)`

  Options object shape:
  ```ts
  type UseAsyncJobOptions<TData, TRawStatus extends string = string> = {
    jobId: string | null | undefined   // null/undefined = idle (polling disabled)
    endpoint: string                   // e.g. '/bd/imports/{id}/status' — hook substitutes {id} or appends jobId
    enabled?: boolean                  // additional enabled gate on top of jobId presence
    statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>  // override/extend default mapping
    refetchInterval?: number           // default: 2000ms
  }
  ```

- **D-07:** Return type:
  ```ts
  type AsyncJobPhase = 'idle' | 'pending' | 'complete' | 'failed'

  type AsyncJobResult<TData, TRawStatus extends string = string> = {
    phase: AsyncJobPhase       // normalized state for conditional rendering
    rawStatus?: TRawStatus     // passthrough from backend for callers that need exact status
    data?: TData               // resolved job output (present when phase === 'complete')
    error?: unknown            // error details (present when phase === 'failed')
    isPolling: boolean         // true while refetchInterval is active
  }
  ```

- **D-08:** Built-in default status mapping (covers the backend's documented status vocabulary):
  - `'queued'`, `'processing'`, `'running'` → `'pending'`
  - `'done'`, `'completed'`, `'succeeded'`, `'success'` → `'complete'`
  - `'failed'`, `'error'` → `'failed'`
  - Absent `jobId` or `enabled === false` → `'idle'`
  Callers can override or extend any entry via `statusMap`.

- **D-09:** Hook lives in `packages/hooks/src/use-async-job.ts`, exported from `@brynzit/hooks`. Both apps import from this package.

### Tailwind v4 + Monorepo Content Scanning
- **D-10:** Each app's CSS entry point (`apps/web/src/app/globals.css`, `apps/console/src/app/globals.css`) adds exactly one `@source` directive for the external package:
  ```css
  @source '../../packages/ui/src/**/*.{ts,tsx}';
  ```
  Tailwind v4 auto-scans the app's own source files — no additional `@source` needed for the app itself. One directive per external package is the rule.

- **D-11:** `packages/ui/src/styles/globals.css` is the shared token source. It owns:
  ```css
  @import "tailwindcss";

  @theme {
    /* Shared OKLCH color tokens (from 01-UI-SPEC.md) */
    /* Spacing aliases */
    /* Typography tokens */
    /* Border radius */
    /* Shadows */
    /* CSS variables for shadcn/ui */
  }
  ```
  Both apps import this file from `packages/ui`. Neither app defines its own `@theme` color or spacing tokens — all token definitions live here.

- **D-12:** App-specific overrides live in each app's `globals.css`, imported after the shared tokens:
  - `apps/web/src/app/globals.css`: imports `@brynzit/ui/styles/globals.css`, then overrides for marketing/editorial mood (e.g. `:root` = light mode default, `--radius: 0.5rem`)
  - `apps/console/src/app/globals.css`: imports `@brynzit/ui/styles/globals.css`, then overrides for dense internal tool (e.g. `:root` = dark mode default, `--radius: 0.375rem`, compact spacing scale)
  See `01-UI-SPEC.md` "Two-app token split" table for the full override values.

### Claude's Discretion
- pnpm workspace catalog usage for version pinning — use pnpm 11 catalog feature to centralize version pins in root `pnpm-workspace.yaml`. Claude decides the exact catalog structure.
- Turborepo task pipeline definition — Claude decides the task graph in `turbo.json` (build order, caching, dependencies).
- Contract proposal file format for candidate-facing endpoints in `.planning/contracts/` — Claude decides whether to use full OpenAPI 3.1 YAML or minimal TypeScript interface files as the contract format.
- Error boundary placement in each app — Claude decides where root error boundaries go.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Contracts
- `.planning/phases/01-foundation/01-UI-SPEC.md` — **MANDATORY.** Visual and component contracts for Phase 1: design system init commands, color tokens (OKLCH values), typography scale, spacing scale, shadcn component list, MSW handler file shapes, two-app token split. Planner must treat this as a locked implementation spec.

### Project Context
- `.planning/REQUIREMENTS.md` — All 45 requirements. FOUND-01 through FOUND-04 are the Phase 1 requirements.
- `.planning/ROADMAP.md` — Phase 1 goal statement and all 6 success criteria (the `turbo run build` clean-build gate, the Pydantic v2 nullable smoke test, MSW handler file existence, `useAsyncJob` unit test, contract proposal files, live-backend smoke tests).
- `.planning/PROJECT.md` — Backend endpoint inventory (what exists at `../talent-platform/api/v1`), candidate-facing gap summary, product constraints.

### Research and Pitfalls
- `.planning/research/SUMMARY.md` — Architecture approach, openapi-typescript + openapi-fetch codegen decision (why not Orval or hey-api), MSW mock architecture, 202-polling pattern, phase ordering rationale.
- `.planning/research/PITFALLS.md` — Critical pitfalls to prevent: MSW mock drift (Pitfall 1), Pydantic v2 anyOf nullables (Pitfall 2), snake_case/camelCase mismatch (Pitfall 3), Turborepo phantom dependencies + transpilePackages (Pitfall 4), AI-generated UI slop / design token divergence (Pitfall 12).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components, hooks, or utilities. Everything in Phase 1 is net-new.

### Established Patterns
- None yet established in code. The patterns defined in `.planning/research/SUMMARY.md` (202-polling via `useQuery` + `refetchInterval`, cursor pagination via `useInfiniteQuery`, `use cache` on public RSCs) are the target patterns for Phase 1 to instantiate.

### Integration Points
- Backend at `../talent-platform` — OpenAPI schema at `GET http://localhost:8000/api/v1/openapi.json`. Accessible when running locally with FastAPI dev server.
- Pydantic v2 backend: expect `anyOf + null` pattern in OpenAPI schema for optional fields. The Pydantic model `alias_generator` setting must be checked before first codegen run to determine if fields are snake_case or camelCase in API responses.

</code_context>

<specifics>
## Specific Ideas

- **`generate:api:live` workflow:** `openapi-typescript http://localhost:8000/api/v1/openapi.json -o packages/api-client/src/types/api.d.ts && cp <fetched-json> packages/api-client/openapi.json`. The snapshot update is part of the same script so they stay in sync.
- **`useAsyncJob` endpoint pattern:** the `endpoint` option should support `{id}` interpolation — e.g. `'/bd/imports/{id}/status'` — so the hook can build the full URL by substituting `jobId`. Alternatively, accept a plain string where the caller appends `/${jobId}` — either works; planner to choose the simpler approach.
- **DESIGN_BRIEF.md:** The UI-SPEC.md serves as the design brief for Phase 1. For later phases, the Taste Skill needs a brief that references contrario.ai (public site) and Linear/Attio (console) as visual references. The planner should note creating `packages/ui/DESIGN_BRIEF.md` as a task within FOUND-01 or FOUND-02 so it exists before any future Taste Skill invocation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-06-13*
