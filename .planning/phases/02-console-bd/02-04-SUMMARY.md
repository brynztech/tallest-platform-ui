---
phase: 02-console-bd
plan: "04"
subsystem: ui
tags: [react, dnd-kit, tanstack-query, kanban, msw, vitest, next-js]

# Dependency graph
requires:
  - phase: 02-console-bd/02-01
    provides: dnd-kit deps installed, MSW pipeline + tasks handlers, sidebar with wake badge
  - phase: 02-console-bd/02-02
    provides: lead queue, Vitest infra, MSW handlers for leads
  - phase: 02-console-bd/02-03
    provides: imports + outreach pages, useAsyncJob pattern

provides:
  - /bd/pipeline page with 7-column kanban, @dnd-kit/core v6 + @dnd-kit/sortable v7 visual drag
  - /bd/replies page with MSW-sourced BDTaskSummary, classification quick-actions
  - Pipeline polling (refetchInterval: 15000ms) against /api/v1/bd/pipeline
  - KanbanBoard component with per-column SortableContext and local-state visual reorder
  - ReplyCard with classification-specific actions (interested/ooo/not_now/unsubscribe)
  - 3 pipeline tests covering BD-06 column labels, BD-07 sort order, BD-08 wake badge logic
  - All 5 BD routes complete (leads, outreach, pipeline, imports, replies)

affects: [phase-03-ops, future-pipeline-consumers, supply-kanban-if-added]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "KanbanBoard visual-only drag: DndContext wraps per-column SortableContext; handleDragEnd only mutates local state — no API call fired"
    - "context_json normalisation: MSW BDTaskSummary tasks have nested context_json; RepliesPage maps via normaliseTask() before rendering"
    - "Classification routing: single switch/conditional per classification value drives badge variant and quick-action buttons"

key-files:
  created:
    - apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx
    - apps/console/app/(shell)/bd/pipeline/page.tsx
    - apps/console/app/(shell)/bd/replies/page.tsx
  modified:
    - apps/console/src/__tests__/pipeline.test.tsx

key-decisions:
  - "Visual-only drag: KanbanBoard uses local React state for reorder — arrayMove() from @dnd-kit/sortable. No API persistence in Phase 2."
  - "context_json extraction: MSW /bd/tasks returns BDTaskSummary where company_name/contact_name/classification are nested in context_json. normaliseTask() flattens before rendering."
  - "Import guard enforced: @dnd-kit/sortable v7 (stable) used exclusively; comment in file warns against @dnd-kit/react (0.5.x pre-release) per RESEARCH.md Pitfall 5."

patterns-established:
  - "KanbanBoard pattern: DndContext > per-column SortableContext > useSortable cards; arrayMove on dragEnd; no API call"
  - "normaliseTask() pattern: when MSW context_json nests data that UI needs flat, extract into typed interface before rendering"

requirements-completed: [BD-06, BD-07, BD-08]

# Metrics
duration: 12min
completed: 2026-06-14
---

# Phase 2 Plan 04: Pipeline Kanban + Reply Triage Summary

**@dnd-kit/core v6 kanban board with 7 pipeline columns and classification-based reply triage completing all Phase 2 BD requirements**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-14T00:04:00Z
- **Completed:** 2026-06-14T00:06:30Z
- **Tasks:** 1 (TDD)
- **Files modified:** 4

## Accomplishments

- KanbanBoard renders 7 status columns (discovered → converted) from /api/v1/bd/pipeline with count badges, compact lead cards (ICP badge + company name), and visual-only drag reorder via @dnd-kit/sortable v7
- Pipeline page polls every 15 seconds (refetchInterval: 15000) — live pipeline counts without manual refresh
- RepliesPage loads MSW /bd/tasks stub, sorts interested tasks first (SORT_PRIORITY map), renders per-classification quick-actions: interested (View briefing + Mark handled), OOO (Snooze 2 weeks), not_now (Snooze 1 month), unsubscribe (destructive Unsubscribe)
- All 5 BD routes exist and route correctly: /bd/leads, /bd/outreach, /bd/pipeline, /bd/imports, /bd/replies
- 3 pipeline tests added covering BD-06 column structure (7 labels validated), BD-07 sort order (interested first), BD-08 wake badge count logic

## Task Commits

1. **RED — Pipeline tests** - `d2b36c8` (test)
2. **GREEN — Pipeline + Replies implementation** - `dec9dbb` (feat)

## Files Created/Modified

- `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx` - KanbanBoard with DndContext + per-column SortableContext; visual-only arrayMove drag; ICP badge variants
- `apps/console/app/(shell)/bd/pipeline/page.tsx` - Pipeline page with useQuery polling at 15s; loading/error states
- `apps/console/app/(shell)/bd/replies/page.tsx` - RepliesPage normalising MSW context_json; ReplyCard with classification-specific quick-actions
- `apps/console/src/__tests__/pipeline.test.tsx` - 3 real tests replacing stub todos

## Decisions Made

- **Visual-only drag:** KanbanBoard uses local React state for visual reorder (arrayMove) — no API call. BD reps can re-order within a column visually; ordering is not persisted in Phase 2. Future phases can wire PATCH /bd/leads/{id} for persistence.
- **context_json normalisation:** The MSW /bd/tasks stub returns BDTaskSummary where classification, company_name, contact_name, and ai_briefing are inside context_json (not top-level). A normaliseTask() function extracts these into a flat BDReplyTask interface before rendering. This matches the actual backend schema shape.
- **Import guard comment:** A prominent comment in kanban-board.tsx warns against importing from @dnd-kit/react (the 0.5.x pre-release rewrite). All imports use @dnd-kit/core + @dnd-kit/sortable (stable v6+v7 per CLAUDE.md).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The only gotcha was that the plan's KanbanLeadItem type definition included only 4 fields (`id`, `company_name`, `icp_score`, `canonical_domain`) while the actual API schema has 8 fields. The component-local type is used for rendering purposes only (subset of schema fields needed for card display), which is correct and intentional.

## User Setup Required

None — no external service configuration required.

## Known Stubs

- **ReplyCard "View briefing" button** (`apps/console/app/(shell)/bd/replies/page.tsx`): Click shows toast "Briefing view not yet implemented." The full briefing slide-over is a Phase 3+ feature; the button is present per BD-07 spec to confirm the UI path exists.
- **Unsubscribe action** (`apps/console/app/(shell)/bd/replies/page.tsx`): Phase 2 unsubscribe fires a toast only. Production implementation requires POST /bd/leads/{id}/unsubscribe (T-02-17 mitigation documented in threat model).

## Threat Flags

No new security surface beyond the plan's threat model. T-02-14 (XSS via company_name) and T-02-15 (XSS via ai_briefing) are both mitigated — all user-controlled strings render as React text nodes with no `dangerouslySetInnerHTML`.

## TDD Gate Compliance

- RED gate: `d2b36c8` — test(02-04) commit with 3 failing-stub tests converted to real assertions
- GREEN gate: `dec9dbb` — feat(02-04) commit, all 3 tests pass

## Self-Check: PASSED

Files verified:
- FOUND: apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx
- FOUND: apps/console/app/(shell)/bd/pipeline/page.tsx
- FOUND: apps/console/app/(shell)/bd/replies/page.tsx
- FOUND: apps/console/src/__tests__/pipeline.test.tsx (modified)

Commits verified:
- FOUND: d2b36c8 (test RED)
- FOUND: dec9dbb (feat GREEN)

Tests: 13 passed, 0 failed (vitest run)
Typecheck: tsc --noEmit exits 0

---
*Phase: 02-console-bd*
*Completed: 2026-06-14*
