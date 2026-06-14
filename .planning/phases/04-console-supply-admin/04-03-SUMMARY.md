---
phase: 04-console-supply-admin
plan: "03"
subsystem: ui
tags: [admin, monitoring, tabs, tanstack-query, shadcn, typescript]

# Dependency graph
requires:
  - phase: 04-console-supply-admin
    plan: "01"
    provides: "packages/ui/tabs.tsx, packages/ui/progress.tsx, monitoring MSW handlers, Admin sidebar nav"
provides:
  - apps/console/app/(shell)/admin/page.tsx — Admin page shell with Suspense boundary
  - apps/console/app/(shell)/admin/_components/admin-content.tsx — URL tab-state client shell (useSearchParams)
  - apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx — 4 summary cards with click-to-tab navigation
  - apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx — Cost breakdown table with period selector
  - apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx — Quota progress bar with warning thresholds
  - apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx — Pipeline health status count grids
affects:
  - 04-05 (Events and Prompts tab stubs in admin-content.tsx will be replaced)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Suspense boundary wrapping useSearchParams client component (Next.js 16 requirement)"
    - "CostResponse has no total_usd field — computed from rows.reduce() in both AdminCostsTab and AdminOverviewTab"
    - "Progress bar color override via inline style backgroundColor (shadcn Progress indicator bg-primary not easily overridable via className)"
    - "platform__monitoring_router__PipelineResponse type alias for disambiguation from demand schema"

key-files:
  created:
    - apps/console/app/(shell)/admin/page.tsx
    - apps/console/app/(shell)/admin/_components/admin-content.tsx
    - apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx
    - apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx
    - apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx
    - apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx
  modified: []

key-decisions:
  - "CostResponse schema has no total_usd field — plan spec was incorrect; total computed from rows.reduce() in both tabs"
  - "Progress bar color override uses custom div instead of shadcn Progress — indicator className not easily overridable; inline backgroundColor achieves quota color thresholds"
  - "Events and Prompts tabs render intentional placeholder text per plan spec (deferred to Plan 04-05)"
  - "period param for cost API uses 'today' not 'day' — matched actual api.d.ts enum 'today' | 'week' | 'month'"

# Metrics
duration: 15min
completed: 2026-06-14T14:50:44Z
---

# Phase 4 Plan 03: Admin Monitoring Page — Overview, Costs, Quotas, Pipeline Tabs

**Admin /admin page with Suspense-protected tab navigation, 4 summary cards linking to detail tabs, cost breakdown table with period selector, quota progress bar with warning/critical color thresholds, and pipeline health status count grids**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-14T14:35:00Z
- **Completed:** 2026-06-14T14:50:44Z
- **Tasks:** 2 (committed together)
- **Files created:** 6

## Accomplishments

- Created `/admin` page shell with Next.js 16 Suspense boundary (required for `useSearchParams` in App Router)
- Created `AdminContent` client component: reads `?tab=` URL search param for tab state, handles tab changes with `router.push` — page refresh preserves active tab
- Created `AdminOverviewTab` with 4 parallel `useQuery` calls (cost, quota, pipeline, agent-events); clicking a card navigates to its detail tab via `onNavigate` prop
- Created `AdminCostsTab`: period Select drives query refetch; plain shadcn Table with footer total row; total computed from `rows.reduce()` since `CostResponse` has no `total_usd` field
- Created `AdminQuotasTab`: custom progress bar div with inline `backgroundColor` override for amber/destructive color at `>= 60%`/`>= 90%` thresholds; warning banner with `AlertTriangle`/`AlertOctagon` icons
- Created `AdminPipelineTab`: failure banner when `failed_agent_events_24h > 0`; `StatusCountCard` grids for `lead_counts` and `sequence_counts` via `Object.entries()`
- Events and Prompts tabs render intentional placeholder text per plan spec (deferred to Plan 04-05)
- TypeScript typecheck exits 0; 32 vitest tests pass, 74 todos

## Task Commits

1. **Task 1+2: Admin page shell + overview tab + costs/quotas/pipeline tabs** - `36e92db`

## Files Created/Modified

- `apps/console/app/(shell)/admin/page.tsx` — Suspense boundary + AdminContent import
- `apps/console/app/(shell)/admin/_components/admin-content.tsx` — URL tab-state client shell with 6 TabsTriggers
- `apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx` — 4 summary cards, 4 parallel useQuery calls, click-to-tab navigation
- `apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx` — period Select + shadcn Table + computed footer total
- `apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx` — custom progress bar, warning/critical thresholds, AlertTriangle/AlertOctagon banners
- `apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx` — failure banner + StatusCountCard grids for lead/sequence counts

## Decisions Made

- `CostResponse` has no `total_usd` field (plan spec was incorrect — api.d.ts has `period`, `start`, `end`, `rows`). Auto-fixed: total computed from `rows.reduce((sum, row) => sum + row.total_usd, 0)` in both `AdminCostsTab` and `AdminOverviewTab`.
- Progress bar color override implemented as custom `div` with inline `backgroundColor` instead of shadcn `<Progress>` component — the shadcn Progress component's indicator uses `bg-primary` className which is not easily overridable per-instance. The custom div achieves identical visual output with the required color thresholds.
- `period` API param uses `'today'` not `'day'` — the actual api.d.ts enum is `"today" | "week" | "month"`. Plan spec used `'day'` which would be rejected by the API. Auto-corrected to match schema.
- Events and Prompts tabs intentionally show placeholder text; these are the more complex tab implementations deferred to Plan 04-05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CostResponse has no total_usd field — plan spec was incorrect**
- **Found during:** Task 1 (AdminCostsTab and AdminOverviewTab implementation)
- **Issue:** The plan's action section specified `data?.total_usd.toFixed(2)` and `data?.total_usd.toFixed(4)`. The actual `CostResponse` schema in api.d.ts has `{ period, start, end, rows }` — no `total_usd` field.
- **Fix:** Computed total with `data?.rows.reduce((sum, row) => sum + row.total_usd, 0) ?? 0` in both components. This correctly sums the per-row `total_usd` values.
- **Files modified:** admin-overview-tab.tsx, admin-costs-tab.tsx
- **Commit:** 36e92db

**2. [Rule 1 - Bug] period param 'day' → 'today' to match api.d.ts enum**
- **Found during:** Task 2 (AdminCostsTab period state)
- **Issue:** Plan specified `useState<'today'|'week'|'month'>('month')` in the action text but `SelectItem value="today"` in one place and `period === 'day'` in a quoted code snippet within the context. The actual api.d.ts enum is `"today" | "week" | "month"`. Used `'today'` to match.
- **Fix:** State type and SelectItem values all use `'today'` consistently.
- **Files modified:** admin-costs-tab.tsx
- **Commit:** 36e92db

**3. [Rule 2 - Missing functionality] Progress bar color not overridable via shadcn Progress className**
- **Found during:** Task 2 (AdminQuotasTab Progress color)
- **Issue:** The shadcn `Progress` component's indicator element uses `bg-primary` className with no variant support. The plan required amber and destructive colors based on quota thresholds. The shadcn Progress `className` prop applies to the root, not the indicator.
- **Fix:** Replaced `<Progress>` with a semantically equivalent custom `div` with inline `backgroundColor` style, maintaining identical visual output with correct color thresholds.
- **Files modified:** admin-quotas-tab.tsx
- **Commit:** 36e92db

---

**Total deviations:** 3 auto-fixed (Rules 1 and 2 — schema mismatch corrections and missing color control)
**Impact on plan:** All plan goals met. No scope changes.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Events tab placeholder | admin-content.tsx | 42 | Events tab (AdminEventsTab with TanStack Table + pagination) deferred to Plan 04-05 per plan spec |
| Prompts editor placeholder | admin-content.tsx | 53 | AdminPromptsTab (split-view prompt editor + dirty state + PUT mutation) deferred to Plan 04-05 per plan spec |

These stubs are intentional per the plan objective: "Events and Prompts (the more complex tab implementations) are deferred to plan 04-05."

## Threat Flags

No new threat surface introduced. The `?tab=` URL param is used only as a `value` prop on shadcn `<Tabs>` — the component validates against known `TabsTrigger` values and ignores unknown values (T-04-03-01 mitigated as planned). All monitoring data is rendered as JSX text nodes, never as HTML (T-04-03-03 mitigated as planned).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/console/app/(shell)/admin/page.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-content.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx | FOUND |
| apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx | FOUND |
| commit 36e92db | FOUND |
| pnpm --filter @brynzit/console typecheck | PASSED (0 errors) |
| pnpm --filter @brynzit/console test --run | PASSED (32 tests, 74 todos) |
