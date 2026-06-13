# Phase 2: Console BD - Research

**Researched:** 2026-06-13
**Domain:** Console BD rep workflow — cursor-paginated lead queue, optimistic CRUD, keyboard shortcuts, Radix Sheet slide-over, @dnd-kit kanban, MSW v2 handlers, CSV multipart upload
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Fat Card Layout (BD-01)**
- D-01: Card shows only: ICP score badge, company name + canonical domain, contact name/title, suggested angle (1–2 lines), open roles count if available, small status/task badges only when they affect the action. All other fields go in the slide-over detail panel.

**Detail Panel / Side-panel Slide-over (CUX-01)**
- D-02: Detail opens as a slide-over overlay from the right — panel slides over the queue, queue stays in background (dimmed slightly). Closing returns focus and cursor position to the queue. Canonical CUX-01 pattern for all future phases.
- D-03: Clicking anywhere on card body opens the detail panel. Approve/reject/snooze action buttons appear both on the card and inside the panel.

**Reject + Snooze Inline Interaction (BD-02)**
- D-04: Clicking Reject opens a floating Radix Popover listing the 7 rejection reasons. Rep picks one, card animates out. No modal, no extra confirm step.
- D-05: Snooze presets: 1 week / 1 month / end of quarter / custom date. Same popover pattern.
- D-06: Undo pattern (CUX-02): card leaves the queue immediately on action (optimistic). Sonner toast shows "Approved — Undo" for 5 seconds. If undone, card reappears at original position. TanStack Query optimistic update + rollback.

**BD Navigation Structure**
- D-07: BD surfaces are separate sidebar nav routes: /bd/leads, /bd/outreach, /bd/pipeline, /bd/imports, /bd/replies. Badge counts in sidebar where relevant.
- D-08: Phase 2 builds the full (shell)/layout.tsx sidebar: BD section fully wired + dimmed/locked stubs for Ops, Supply, Admin.

**Pending-overlay + Bulk Action UX (BD-03)**
- D-09: Bulk action processing: selected cards get 50% opacity + small spinner badge overlay. On API settle: cards animate out (success) or revert with error badge (failure).
- D-10: After bulk action settles, reset cursor to page 1 and refetch the queue from the top.

**Keyboard Shortcuts (CUX-03)**
- D-11: Shortcuts scope to the queue when a lead card is "focused". J/K navigate, A approves, R opens reject popover, S opens snooze popover. `?` shows shortcut overlay. Shortcuts disabled when a text input or the detail slide-over is focused.

**Async Polling (BD-04 — CSV Import)**
- D-12: CSV import uses `useAsyncJob` from `@brynzit/hooks`. Status states: queued → processing (with count) → done / failed.

### Claude's Discretion

None — all decisions were pre-answered in the discussion session.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BD-01 | Cursor-paginated lead queue of fat cards with company, ICP score, open roles, decision-maker, suggested angle | `useInfiniteQuery` with `cursor` param; `LeadQueueResponse` type verified from api.d.ts |
| BD-02 | Approve, reject (7 reasons), snooze (presets + custom) inline; full loop under 30 seconds | Radix Popover + TanStack Query mutation + optimistic update pattern verified |
| BD-03 | Bulk-select leads and bulk approve/reject/snooze with pending-overlay and no cursor corruption | `BulkActionRequest/Response` type verified; `queryClient.resetPages()` + `invalidateQueries` pattern |
| BD-04 | Upload CSV and watch async import progress without manual refresh | `useAsyncJob` already in packages/hooks; `ImportStatusResponse` type verified; `multipart/form-data` endpoint confirmed |
| BD-05 | Review 3-email outreach sequence, edit steps, approve or reject before delivery | `OutreachSequenceResponse` type + `PatchOutreachRequest` verified; `PATCH /outreach/{id}` + `POST /outreach/{id}/approve` |
| BD-06 | Pipeline as kanban of status columns with live counts | `KanbanColumn` + `KanbanLeadItem` types verified; `GET /bd/pipeline` endpoint; `@dnd-kit/core@6.3.1` stable API |
| BD-07 | Triage replies: interested (AI briefing), OOO/not-now (snooze), unsubscribe (quick-action) | OPEN QUESTION: no dedicated `/bd/tasks` or `/bd/replies` endpoint exists — `BDTaskSummary` is embedded in `LeadFatCardResponse.tasks[]`; see Open Questions |
| BD-08 | Snoozed leads resurface with nav badge on wake date | OPEN QUESTION: no wake-date notification endpoint — must be derived from filtered lead queue or simulated from BDTask due_at; see Open Questions |
| CUX-01 | Detail views open as side-panel slide-overs | Radix Sheet side="right"; `onCloseAutoFocus` for focus return; pattern verified |
| CUX-02 | 5-second undo toast before committing approve/reject/snooze | Sonner already installed; 300ms API delay pattern; compensating call pattern |
| CUX-03 | Keyboard J/K/A/R/S/? shortcuts in review queues | `keydown` listener with `document.activeElement` guard + `data-queue-focused` attribute scope |
</phase_requirements>

---

## Summary

Phase 2 builds the complete BD rep workflow in `apps/console`. The foundation from Phase 1 gives us: typed `apiClient`, `useAsyncJob`, shadcn/ui with 9 components, MSW handler infrastructure, and a skeleton `/bd/leads` page ready to be replaced. The key technical challenges in Phase 2 are: (1) cursor pagination with `useInfiniteQuery` that invalidates cleanly after bulk actions, (2) optimistic update + 5-second undo window before the API call commits, (3) Radix Sheet focus management that coexists with queue keyboard shortcuts, and (4) the `@dnd-kit/core` v6 kanban which needs no persistence — just visual drag feedback showing pipeline status.

A critical API gap was discovered during research: there is no dedicated `/api/v1/bd/tasks` or `/api/v1/bd/replies` endpoint. Reply tasks are embedded as `BDTaskSummary[]` inside `LeadFatCardResponse.tasks`. This means the `/bd/replies` page cannot simply list "all reply tasks" — it must either (a) query the lead queue with a filter and parse tasks from each lead, or (b) be implemented as an MSW-mocked stub using the existing pattern since no backend endpoint exists. The planner must address this.

Similarly, BD-08 (snoozed lead wake badge) has no dedicated backend endpoint — snoozed leads remain `status=review_queue` and BDTask records track the `due_at`. The nav badge must be derived by querying the lead list with a filter or the `BDTaskSummary.due_at` logic.

**Primary recommendation:** Implement Phase 2 as 6 vertical slices in dependency order: (1) Sidebar shell layout, (2) Lead queue with fat cards and slide-over, (3) Approve/reject/snooze with optimistic updates and undo, (4) Bulk actions, (5) CSV import + outreach review, (6) Pipeline kanban + reply triage + nav badges. Each slice delivers a complete user-observable feature.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lead queue display | Browser/Client | — | Cursor pagination state, keyboard navigation state, and selected-card tracking are all client-side rendering concerns |
| Approve/reject/snooze mutation | Browser/Client → API | — | Mutation fires from client; no SSR involvement; API is the authoritative state owner |
| Optimistic update + undo | Browser/Client | — | Queue removal animation and undo timer are pure UI state; API call is delayed |
| Slide-over detail panel | Browser/Client | — | Sheet open/close state + focus lifecycle is client-side; data fetched on demand |
| Keyboard shortcuts | Browser/Client | — | `keydown` on `document`; scope via DOM attribute; no server involvement |
| Sidebar layout | Frontend Server (RSC) + Client sub-component | — | `(shell)/layout.tsx` is a Server Component for streaming; interactive sidebar behaviors (active state, nav count badges) go in a `'use client'` child component |
| CSV import upload | Browser/Client → API | — | `multipart/form-data` POST from client via `react-dropzone`; backend returns 202 + `import_id`; `useAsyncJob` polls status endpoint |
| Outreach sequence editing | Browser/Client → API | — | PATCH steps; approve/reject are direct mutations; data loaded on `/bd/outreach` page |
| Pipeline kanban | Browser/Client | — | `useQuery` polls `GET /bd/pipeline` every 10-30s; DndContext provides drag UI only — no reorder mutation |
| Reply triage | Browser/Client | MSW mock | No dedicated backend endpoint (see Open Questions); data sourced from `BDTaskSummary` embedded in lead detail or MSW stub |
| Nav badge counts | Browser/Client | — | Derived from query data (queue total, task counts); no dedicated count endpoint |

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.2.9 [VERIFIED: pnpm-workspace.yaml] | App Router, RSC layout, page routing | Locked in CLAUDE.md |
| React | ^19.2.0 [VERIFIED: pnpm-workspace.yaml] | UI runtime | Ships with Next 16 |
| @tanstack/react-query | ^5.101.0 [VERIFIED: npm registry] | Server state, infinite queries, mutations, optimistic updates | Stack standard; v5 stable |
| openapi-fetch + generated types | ^0.17.0 [VERIFIED: pnpm-workspace.yaml] | Typed HTTP calls to backend | Already in packages/api-client |
| useAsyncJob | packages/hooks [VERIFIED: file exists] | 202-style polling | Already built in Phase 1 |
| shadcn/ui (new-york) | CLI (packages/ui) [VERIFIED: components.json] | Component library | Already initialized |
| tailwind v4 + tw-animate-css | ^4.0.0 [VERIFIED: pnpm-workspace.yaml] | Styling + animation utilities | Stack standard |
| Sonner | ^2.0.7 [VERIFIED: packages/ui/src/components/ui/sonner.tsx] | Toast notifications | Already installed |

### New libraries to add this phase
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | ^6.3.1 [VERIFIED: npm view] | DnD context, sensors, collision detection | Pipeline kanban visual drag |
| @dnd-kit/sortable | ^10.0.0 [VERIFIED: npm view] | `useSortable` hook wrapping dnd-kit/core v6 API | Same kanban; peers with @dnd-kit/core ^6.3.0 |
| @dnd-kit/utilities | ^3.2.2 [VERIFIED: npm view indirect] | `CSS.Transform.toString()` for drag transform styles | Required by useSortable pattern |
| react-dropzone | ^15.0.0 [VERIFIED: npm registry: 15.0.0 latest] | Headless file drag-and-drop zone for CSV upload | /bd/imports page only |

**Critical note on @dnd-kit versioning [VERIFIED: npm registry]:** `@dnd-kit/sortable` jumped from v7.0.2 (Jan 2023) to v10.0.0 (Dec 2024) skipping v8/v9. The v10.0.0 still peers with `@dnd-kit/core@^6.3.0` (the stable API) and is NOT the `@dnd-kit/react` rewrite. CLAUDE.md says "use @dnd-kit/core@^6 + @dnd-kit/sortable@^7" — the intent is the stable v6 core API; v10.0.0 of sortable fulfills that intent. Do NOT install `@dnd-kit/react` (the 0.5.x pre-release rewrite).

### New shadcn components to add via CLI
```bash
npx shadcn@latest add popover sheet checkbox dropdown-menu dialog table select command --cwd=packages/ui
```

All from official shadcn registry [VERIFIED: ui-spec.md registry safety section].

### Version verification
```bash
npm view @dnd-kit/core version      # 6.3.1 as of 2026-06-13
npm view @dnd-kit/sortable version  # 10.0.0 as of 2026-06-13 (peers @dnd-kit/core ^6.3.0)
npm view react-dropzone version     # 15.0.0 as of 2026-06-13
npm view @tanstack/react-query version  # 5.101.0 as of 2026-06-13
```

### Installation
```bash
pnpm --filter @brynzit/console add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-dropzone
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (BD Rep)
│
├── keydown events ──────────────────────────────────────────────────────┐
│                                                                         │
▼                                                                         ▼
(shell)/layout.tsx (RSC)                                      useKeyboardNav hook
├── SidebarNav ('use client') ─── useQuery(['leads-count'])              │
│   ├── /bd/leads (badge: total)                                          │
│   ├── /bd/outreach                                                      │
│   ├── /bd/pipeline                                                      │
│   ├── /bd/imports                                                       │
│   └── /bd/replies (badge: pending tasks)                               │
│                                                                         │
└── <main>{children}</main>                                              │
                                                                         │
/bd/leads page ('use client')  ◄──────────────────────────────────────────┘
├── useInfiniteQuery(['leads', filters])
│   └── GET /api/v1/bd/leads?status=review_queue&cursor={cursor}&limit=50
│
├── LeadCard[] (mapped from pages[].leads)
│   ├── <Checkbox> bulk select
│   ├── ICP score Badge
│   ├── company name, domain, contact, angle
│   ├── Approve button ──► useMutation(approveLead) ──► optimistic remove ──► Sonner toast (5s undo)
│   ├── Reject button ──► <Popover> 7 reasons ──► useMutation(rejectLead) ──► same
│   └── Snooze button ──► <Popover> 4 presets ──► useMutation(snoozeLead) ──► same
│
├── LeadCard onClick (body) ──► open <Sheet side="right">
│   └── useQuery(['lead-detail', leadId]) ──► GET /api/v1/bd/leads/{id}
│       └── <LeadDetailPanel> (same action buttons)
│
├── Bulk toolbar (visible when ≥1 selected)
│   └── POST /api/v1/bd/leads/bulk-action ──► pending-overlay ──► resetPages + invalidate
│
└── Intersection observer / "Load more" ──► fetchNextPage()

/bd/imports page
├── react-dropzone ──► FormData POST /api/v1/bd/imports
│   └── 202 response → import_id
└── useAsyncJob(import_id, '/api/v1/bd/imports/{id}/status')
    └── ImportStatusCard (queued → processing N → done / failed)

/bd/outreach page
├── useQuery(['outreach-sequences']) ──► GET /api/v1/bd/outreach (MSW list — no live endpoint)
└── SequenceCard ──► expand ──► GET /api/v1/bd/outreach/{sequence_id}
    ├── StepEditor × 3 ──► PATCH /api/v1/bd/outreach/{sequence_id}
    ├── Approve ──► POST /api/v1/bd/outreach/{sequence_id}/approve
    └── Reject ──► POST /api/v1/bd/outreach/{sequence_id}/reject

/bd/pipeline page
├── useQuery(['pipeline'], { refetchInterval: 15000 }) ──► GET /api/v1/bd/pipeline
└── <DndContext> (visual only, no reorder mutation)
    └── 7 KanbanColumn[] ──► KanbanLeadItem stubs (compact cards)

/bd/replies page (MSW-mocked — no backend list endpoint)
└── useQuery(['bd-tasks']) ──► MSW handler returning BDTaskSummary[]
    └── ReplyCard[] with classification quick-actions
```

### Recommended Project Structure

```
apps/console/app/(shell)/
├── layout.tsx               # RSC — imports SidebarNav client sub-component
├── _components/
│   ├── sidebar-nav.tsx      # 'use client' — active route, badge counts
│   └── [existing files]
├── bd/
│   ├── leads/
│   │   ├── page.tsx         # 'use client' — replaces walking skeleton
│   │   └── _components/
│   │       ├── lead-card.tsx
│   │       ├── lead-detail-panel.tsx  # Sheet
│   │       ├── reject-popover.tsx
│   │       ├── snooze-popover.tsx
│   │       ├── bulk-toolbar.tsx
│   │       └── shortcut-overlay.tsx  # Dialog
│   ├── outreach/
│   │   ├── page.tsx         # 'use client'
│   │   └── _components/sequence-editor.tsx
│   ├── pipeline/
│   │   ├── page.tsx         # 'use client'
│   │   └── _components/kanban-board.tsx
│   ├── imports/
│   │   ├── page.tsx         # 'use client'
│   │   └── _components/import-dropzone.tsx
│   └── replies/
│       └── page.tsx         # 'use client'
```

### Pattern 1: Cursor Pagination with useInfiniteQuery

The `GET /api/v1/bd/leads` endpoint returns `LeadQueueResponse: { leads[], next_cursor: string | null, total: number }`. The cursor is a UUID of the last-seen lead (not an offset integer).

```typescript
// Source: Context7 /tanstack/query — infinite-queries.md
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['leads', filters],
  queryFn: async ({ pageParam }) => {
    const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
      params: {
        query: {
          status: 'review_queue',
          cursor: pageParam ?? undefined,
          limit: 50,
        },
      },
    })
    if (error) throw error
    return data
  },
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
})

// Flatten pages for rendering:
const leads = data?.pages.flatMap((page) => page.leads) ?? []
```

**After bulk action settles (D-10):** Reset cursor to page 1 — do NOT use `invalidateQueries` on infinite query after bulk actions because page 1 is correct but pages 2+ may be stale with wrong leads. Use `queryClient.resetQueries` or `setQueryData` to clear all pages and re-fetch from page 1:

```typescript
// After bulk action settles:
await queryClient.resetQueries({ queryKey: ['leads'] })
// resetQueries clears cached pages and refetches from page 1 (initialPageParam = null)
```

[VERIFIED: Context7 /tanstack/query — query-invalidation.md and infinite-queries.md]

### Pattern 2: Optimistic Remove + 5-Second Undo

The undo window is implemented via a 300ms API delay: the card exits immediately, the API call fires after 300ms. If Undo is clicked before the API fires, cancel the timeout and replay entrance animation. If clicked after, fire a compensating API call.

```typescript
// Source: Context7 /tanstack/query — optimistic-updates.md
const queryClient = useQueryClient()

const approveMutation = useMutation({
  mutationFn: (leadId: string) =>
    apiClient.POST('/api/v1/bd/leads/bulk-action', {
      body: { action: 'approve', lead_ids: [leadId] },
    }),
  onMutate: async (leadId) => {
    // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
    await queryClient.cancelQueries({ queryKey: ['leads'] })

    // 2. Snapshot previous state for rollback
    const previousData = queryClient.getQueryData(['leads'])

    // 3. Optimistically remove lead from all pages
    queryClient.setQueryData(['leads'], (old: InfiniteData<LeadQueueResponse>) => ({
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        leads: page.leads.filter((l) => l.id !== leadId),
      })),
    }))

    return { previousData }
  },
  onError: (_err, _leadId, context) => {
    // Rollback
    queryClient.setQueryData(['leads'], context?.previousData)
    toast.error('Action failed — lead restored.')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  },
})

// Usage with 300ms undo window:
function handleApprove(lead: LeadQueueItem) {
  // Card exits immediately (via state)
  setLeavingLeads((prev) => [...prev, lead.id])

  // Show Sonner toast with Undo
  const toastId = toast('Approved', {
    description: `${lead.company_name} moved out of queue.`,
    action: {
      label: 'Undo',
      onClick: () => {
        clearTimeout(timeoutRef.current)
        setLeavingLeads((prev) => prev.filter((id) => id !== lead.id))
        toast.dismiss(toastId)
      },
    },
    duration: 5000,
  })

  // Fire API after 300ms (allows undo before network)
  timeoutRef.current = setTimeout(() => {
    approveMutation.mutate(lead.id)
  }, 300)
}
```

[VERIFIED: Context7 /tanstack/query — optimistic-updates.md, mutations.md]

### Pattern 3: Radix Sheet (Slide-over) Focus Management

The Radix Sheet (which shadcn `sheet.tsx` wraps) uses `FocusScope` with `trapFocus`. `onOpenAutoFocus` fires when the sheet opens; `onCloseAutoFocus` fires when it closes.

Default behavior: on close, focus returns to the element that triggered the open (the lead card button/element). This is exactly what CUX-01 requires.

```typescript
// Source: Context7 /radix-ui/primitives — dialog.tsx (Sheet uses same FocusScope)
import { Sheet, SheetContent } from '@brynzit/ui'

// The card needs a ref to receive focus back on sheet close:
const cardRef = useRef<HTMLDivElement>(null)

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent
    side="right"
    // Default: focus returns to the trigger on close (FocusScope behavior)
    // Override only if needed:
    onCloseAutoFocus={(event) => {
      event.preventDefault()
      cardRef.current?.focus()
    }}
  >
    {/* panel content */}
  </SheetContent>
</Sheet>
```

**Queue visibility during sheet open:** The queue is NOT `aria-hidden` — per the decision, the queue stays visible but dimmed. The Sheet overlay provides visual dimming. Tab focus is trapped inside the sheet.

**Keyboard shortcut conflict resolution:** Shortcuts must check that neither a Sheet nor Dialog is open:
```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Disable shortcuts when sheet or dialog is open, or text input is focused
    const activeEl = document.activeElement
    const isInputFocused = activeEl instanceof HTMLInputElement ||
      activeEl instanceof HTMLTextAreaElement ||
      (activeEl as HTMLElement)?.isContentEditable
    const isOverlayOpen = document.querySelector('[data-state="open"][role="dialog"]')

    if (isInputFocused || isOverlayOpen) return

    switch (e.key) {
      case 'j': // navigate down
      case 'k': // navigate up
      case 'a': // approve
      case 'r': // reject
      case 's': // snooze
      case '?': // shortcut overlay
        e.preventDefault()
        // handle...
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [/* deps */])
```

[VERIFIED: Context7 /radix-ui/primitives — focus-scope.tsx, dialog.tsx]

### Pattern 4: @dnd-kit/core v6 Kanban (Visual Only)

The pipeline kanban requires NO reorder persistence — it shows read-only status columns populated from `GET /api/v1/bd/pipeline`. Drag is visual feedback only (e.g., to allow rearranging cards within a column for personal preference without API writes).

```typescript
// Source: Context7 /clauderic/dnd-kit — use-sortable docs; verified against @dnd-kit/core@6.3.1
// IMPORTANT: This uses @dnd-kit/core v6 + @dnd-kit/sortable v10 (stable API)
// NOT @dnd-kit/react (the 0.5.x pre-release rewrite)
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable card within a column:
function KanbanCard({ lead }: { lead: KanbanLeadItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="h-14 rounded-lg border border-border bg-card px-3 flex items-center gap-2"
    >
      <IcpBadge score={lead.icp_score} />
      <span className="text-sm font-semibold truncate">{lead.company_name}</span>
    </div>
  )
}

// Column with sortable context:
function KanbanColumn({ column }: { column: KanbanColumn }) {
  const leadIds = column.leads.map(l => l.id)
  return (
    <div className="min-w-[260px] flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{column.status}</span>
        <Badge variant="secondary">{column.count}</Badge>
      </div>
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        {column.leads.map(lead => <KanbanCard key={lead.id} lead={lead} />)}
      </SortableContext>
    </div>
  )
}

// Board — visual sort only, no persist:
function KanbanBoard() {
  const [columns, setColumns] = useState(pipelineData.columns)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    // Update local visual order only — no API call
    const { active, over } = event
    if (!over || active.id === over.id) return
    // find which column and reorder within it locally...
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => <KanbanColumn key={col.status} column={col} />)}
      </div>
    </DndContext>
  )
}
```

[VERIFIED: Context7 /clauderic/dnd-kit — migration.mdx shows the stable v6 API pattern]

### Pattern 5: CSV Upload with react-dropzone + multipart POST + useAsyncJob

The backend endpoint is `POST /api/v1/bd/imports` with `multipart/form-data` content-type. It returns `202` with `ImportResponse` containing `import_id`. `useAsyncJob` polls `GET /api/v1/bd/imports/{import_id}/status`.

```typescript
// Source: Context7 /websites/react-dropzone_js + /websites/mswjs_io
import { useDropzone } from 'react-dropzone'
import { useAsyncJob } from '@brynzit/hooks'

function ImportDropzone() {
  const [importId, setImportId] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/imports`, {
        method: 'POST',
        body: formData,
        // No Content-Type header — browser sets boundary automatically for FormData
      })
      const data = await res.json()
      setImportId(data.import_id)
    },
  })

  const { phase, data: statusData } = useAsyncJob<ImportStatusResponse>({
    jobId: importId,
    endpoint: '/api/v1/bd/imports/{id}/status',
  })

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? 'Drop CSV here' : 'Drag CSV or click to upload'}
      </div>
      {importId && <ImportStatusCard phase={phase} status={statusData} />}
    </div>
  )
}
```

**openapi-fetch cannot send `multipart/form-data` with FormData directly** [ASSUMED — openapi-fetch v0.17 uses native fetch which supports FormData, but the path type expects `file: string` per `Body_create_import_api_v1_bd_imports_post`. Use `fetch` directly with `FormData` for this endpoint rather than going through `apiClient`.]

[VERIFIED: Context7 /websites/mswjs_io — file-uploads.md confirms `request.formData()` pattern for MSW handler]

### Pattern 6: MSW v2 BD Handlers

All new BD handlers follow the established pattern from `packages/mocks/src/handlers/bd.ts`:

```typescript
// Source: verified packages/mocks/src/handlers/bd.ts + /websites/mswjs_io
import { http, HttpResponse } from 'msw'
import { API_BASE } from '../base-url'
import type { components } from '@brynzit/api-client'

type LeadQueueResponse = components['schemas']['LeadQueueResponse']

export const bdHandlers: HttpHandler[] = [
  // Existing:
  http.get(`${API_BASE}/api/v1/bd/rejection-reasons`, () =>
    HttpResponse.json({ reasons: ['NOT_ICP_FIT', 'WRONG_SENIORITY', 'NO_OPEN_ROLES', 'COMPETITOR', 'BAD_TIMING', 'ALREADY_A_CLIENT', 'OTHER'] })
  ),

  // New: Lead queue with cursor pagination
  http.get(`${API_BASE}/api/v1/bd/leads`, ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    // Return page 1 or page 2 based on cursor
    const response: LeadQueueResponse = {
      leads: MOCK_LEADS.slice(cursor ? 5 : 0, cursor ? 10 : 5),
      next_cursor: cursor ? null : 'mock-cursor-uuid',
      total: 10,
    }
    return HttpResponse.json(response)
  }),

  // New: Bulk action (partial-success response)
  http.post(`${API_BASE}/api/v1/bd/leads/bulk-action`, async ({ request }) => {
    const body = await request.json()
    const succeeded = body.lead_ids.length
    return HttpResponse.json({ succeeded, failed: 0, errors: [] })
  }),

  // New: CSV import (multipart)
  http.post(`${API_BASE}/api/v1/bd/imports`, async ({ request }) => {
    const data = await request.formData()
    const file = data.get('file')
    if (!file || !(file instanceof File)) {
      return new HttpResponse('Missing file', { status: 400 })
    }
    return HttpResponse.json(
      { import_id: 'mock-import-uuid', accepted: 100, skipped_duplicate: 0, skipped_invalid: 0, skipped_rows: [] },
      { status: 202 }
    )
  }),

  // New: Import status polling
  http.get(`${API_BASE}/api/v1/bd/imports/:import_id/status`, ({ params }) => {
    // Return 'complete' after a few polls (or vary by params for testing)
    return HttpResponse.json({
      import_id: params.import_id,
      status: 'complete',
      total: 100,
      enriching: 0,
      icp_scored: 0,
      review_queue: 97,
      suppressed: 3,
      failed: 0,
    })
  }),
]
```

[VERIFIED: Context7 /websites/mswjs_io — file-uploads.md + verified bd.ts handler pattern]

### Anti-Patterns to Avoid

- **Using `queryClient.invalidateQueries` on the infinite leads query after bulk actions:** This refetches ALL pages from page 1, which is correct, but it discards cursor context. Prefer `queryClient.resetQueries({ queryKey: ['leads'] })` for clean page-1 restart. [VERIFIED: D-10 in CONTEXT.md]
- **Putting the keyboard `keydown` listener inside a leaf component:** The listener must be attached at the queue container level (or `window`) and check `document.activeElement` to avoid firing inside text inputs or when an overlay is open.
- **Using `@dnd-kit/react` (the 0.5.x pre-release):** Its `useSortable` API uses `import {useSortable} from '@dnd-kit/react/sortable'` — entirely different from the stable `@dnd-kit/sortable`. Do NOT mix them. [VERIFIED: npm registry]
- **Using the `apiClient.POST` for multipart FormData:** `openapi-fetch` may not handle `FormData` bodies correctly via the type-safe wrapper for the `file: string` typed field. Use native `fetch` with `FormData` for `/api/v1/bd/imports`. [ASSUMED]
- **Making (shell)/layout.tsx a Client Component:** It must remain a Server Component. The interactive sidebar (active route detection via `usePathname`) goes in a `'use client'` child component like `<SidebarNav>`. [VERIFIED: CONTEXT.md code context]
- **Redefining `@theme` in apps/console/app/globals.css:** The theme is owned by `packages/ui/src/styles/globals.css`. Only CSS variable overrides are allowed in the console globals. [VERIFIED: console globals.css — no @theme declaration]
- **Using `aria-hidden="true"` on the queue behind a Sheet:** The spec explicitly states `aria-hidden="false"` for the queue while the sheet is open. Use the Sheet overlay for visual dimming only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in slide-over | Custom focus lock | Radix Sheet (shadcn `sheet.tsx`) | `FocusScope` in Radix handles edge cases: focus guards, nested traps, unmount cleanup with 0ms setTimeout |
| Toast with undo action | Custom toast system | Sonner (already in packages/ui) | Already configured with dark-mode styles; supports `action: { label, onClick }` out of the box |
| Drag and drop for kanban | Raw pointer events + drop zones | @dnd-kit/core v6 + @dnd-kit/sortable v10 | Handles touch, keyboard accessibility, collision detection, scroll containers |
| File drop zone UI | `<input type="file">` + manual drag events | react-dropzone | MIME type validation, multi-file guard, drag state management |
| Cursor pagination state | Manual page tracking | `useInfiniteQuery` | `getNextPageParam`, `fetchNextPage`, `hasNextPage`, `isFetchingNextPage` — all built in |
| Keyboard shortcut scope | `event.target` matching | `document.activeElement` check + Radix `data-state` attribute | Radix primitives set `data-state="open"` on dialog/sheet — use as shortcut disable gate |
| Rejection reason list | Hardcode enum values in client | Always fetch `GET /api/v1/bd/rejection-reasons` (cached, static) | Enum values are server-owned (verified: SCREAMING_SNAKE_CASE from live backend); MSW handler already exists |

**Key insight:** The most complex part of this phase — optimistic update with 5-second undo + rollback — is handled by TanStack Query's `onMutate`/`onError`/`onSettled` lifecycle. Do not build a custom state machine for it.

---

## Common Pitfalls

### Pitfall 1: Cursor Corruption After Bulk Actions
**What goes wrong:** Rep bulk-approves 20 leads from pages 1 and 2. If only page 1 is refetched, the cursor for page 2 may now point to a lead that was removed, causing the API to return an incorrect page or skip leads.
**Why it happens:** TanStack Query's `invalidateQueries` for infinite queries attempts to refetch all loaded pages in sequence, but the cursor for page 2 may now be stale.
**How to avoid:** After any bulk action settles, call `queryClient.resetQueries({ queryKey: ['leads'] })` — this clears all pages and restarts from `initialPageParam: null` (page 1). [VERIFIED: CONTEXT.md D-10]
**Warning signs:** After bulk approval, the next loaded page contains leads that were already approved.

### Pitfall 2: Keyboard Shortcuts Firing Inside Popovers
**What goes wrong:** Rep opens the Reject popover. Pressing 'J' to navigate the reason list closes the popover and navigates the queue instead.
**Why it happens:** Radix Popover is non-modal by default (no focus trap). The `keydown` listener at the window level still fires.
**How to avoid:** The shortcut guard checks `document.querySelector('[data-state="open"][role="dialog"]')` — but Popovers use `role="dialog"` only when `modal=true`. For non-modal popovers, check for `[data-state="open"]` elements that are descendants of a Radix portal.
**Better approach:** Track popover open state in component state and pass it as a prop to the keyboard handler: `if (isRejectOpen || isSnoozeOpen || isSheetOpen || isShortcutOpen) return`.

### Pitfall 3: Sonner Toaster Not Rendering in Dark Mode
**What goes wrong:** Toast appears with light background in a dark-mode-first console.
**Why it happens:** Sonner uses `next-themes` `useTheme()`. The console must have a `ThemeProvider` with `forcedTheme="dark"` or the Toaster is given `theme="dark"` explicitly.
**How to avoid:** The `Toaster` component in `packages/ui/src/components/ui/sonner.tsx` uses `useTheme()`. The console's `console-providers.tsx` must include a `ThemeProvider`. Check that `apps/console/app/layout.tsx` renders the Toaster inside a ThemeProvider. [VERIFIED: sonner.tsx uses `useTheme`]

### Pitfall 4: `next/headers` and `next/cookies` Synchronous Access Removed in Next.js 16
**What goes wrong:** `cookies()` or `headers()` called synchronously in Server Components throws a runtime error.
**Why it happens:** Next.js 16 made these async (breaking change from v15).
**How to avoid:** Always `await cookies()`, `await headers()`. This phase doesn't use cookies/headers, but is relevant if any BD server component tries to read them. [CITED: CLAUDE.md — "fully removed in Next.js 16"]

### Pitfall 5: `@dnd-kit/react` vs `@dnd-kit/sortable` Import Confusion
**What goes wrong:** Developer installs `@dnd-kit/react` (the pre-release rewrite) instead of `@dnd-kit/sortable` and finds the API is completely different.
**Why it happens:** npm registry now shows `@dnd-kit/react@0.5.x` and `@dnd-kit/sortable@10.0.0` as separate packages. Context7 docs mostly describe the new `@dnd-kit/react` API.
**How to avoid:** Import path is the distinguishing signal: stable = `import { useSortable } from '@dnd-kit/sortable'`. Rewrite = `import { useSortable } from '@dnd-kit/react/sortable'`. [VERIFIED: Context7 migration guide]

### Pitfall 6: Missing `company_name` on LeadQueueItem
**What goes wrong:** The fat card tries to display `lead.company_name` but TypeScript types show it as `string | null` — potential render errors.
**Why it happens:** `LeadQueueItem.company_name` is `string | null` in the API types. Same for `contact_name`, `contact_title`, `icp_score`.
**How to avoid:** Always guard with nullish coalescing: `lead.company_name ?? 'Unknown Company'`. Provide skeleton placeholder for null values rather than empty string. [VERIFIED: api.d.ts LeadQueueItem schema]

### Pitfall 7: BD Reply Triage Has No Backend List Endpoint
**What goes wrong:** `/bd/replies` page tries to call an API endpoint to list reply tasks and gets a 404.
**Why it happens:** The API has no `GET /api/v1/bd/tasks` or `/bd/replies` endpoint. `BDTaskSummary` is embedded in `LeadFatCardResponse.tasks[]` (per-lead detail) only.
**How to avoid:** For Phase 2, the `/bd/replies` page should use an MSW handler that returns mock `BDTaskSummary[]` data (flagged as MSW-only). The planner must decide: either use MSW stub for now or propose a backend contract extension. [VERIFIED: api.d.ts — no /bd/tasks path]

---

## Code Examples

### API Type References (Verified from api.d.ts)

```typescript
// Source: packages/api-client/src/types/api.d.ts [VERIFIED]

// Lead queue item (from list endpoint — compact)
type LeadQueueItem = components['schemas']['LeadQueueItem']
// Fields: id, canonical_domain, icp_score, status, icp_breakdown, enrichment_status,
//         rejection_reason, created_at, updated_at, contact_id, contact_name,
//         contact_title, contact_email, company_name

// Lead fat card response (from detail endpoint — full)
type LeadFatCardResponse = components['schemas']['LeadFatCardResponse']
// Additional fields: contact (ContactDetail), active_sequence (OutreachSequenceSummary | null),
//                   tasks (BDTaskSummary[])

// Bulk action request
type BulkActionRequest = components['schemas']['BulkActionRequest']
// { action: 'approve' | 'reject' | 'snooze', lead_ids: string[],
//   rejection_reason?: string | null, due_at?: string | null }
// IMPORTANT: action='reject' requires rejection_reason field (422 if omitted)
// IMPORTANT: action='snooze' requires due_at field (422 if omitted)

// Import status (for useAsyncJob polling)
type ImportStatusResponse = components['schemas']['ImportStatusResponse']
// { import_id, status: string, total, enriching, icp_scored, review_queue, suppressed, failed }
// Terminal status value: 'complete' (NOT 'completed') [VERIFIED: useAsyncJob DEFAULT_STATUS_MAP]

// Pipeline response
type PipelineResponse = components['schemas']['demand__schemas__lead_queue__PipelineResponse']
// { columns: KanbanColumn[] }
// KanbanColumn: { status, count, leads: KanbanLeadItem[] }

// Outreach sequence steps: two different schemas
// - In OutreachSequenceResponse (full detail): demand__outreach_config__OutreachStepResponse
//   - has original_subject, original_body (never null) + status
// - In OutreachSequenceSummary (embedded in LeadFatCardResponse): demand__schemas__lead_queue__OutreachStepResponse
//   - has original_subject?, original_body? (nullable) + status
```

### Rejection Reason Enum (Verified from Live Backend)

```typescript
// Source: packages/mocks/src/handlers/bd.ts [VERIFIED: live backend 2026-06-13]
const REJECTION_REASONS = [
  'NOT_ICP_FIT',
  'WRONG_SENIORITY',
  'NO_OPEN_ROLES',
  'COMPETITOR',
  'BAD_TIMING',
  'ALREADY_A_CLIENT',
  'OTHER',
] as const
// NOTE: SCREAMING_SNAKE_CASE — not the lowercase/space-separated display labels
// Display labels from UI-SPEC: "Not a fit" | "Wrong industry" | "Too small" | etc.
// Map: NOT_ICP_FIT → "Not a fit", WRONG_SENIORITY → "Wrong seniority", etc.
```

### Pipeline Status Order (Verified from api.d.ts comment)

```typescript
// Source: api.d.ts comment on get_pipeline_view [VERIFIED]
const PIPELINE_STATUSES = [
  'discovered',
  'icp_scored',
  'review_queue',
  'outreach_approved',
  'outreach_sent',
  'interested',
  'converted',
] as const
// UI-SPEC uses: "In Review" for review_queue, "Outreach Approved" for outreach_approved, etc.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwindcss-animate` | `tw-animate-css` | Tailwind v4 migration | Required for `animate-out slide-out-to-right-4` card exit animations |
| `@dnd-kit/sortable@^7` | `@dnd-kit/sortable@10.0.0` (same API, version alignment) | Dec 2024 | No API breaking change — both peer with @dnd-kit/core v6; v10 is latest stable |
| `useMutation(options)` v4 | `useMutation(options)` v5 | TanStack Query v5 | `onMutate` context now receives a second `context` argument |
| `useInfiniteQuery` v4 | `useInfiniteQuery` with `initialPageParam` v5 | TanStack Query v5 | `initialPageParam` is now required; no implicit `undefined` first page |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Archived by Atlassian 2022 — use @dnd-kit/core instead.
- `@dnd-kit/react` 0.5.x: Pre-release; DO NOT use for this phase.
- `tailwindcss-animate`: Replaced by `tw-animate-css` in Tailwind v4.
- MSW v1 `rest` namespace: MSW v2 uses `http` namespace with `HttpResponse` — all handlers in this project already use v2.

---

## Runtime State Inventory

This is a greenfield feature phase (no rename/refactor). No runtime state migration required.

---

## Environment Availability

```
Node.js: available (required by Next.js)
pnpm: available (project uses pnpm workspaces)
@dnd-kit/core: NOT installed — add to console deps
@dnd-kit/sortable: NOT installed — add to console deps
@dnd-kit/utilities: NOT installed — add to console deps
react-dropzone: NOT installed — add to console deps
shadcn components (popover, sheet, checkbox, etc.): NOT installed — add via CLI
```

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @dnd-kit/core | BD-06 pipeline kanban | No | — | None — install required |
| @dnd-kit/sortable | BD-06 pipeline kanban | No | — | None — install required |
| @dnd-kit/utilities | BD-06 kanban CSS transforms | No | — | None — install required |
| react-dropzone | BD-04 CSV import | No | — | `<input type="file" onChange>` (fallback acceptable for v1) |
| shadcn popover | BD-02 reject/snooze | No | — | None — add via CLI |
| shadcn sheet | CUX-01 slide-over | No | — | None — add via CLI |
| shadcn checkbox | BD-03 bulk select | No | — | None — add via CLI |
| shadcn dropdown-menu | BD-03 bulk toolbar | No | — | None — add via CLI |
| shadcn dialog | CUX-03 shortcut overlay | No | — | None — add via CLI |
| shadcn table | BD-05 outreach editor | No | — | None — add via CLI |
| shadcn select | BD-03 bulk reject reason | No | — | None — add via CLI |
| shadcn command | Optional shortcut overlay | No | — | Dialog alone suffices |
| Live backend at localhost:8000 | MSW disabled testing | Available | — | MSW mock layer |

**Missing dependencies with no fallback:**
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (must install before BD-06 plan)
- shadcn components: popover, sheet, checkbox, dropdown-menu, dialog, table, select (must add via CLI before any plan that uses them)

**Missing dependencies with fallback:**
- react-dropzone: `<input type="file">` with `onChange` works for v1 MVP

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.8 |
| Config file | packages/hooks/vitest.config.ts (existing); apps/console needs vitest.config.ts for component tests |
| Quick run command | `pnpm --filter @brynzit/hooks test -- --run` |
| Full suite command | `turbo run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BD-01 | `useInfiniteQuery` with cursor returns paginated leads | unit | `pnpm --filter @brynzit/hooks test -- --run` (reuse pattern) | No — Wave 0 gap |
| BD-02 | Optimistic remove + rollback fires on mutation error | unit | `pnpm --filter @brynzit/console test -- --run` | No — Wave 0 gap |
| BD-04 | `useAsyncJob` with import_id polls until 'complete' | unit | `pnpm --filter @brynzit/hooks test -- --run` (existing pattern) | Partial — test file exists; new status values to add |
| CUX-02 | Sonner toast appears with Undo action after approve | component | `pnpm --filter @brynzit/console test:component -- --run` | No — Wave 0 gap |
| CUX-03 | J/K keyboard navigation disabled when sheet is open | component | Same | No — Wave 0 gap |
| BD-06 | Pipeline kanban renders 7 columns from API data | component | Same | No — Wave 0 gap |
| MSW | All new BD handlers return correctly typed responses | integration | `pnpm --filter @brynzit/api-client test:live -- --run` | Partial — needs BD handlers |

### Sampling Rate
- **Per task commit:** `pnpm --filter @brynzit/hooks test -- --run` + TypeScript typecheck
- **Per wave merge:** `turbo run build typecheck test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/console/vitest.config.ts` — component test config with jsdom + @testing-library/react
- [ ] `apps/console/src/__tests__/lead-queue.test.tsx` — covers BD-01, BD-02, CUX-02 optimistic update
- [ ] `apps/console/src/__tests__/keyboard-nav.test.tsx` — covers CUX-03 shortcut scoping
- [ ] `packages/mocks/src/handlers/bd.ts` — add all new BD handlers (currently only rejection-reasons)

---

## Security Domain

`security_enforcement: true` in config.json. Applying ASVS Level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1 console (CLAUDE.md: trusted-network) |
| V3 Session Management | No | No auth in v1 console |
| V4 Access Control | No | No auth in v1 console |
| V5 Input Validation | Yes (limited) | Form inputs (custom date, reject reason select) validated client-side; server validates via Pydantic |
| V6 Cryptography | No | No crypto operations in UI |
| V7 Error Handling | Yes | Error states must not expose internal API error messages to the user in raw form |
| V14 Config | Partial | `NEXT_PUBLIC_API_URL` is the only secret-adjacent config; it is a public URL and safe to expose client-side |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via unsanitized lead data (company names from external sources) | Tampering | React JSX auto-escapes string interpolation; do NOT use `dangerouslySetInnerHTML` for any lead field |
| MSW active in production | Elevation of Privilege | MSW only activates when `NEXT_PUBLIC_API_MOCKING=enabled` — already enforced in bd.ts handler comment and MSWProvider early-return |
| CSV file upload validation bypass | Tampering | Backend validates file type/content; client-side MIME check in react-dropzone is UX-only, not security |
| Unintended bulk action on large lead sets | Tampering | Bulk action requires explicit checkbox selection; no "select all pages" without confirmation |

---

## Open Questions

1. **BD-07 Reply Triage: No Dedicated Backend Endpoint**
   - What we know: The API has no `GET /api/v1/bd/tasks` or `/bd/replies` endpoint. Reply task data (`BDTaskSummary`) is embedded inside `LeadFatCardResponse.tasks[]` — accessible only per-lead, not as a list. [VERIFIED: api.d.ts — no /bd/tasks path]
   - What's unclear: Should Phase 2 (a) implement `/bd/replies` as a pure MSW-mocked stub, (b) query the lead queue and filter for leads with `interested` reply tasks, or (c) propose a backend contract extension?
   - Recommendation: Implement as MSW stub for Phase 2 with a typed mock response using `BDTaskSummary` shapes. Document the gap in a contract YAML. Do not block Phase 2 on a backend change.

2. **BD-08 Snoozed Lead Wake Badge: No Dedicated Wake Notification Endpoint**
   - What we know: When a lead is snoozed, a `BDTask(type=snooze, due_at=...)` is created. But there is no endpoint for "list leads whose snooze has expired." The lead `status` remains `review_queue` unchanged during snooze. [VERIFIED: api.d.ts bulk-action comment: "action='snooze': CompanyLead.status unchanged"]
   - What's unclear: How does the frontend know a snoozed lead has woken? There is no wake notification endpoint or push mechanism.
   - Recommendation: For Phase 2, derive the badge count from a MSW mock that simulates `N` snoozed leads with `due_at < now`. Document as requiring a backend endpoint (`GET /api/v1/bd/leads?has_woken_snooze=true`) or client-side polling of the task due dates.

3. **Outreach Sequence List Endpoint**
   - What we know: `GET /api/v1/bd/outreach/{sequence_id}` retrieves a single sequence. There is no `GET /api/v1/bd/outreach` (list) endpoint in the API types. [VERIFIED: api.d.ts — no list outreach path]
   - What's unclear: How does the `/bd/outreach` page list all sequences pending review?
   - Recommendation: Implement the list via MSW handler returning mock sequences, and `GET /api/v1/bd/leads?status=outreach_review` (the lead queue filter by outreach_review status) as the data source. Each lead with `outreach_review` status has an `active_sequence` in its fat card.

4. **openapi-fetch + FormData for multipart POST**
   - What we know: The API type for `POST /api/v1/bd/imports` expects `"multipart/form-data"` content with `file: string`. [VERIFIED: api.d.ts Body_create_import schema]
   - What's unclear: Whether `apiClient.POST('/api/v1/bd/imports', { body: formData })` correctly sends `multipart/form-data` vs. serializing as JSON.
   - Recommendation: [ASSUMED] Use native `fetch` with `FormData` for this upload endpoint. Confirm behavior during Wave 0 setup task.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `openapi-fetch` cannot reliably send `FormData` for `multipart/form-data` endpoints — native `fetch` should be used instead | Pattern 5, Open Questions 4 | Low risk: if wrong, `apiClient.POST` works and code is slightly simpler |
| A2 | `@dnd-kit/sortable@10.0.0` is API-compatible with `@dnd-kit/sortable@7.x` (same `useSortable` signature from `@dnd-kit/sortable` import) | Standard Stack | Medium risk: if v10 has breaking changes, rollback to v7.0.2 which also peers @dnd-kit/core@6 |

---

## Sources

### Primary (HIGH confidence)
- `packages/api-client/src/types/api.d.ts` — all BD endpoint shapes, request/response schemas, path keys verified
- `packages/hooks/src/use-async-job.ts` — polling hook implementation, status map, terminal states
- `packages/mocks/src/handlers/bd.ts` — existing MSW handler pattern
- `apps/console/app/globals.css` — dark theme CSS variables
- `packages/ui/src/components/ui/sonner.tsx` — Sonner component config
- Context7 `/tanstack/query` — `useInfiniteQuery`, optimistic updates, `invalidateQueries`, `resetQueries` (infinite-queries.md, optimistic-updates.md, QueryClient.md)
- Context7 `/radix-ui/primitives` — `FocusScope`, `DialogContentImpl`, `onOpenAutoFocus`/`onCloseAutoFocus` (dialog.tsx, focus-scope.tsx)
- Context7 `/clauderic/dnd-kit` — `useSortable` migration guide (stable v6 API vs @dnd-kit/react rewrite)
- Context7 `/websites/mswjs_io` — `http.post` multipart FormData handler pattern
- Context7 `/websites/react-dropzone_js` — `useDropzone`, FormData integration

### Secondary (MEDIUM confidence)
- npm registry: @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0 (verified peer deps), react-dropzone@15.0.0 — version/publish date verified

### Tertiary (LOW confidence)
- None — all claims are verified or tagged [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry; existing packages verified in pnpm-workspace.yaml
- Architecture: HIGH — API types verified from api.d.ts; patterns verified from Context7 official docs
- Pitfalls: HIGH for code pitfalls (verified from source); MEDIUM for BD-07/BD-08 gaps (derived from API inspection)
- MSW handlers: HIGH — pattern verified from existing bd.ts + Context7 mswjs.io docs

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (30 days; stable libraries)
