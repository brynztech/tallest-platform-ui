# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-12)

**Core value:** Every human gate in the recruiting pipeline is a fast, obvious screen in the console; candidates get a public experience polished enough that they want to join the pool.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 0 of 4 in current phase
Status: Ready to execute
Last activity: 2026-06-13 — Phase 1 planned; 4 plans in 3 waves

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: -

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Tailwind v4 content scanning across Turborepo package boundaries has documented gotchas — verify exact `@import` vs `content` config before scaffolding (see SUMMARY.md research flag)
- Phase 2: Cursor pagination + bulk action cache invalidation interaction is the most complex data pattern — pending-overlay implementation needs concrete design before coding (see SUMMARY.md research flag)
- Phase 4: Semantic search response contract (`/supply/candidates/search` response shape) should be confirmed against live FastAPI before building the results UI
- Phase 5: JobPosting JSON-LD required fields + Google for Jobs validation + canonical URL strategy for filter combinations need a concrete implementation plan before coding
- All phases: snake_case vs camelCase on the live backend must be verified against Pydantic model config before first codegen run — a global decision affecting every component

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-06-13
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-foundation/01-CONTEXT.md
