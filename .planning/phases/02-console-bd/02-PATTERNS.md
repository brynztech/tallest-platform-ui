# Phase 2: Console BD - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 18 new/modified files
**Analogs found:** 18 / 18 (all have at least a role-match analog from Phase 1 foundation)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/console/app/(shell)/layout.tsx` | layout (RSC) | request-response | `apps/console/app/layout.tsx` | role-match |
| `apps/console/app/(shell)/_components/sidebar-nav.tsx` | component (client) | request-response | `apps/console/app/_components/console-providers.tsx` | partial-match |
| `apps/console/app/(shell)/bd/leads/page.tsx` | page (client) | CRUD + streaming | `apps/console/app/(shell)/bd/leads/page.tsx` (existing skeleton) | exact |
| `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | component | request-response | `packages/ui/src/components/ui/card.tsx` | partial-match |
| `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | component (Sheet) | request-response | `packages/ui/src/components/ui/card.tsx` | partial-match |
| `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx` | component (Popover) | request-response | `packages/ui/src/components/ui/badge.tsx` | partial-match |
| `apps/console/app/(shell)/bd/leads/_components/snooze-popover.tsx` | component (Popover) | request-response | `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx` | exact |
| `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx` | component | CRUD | `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) | role-match |
| `apps/console/app/(shell)/bd/leads/_components/shortcut-overlay.tsx` | component (Dialog) | event-driven | `apps/console/app/_components/msw-provider.tsx` | partial-match |
| `apps/console/app/(shell)/bd/outreach/page.tsx` | page (client) | CRUD | `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) | role-match |
| `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` | component | CRUD | `packages/ui/src/components/ui/card.tsx` | partial-match |
| `apps/console/app/(shell)/bd/pipeline/page.tsx` | page (client) | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) | role-match |
| `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx` | component | event-driven | none — no dnd-kit analog exists | no-analog |
| `apps/console/app/(shell)/bd/imports/page.tsx` | page (client) | file-I/O + streaming | `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) | role-match |
| `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` | component | file-I/O | `packages/hooks/src/use-async-job.ts` | partial-match |
| `apps/console/app/(shell)/bd/replies/page.tsx` | page (client) | CRUD | `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) | role-match |
| `packages/mocks/src/handlers/bd.ts` | handler (MSW) | request-response | `packages/mocks/src/handlers/candidate.ts` | exact |
| `apps/console/app/(shell)/bd/leads/__tests__/lead-queue.test.tsx` | test | CRUD | `packages/hooks/src/__tests__/use-async-job.test.ts` | exact |

---

## Pattern Assignments

### `apps/console/app/(shell)/layout.tsx` (layout, request-response)

**Analog:** `apps/console/app/layout.tsx`

**Rule:** Must remain a Server Component (no `'use client'`). Interactive sidebar goes in a `'use client'` child. Never add data fetching directly — it blocks the entire console render.

**Imports pattern** (lines 1-2 of root layout.tsx):
```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
// For (shell)/layout.tsx — no font import needed, already set at root
// Import the SidebarNav client sub-component:
import { SidebarNav } from './_components/sidebar-nav'
```

**RSC layout pattern** (lines 13-25 of `apps/console/app/layout.tsx`):
```typescript
// (shell)/layout.tsx — expand this skeleton:
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Phase 1: structural placeholder — sidebar nav and header added in Phase 2
  // NEVER add data fetching here — it would block the entire console render
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sidebar nav placeholder — Phase 2 (CUX-01, CUX-02, CUX-03) */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

**Target shape** (Phase 2 replacement):
```typescript
// No 'use client' — Server Component
import { SidebarNav } from './_components/sidebar-nav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

---

### `apps/console/app/(shell)/_components/sidebar-nav.tsx` (component, request-response)

**Analog:** `apps/console/app/_components/console-providers.tsx`

**Rule:** `'use client'` is required here (uses `usePathname` for active route). Badge counts fetched via `useQuery`.

**Imports pattern** (lines 1-5 of `console-providers.tsx`):
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
// Add:
import { usePathname } from 'next/navigation'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@brynzit/ui/lib/utils'
```

**Active route pattern** (derive from `usePathname`):
```typescript
'use client'

export function SidebarNav() {
  const pathname = usePathname()
  // Badge counts — queryKey kept stable, staleTime high (badge doesn't need to be fresh)
  const { data: leadsData } = useQuery({
    queryKey: ['leads-count'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/leads', {
        params: { query: { status: 'review_queue', limit: 1 } },
      })
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })
  // ...
}
```

**CSS variables for sidebar** (from `apps/console/app/globals.css` lines 17):
```css
--sidebar: oklch(0.185 0 0);
```
Use `bg-[var(--sidebar)]` or add a `bg-sidebar` token (see globals.css) for the sidebar background.

---

### `apps/console/app/(shell)/bd/leads/page.tsx` (page, CRUD + streaming)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (current walking skeleton — full replacement)

**Rule:** `'use client'`. Uses `useInfiniteQuery` for cursor pagination. Keyboard shortcuts scoped to this page. All mutation/optimistic logic lives here or in child components that receive callbacks.

**Imports pattern** (expand from skeleton lines 1-5):
```typescript
'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
```

**useQuery pattern** (from skeleton lines 3-14 — upgrade to useInfiniteQuery):
```typescript
// Current skeleton uses useQuery — replace with:
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
const leads = data?.pages.flatMap((page) => page.leads) ?? []
```

**Loading/error pattern** (from skeleton lines 15-32 — keep same structure):
```typescript
// Reuse exact skeleton pattern:
if (isLoading) {
  return (
    <div className="p-6">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  )
}
if (error) {
  return (
    <div className="p-6">
      <p className="text-destructive text-sm">Error loading data</p>
    </div>
  )
}
```

**Optimistic remove + undo pattern** (from RESEARCH.md Pattern 2):
```typescript
const queryClient = useQueryClient()
type LeadQueueResponse = components['schemas']['LeadQueueResponse']

const approveMutation = useMutation({
  mutationFn: (leadId: string) =>
    apiClient.POST('/api/v1/bd/leads/bulk-action', {
      body: { action: 'approve', lead_ids: [leadId] },
    }),
  onMutate: async (leadId) => {
    await queryClient.cancelQueries({ queryKey: ['leads'] })
    const previousData = queryClient.getQueryData(['leads'])
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
    queryClient.setQueryData(['leads'], context?.previousData)
    toast.error('Action failed — lead restored.')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  },
})
```

**Keyboard shortcut pattern** (from RESEARCH.md Pattern 3):
```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const activeEl = document.activeElement
    const isInputFocused =
      activeEl instanceof HTMLInputElement ||
      activeEl instanceof HTMLTextAreaElement ||
      (activeEl as HTMLElement)?.isContentEditable
    const isOverlayOpen = document.querySelector('[data-state="open"][role="dialog"]')
    if (isInputFocused || isOverlayOpen) return

    switch (e.key) {
      case 'j': case 'k': case 'a': case 'r': case 's': case '?':
        e.preventDefault()
        // handle...
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

**After bulk action — reset to page 1** (D-10):
```typescript
// Do NOT use invalidateQueries for bulk actions on infinite query
await queryClient.resetQueries({ queryKey: ['leads'] })
```

---

### `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` (component, request-response)

**Analog:** `packages/ui/src/components/ui/card.tsx`

**Rule:** Renders a single `LeadQueueItem`. Clicking card body calls `onOpenDetail`. Actions (approve/reject/snooze) call callbacks passed from the page. Bulk select checkbox uses shadcn Checkbox. ICP score badge uses shadcn Badge.

**Imports pattern** (from `card.tsx` lines 1-4 + badge/button):
```typescript
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import type { components } from '@brynzit/api-client'
```

**Component prop types** (derived from api.d.ts lines 1648-1692):
```typescript
type LeadQueueItem = components['schemas']['LeadQueueItem']

interface LeadCardProps {
  lead: LeadQueueItem
  isSelected: boolean
  isLeaving: boolean
  isProcessing: boolean
  onSelect: (id: string, checked: boolean) => void
  onOpenDetail: (id: string) => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onSnooze: (id: string, dueAt: string) => void
}
```

**cn usage pattern** (from `card.tsx` lines 6-14 and `button.tsx` line 55):
```typescript
// Apply pending/leaving state classes:
<div
  className={cn(
    'relative rounded-lg border bg-card px-4 py-3 transition-opacity',
    isLeaving && 'opacity-0 pointer-events-none',
    isProcessing && 'opacity-50',
  )}
>
```

**Nullish-coalescing for nullable fields** (from RESEARCH.md Pitfall 6):
```typescript
// All these fields are string | null in LeadQueueItem:
lead.company_name ?? 'Unknown Company'
lead.contact_name ?? '—'
lead.contact_title ?? '—'
lead.icp_score ?? 0
```

---

### `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` (component, request-response)

**Analog:** `apps/console/app/_components/msw-provider.tsx` (client component shell pattern)

**Rule:** Radix Sheet with `side="right"`. Uses `useQuery` to fetch `LeadFatCardResponse` on demand (lazy — only when `open=true`). Focus returns to trigger card on close via default Radix FocusScope behavior.

**Imports pattern**:
```typescript
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@brynzit/ui/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
```

**Sheet focus management pattern** (from RESEARCH.md Pattern 3):
```typescript
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent
    side="right"
    // Default FocusScope returns focus to trigger on close — no override needed
    // Only override if the trigger ref needs explicit focus:
    onCloseAutoFocus={(event) => {
      event.preventDefault()
      cardRef.current?.focus()
    }}
  >
    {/* panel content */}
  </SheetContent>
</Sheet>
```

**Lazy fetch pattern** (only fetch when sheet opens):
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['lead-detail', leadId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/bd/leads/{lead_id}', {
      params: { path: { lead_id: leadId! } },
    })
    if (error) throw error
    return data
  },
  enabled: !!leadId && isOpen,
  staleTime: 30 * 1000,
})
```

---

### `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx` (component, request-response)

**Analog:** `packages/ui/src/components/ui/badge.tsx` (shadcn component structure pattern)

**Rule:** Radix Popover (non-modal). Renders 7 rejection reasons fetched from `GET /api/v1/bd/rejection-reasons` (already MSW-mocked). No custom focus trap — track open state in parent to disable keyboard shortcuts.

**Imports pattern**:
```typescript
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Button } from '@brynzit/ui/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
```

**Rejection reasons fetch** (already has MSW handler — `bd.ts` lines 15-27):
```typescript
// Reuse the existing MSW-backed query pattern from skeleton page.tsx lines 7-14:
const { data } = useQuery({
  queryKey: ['rejection-reasons'],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/bd/rejection-reasons')
    if (error) throw error
    return data
  },
  staleTime: Infinity, // Static data — never refetch
})
```

**Popover open state** (expose to parent for keyboard guard per RESEARCH.md Pitfall 2):
```typescript
interface RejectPopoverProps {
  leadId: string
  onOpenChange?: (open: boolean) => void
  onReject: (leadId: string, reason: string) => void
}
// In parent: if (isRejectOpen || isSnoozeOpen || isSheetOpen) return (in keydown handler)
```

---

### `apps/console/app/(shell)/bd/leads/_components/snooze-popover.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/reject-popover.tsx`

**Rule:** Identical Popover pattern to reject-popover. Presets: 1 week / 1 month / end of quarter / custom date. Custom date uses `<input type="date">` or shadcn Select/Calendar. Passes `due_at` ISO string to `onSnooze` callback.

**Imports pattern** (same as reject-popover + date handling):
```typescript
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Button } from '@brynzit/ui/components/ui/button'
// For custom date: import { Input } from '@brynzit/ui/components/ui/input'
```

**Preset computation**:
```typescript
function getPresetDate(preset: 'week' | 'month' | 'quarter'): string {
  const d = new Date()
  if (preset === 'week') d.setDate(d.getDate() + 7)
  else if (preset === 'month') d.setMonth(d.getMonth() + 1)
  else {
    // End of current quarter
    const q = Math.floor(d.getMonth() / 3)
    d.setMonth((q + 1) * 3, 0)
  }
  return d.toISOString()
}
```

---

### `apps/console/app/(shell)/bd/leads/_components/bulk-toolbar.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton — client component pattern)

**Rule:** `'use client'`. Conditionally rendered when `selectedIds.length >= 1`. Fires bulk action then calls `onBulkSettled` which triggers `queryClient.resetQueries`. Shows pending-overlay state (50% opacity + spinner) via `isProcessing` prop on LeadCard.

**Imports pattern**:
```typescript
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Button } from '@brynzit/ui/components/ui/button'
import { toast } from 'sonner'
```

**Bulk mutation + reset** (from RESEARCH.md D-09, D-10):
```typescript
const queryClient = useQueryClient()

const bulkMutation = useMutation({
  mutationFn: (payload: BulkActionRequest) =>
    apiClient.POST('/api/v1/bd/leads/bulk-action', { body: payload }),
  onSettled: async () => {
    // D-10: reset to page 1, not invalidate, to avoid cursor corruption
    await queryClient.resetQueries({ queryKey: ['leads'] })
    onBulkSettled?.()
  },
  onError: () => {
    toast.error('Bulk action failed. Please try again.')
  },
})
```

---

### `apps/console/app/(shell)/bd/leads/_components/shortcut-overlay.tsx` (component, event-driven)

**Analog:** `apps/console/app/_components/msw-provider.tsx` (client component that mounts/unmounts on condition)

**Rule:** Radix Dialog (modal). Opened by `?` keypress from page-level handler. Lists all shortcuts: J/K/A/R/S/?. Self-contained — accepts `open` and `onOpenChange` props from page.

**Imports pattern**:
```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
```

**Minimal dialog pattern**:
```typescript
interface ShortcutOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutOverlay({ open, onOpenChange }: ShortcutOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        {/* shortcut table */}
      </DialogContent>
    </Dialog>
  )
}
```

---

### `apps/console/app/(shell)/bd/outreach/page.tsx` (page, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton)

**Rule:** `'use client'`. Lists outreach sequences. No live list endpoint — uses MSW mock handler. PATCH steps + approve/reject via `apiClient`.

**Imports pattern** (expand skeleton lines 1-5):
```typescript
'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
```

**Query pattern** (same structure as skeleton lines 7-14):
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['outreach-sequences'],
  queryFn: async () => {
    // MSW mock handler — no live list endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/outreach`)
    if (!res.ok) throw new Error('Failed to fetch sequences')
    return res.json()
  },
})
```

---

### `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` (component, CRUD)

**Analog:** `packages/ui/src/components/ui/card.tsx`

**Rule:** Renders one `OutreachSequenceResponse`. Expandable card — collapsed shows summary, expanded shows 3 step editors. PATCH on blur or explicit save. Approve/reject buttons fire mutations.

**Type import pattern**:
```typescript
import type { components } from '@brynzit/api-client'
type OutreachSequenceResponse = components['schemas']['OutreachSequenceResponse']
// Note: two different OutreachStep schemas exist — use full detail schema here:
// demand__outreach_config__OutreachStepResponse (has original_subject, original_body non-null)
```

---

### `apps/console/app/(shell)/bd/pipeline/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton)

**Rule:** `'use client'`. Polls every 15 seconds via `refetchInterval`. Renders `<KanbanBoard>`. No mutations from this page — kanban is visual-only.

**Polling query pattern** (from RESEARCH.md Architecture diagram):
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['pipeline'],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/bd/pipeline')
    if (error) throw error
    return data
  },
  refetchInterval: 15_000,
})
```

---

### `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx` (component, event-driven)

**Analog:** None — no dnd-kit analog exists in codebase. Use RESEARCH.md Pattern 4 directly.

**Rule:** `@dnd-kit/core` v6 + `@dnd-kit/sortable` v10. Visual-only drag (no API calls). Import guard: always `from '@dnd-kit/sortable'` not `from '@dnd-kit/react/sortable'`.

**Imports pattern** (from RESEARCH.md Pattern 4):
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { components } from '@brynzit/api-client'
```

---

### `apps/console/app/(shell)/bd/imports/page.tsx` (page, file-I/O + streaming)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton)

**Rule:** `'use client'`. Combines react-dropzone for file pick + native `fetch` for FormData POST (not `apiClient` — see RESEARCH.md Open Question 4) + `useAsyncJob` for polling.

**Imports pattern**:
```typescript
'use client'

import { useState } from 'react'
import { useAsyncJob } from '@brynzit/hooks'
import type { components } from '@brynzit/api-client'
type ImportStatusResponse = components['schemas']['ImportStatusResponse']
```

---

### `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` (component, file-I/O)

**Analog:** `packages/hooks/src/use-async-job.ts` (polling pattern)

**Rule:** react-dropzone for file selection + FormData POST + `useAsyncJob` polling.

**useAsyncJob invocation pattern** (from `use-async-job.ts` lines 73-132):
```typescript
// Exact invocation matching the hook signature:
const { phase, data: statusData, isPolling } = useAsyncJob<ImportStatusResponse>({
  jobId: importId,
  endpoint: '/api/v1/bd/imports/{id}/status',
  // No statusMap override needed — 'complete' is already in DEFAULT_STATUS_MAP
})

// Phase display:
// phase === 'idle'    → show dropzone
// phase === 'pending' → show "Processing N leads…" (statusData?.total)
// phase === 'complete'→ show success counts (statusData?.review_queue)
// phase === 'failed'  → show error message
```

**Native fetch for multipart** (RESEARCH.md Pattern 5 — NOT apiClient):
```typescript
const formData = new FormData()
formData.append('file', file)
// No Content-Type header — browser sets boundary automatically
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/imports`,
  { method: 'POST', body: formData },
)
const data = await res.json()
setImportId(data.import_id)
```

---

### `apps/console/app/(shell)/bd/replies/page.tsx` (page, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton)

**Rule:** `'use client'`. MSW-only stub — no live backend endpoint. Fetches from MSW handler returning `BDTaskSummary[]`. Tagged as contract gap requiring backend extension.

**Query pattern** (same structure as skeleton):
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['bd-tasks'],
  queryFn: async () => {
    // MSW stub only — no live /bd/tasks endpoint exists
    // See RESEARCH.md Open Questions #1
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/bd/tasks`,
    )
    if (!res.ok) throw new Error('Failed to fetch tasks')
    return res.json() as Promise<{ tasks: BDTaskSummary[] }>
  },
})
```

---

### `packages/mocks/src/handlers/bd.ts` (handler, request-response)

**Analog:** `packages/mocks/src/handlers/candidate.ts`

**Rule:** Expand the existing file (do not replace). Add all new handlers following the established `http.METHOD + API_BASE + HttpResponse.json` pattern. Import `API_BASE` from `'../base-url'`. Import `type { components }` from `'@brynzit/api-client'`.

**Imports pattern** (from `bd.ts` lines 1-4 — keep exactly):
```typescript
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'
import type { components } from '@brynzit/api-client'
```

**Handler shape pattern** (from `bd.ts` lines 15-27 — the one existing handler):
```typescript
http.get(`${API_BASE}/api/v1/bd/rejection-reasons`, () => {
  return HttpResponse.json({
    reasons: [ /* ... */ ],
  })
}),
```

**Multipart handler pattern** (from `candidate.ts` lines 19-22 shape + RESEARCH.md Pattern 6):
```typescript
http.post(`${API_BASE}/api/v1/bd/imports`, async ({ request }) => {
  const data = await request.formData()
  const file = data.get('file')
  if (!file || !(file instanceof File)) {
    return new HttpResponse('Missing file', { status: 400 })
  }
  return HttpResponse.json(
    { import_id: 'mock-import-uuid', accepted: 100, skipped_duplicate: 0, skipped_invalid: 0, skipped_rows: [] },
    { status: 202 },
  )
}),
```

**Path param handler pattern** (from `candidate.ts` lines 31-33 shape):
```typescript
http.get(`${API_BASE}/api/v1/bd/imports/:import_id/status`, ({ params }) => {
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
```

---

### `apps/console/app/(shell)/bd/leads/__tests__/lead-queue.test.tsx` (test, CRUD)

**Analog:** `packages/hooks/src/__tests__/use-async-job.test.ts`

**Rule:** Vitest + @testing-library/react + jsdom. Same `makeWrapper` pattern for QueryClientProvider. `vi.fn()` for API mocks.

**Test wrapper pattern** (from `use-async-job.test.ts` lines 7-14):
```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})
```

**Test pattern for optimistic update** (derive from `use-async-job.test.ts` lines 43-58):
```typescript
it('optimistic remove — lead disappears from queue on approve', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ succeeded: 1, failed: 0, errors: [] }),
  })
  // render LeadsPage with mock data, trigger approve, assert lead is removed
})
```

**Vitest config** (copy from `packages/hooks/vitest.config.ts` lines 1-9):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
```

---

## Shared Patterns

### TanStack Query Client Setup
**Source:** `apps/console/app/_components/console-providers.tsx` lines 1-24
**Apply to:** All `'use client'` page files — QueryClient is already at root via `ConsoleProviders`. Do NOT create new QueryClient instances. Import `useQuery`, `useMutation`, `useQueryClient`, `useInfiniteQuery` directly.

```typescript
// Never do this in page/component files:
// const queryClient = new QueryClient(...)
// Do this instead:
const queryClient = useQueryClient()  // get the root client
```

### API Client Import
**Source:** `packages/api-client/src/client.ts` lines 1-8
**Apply to:** All files that call backend endpoints

```typescript
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
// Never inline or re-export types — always import type { components }
```

### Error Handling in Query Functions
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) lines 8-13
**Apply to:** All `queryFn` and `mutationFn` callbacks

```typescript
const { data, error } = await apiClient.GET('/api/v1/...')
if (error) throw error
return data
// openapi-fetch returns { data, error } — always check error before using data
```

### CSS Token Usage
**Source:** `apps/console/app/globals.css` lines 1-19
**Apply to:** All new console components

```typescript
// Correct — use CSS variable tokens:
className="bg-card text-card-foreground border-border"
className="bg-[var(--sidebar)]"   // for sidebar background
// Wrong — never define @theme in app files, only in packages/ui/src/styles/globals.css
```

### Loading + Error States
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` (skeleton) lines 15-32
**Apply to:** All page-level components

```typescript
if (isLoading) return <div className="p-6"><p className="text-muted-foreground text-sm">Loading…</p></div>
if (error) return <div className="p-6"><p className="text-destructive text-sm">Error loading data</p></div>
```

### Sonner Toast
**Source:** `packages/ui/src/components/ui/sonner.tsx` lines 1-41
**Apply to:** All approve/reject/snooze actions, bulk actions, error states

```typescript
import { toast } from 'sonner'

// Undo toast (CUX-02):
toast('Approved', {
  description: `${lead.company_name ?? 'Lead'} moved out of queue.`,
  action: { label: 'Undo', onClick: () => { /* cancel timeout, restore */ } },
  duration: 5000,
})

// Error toast:
toast.error('Action failed — lead restored.')
```
Note: `Toaster` must be rendered inside a `ThemeProvider` for dark mode. Verify `apps/console/app/layout.tsx` has `ThemeProvider` wrapping `ConsoleProviders` — if missing, add it (RESEARCH.md Pitfall 3).

### MSW Handler Registration
**Source:** `packages/mocks/src/browser.ts` lines 1-14 + `packages/mocks/src/node.ts` lines 1-14
**Apply to:** Every new handler added to `bd.ts` — automatically included via spread

```typescript
// New handlers in bd.ts are automatically included because:
// browser.ts: setupWorker(...bdHandlers, ...)
// node.ts:    setupServer(...bdHandlers, ...)
// No changes needed to browser.ts or node.ts when adding handlers to bdHandlers[]
```

### Guard Against Synchronous `next/headers`/`next/cookies`
**Source:** CLAUDE.md constraint
**Apply to:** Any Server Component that might need cookies/headers (not relevant to Phase 2 BD pages, but applies to `(shell)/layout.tsx`)

```typescript
// Always async in Next.js 16:
const cookieStore = await cookies()
const headersList = await headers()
// Never: cookies().get(...) — synchronous call removed in Next.js 16
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/console/app/(shell)/bd/pipeline/_components/kanban-board.tsx` | component | event-driven | No dnd-kit usage anywhere in the codebase yet. Use RESEARCH.md Pattern 4 directly (`@dnd-kit/core` v6 + `@dnd-kit/sortable` v10 — see exact code excerpt in RESEARCH.md lines 419-483) |

---

## Metadata

**Analog search scope:** All TypeScript files under `apps/`, `packages/` (excluding `node_modules`, `.next`, `dist`)
**Files scanned:** 33 source files
**Pattern extraction date:** 2026-06-13
