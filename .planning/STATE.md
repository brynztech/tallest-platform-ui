# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-12)

**Core value:** Every human gate in the recruiting pipeline is a fast, obvious screen in the console; candidates get a public experience polished enough that they want to join the pool.
**Current focus:** Phase 2 — Console BD

## Current Position

Phase: 2 of 6 (Console BD)
Plan: 0 of TBD in current phase
Status: Phase 1 complete — ready to begin Phase 2
Last activity: 2026-06-13 — Phase 1 executed; 4/4 plans complete, 6/6 success criteria verified

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~40 min/plan
- Total execution time: ~3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 — Foundation | 4 | ~3h | ~40 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 01-03, 01-04
- Trend: On track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: openapi-typescript + openapi-fetch (not @hey-api/openapi-ts, not Orval) per SUMMARY.md resolution — transparent cache control for 202-polling patterns
- Roadmap: Console built before public site — all console endpoints live today; public site is mock-first
- Roadmap: CUX-01..03 cross-cutting UX patterns land in Phase 2 (BD) — first phase that needs them; patterns carry forward
- Roadmap: PUB-07 (enrichment display) assigned to Phase 6 alongside DASH — it lives on the authed candidate profile page, not the onboarding flow
- Roadmap: FOUND-04 (useAsyncJob) must ship in Phase 1 — it is a prerequisite for BD-04, OPS-02, SUP-03, PUB-03
- Phase 1 execution: jsdom must be an explicit devDep of @brynzit/hooks (not @vitest/environment-jsdom — that doesn't exist)
- Phase 1 execution: apps need @brynzit/config in devDeps for tsconfig extends to resolve; skipLibCheck must be in base.json
- Phase 1 execution: @types/react + @types/react-dom + @types/node required in app devDeps with Next.js 16
- Phase 1 execution: MSWProvider should early-return setReady(true) when mocking disabled — avoids blank flash in production
- Phase 1 execution: @source path in app globals.css needs ../../../ not ../../ to resolve packages/ui from apps/*/app/

### Pending Todos

- Human visual verification of walking skeleton (/bd/leads) still pending (01-HUMAN-UAT.md) — run before Phase 2 feature work uses the skeleton as a template

### Blockers/Concerns

- Phase 2: Cursor pagination + bulk action cache invalidation interaction is the most complex data pattern — pending-overlay implementation needs concrete design before coding
- Phase 4: Semantic search response contract (`/supply/candidates/search` response shape) should be confirmed against live FastAPI before building the results UI
- Phase 5: JobPosting JSON-LD required fields + Google for Jobs validation + canonical URL strategy for filter combinations need a concrete implementation plan before coding
- All phases: snake_case vs camelCase on the live backend — Pydantic config confirmed camelCase (verified via codegen); propagate this as a global constraint to all feature phases

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| UAT | Phase 1 visual browser verification | Pending | 2026-06-13 |

## Session Continuity

Last session: 2026-06-13
Stopped at: Phase 1 complete, Phase 2 ready to begin
Resume file: .planning/phases/01-foundation/01-VERIFICATION.md
