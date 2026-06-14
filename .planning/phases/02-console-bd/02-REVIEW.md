---
phase: 02-console-bd
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - apps/console/app/(shell)/_components/sidebar-nav.tsx
  - apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx
  - apps/console/app/(shell)/bd/imports/page.tsx
  - apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx
  - apps/console/app/(shell)/bd/leads/_components/lead-card.tsx
  - apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx
  - apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx
  - apps/console/app/(shell)/bd/leads/_components/shortcut-overlay.tsx
  - apps/console/app/(shell)/bd/leads/_components/snooze-popover.tsx
  - apps/console/app/(shell)/bd/leads/page.tsx
  - apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx
  - apps/console/app/(shell)/bd/outreach/page.tsx
  - apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx
  - apps/console/app/(shell)/bd/pipeline/page.tsx
  - apps/console/app/(shell)/bd/replies/page.tsx
  - apps/console/app/(shell)/layout.tsx
  - apps/console/app/layout.tsx
  - packages/hooks/src/use-async-job.ts
  - packages/mocks/src/handlers/bd.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

The BD console implementation covers the full workflow (lead queue, bulk actions, outreach review, import, pipeline, replies) and the overall structure is sound. The keyboard-shortcut UX, optimistic update pattern with undo timers, and cursor-pagination wiring are well-executed. Three blockers were found: a URL construction bug in the shared `useAsyncJob` hook that silently breaks all import status polling; an MSW handler registration ordering issue that shadows the snoozed-wake-count endpoint; and `KanbanBoard` deriving local state from props once on mount and then ignoring prop updates, which means the 15-second polling in `PipelinePage` never refreshes the board. Five warnings cover a deceptive undo toast in `BulkToolbar`, a focusedIndex-goes-negative edge case, double-callback on mutation error, and three instances of verbatim-duplicated constants.

---

## Critical Issues

### CR-01: `useAsyncJob` constructs a relative URL, breaking import status polling in all environments

**File:** `packages/hooks/src/use-async-job.ts:87-99`

**Issue:** The hook builds the poll URL by replacing `{id}` in the endpoint string but never prepends the API base URL:

```ts
const url = endpoint.includes('{id}')
  ? endpoint.replace('{id}', jobId ?? '')   // → '/api/v1/bd/imports/abc/status'
  : jobId
    ? `${endpoint}/${jobId}`
    : endpoint

const res = await fetch(url)   // fetch('/api/v1/bd/imports/abc/status')
```

`import-dropzone.tsx` passes `'/api/v1/bd/imports/{id}/status'`. In a browser, `fetch('/api/v1/...')` resolves against the **current origin** (e.g. `http://localhost:3001`). The MSW handler for this endpoint is registered against `http://localhost:8000/api/v1/bd/imports/:import_id/status`. The origins differ, so MSW never intercepts the request; Next.js returns a 404. Every other `fetch()` call in the codebase correctly prepends `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}` — this hook is the single exception and the inconsistency is invisible at authoring time.

In production (no MSW, no Next.js rewrites configured) the same relative URL hits the Next.js server and returns 404, so the polling spinner never resolves to `complete`.

**Fix:** Add an `apiBase` option or resolve the URL inside the hook using the same convention as every other file:

```ts
// packages/hooks/src/use-async-job.ts
export type UseAsyncJobOptions<TData, TRawStatus extends string = string> = {
  jobId: string | null | undefined
  endpoint: string
  apiBase?: string          // add this
  enabled?: boolean
  statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>
  refetchInterval?: number
}

// inside useAsyncJob:
const base = options.apiBase
  ?? (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
  ?? 'http://localhost:8000'

const url = endpoint.includes('{id}')
  ? `${base}${endpoint.replace('{id}', jobId ?? '')}`
  : jobId
    ? `${base}${endpoint}/${jobId}`
    : `${base}${endpoint}`
```

---

### CR-02: MSW handler `/leads/:lead_id` shadows `/leads/snoozed-wake-count` due to registration order

**File:** `packages/mocks/src/handlers/bd.ts:53,220`

**Issue:** MSW v2 evaluates handlers top-to-bottom and uses first-match-wins. Handler 2 (line 53) is a wildcard `GET /api/v1/bd/leads/:lead_id`. Handler 12 (line 220) is the specific `GET /api/v1/bd/leads/snoozed-wake-count`. Because `:lead_id` matches any single path segment including the literal string `snoozed-wake-count`, all requests for the wake-count endpoint are intercepted by the lead-detail handler, which returns a full `LeadFatCardResponse` JSON. The calling code (`sidebar-nav.tsx`) reads `.count` on that response, gets `undefined`, and the wake badge never appears — silently broken in dev.

**Fix:** Move the specific route before the wildcard route:

```ts
// packages/mocks/src/handlers/bd.ts

// Place snoozed-wake-count BEFORE the :lead_id wildcard handler
http.get(`${API_BASE}/api/v1/bd/leads/snoozed-wake-count`, () => {
  return HttpResponse.json({ count: 2 })
}),

// Then the wildcard
http.get(`${API_BASE}/api/v1/bd/leads/:lead_id`, ({ params }) => { ... }),
```

---

### CR-03: `KanbanBoard` ignores prop updates after initial mount — polling data is discarded

**File:** `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx:116-119`

**Issue:** The component initialises local state once from `initialColumns`:

```ts
const [columns, setColumns] = useState<Record<string, KanbanLeadItem[]>>(
  Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])),
)
```

`PipelinePage` re-fetches every 15 seconds (`refetchInterval: 15_000`) and passes fresh `columns` props. Because `useState` only uses its initialiser argument on the first render, all subsequent prop updates are ignored. New leads added to a column on the server never appear in the board; server-updated counts in `column.count` (read from `initialColumns`) may differ from the stale lead arrays rendered from state. This defeats the stated purpose of the polling.

**Fix:** Sync the state when the incoming prop reference changes. The simplest safe approach is a `useEffect`:

```ts
// Track whether a drag is in progress; only accept external updates when idle
const [isDragging, setIsDragging] = useState(false)

useEffect(() => {
  if (!isDragging) {
    setColumns(Object.fromEntries(initialColumns.map((col) => [col.status, col.leads])))
  }
}, [initialColumns, isDragging])
```

Set `isDragging` to `true` in `onDragStart` and back to `false` in `onDragEnd`/`onDragCancel` to avoid clobbering a user's in-flight drag with a background refetch.

---

## Warnings

### WR-01: `BulkToolbar` shows "Undo" toast but fires the mutation immediately — undo is not functional

**File:** `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx:75-85`

**Issue:** The single-lead action in `leads/page.tsx` correctly delays the API call by 300 ms via a timer so the user can undo. `BulkToolbar` fires `bulkMutation.mutate(payload)` on line 75 **before** showing the toast on line 76. The toast's "Undo" button only calls `queryClient.resetQueries` which triggers a server refetch — it cannot cancel or reverse a mutation that has already been dispatched. Presenting an "Undo" affordance that does not undo the action is misleading and erodes trust.

**Fix:** Apply the same delayed-fire pattern as single-lead actions:

```ts
function handleBulkAction(action: 'approve' | 'reject' | 'snooze') {
  // ... validation ...
  onBulkStart(selectedIds)
  const payload: BulkActionRequest = { /* ... */ }

  const toastId = toast(`Bulk action: ${action} ${selectedIds.length} leads`, {
    action: {
      label: 'Undo',
      onClick: () => {
        clearTimeout(timer)
        onBulkSettled()
        toast.dismiss(toastId)
      },
    },
    duration: 5000,
  })

  const timer = setTimeout(() => {
    bulkMutation.mutate(payload)
  }, 300)
}
```

---

### WR-02: `focusedIndex` can become `-1` when the lead list is empty, breaking keyboard navigation

**File:** `apps/console/app/(shell)/bd/leads/page.tsx:184-188`

**Issue:** The `j` key handler clamps the new index with `Math.min(i + 1, visibleLeads.length - 1)`. When `visibleLeads` is empty (`length === 0`), `length - 1 = -1`, so pressing `j` with `focusedIndex = 0` sets it to `Math.min(1, -1) = -1`. Subsequent `a` (approve) / `r` (reject) / `s` (snooze) / `Enter` keypresses call `visibleLeads[-1]` which returns `undefined` and is guarded by `if (lead)` — no crash, but no visual feedback that focus is invalid and every keyboard action silently fails.

**Fix:** Guard the empty-list case:

```ts
case 'j': {
  e.preventDefault()
  if (visibleLeads.length > 0)
    setFocusedIndex((i) => Math.min(i + 1, visibleLeads.length - 1))
  break
}
case 'k': {
  e.preventDefault()
  if (visibleLeads.length > 0)
    setFocusedIndex((i) => Math.max(i - 1, 0))
  break
}
```

Also clamp `focusedIndex` when `visibleLeads` shrinks after an action so the focused card doesn't silently disappear:

```ts
useEffect(() => {
  if (visibleLeads.length > 0)
    setFocusedIndex((i) => Math.min(i, visibleLeads.length - 1))
}, [visibleLeads.length])
```

---

### WR-03: `BulkToolbar.onBulkSettled` is called twice on mutation error

**File:** `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx:50-58`

**Issue:** TanStack Query calls `onError` then `onSettled` sequentially when a mutation fails. Both callbacks call `onBulkSettled()`:

```ts
onSettled: async () => {
  await queryClient.resetQueries({ queryKey: ['leads'] })
  onBulkSettled()          // ← called second time
},
onError: () => {
  toast.error('Bulk action failed. Please try again.')
  onBulkSettled()          // ← called first time
},
```

`onBulkSettled` clears `processingIds` and `selectedIds` — calling it twice causes two redundant state updates and two calls to `resetQueries` (from `onSettled`), which may produce a visible double-reload flicker in the lead queue.

**Fix:** Remove `onBulkSettled()` from `onError` and rely solely on `onSettled`, or remove it from `onSettled` and handle the error state separately:

```ts
onSettled: async () => {
  await queryClient.resetQueries({ queryKey: ['leads'] })
  onBulkSettled()
},
onError: () => {
  toast.error('Bulk action failed. Please try again.')
  // onBulkSettled is called by onSettled — do not call twice
},
```

---

### WR-04: `REASON_LABELS` constant is copy-pasted verbatim across three files

**Files:**
- `apps/console/app/(shell)/bd/leads/page.tsx:17-26`
- `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx:9-17`
- `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx:19-28`

**Issue:** The same `REASON_LABELS` map is duplicated in three places. A future change to a label copy (e.g. `'Not a fit'` → `'Not ICP fit'`) requires three synchronised edits; one missed copy will produce inconsistent UI strings across the reject popover, bulk toolbar, and action toasts.

**Fix:** Extract to a shared module (e.g. `apps/console/app/(shell)/bd/leads/_lib/rejection-reasons.ts`) and import from all three sites:

```ts
// _lib/rejection-reasons.ts
export const REASON_LABELS: Record<string, string> = {
  NOT_ICP_FIT: 'Not a fit',
  WRONG_SENIORITY: 'Wrong seniority',
  NO_OPEN_ROLES: 'No open roles',
  COMPETITOR: 'Competitor',
  BAD_TIMING: 'Bad timing',
  ALREADY_A_CLIENT: 'Already a client',
  OTHER: 'Other',
}

export const REJECTION_REASONS = Object.keys(REASON_LABELS) as Array<keyof typeof REASON_LABELS>
```

---

### WR-05: `icpBadgeClass` helper is copy-pasted across three components

**Files:**
- `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx:15-20`
- `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx:16-21`
- `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx:49-54`

**Issue:** The same ICP score → Tailwind class mapping function appears three times with minor formatting variations. A threshold change (e.g. raising "high" from 80 to 85) requires three edits.

**Fix:** Move to a shared utility (e.g. `packages/ui/src/lib/icp-badge.ts` or a BD-specific shared module) and import in all three components.

---

## Info

### IN-01: `handleStepChange` in `SequenceEditor` is a no-op — dead code

**File:** `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx:151-156`

**Issue:** The callback passed to `StepEditor.onStepChange` immediately voids all three arguments and does nothing:

```ts
function handleStepChange(stepIndex: number, subject: string, body: string) {
  void stepIndex
  void subject
  void body
}
```

The comment says "Step state is managed locally in StepEditor — this callback is for parent awareness." But it provides no awareness. The `onStepChange` prop on `StepEditor` is therefore vestigial.

**Fix:** Either remove the `onStepChange` prop from `StepEditor` entirely, or implement actual parent-state tracking if cross-step validation (e.g. "all steps saved before approving") is planned.

---

### IN-02: `OutreachPage` passes `leadName={undefined}` to every `SequenceEditor`

**File:** `apps/console/app/(shell)/bd/outreach/page.tsx:71`

**Issue:** The outreach list response from MSW includes `lead_id` per sequence, but `OutreachPage` never resolves that ID to a company name, always passing `leadName={undefined}`. Every sequence header falls back to `Sequence ${sequence.sequence_id.slice(0, 8)}` — a UUID fragment that is meaningless to a reviewer scanning the list.

**Fix:** When fetching the sequence list, also query the leads by ID (or have the backend embed `company_name` in the sequence response — a reasonable contract proposal). At minimum the `leadName` lookup should be wired even if it requires a secondary query.

---

### IN-03: `RejectPopover` fetches rejection reasons even when the popover has never been opened

**File:** `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx:28-36`

**Issue:** The `useQuery` call has no `enabled` guard. `RejectPopover` is mounted for every `LeadCard`, so the rejection-reasons endpoint is fetched as soon as any card renders — regardless of whether the user ever opens the popover. With `staleTime: Infinity` this is only one network request total (TanStack Query deduplicates), so the impact is minor, but it is semantically incorrect — a closed popover should not trigger network activity.

**Fix:** Add `enabled: open` so the fetch only fires when the popover is open for the first time:

```ts
const { data } = useQuery({
  queryKey: ['rejection-reasons'],
  queryFn: async () => { /* ... */ },
  enabled: open,
  staleTime: Infinity,
})
```

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
