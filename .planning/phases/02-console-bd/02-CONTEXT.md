# Phase 2: Console BD - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the full BD rep workflow in `apps/console`: lead review queue with fat cards, approve/reject/snooze inline, bulk actions with pending-overlay pattern, CSV import with async polling, outreach sequence review/edit/approve, pipeline kanban, and reply triage — with keyboard shortcuts (J/K/A/R/S/?) and 5-second undo toasts throughout. Also establishes the shell sidebar layout (BD fully wired + Ops/Supply/Admin stubs) and the side-panel slide-over pattern (CUX-01) used by all later phases.

</domain>

<decisions>
## Implementation Decisions

### Fat Card Layout (BD-01)
- **D-01:** Card shows only decision-relevant fields: ICP score badge (strongly visible), company name + canonical domain, contact name/title, suggested angle (1–2 lines max), open roles count if available, small status/task badges only when they affect the action (snoozed, sequence ready, urgent reply). All other fields (ICP breakdown detail, enrichment, full task history, outreach sequence detail) go in the slide-over detail panel.

### Detail Panel / Side-panel Slide-over (CUX-01)
- **D-02:** Detail opens as a **slide-over overlay** from the right — panel slides over the queue, queue stays in background (dimmed slightly). Closing returns focus and cursor position to the queue. This is the canonical CUX-01 pattern used by all future phases (candidate profile in Phase 4, requisition detail in Phase 3, etc.).
- **D-03:** Clicking anywhere on the card body opens the detail panel. Approve/reject/snooze action buttons appear **both on the card** (for fast queue review without opening detail) **and inside the panel** (for after reading full context). No exclusive-to-panel-only actions.

### Reject + Snooze Inline Interaction (BD-02)
- **D-04:** Clicking Reject opens a **floating Radix Popover** above/below the button listing the 7 rejection reasons. Rep picks one reason, card animates out. No modal, no extra confirm step.
- **D-05:** Snooze presets: **1 week / 1 month / end of quarter / custom date**. Shown in the same popover pattern as reject.
- **D-06:** Undo pattern (CUX-02): card **leaves the queue immediately** on approve/reject/snooze (optimistic update). Sonner toast shows "Approved — Undo" for 5 seconds. If undone, card reappears at its original position. TanStack Query optimistic update + rollback handles this.

### BD Navigation Structure
- **D-07:** BD surfaces are **separate sidebar nav routes**: `/bd/leads` (queue), `/bd/outreach`, `/bd/pipeline`, `/bd/imports`, `/bd/replies`. Each has its own badge count in the sidebar where relevant (e.g., "Leads (12)" for queue count, "Replies (3)" for urgent reply count, "BD-08 snooze wake badge").
- **D-08:** Phase 2 builds the full `(shell)/layout.tsx` sidebar: BD section fully wired + **dimmed/locked stubs** for Ops, Supply, Admin. Establishes the nav shape so Phase 3 just activates the Ops items without rearchitecting the sidebar.

### Pending-overlay + Bulk Action UX (BD-03)
- **D-09:** Bulk action processing state: selected cards get **50% opacity + small spinner badge overlay**. Queue remains readable — rep can see what's processing. On API settle: cards animate out (success) or revert with an error badge (failure).
- **D-10:** After bulk action settles, **reset cursor to page 1** and refetch the queue from the top. Avoids cursor corruption from actioned leads shifting positions in the cursor window (flagged in STATE.md as the known danger here).

### Keyboard Shortcuts (CUX-03)
- **D-11:** Shortcuts scope to the queue when a lead card is "focused" (hovered or selected). J/K navigate between cards, A approves focused lead, R opens the reject popover, S opens the snooze popover. `?` shows a keyboard shortcut overlay (modal or popover listing all shortcuts). Shortcuts are disabled when a text input or the detail slide-over is focused.

### Async Polling (BD-04 — CSV Import)
- **D-12:** CSV import uses the existing `useAsyncJob` hook from `@brynzit/hooks`. Status states displayed: queued → processing (with count "Processing 247 leads…") → done (with success count) / failed (with error message). No manual refresh — `useAsyncJob` polls until terminal state.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend API (all BD endpoints exist on live backend)
- `packages/api-client/src/types/api.d.ts` — Generated TypeScript types. BD paths: `/api/v1/bd/leads`, `/api/v1/bd/leads/bulk-action`, `/api/v1/bd/leads/{lead_id}`, `/api/v1/bd/pipeline`, `/api/v1/bd/rejection-reasons`, `/api/v1/bd/imports`, `/api/v1/bd/imports/{import_id}/status`, `/api/v1/bd/leads/{lead_id}/outreach/*`, `/api/v1/bd/outreach/{sequence_id}/*`, `/api/v1/bd/webhooks/instantly/reply`
- `packages/api-client/src/client.ts` — `apiClient` instance (openapi-fetch, base URL from `NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'`)

### Phase 1 Foundation (reuse everything)
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — What the scaffold built (packages, hooks, MSW architecture)
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — API types, useAsyncJob tests, contract YAMLs
- `.planning/phases/01-foundation/01-03-SUMMARY.md` — App shells, globals.css, MSW provider pattern
- `.planning/phases/01-foundation/01-04-SUMMARY.md` — shadcn components available, bd.ts handler pattern

### Requirements
- `.planning/REQUIREMENTS.md` §BD — BD-01 through BD-08, CUX-01 through CUX-03 (all Phase 2)
- `.planning/ROADMAP.md` §Phase 2 — Full success criteria (6 items) and cross-cutting constraints

### Backend Platform Context
- `../talent-platform/PLATFORM_FLOWS.md` — Full flow diagrams, status machine (discovered → icp_scored → review_queue → outreach_approved → outreach_sent → … → converted), ER model, reply classification (OOO/unsubscribe/not-now/interested+briefing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/hooks/src/use-async-job.ts` — Use for CSV import polling (BD-04) and outreach generation polling (BD-05). Already covers all 202 terminal states including `complete`.
- `packages/ui/src/components/ui/` — Available: button, badge, card, skeleton, sonner (toast), separator, input, label, avatar. Phase 2 will need to add via shadcn CLI: table, popover, select, dialog, sheet (for slide-over), command (keyboard shortcuts overlay), dropdown-menu, checkbox (bulk select).
- `packages/mocks/src/handlers/bd.ts` — Existing rejection-reasons handler. Phase 2 fleshes out all BD handlers.
- `packages/mocks/src/base-url.ts` — `API_BASE` constant — all new MSW handlers must use `${API_BASE}/api/v1/bd/...`.
- `apps/console/app/(shell)/bd/leads/page.tsx` — Existing walking skeleton. Phase 2 replaces this with the real lead queue.

### Established Patterns
- **MSW handler pattern:** Import `API_BASE` from `../base-url`, prefix all handler URLs with `${API_BASE}`. Relative paths don't work with the openapi-fetch client.
- **Async polling:** `useAsyncJob(jobId, fetchFn, options)` — pass `refetchInterval` as a function that returns `false` when terminal.
- **Theme / tokens:** Import from `packages/ui/src/styles/globals.css` via `@import '@brynzit/ui/styles/globals.css'`. Never redefine `@theme` in the app. Console is dark-mode-first (`:root` is dark values).
- **Type imports:** Always use `import type { components } from '@brynzit/api-client'` for API types — never re-export or inline them.

### Integration Points
- `apps/console/app/(shell)/layout.tsx` — Phase 2 builds this into the real sidebar. Must remain a Server Component (no `'use client'`); interactive sidebar behavior goes in a client sub-component.
- `apps/console/app/_components/console-providers.tsx` — QueryClientProvider + MSWProvider already at root. TanStack Query is available to all pages.
- `packages/mocks/src/browser.ts` + `node.ts` — Add new BD handlers here. `worker` is already configured.

</code_context>

<specifics>
## Specific Ideas

- **Linear/Attio feel** for the queue — dense, keyboard-first, no wasted vertical space. Not a generic admin dashboard table.
- **Hybrid aesthetic rule (from PROJECT.md):** Queue surfaces = dense + keyboard-driven. Detail/fat card view = richer layout that sells the decision. Both in the same phase.
- ICP score badge should be visually prominent on the card — it's the primary decision signal.
- The slide-over detail panel (CUX-01) is established in this phase as the pattern for ALL later detail views. Get the animation and focus-management right here; later phases inherit it.
- Sonner is already installed (`packages/ui/src/components/ui/sonner.tsx`) — use it for the 5-second undo toasts.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Console BD*
*Context gathered: 2026-06-13*
