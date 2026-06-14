---
phase: 02-console-bd
verified: 2026-06-14T11:55:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 1
overrides:
  - requirement: BD-01 / ROADMAP SC1 (open_roles + suggested_angle on fat card)
    disposition: accepted_with_open_contract
    notes: |
      Fields rendered via LeadQueueItemExtended mock bridge. Backend contract proposal
      documented at .planning/contracts/bd-lead-queue-item-fat-card.yaml.
      Gap is explicitly open — not closed. Human-approved 2026-06-14.
human_verification:
  - test: "Full end-to-end BD workflow in browser with MSW enabled"
    expected: |
      Sidebar shows Brynzit brand + BD nav with Leads/Outreach/Pipeline/Imports/Replies.
      Lead queue shows fat cards with ICP score, company, contact name/title.
      Approve/reject/snooze cards with 5-second undo toast.
      Reject popover shows 7 reasons.
      Snooze popover shows 4 presets.
      Clicking card body opens right-side Sheet slide-over with lead detail and action buttons.
      Esc closes sheet and returns focus to originating card.
      Checkboxes + bulk toolbar with Approve All/Reject All/Snooze All.
      J/K/A/R/S/? keyboard shortcuts active; disabled when Sheet/Dialog/Popover open.
      CSV import dropzone processes file and transitions processing→done via polling (no refresh).
      Outreach sequences expand to 3 step editors; Approve Sequence/Reject Sequence fire and remove sequence.
      Pipeline shows 7 kanban columns; drag reorders visually within column.
      Replies page shows interested/OOO/unsubscribe tasks with correct quick-action buttons.
    why_human: |
      Plan 02-04 has an explicit blocking checkpoint:human-verify (Task 2, gate="blocking")
      requiring human approval before the phase is considered complete. No approval signal
      was recorded in any SUMMARY.md or planning artifact. Visual behavior, drag-and-drop,
      Sheet focus return, and toast interactions cannot be verified programmatically.
  - test: "Verify 'suggested angle' field on fat card"
    expected: |
      ROADMAP SC1 states: 'ICP score, open roles, decision-maker, suggested angle visible
      without opening any detail page'. Confirm whether the missing fields are acceptable
      given the LeadQueueItem schema does not expose suggested_angle or open_roles_count.
    why_human: |
      The LeadQueueItem API schema does not contain suggested_angle or open_roles fields.
      Plan 02-02 line 753 documents this as 'omit for now'. ROADMAP SC1 explicitly requires
      both fields on the fat card without opening a detail page. A human must decide whether
      to accept the schema constraint as a deviation from SC1 or require a backend schema
      update before the phase is complete.
gaps:
  - truth: "Fat card shows open roles count and suggested angle without opening a detail page"
    status: failed
    reason: |
      LeadQueueItem schema (api.d.ts lines 1648-1692) does not include open_roles or
      suggested_angle fields. LeadCard row 3 shows only the updated_at date. Plan 02-02
      code comment at line 753 explicitly states 'LeadQueueItem has no suggested_angle
      field — omit for now'. ROADMAP SC1 requires both fields visible on the card.
    artifacts:
      - path: "apps/console/app/(shell)/bd/leads/_components/lead-card.tsx"
        issue: "Row 3 shows updated_at date only; no open_roles or suggested_angle rendered"
      - path: "packages/api-client/src/types/api.d.ts"
        issue: "LeadQueueItem schema (lines 1649-1692) has no open_roles or suggested_angle fields"
    missing:
      - "Backend schema update to add open_roles_count and suggested_angle to LeadQueueItem"
      - "OR explicit deviation accepted: document that these fields are only available in LeadFatCardResponse (detail panel)"
---

# Phase 2: Console BD Verification Report

**Phase Goal:** A BD rep can open the console, clear an entire lead review queue in under 30 seconds per lead, approve outreach sequences, monitor the pipeline, process CSV imports asynchronously, triage replies, and use keyboard shortcuts throughout — with side-panel slide-overs keeping queue context intact.
**Verified:** 2026-06-14T11:55:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | BD rep sees fat cards with ICP score, open roles, decision-maker, and suggested angle — all without opening detail | FAILED | `LeadQueueItem` schema lacks `open_roles` and `suggested_angle`. Card shows ICP score, company, contact name/title, domain, date only. Plan 02-02 line 753: "LeadQueueItem has no suggested_angle field — omit for now" |
| 2 | Clicking Approve/Reject/Snooze optimistically removes card, shows 5-second undo toast, fires API after 300ms | VERIFIED | `page.tsx:108,144,157` — `leavingIds` set immediately, toast with `duration: 5000` and Undo callback that `clearTimeout`, `setTimeout(() => actionMutation.mutate, 300)` |
| 3 | Clicking card body opens Sheet slide-over from right; Escape closes it | VERIFIED | `lead-detail-panel.tsx:57-61` — `<Sheet side="right">`, wired via `setIsDetailOpen(true)` in page. Radix Sheet handles Escape natively. |
| 4 | Bulk-select ≥1 cards shows toolbar; bulk action sets pending state; resetQueries (not invalidate) after settle | VERIFIED | `bulk-toolbar.tsx:52-55` — `resetQueries({ queryKey: ['leads'] })` in `onSettled`. Delayed 300ms timer + Undo (WR-01 fix confirmed). `processingIds` set via `onBulkStart`. |
| 5 | J/K/A/R/S/? shortcuts work; disabled when Sheet/Dialog/Popover open | VERIFIED | `page.tsx:182` — `if (isInputFocused \|\| isDetailOpen \|\| isShortcutOpen \|\| anyPopoverOpen) return`. All cases J/K/A/R/S/Enter/Space/? implemented with correct guards. |
| 6 | CSV upload returns import_id; useAsyncJob polls until complete without manual refresh | VERIFIED | `import-dropzone.tsx:4-5,19-21,37-53` — `useDropzone`, `FormData` native fetch (no apiClient), `useAsyncJob` hook. `use-async-job.ts:93-97` — base URL prepended (CR-01 fix). |

**Score:** 5/6 truths verified (1 failed on open_roles/suggested_angle schema constraint)

### Observable Truths (continued — plan 02-02 and 02-03 and 02-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | Reject popover shows 7 reasons fetched from API | VERIFIED | `reject-popover.tsx:29-35` — fetches `/api/v1/bd/rejection-reasons`, `staleTime: Infinity`. MSW returns 7 reasons. |
| 8 | Snooze popover shows 4 presets (1 week / 1 month / end of quarter / custom date) | VERIFIED | `snooze-popover.tsx:63-72` — 3 preset buttons (week/month/quarter) + "Custom date…" button with date input |
| 9 | Outreach sequence expands to 3 step editors; approve/reject fires correct API | VERIFIED | `sequence-editor.tsx:106,186-216` — `isExpanded` state, StepEditor per step, approve/reject native fetch POSTs |
| 10 | Import status transitions processing→done via polling | VERIFIED | `import-dropzone.tsx:74-99` — phase-based rendering: pending spinner, complete green badge, failed destructive badge |
| 11 | Pipeline renders 7 kanban columns with counts; visual drag reorder | VERIFIED | `kanban-board.tsx:39-47,116-181` — `PIPELINE_STATUS_LABELS` for 7 statuses, `DndContext + SortableContext + arrayMove`, `useEffect` prop sync (CR-03 fix). |
| 12 | Reply triage shows interested/OOO/not_now/unsubscribe with correct quick-actions | VERIFIED | `replies/page.tsx:38-150` — `SORT_PRIORITY` sorts interested first, `classificationBadgeClass` per type, correct buttons per classification |
| 13 | Nav badge shows count when snoozed leads have woken | VERIFIED | `sidebar-nav.tsx:44-70,82-88` — `snoozed-wake-count` query (before `:lead_id` wildcard, CR-02 fix), `wakeCount > 0` badge conditional |
| 14 | ? key opens shortcut overlay Dialog | VERIFIED | `page.tsx:224,371` — `setIsShortcutOpen(true)` on `e.key === '?'`, `<ShortcutOverlay>` rendered with all J/K/A/R/S/Enter/Esc/? entries |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `apps/console/app/(shell)/_components/sidebar-nav.tsx` | Client sidebar with BD nav, badge counts, dimmed stubs | VERIFIED | 155 lines, `'use client'`, 5 BD nav items, badge queries, opacity-40 stub sections, wake badge |
| `apps/console/app/(shell)/layout.tsx` | RSC shell layout with SidebarNav | VERIFIED | No top-level `'use client'`, imports SidebarNav, flex layout |
| `apps/console/app/layout.tsx` | Root layout with ThemeProvider + Toaster | VERIFIED | `ThemeProvider forcedTheme="dark"`, `Toaster position="bottom-right"` |
| `apps/console/app/(shell)/bd/leads/page.tsx` | Lead queue page | VERIFIED | 374 lines, useInfiniteQuery, optimistic updates, keyboard handler |
| `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | Fat card component | VERIFIED | 159 lines, ICP color tiers, exit animation, pending spinner |
| `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | Sheet slide-over | VERIFIED | `side="right"`, `enabled: !!leadId && isOpen` lazy fetch |
| `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx` | Reject reason popover | VERIFIED | 7 REASON_LABELS, API fetch, `staleTime: Infinity` |
| `apps/console/app/(shell)/bd/leads/_components/snooze-popover.tsx` | Snooze preset popover | VERIFIED | 3 presets + custom date input, `getPresetDate`, `toISOString()` |
| `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx` | Bulk action toolbar | VERIFIED | `resetQueries`, 300ms delay + undo timer (WR-01 fix applied) |
| `apps/console/app/(shell)/bd/leads/_components/shortcut-overlay.tsx` | Keyboard shortcut Dialog | VERIFIED | Dialog with `kbd` elements listing J/K/A/R/S/Enter/Esc/? shortcuts |
| `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` | CSV dropzone + polling | VERIFIED | `useDropzone`, native FormData, `useAsyncJob`, 4-state card |
| `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` | Sequence editor | VERIFIED | SequenceEditor (expand/collapse), StepEditor, approve/reject mutations |
| `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx` | Kanban board | VERIFIED | DndContext + SortableContext, arrayMove, useEffect prop sync |
| `apps/console/app/(shell)/bd/replies/page.tsx` | Reply triage page | VERIFIED | normaliseTask(), SORT_PRIORITY, ReplyCard with classification actions |
| `packages/mocks/src/handlers/bd.ts` | All BD MSW handlers | VERIFIED | 14 HTTP handlers, correct ordering (snoozed-wake-count before :lead_id) |
| `packages/hooks/src/use-async-job.ts` | Async polling hook | VERIFIED | apiBase option, base URL prepended (CR-01 fix), terminal state stops polling |
| `apps/console/vitest.config.ts` | Vitest config | VERIFIED | `environment: 'jsdom'`, `globals: true` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `leads/page.tsx` | `/api/v1/bd/leads` | `useInfiniteQuery` with cursor pagination | VERIFIED | `initialPageParam: null as string \| null`, `getNextPageParam` returns `next_cursor` |
| `leads/page.tsx` | `/api/v1/bd/leads/bulk-action` | `useMutation` optimistic update | VERIFIED | `onMutate` sets query data, `onError` rolls back, `setTimeout 300ms` before fire |
| `lead-detail-panel.tsx` | `/api/v1/bd/leads/{lead_id}` | `useQuery` enabled when sheet open | VERIFIED | `enabled: !!leadId && isOpen`, lazy fetch |
| `import-dropzone.tsx` | `/api/v1/bd/imports` | native `fetch` with `FormData` | VERIFIED | No apiClient — browser sets `multipart/form-data` boundary automatically |
| `import-dropzone.tsx` | `useAsyncJob` | polls `/api/v1/bd/imports/{id}/status` | VERIFIED | `useAsyncJob({ jobId: importId, endpoint: '/api/v1/bd/imports/{id}/status' })` |
| `sequence-editor.tsx` | `/api/v1/bd/outreach/{id}/approve` | `useMutation` native fetch | VERIFIED | `fetch(.../approve, { method: 'POST' })` on `approveMutation` |
| `pipeline/page.tsx` | `/api/v1/bd/pipeline` | `useQuery` with `refetchInterval: 15_000` | VERIFIED | `refetchInterval: 15_000` line 16 |
| `kanban-board.tsx` | `@dnd-kit/core + @dnd-kit/sortable` | `DndContext + SortableContext` | VERIFIED | Imports from `@dnd-kit/core` and `@dnd-kit/sortable` only (NOT `@dnd-kit/react`) |
| `replies/page.tsx` | `/api/v1/bd/tasks` | `useQuery` MSW stub | VERIFIED | `fetch(.../bd/tasks)`, `normaliseTask()` maps context_json |
| `sidebar-nav.tsx` | `/api/v1/bd/leads/snoozed-wake-count` | `useQuery` polling every 5min | VERIFIED | `refetchInterval: 5 * 60 * 1000`, wakeCount badge conditional |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `leads/page.tsx` | `leads` from `useInfiniteQuery` | MSW `GET /api/v1/bd/leads` returns 6 mock leads | Yes — 6 mock leads, cursor pagination | FLOWING |
| `lead-detail-panel.tsx` | `data` from `useQuery` | MSW `GET /api/v1/bd/leads/:lead_id` returns full contact detail | Yes — full LeadFatCardResponse | FLOWING |
| `import-dropzone.tsx` | `phase` / `statusData` from `useAsyncJob` | MSW `GET /api/v1/bd/imports/:import_id/status` cycles through processing→complete | Yes — status transitions | FLOWING |
| `sequence-editor.tsx` | `sequence` prop from `outreach/page.tsx` | MSW `GET /api/v1/bd/outreach` returns 1 sequence with 3 steps | Yes — 3 steps with subject/body | FLOWING |
| `kanban-board.tsx` | `columns` prop from `pipeline/page.tsx` | MSW `GET /api/v1/bd/pipeline` returns 7 columns | Yes — 7 columns, some with leads | FLOWING |
| `replies/page.tsx` | `rawTasks` from `useQuery` | MSW `GET /api/v1/bd/tasks` returns 3 tasks | Yes — 3 tasks with context_json classifications | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vitest test suite | `pnpm --filter @brynzit/console test -- --run` | 4 test files passed, 13 tests passed, 11 todo, 0 failures | PASS |
| TypeScript compilation | `pnpm --filter @brynzit/console typecheck` | `tsc --noEmit` exits 0 (no output = no errors) | PASS |
| MSW handler count | `grep -c "http\." packages/mocks/src/handlers/bd.ts` | 14 handlers | PASS |
| Shell layout is RSC | `grep -n "^'use client'" apps/console/app/(shell)/layout.tsx` | No match — Server Component | PASS |
| dnd-kit stable import | `grep "@dnd-kit/react" kanban-board.tsx` | No match — only `@dnd-kit/core` and `@dnd-kit/sortable` | PASS |
| Import uses native fetch | `grep "apiClient" import-dropzone.tsx` | Only in comment — no actual apiClient call | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|------------|-------------|--------|----------|
| BD-01 | 02-02 | Cursor-paginated fat cards with company, ICP score, open roles, decision-maker, suggested angle | PARTIAL | ICP score, company, contact name/title present; open_roles and suggested_angle absent (schema gap) |
| BD-02 | 02-02 | Approve/reject/snooze with 7 reasons and smart snooze presets | VERIFIED | leads/page.tsx handleAction, reject-popover (7 reasons, Infinity staleTime), snooze-popover (4 presets) |
| BD-03 | 02-02 | Bulk select + approve/reject/snooze with pending-overlay | VERIFIED | bulk-toolbar.tsx with processingIds, resetQueries, 300ms delay + undo toast |
| BD-04 | 02-03 | CSV upload with async import progress | VERIFIED | import-dropzone.tsx + useAsyncJob polling, native FormData |
| BD-05 | 02-03 | 3-email outreach sequence review, edit steps, approve/reject | VERIFIED | sequence-editor.tsx StepEditor + PATCH, approveMutation/rejectMutation |
| BD-06 | 02-04 | Pipeline kanban with status columns and live counts | VERIFIED | kanban-board.tsx 7 columns, DndContext, refetchInterval: 15s |
| BD-07 | 02-04 | Reply triage with classification-based quick-actions and AI briefing | VERIFIED | replies/page.tsx normaliseTask, line-clamp-2 ai_briefing, per-classification buttons |
| BD-08 | 02-01, 02-04 | Snoozed leads resurface with nav badge | VERIFIED | sidebar-nav.tsx snoozed-wake-count query, wakeCount > 0 badge, CR-02 ordering fix |
| CUX-01 | 02-02 | Detail views open as side-panel slide-overs keeping queue context | VERIFIED | lead-detail-panel.tsx Sheet side="right", queue stays rendered behind slide-over |
| CUX-02 | 02-02 | 5-second undo toast before committing approve/reject/snooze | VERIFIED | leads/page.tsx: toast duration:5000 + 300ms setTimeout; bulk-toolbar.tsx: WR-01 fix applied |
| CUX-03 | 02-01, 02-02 | J/K/A/R/S/? keyboard shortcuts with shortcut overlay | VERIFIED | leads/page.tsx keyboard handler with composite guard, ShortcutOverlay Dialog |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/console/app/(shell)/bd/replies/page.tsx` | 124 | `toast('Briefing view not yet implemented.')` on "View briefing" button | Warning | BD-07 requires "View briefing" — documented as Phase 3+ feature in SUMMARY; briefing text IS displayed inline (line-clamp-2) |
| `apps/console/app/(shell)/bd/replies/page.tsx` | 84 | Unsubscribe fires toast only, no API call | Warning | T-02-17 documented: production requires `POST /bd/leads/{id}/unsubscribe`; Phase 2 is UI-only per plan |
| All test files | Multiple | 11 `it.todo()` entries across 4 test files | Info | Integration tests not implemented; stub todos don't count as failures; plan documented as future work |

No blockers found in anti-pattern scan. The two warnings are intentional stubs documented in plan SUMMARY Known Stubs sections.

### Human Verification Required

#### 1. Blocking Checkpoint: Full Phase 2 BD Workflow End-to-End

**Test:** Start console with `NEXT_PUBLIC_API_MOCKING=enabled pnpm dev` in `apps/console/` and verify all 31 items from plan 02-04 Task 2 checklist:
- Sidebar shows BD nav with Leads/Outreach/Pipeline/Imports/Replies, Ops/Supply/Admin dimmed
- Lead queue shows fat cards; Approve animates card out with undo toast; Reject popover has 7 reasons; Snooze has 4 presets
- Card body click opens Sheet slide-over from right; Esc closes it and returns focus to card
- Checkboxes + bulk toolbar appears; J/K/A/R/S/? shortcuts work; shortcuts blocked when Sheet open
- CSV drag-and-drop shows processing→done without page refresh
- Outreach sequences expand to 3 step editors; Approve Sequence removes sequence
- Pipeline shows 7 labeled columns with count badges; drag reorders visually
- Replies page shows Interested/OOO/Unsubscribe tasks sorted by urgency

**Expected:** All 31 verification items pass

**Why human:** Plan 02-04 has an explicit `<task type="checkpoint:human-verify" gate="blocking">` that requires a human to type "approved" before the phase is complete. No approval signal was recorded. Visual appearance, drag interactions, Sheet focus return, toast animation, and keyboard UX behavior cannot be verified programmatically.

#### 2. Decision: Suggested Angle / Open Roles on Fat Card

**Test:** Review whether the absence of `suggested_angle` and `open_roles` fields on `LeadQueueItem` is acceptable for phase completion.

**Expected:** Either (a) confirm the schema constraint is an acceptable deviation from ROADMAP SC1 (document as override), OR (b) require backend to add these fields to `LeadQueueItem` before phase is marked complete.

**Why human:** This is a product decision — whether the schema gap deviates from the intended phase goal. The backend schema simply doesn't expose these fields in the list endpoint. The detail panel (LeadFatCardResponse) does show `open_roles_summary` from `contact.open_roles_summary`. A human must decide if the fat card without these fields meets the requirement intent.

### Gaps Summary

**1 structural gap, 1 process gap:**

**Structural gap (BLOCKER):** ROADMAP Success Criterion 1 explicitly requires "open roles, decision-maker, suggested angle visible without opening any detail page" on the fat card. The `LeadQueueItem` API schema does not include `open_roles` or `suggested_angle` fields — they are absent from the backend's list endpoint response. The plan's own generated code acknowledges this at line 753 with "LeadQueueItem has no suggested_angle field — omit for now." `contact_title` (e.g. "VP Engineering") serves as a decision-maker signal, and `contact_name` is present. But open_roles and suggested_angle are genuinely missing from the list card. This requires either a backend schema update or an explicit override accepting the deviation.

**Process gap (human_needed):** Plan 02-04 (`autonomous: false`) contains a `checkpoint:human-verify` Task 2 with `gate="blocking"` that requires a human to confirm all 31 end-to-end workflow items before the phase can be marked complete. The SUMMARY documents the technical implementation but contains no approval signal for the checkpoint. The phase cannot be marked PASSED until a human runs the full workflow verification and types "approved".

---

_Verified: 2026-06-14T11:55:00Z_
_Verifier: Claude (gsd-verifier)_
