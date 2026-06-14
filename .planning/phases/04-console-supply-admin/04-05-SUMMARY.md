---
phase: 04-console-supply-admin
plan: "05"
subsystem: ui
tags: [admin, monitoring, events, prompts, tanstack-table, tanstack-query, dirty-state, typescript]

# Dependency graph
requires:
  - phase: 04-console-supply-admin
    plan: "03"
    provides: "admin-content.tsx shell with Events and Prompts tab stubs"
provides:
  - apps/console/app/(shell)/admin/_components/admin-events-tab.tsx — Agent event log with TanStack Table v8, server+client filters, limit+offset pagination
  - apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx — Split-view prompt editor with KNOWN_PROMPTS, dirty state, save/reset, PUT mutation
  - apps/console/app/(shell)/admin/_components/admin-content.tsx — Updated to wire AdminEventsTab and AdminPromptsTab (all 6 tabs fully implemented)
affects:
  - none (terminal — all admin tabs now complete)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack Table v8 createColumnHelper pattern with display() column for derived token display (input_tokens / output_tokens)"
    - "Two-tier filtering: server-side domain+status params vs client-side task_type Array.filter — comment in code explains why"
    - "useEffect([promptData?.content, selectedPromptName]) sync pattern for prompt editor load-on-select"
    - "Dirty guard toast with Discard action — blocks prompt switching while unsaved"
    - "AgentEventOut uses model_used (not model) and input_tokens/output_tokens (not tokens_in/tokens_out)"

key-files:
  created:
    - apps/console/app/(shell)/admin/_components/admin-events-tab.tsx
    - apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx
  modified:
    - apps/console/app/(shell)/admin/_components/admin-content.tsx

key-decisions:
  - "AgentEventOut.model_used (not model) — plan interface snippet used 'model' but api.d.ts has model_used; corrected to match schema"
  - "AgentEventOut.input_tokens/output_tokens (not tokens_in/tokens_out) — api.d.ts field names differ from plan snippet; corrected"
  - "Select 'All domains' uses value='_all' sentinel to avoid empty string conflicts with Radix Select uncontrolled state"
  - "KNOWN_PROMPTS hardcoded per RESEARCH.md Pitfall 6 — no list endpoint exists; backend PROMPT_REGISTRY is the source of truth"
  - "Prompt versions display conditionally (only when versions array is non-empty) to avoid empty 'Versions:' label"

# Metrics
duration: 20min
completed: 2026-06-14T20:35:00Z
---

# Phase 4 Plan 05: Admin Events Tab + Prompts Tab

**AdminEventsTab (TanStack Table v8, server+client filters, limit+offset pagination) and AdminPromptsTab (split-view editor with KNOWN_PROMPTS, dirty state, PUT save, reset). Replaces stubs in admin-content.tsx — all 6 admin tabs fully implemented.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-14T20:15:00Z
- **Completed:** 2026-06-14T20:35:00Z
- **Tasks:** 2 (each committed individually)
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Created `AdminEventsTab`: TanStack Table v8 with 9 columns (Timestamp, Domain, Agent Type, Task Type, Model, Tokens, Cost, Duration, Status); domain+status filters are server-side query params; task_type is client-side `Array.filter` with comment explaining why; status badge color map (success=green text, error=destructive badge, quota_exhausted=amber outline); Previous/Next pagination controls with correct disabled states
- Created `AdminPromptsTab`: `KNOWN_PROMPTS` constant with 4 prompt names; left panel prompt list with active indicator (left border accent) and amber dirty dot; useQuery on prompt selection (enabled only when selected); useEffect sync for `editedContent` when promptData loads; `isDirty` derived state; dirty navigation guard via toast with Discard action; PUT saveMutation with Sonner success/error toasts; Reset button restores original content from cache
- Updated `admin-content.tsx`: replaced both placeholder divs with `<AdminEventsTab />` and `<AdminPromptsTab />`; all 6 admin tabs are now fully implemented
- TypeScript typecheck exits 0; 32 vitest tests pass, 74 todos (same as pre-plan baseline)

## Task Commits

1. **Task 1: AdminEventsTab + admin-content Events wiring** - `5af3434`
2. **Task 2: AdminPromptsTab + admin-content Prompts wiring** - `9548354`

## Files Created/Modified

- `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx` — Agent event log: TanStack Table v8, server domain+status filters, client task_type filter, limit+offset pagination with Previous/Next
- `apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx` — Split-view prompt editor: KNOWN_PROMPTS list, useQuery on select, dirty state, save/reset, dirty navigation guard
- `apps/console/app/(shell)/admin/_components/admin-content.tsx` — Updated: AdminEventsTab + AdminPromptsTab wired in, both placeholder stubs removed

## Decisions Made

- `AgentEventOut` field names from api.d.ts: `model_used` (not `model`), `input_tokens`/`output_tokens` (not `tokens_in`/`tokens_out`). Plan's interface snippet used different names — corrected to match actual schema.
- Tokens column implemented as `columnHelper.display()` (not `accessor`) to combine `input_tokens` and `output_tokens` into one formatted cell (`[in] / [out]`).
- Select components use sentinel value `_all` for "All domains" / "All statuses" to avoid empty string conflicts with Radix Select's controlled state management (empty string can cause uncontrolled/controlled mismatch).
- `KNOWN_PROMPTS` hardcoded per RESEARCH.md Pitfall 6: no GET list endpoint exists. Comment in code explains this. Backend PROMPT_REGISTRY is the canonical source.
- Prompt versions shown conditionally: `{promptData?.versions && promptData.versions.length > 0 && ...}` — avoids a dangling "Versions:" label when the array is empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AgentEventOut field names differ from plan snippet**
- **Found during:** Task 1 (admin-events-tab.tsx implementation)
- **Issue:** The plan's `<interfaces>` section showed `model`, `tokens_in`, `tokens_out` as field names. The actual `AgentEventOut` schema in api.d.ts uses `model_used`, `input_tokens`, `output_tokens`.
- **Fix:** Used the correct field names from api.d.ts: `model_used`, `input_tokens`, `output_tokens`. Added `columnHelper.display()` for tokens to format `input_tokens / output_tokens` in one cell.
- **Files modified:** admin-events-tab.tsx
- **Commit:** 5af3434

## Known Stubs

None — both tabs are fully implemented with real API calls, proper state, and no placeholder text.

## Threat Flags

No new threat surface beyond what was identified in the plan's `<threat_model>`. Mitigations applied:
- T-04-05-01 (Prompt textarea → PUT): Content saved via typed `PromptSaveRequest`; rendered in `<Textarea>` (not dangerouslySetInnerHTML) — XSS risk is backend-side only.
- T-04-05-03 (Agent event fields): All event fields rendered as JSX text nodes only — no injection surface.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/console/app/(shell)/admin/_components/admin-events-tab.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-content.tsx (no placeholders) | PASSED |
| commit 5af3434 (AdminEventsTab) | FOUND |
| commit 9548354 (AdminPromptsTab) | FOUND |
| pnpm --filter @brynzit/console typecheck | PASSED (0 errors) |
| pnpm --filter @brynzit/console test --run | PASSED (32 tests, 74 todos) |
