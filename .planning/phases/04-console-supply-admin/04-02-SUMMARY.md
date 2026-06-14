---
phase: 04-console-supply-admin
plan: "02"
subsystem: ui
tags: [supply, search, candidate-profile, enrichment, shortlist, typescript, tanstack-query]

# Dependency graph
requires:
  - phase: 04-01
    provides: supplyHandlers MSW suite, sidebar Supply nav, vitest stub files
  - phase: 03-console-ops
    provides: CandidateDetailPanel pattern (analog), ShortlistTable undo toast pattern
provides:
  - apps/console/app/(shell)/supply/search/page.tsx — talent search page with explicit-submit gate
  - apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx — collapsible filter sidebar
  - apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx — fat result card with rank badge
  - apps/console/app/(shell)/_components/candidate-profile-sheet.tsx — shared enriched profile slide-over
affects:
  - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx — CandidateDetailPanel replaced with CandidateProfileSheet
  - 04-03 onwards — CandidateProfileSheet shared component available for all candidate contexts
  - 04-05 supply-engagements — Generate Engagement button in CandidateProfileSheet reserved for wiring

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Explicit-submit gate: searchSubmitted + submittedFilters as two separate state values — query only runs when both are true"
    - "Title filter folded into q before submit: [title, q].filter(Boolean).join(' ') — no title API param"
    - "Manual setInterval enrichment polling: invalidateQueries every 2s, stop on signal or 30s timeout"
    - "Availability badge OKLCH color: available → oklch(0.45_0.15_145) with 0.15 alpha bg + 0.4 alpha border"
    - "Active filter chips from submittedFilters only (not live form state) — chip × handler re-submits"

key-files:
  created:
    - apps/console/app/(shell)/supply/search/page.tsx
    - apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx
    - apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx
    - apps/console/app/(shell)/_components/candidate-profile-sheet.tsx
  modified:
    - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx

key-decisions:
  - "CandidateProfileSheet created in this plan (not plan 03) because supply/search/page.tsx imports it — both tasks in this wave"
  - "useAsyncJob not used for enrichment polling — CandidateProfileResponse has no .status field; manual setInterval per RESEARCH.md Pitfall 3"
  - "Select seniority options: empty string mapped to '__any__' value to satisfy Radix Select non-empty requirement"
  - "Generate Engagement button in CandidateProfileSheet is a stub (no mutation wired) — deferred to plan 04-05 per plan spec"
  - "candidate-detail-panel.tsx kept as-is (import removed in page.tsx makes it unreachable) — noted for cleanup in future plan"

# Metrics
duration: 4min
completed: 2026-06-14
---

# Phase 4 Plan 02: Supply Search + CandidateProfileSheet Summary

**Talent search page with explicit-submit gate, ranked result cards, collapsible filter sidebar, and shared CandidateProfileSheet with manual enrichment polling — Phase 3 shortlist stub replaced**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-14T14:47:48Z
- **Completed:** 2026-06-14T14:51:49Z
- **Tasks:** 2
- **Files created/modified:** 5

## Accomplishments

- Built `/supply/search` page with the exact explicit-submit pattern (D-02): `searchSubmitted` + `submittedFilters` state pair — query only fires on submit, not on filter edit; active filter chips reflect submitted values only
- Title filter field value folded into `q` on submit (`[title, q].filter(Boolean).join(' ')`) — no separate title API param
- FilterSidebar with collapsible toggle, all 6 filter fields (search, title, skills, location, seniority, max results), Enter-triggers-submit on each input
- CandidateResultCard with rank badge (primary color for top 3, muted otherwise), availability badge with OKLCH green for "available", top-3 skills, match reason, secondary email/GitHub badges
- J/K/Enter keyboard nav with ShortcutOverlay; shortcuts disabled when sheet or overlay is open
- CandidateProfileSheet as shell-level shared component — handles both `source="search"` (Generate Engagement button, no shortlist actions) and `source="shortlist"` (Approve/Hold/Pass quick action bar with 5-second undo toast)
- Manual setInterval enrichment polling (2s interval, 30s timeout) per RESEARCH.md — `useAsyncJob` intentionally NOT used since `CandidateProfileResponse` has no `.status` field
- Skeleton shimmer during enrichment for skills/GitHub/contact/resume sections
- Phase 3 `CandidateDetailPanel` import in `ops/requisitions/[id]/page.tsx` replaced with `CandidateProfileSheet` using `source="shortlist"`
- TypeScript typecheck: 0 errors. Vitest: 32 passed | 74 todo (all stubs from plan 01 remain green)

## Task Commits

1. **Task 1: Supply search page + filter sidebar + result cards** — `11cc8b9` (feat)
2. **Task 2: CandidateDetailPanel stub replacement** — `5078647` (feat)

## Files Created/Modified

- `apps/console/app/(shell)/supply/search/page.tsx` — search page with explicit-submit gate, J/K/Enter nav, active filter chips
- `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx` — collapsible w-[260px] filter sidebar with all fields
- `apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx` — fat result card with rank badge, availability, skills, match reason
- `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx` — shared shell-level profile slide-over with enrichment + shortlist actions
- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` — CandidateDetailPanel → CandidateProfileSheet swap

## Decisions Made

- CandidateProfileSheet built in this plan alongside the search page (not deferred to plan 03) because page.tsx imports it — creating it here avoids a broken import
- Manual `setInterval` used for enrichment polling (not `useAsyncJob`) — confirmed by checking `CandidateProfileResponse` schema; no `.status` field exists
- Seniority empty string option uses `'__any__'` as value to satisfy Radix Select's non-empty value requirement
- `Generate Engagement` button in CandidateProfileSheet is UI-only (no mutation wired) — deferred to plan 04-05 per plan spec notes
- `candidate-detail-panel.tsx` kept in place (unreachable via import); noted for cleanup

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written with one minor note:

**1. [Rule 2 - Missing] Radix Select requires non-empty string values**
- **Found during:** Task 1 (FilterSidebar implementation)
- **Issue:** Radix Select's `SelectItem` requires non-empty `value` prop; the "Any seniority" option with `value=""` would be ignored or cause a Radix warning
- **Fix:** Used `value="__any__"` for the "Any seniority" option; filter submission logic treats `__any__` the same as empty (excluded from API params)
- **Files modified:** apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx
- **Impact:** Functionally identical; the API correctly receives no seniority param for "any seniority" case

## Known Stubs

- `CandidateProfileSheet` — Generate Engagement button (`source="search"` path): click handler is a placeholder (button renders, no POST mutation wired). Deferred to plan 04-05. The search UX is complete; only the engagement generation action is deferred.

## Threat Mitigations Verified

| Threat ID | Mitigation | Verified |
|-----------|-----------|---------|
| T-04-02-01 | Filter params sent via typed apiClient — compile-time shape enforcement | TypeScript passes |
| T-04-02-03 | Candidate name rendered as JSX text node — no dangerouslySetInnerHTML | grep check PASS |
| T-04-02-05 | Enrichment polling: 30s timeout clears interval, no runaway polling | setInterval + 30s timeout in code |

## Self-Check: PASSED

- `apps/console/app/(shell)/supply/search/page.tsx`: exists
- `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx`: exists
- `apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx`: exists
- `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx`: exists
- `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`: CandidateDetailPanel removed, CandidateProfileSheet present
- Task 1 commit `11cc8b9`: exists
- Task 2 commit `5078647`: exists
- TypeScript: 0 errors
- Vitest: 32 passed | 74 todo

---
*Phase: 04-console-supply-admin*
*Completed: 2026-06-14*
