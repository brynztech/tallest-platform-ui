# Phase 3: Console Ops - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 17 new/modified files
**Analogs found:** 17 / 17 (all have at least a role-match analog from Phase 2)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/console/app/(shell)/_components/sidebar-nav.tsx` | component (client) | request-response | `apps/console/app/(shell)/_components/sidebar-nav.tsx` (modify existing) | exact |
| `apps/console/app/(shell)/ops/clients/page.tsx` | page (client) | CRUD | `apps/console/app/(shell)/bd/leads/page.tsx` | role-match |
| `apps/console/app/(shell)/ops/clients/[id]/page.tsx` | page (client) | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` | role-match |
| `apps/console/app/(shell)/ops/clients/[id]/_components/client-fields.tsx` | component | CRUD | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match |
| `apps/console/app/(shell)/ops/clients/[id]/_components/client-notes.tsx` | component | CRUD | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match |
| `apps/console/app/(shell)/ops/clients/[id]/_components/client-requisitions.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/page.tsx` | page (client) | CRUD | `apps/console/app/(shell)/bd/leads/page.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` | page (client) | CRUD + streaming | `apps/console/app/(shell)/bd/leads/page.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` | component | streaming | `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` | component | CRUD | `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx` | component (Sheet) | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | exact |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx` | component | CRUD | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx` | component (Sheet) | CRUD | `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` | exact |
| `apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | role-match |
| `apps/console/app/(shell)/ops/interviews/page.tsx` | page (client) | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` | role-match |
| `packages/mocks/src/handlers/ops.ts` | handler (MSW) | request-response | `packages/mocks/src/handlers/bd.ts` | exact |
| `apps/console/src/__tests__/ops-*.test.tsx` (×5) | test | CRUD | `apps/console/src/__tests__/lead-queue.test.tsx` | exact |

---

## Pattern Assignments

### `apps/console/app/(shell)/_components/sidebar-nav.tsx` (modify existing)

**Analog:** Self — this is a targeted modification of the existing file.

**What changes:** Remove the Ops entry from `STUB_SECTIONS` and add an `OPS_NAV` array with real Link components. The Supply and Admin stubs remain dimmed.

**Modification target** (`sidebar-nav.tsx` lines 20-24 — current STUB_SECTIONS):
```typescript
// CURRENT (lines 20-24) — Ops is a stub item inside STUB_SECTIONS:
const STUB_SECTIONS = [
  { label: 'Ops', items: ['Clients', 'Requisitions', 'Interviews', 'Placements'] },
  { label: 'Supply', items: ['Candidates', 'Shortlists', 'Engagements'] },
  { label: 'Admin', items: ['Costs', 'Events', 'Quotas', 'Prompts'] },
] as const
```

**Target shape** (after Phase 3 modification — insert before STUB_SECTIONS):
```typescript
// ADD before STUB_SECTIONS — mirrors the BD_NAV structure (lines 11-17):
const OPS_NAV = [
  { href: '/ops/clients', label: 'Clients', badgeKey: null },
  { href: '/ops/requisitions', label: 'Requisitions', badgeKey: null },
  { href: '/ops/interviews', label: 'Interviews', badgeKey: null },
] as const

// MODIFY STUB_SECTIONS — remove Ops, keep Supply and Admin:
const STUB_SECTIONS = [
  { label: 'Supply', items: ['Candidates', 'Shortlists', 'Engagements'] },
  { label: 'Admin', items: ['Costs', 'Events', 'Quotas', 'Prompts'] },
] as const
```

**OPS section render block** (copy BD section at lines 93-130, substitute OPS_NAV):
```typescript
// In the SidebarNav return — place between BD section and STUB_SECTIONS map:
<div className="flex flex-col px-2 py-3">
  <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    Ops
  </span>
  {OPS_NAV.map((item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent/50 text-foreground font-medium border-l-2 border-primary pl-[6px]'
            : 'text-muted-foreground',
        )}
      >
        <span className="flex-1 truncate">{item.label}</span>
      </Link>
    )
  })}
</div>
```

---

### `apps/console/app/(shell)/ops/clients/page.tsx` (page, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Imports pattern** (copy from `leads/page.tsx` lines 1-12 — adapt for clients):
```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@brynzit/ui/components/ui/dialog'
import { Input } from '@brynzit/ui/components/ui/input'
```

**useQuery pattern** (clients list — live endpoint exists):
```typescript
type ClientResponse = components['schemas']['ClientResponse']

const { data, isLoading, error } = useQuery({
  queryKey: ['ops-clients'],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/ops/clients')
    if (error) throw error
    return data
  },
})
const clients: ClientResponse[] = data ?? []
```

**Create client mutation pattern** (copy `useMutation` shape from `leads/page.tsx` lines 67-99):
```typescript
const createMutation = useMutation({
  mutationFn: async (body: components['schemas']['CreateClientRequest']) => {
    const { data, error } = await apiClient.POST('/api/v1/ops/clients', { body })
    if (error) throw error
    return data
  },
  onSuccess: (newClient) => {
    queryClient.invalidateQueries({ queryKey: ['ops-clients'] })
    toast(`Client created — ${newClient.name}`)
    setIsCreateOpen(false)
    router.push(`/ops/clients/${newClient.id}`)
  },
  onError: () => {
    toast.error('Failed to create client.')
  },
})
```

**Loading/error pattern** (copy exactly from `leads/page.tsx` lines 279-295):
```typescript
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
      <p className="text-destructive text-sm">
        Couldn&apos;t load clients. Check your connection or refresh the page.
      </p>
    </div>
  )
}
```

**Page header pattern** (copy sticky toolbar from `leads/page.tsx` lines 300-313):
```typescript
<div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/90 px-6 backdrop-blur">
  <h1 className="text-xl font-semibold">Clients</h1>
  <span className="text-sm text-muted-foreground">{clients.length} clients</span>
  <Button className="ml-auto" size="sm" onClick={() => setIsCreateOpen(true)}>
    New Client
  </Button>
</div>
```

---

### `apps/console/app/(shell)/ops/clients/[id]/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Imports pattern**:
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { ClientFields } from './_components/client-fields'
import { ClientNotes } from './_components/client-notes'
import { ClientRequisitions } from './_components/client-requisitions'
```

**Two-panel layout pattern** (D-02 — `h-[calc(100vh-3.5rem)] flex` with each panel independently scrolling):
```typescript
// Each panel uses h-full overflow-y-auto; parent uses flex h-[calc(100vh-3.5rem)]
// This is the fix for Pitfall 6: independent scroll per panel without bleeding.
export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-client', params.id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}', {
        params: { path: { client_id: params.id } },
      })
      if (error) throw error
      return data
    },
  })

  if (isLoading) return <div className="p-6"><p className="text-muted-foreground text-sm">Loading…</p></div>
  if (error || !data) return <div className="p-6"><p className="text-destructive text-sm">Client not found.</p></div>

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel — client fields + compact req list */}
      <div className="flex w-[480px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border p-6">
        <ClientFields client={data} />
        <ClientRequisitions clientId={params.id} />
      </div>
      {/* Right panel — notes log */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <ClientNotes clientId={params.id} />
      </div>
    </div>
  )
}
```

---

### `apps/console/app/(shell)/ops/clients/[id]/_components/client-fields.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Rule:** Editable form fields for `ClientResponse` with `react-hook-form` + Zod v4. PATCH on save via `apiClient.PATCH`. Uses shadcn Input.

**Imports pattern**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Input } from '@brynzit/ui/components/ui/input'
import { Button } from '@brynzit/ui/components/ui/button'
```

**Form schema + RHF pattern** (from RESEARCH.md Pattern 4 shape — adapt for client):
```typescript
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  primary_contact_name: z.string().nullable().optional(),
  primary_contact_email: z.string().email().nullable().optional(),
})
type ClientFormValues = z.infer<typeof clientSchema>

// In component:
const form = useForm<ClientFormValues>({
  resolver: zodResolver(clientSchema),
  defaultValues: {
    name: client.name,
    primary_contact_name: client.primary_contact_name ?? null,
    primary_contact_email: client.primary_contact_email ?? null,
  },
})

const patchMutation = useMutation({
  mutationFn: (body: Partial<components['schemas']['CreateClientRequest']>) =>
    apiClient.PATCH('/api/v1/ops/clients/{client_id}', {
      params: { path: { client_id: client.id } },
      body,
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-client', client.id] })
    toast('Client updated.')
  },
  onError: () => {
    toast.error('Failed to update client.')
  },
})
```

---

### `apps/console/app/(shell)/ops/clients/[id]/_components/client-notes.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Rule:** Append-only notes log (D-16). Displays `NoteResponse[]` in reverse-chronological order. Input is a plain `Textarea`. POST on submit. No `dangerouslySetInnerHTML` — notes rendered as text nodes.

**Imports pattern**:
```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Button } from '@brynzit/ui/components/ui/button'
```

**Notes fetch + POST pattern** (from RESEARCH.md Pattern 5):
```typescript
type NoteResponse = components['schemas']['NoteResponse']

const { data: notes } = useQuery({
  queryKey: ['client-notes', clientId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/notes', {
      params: { path: { client_id: clientId } },
    })
    if (error) throw error
    return data
  },
})

const addNoteMutation = useMutation({
  mutationFn: (text: string) =>
    apiClient.POST('/api/v1/ops/clients/{client_id}/notes', {
      params: { path: { client_id: clientId } },
      body: { text, channel: 'other' },
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['client-notes', clientId] })
    setNoteText('')
  },
  onError: () => {
    toast.error('Failed to add note.')
  },
})

// Render notes in reverse-chronological order:
const sortedNotes = [...(notes ?? [])].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)
```

**Security pattern — never use dangerouslySetInnerHTML for note content** (XSS guard):
```typescript
// CORRECT — renders as text node, XSS-safe:
<p className="text-sm whitespace-pre-wrap">{note.text}</p>
// NEVER:
// <p dangerouslySetInnerHTML={{ __html: note.text }} />
```

---

### `apps/console/app/(shell)/ops/clients/[id]/_components/client-requisitions.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Rule:** Compact list of requisitions for this client (left panel of client detail). Links to `/ops/requisitions/{id}`. "Create Requisition" button opens the create modal. "View all" link goes to `/ops/requisitions?client_id={id}`.

**Fetch pattern** (uses `GET /api/v1/ops/clients/{client_id}/requisitions` — live endpoint):
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import Link from 'next/link'

type RequisitionResponse = components['schemas']['RequisitionResponse']

const { data: requisitions } = useQuery({
  queryKey: ['client-requisitions', clientId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/requisitions', {
      params: { path: { client_id: clientId } },
    })
    if (error) throw error
    return data
  },
})
```

---

### `apps/console/app/(shell)/ops/requisitions/page.tsx` (page, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Rule:** MSW-only — `GET /api/v1/ops/requisitions` does not exist as a live endpoint (verified: `get?: never` in api.d.ts line 445). Uses raw `fetch()` targeting the MSW handler, same pattern as outreach/page.tsx. Client filter Select uses shadcn Select.

**Imports pattern**:
```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import Link from 'next/link'
```

**MSW-only fetch pattern** (copy from Phase 2 bd/replies pattern — raw fetch, not apiClient):
```typescript
type RequisitionResponse = components['schemas']['RequisitionResponse']

const [clientFilter, setClientFilter] = useState<string | null>(null)

const { data, isLoading, error } = useQuery({
  queryKey: ['ops-requisitions', clientFilter],
  queryFn: async () => {
    // NOTE: MSW-only — no live GET /api/v1/ops/requisitions endpoint exists
    const url = new URL(
      '/api/v1/ops/requisitions',
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
    )
    if (clientFilter) url.searchParams.set('client_id', clientFilter)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('Failed to fetch requisitions')
    return res.json() as Promise<RequisitionResponse[]>
  },
})
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` (page, CRUD + streaming)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Rule:** The main Ops work hub (D-04). Scrollable — all sections on one page. Coordinates shared state: `selectedCandidateId` for the Sheet slide-over, `isPlacementOpen` for the placement panel, and the JD parse state.

**Imports pattern**:
```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { RequisitionFields } from './_components/requisition-fields'
import { ShortlistTable } from './_components/shortlist-table'
import { CandidateDetailPanel } from './_components/candidate-detail-panel'
import { InterviewsSection } from './_components/interviews-section'
import { PlacementPanel } from './_components/placement-panel'
import { PlacementsSection } from './_components/placements-section'
```

**Main query pattern**:
```typescript
type RequisitionResponse = components['schemas']['RequisitionResponse']

const { data: req, isLoading, error } = useQuery({
  queryKey: ['ops-requisition', params.id],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/ops/requisitions/{req_id}', {
      params: { path: { req_id: params.id } },
    })
    if (error) throw error
    return data
  },
})
```

**Shared state pattern** (coordinate panels — copy model from `leads/page.tsx` lines 53-62):
```typescript
const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
const [isCandidatePanelOpen, setIsCandidatePanelOpen] = useState(false)
const [isPlacementOpen, setIsPlacementOpen] = useState(false)
const [approvedCandidateId, setApprovedCandidateId] = useState<string | null>(null)
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` (component, streaming)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx`

**Rule:** Editable requisition fields + JD parse flow (D-05, D-06, D-07). Fields disabled + skeleton shimmer while `phase === 'pending'`. Unlocks + animates on `phase === 'complete'`. Toast on `phase === 'failed'`.

**Imports pattern**:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAsyncJob } from '@brynzit/hooks'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Input } from '@brynzit/ui/components/ui/input'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Button } from '@brynzit/ui/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
```

**JD parse flow pattern** (from RESEARCH.md Pattern 1 + `use-async-job.ts` lines 78-145):
```typescript
type RequisitionResponse = components['schemas']['RequisitionResponse']

// JD parse state
const [isParsingJd, setIsParsingJd] = useState(false)
const [reqId, setReqId] = useState<string | null>(null)

// Step 1: Create requisition
const createMutation = useMutation({
  mutationFn: async (body: components['schemas']['CreateRequisitionRequest']) => {
    const { data, error } = await apiClient.POST('/api/v1/ops/requisitions', { body })
    if (error) throw error
    return data
  },
  onSuccess: async (req) => {
    setReqId(req.id)
    if (jdText.trim()) {
      const { error } = await apiClient.POST('/api/v1/ops/requisitions/{req_id}/parse-jd', {
        params: { path: { req_id: req.id } },
        body: { jd_text: jdText },
      })
      if (!error) setIsParsingJd(true)
    }
  },
})

// Step 2: Poll requisition until status is terminal
// CRITICAL: Pass statusMap override — 'open' is not in DEFAULT_STATUS_MAP (Pitfall 1)
const { phase, data: polledReq } = useAsyncJob<RequisitionResponse>({
  jobId: isParsingJd ? reqId : null,
  endpoint: '/api/v1/ops/requisitions/{id}',
  statusMap: {
    open: 'complete',
    filled: 'complete',
    closed: 'complete',
    parsing: 'pending',
  },
  refetchInterval: 2000,
})

const isParsing = phase === 'pending'
const parseFailed = phase === 'failed'

// Step 3: Surface parse failure (D-07)
useEffect(() => {
  if (parseFailed) {
    toast.error('JD parsing failed — fill fields manually.')
    setIsParsingJd(false)
  }
}, [parseFailed])
```

**Skeleton shimmer pattern** (from RESEARCH.md Code Examples):
```typescript
// While isParsing === true — wrap each parsed field:
{isParsing ? (
  <div className="space-y-2">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
) : (
  <Input
    {...form.register('seniority')}
    disabled={isParsing}
    placeholder="e.g. senior"
  />
)}
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx`

**Rule:** TanStack Table v8 (D-08). Row click opens candidate Sheet slide-over (D-10). Approve/Hold/Pass actions use `PATCH /api/v1/supply/shortlists/{submission_id}` — NOT an ops endpoint (verified in api.d.ts). Shortlist response is `{ [key: string]: unknown }` — requires local type cast (Pitfall 2).

**Imports pattern**:
```typescript
'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@brynzit/ui/components/ui/table'
```

**Local type + safe cast** (Pitfall 2 — shortlist is `{ [key: string]: unknown }`):
```typescript
// Define local ShortlistEntry type based on supply SubmissionResponse shape:
// CRITICAL: GET /api/v1/ops/requisitions/{req_id}/shortlist returns { [key: string]: unknown }
// Cast at the fetch boundary — verified api.d.ts line 3031
type ShortlistEntry = {
  submission_id: string
  candidate_id: string
  candidate_name?: string | null
  current_title?: string | null
  fit_score?: number | null
  rank?: number | null
  status: string
}

const { data: rawShortlist } = useQuery({
  queryKey: ['ops-shortlist', reqId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET(
      '/api/v1/ops/requisitions/{req_id}/shortlist',
      { params: { path: { req_id: reqId } } },
    )
    if (error) throw error
    // Safe cast at boundary — backend returns JSONB object
    const entries = (data as Record<string, unknown>)['submissions'] as ShortlistEntry[] | undefined
    return entries ?? []
  },
})
```

**Shortlist action mutation** (Approve/Hold/Pass — supply domain PATCH, not ops):
```typescript
const actionMutation = useMutation({
  mutationFn: ({ submissionId, status }: { submissionId: string; status: string }) =>
    apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
      params: { path: { submission_id: submissionId } },
      body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-shortlist', reqId] })
  },
  onError: () => {
    toast.error('Action failed.')
  },
})
```

**Status badge color mapping** (copy icpBadgeClass pattern from `lead-detail-panel.tsx` lines 16-21):
```typescript
function shortlistStatusBadgeClass(status: string) {
  switch (status) {
    case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/40'
    case 'hold': return 'bg-amber-500/20 text-amber-700 border-amber-500/40'
    case 'passed': return 'bg-muted text-muted-foreground'
    default: return 'bg-primary/10 text-primary' // shortlisted
  }
}
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx`

**Rule:** Exact pattern clone of `lead-detail-panel.tsx`. Right-side Sheet (D-10). Lazy-fetch candidate profile when open. Shows `CandidateProfile` fields from supply domain. Sticky header + action bar.

**Imports pattern** (copy exactly from `lead-detail-panel.tsx` lines 1-14 — swap lead for candidate):
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@brynzit/ui/components/ui/sheet'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Separator } from '@brynzit/ui/components/ui/separator'
```

**Props interface** (adapt from `lead-detail-panel.tsx` lines 23-30):
```typescript
interface CandidateDetailPanelProps {
  candidateId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onLogPlacement?: (candidateId: string) => void
}
```

**Lazy fetch pattern** (copy exactly from `lead-detail-panel.tsx` lines 43-54):
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['supply-candidate', candidateId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/supply/candidates/{candidate_id}', {
      params: { path: { candidate_id: candidateId! } },
    })
    if (error) throw error
    return data
  },
  enabled: !!candidateId && isOpen,
  staleTime: 30 * 1000,
})
```

**Sheet structure** (copy exactly from `lead-detail-panel.tsx` lines 56-96):
```typescript
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent
    side="right"
    className="w-[560px] max-w-[90vw] overflow-y-auto bg-card border-l border-border p-0"
  >
    {/* Sticky header */}
    <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
      <SheetDescription className="sr-only">
        Enriched candidate profile.
      </SheetDescription>
      {isLoading ? (
        <>
          <SheetTitle className="sr-only">Candidate detail</SheetTitle>
          <Skeleton className="h-6 w-48" />
        </>
      ) : (
        <SheetTitle className="text-xl font-semibold leading-tight">
          {data?.name ?? 'Unknown Candidate'}
        </SheetTitle>
      )}
    </div>
    {/* Body */}
    <div className="flex flex-col gap-6 px-6 py-4">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : data ? (
        // candidate fields
        null
      ) : null}
    </div>
  </SheetContent>
</Sheet>
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Rule:** Lists interviews for this requisition. Inline status Select on each row (D-13). PATCH on `onValueChange`. Toast on 409 (Pitfall 5). "Create Interview" button fires POST mutation.

**Imports pattern**:
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
```

**Interview list fetch pattern** (client-scoped per requisition — same live endpoint GET /api/v1/ops/interviews/{interview_id}, but list is MSW-only if needed):
```typescript
// NOTE: No live GET /api/v1/ops/interviews list endpoint.
// For interviews scoped to a requisition, use MSW handler with ?requisition_id= param.
const { data: interviews } = useQuery({
  queryKey: ['ops-interviews', reqId],
  queryFn: async () => {
    const url = new URL(
      '/api/v1/ops/interviews',
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
    )
    url.searchParams.set('requisition_id', reqId)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('Failed to fetch interviews')
    return res.json() as Promise<components['schemas']['InterviewResponse'][]>
  },
})
```

**Inline status dropdown + PATCH** (from RESEARCH.md Pattern 3):
```typescript
const patchMutation = useMutation({
  mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
    apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
      params: { path: { interview_id: interviewId } },
      body: { status } satisfies components['schemas']['PatchInterviewRequest'],
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
  },
  onError: (err) => {
    // Pitfall 5: Backend returns 409 on invalid state transitions
    toast.error('Invalid status transition.')
    queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] }) // reset optimistic
  },
})

// Valid transitions per D-13 — only show valid next states:
const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}
```

**Create interview mutation**:
```typescript
const createMutation = useMutation({
  mutationFn: (body: components['schemas']['CreateInterviewRequest']) =>
    apiClient.POST('/api/v1/ops/interviews', { body }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    toast('Interview created.')
  },
  onError: () => {
    toast.error('Failed to create interview.')
  },
})
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx`

**Rule:** Sheet slide-over (D-14, D-15). `react-hook-form` + Zod v4. Pre-fills candidate, requisition, client from context. Checkbox for `retention_flag_90d`. POST on submit.

**Imports pattern** (combine `lead-detail-panel.tsx` imports + RHF):
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@brynzit/ui/components/ui/sheet'
import { Input } from '@brynzit/ui/components/ui/input'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
```

**Zod schema + form** (from RESEARCH.md Pattern 4 — verified against api.d.ts lines 1362-1386):
```typescript
const placementSchema = z.object({
  requisition_id: z.string().uuid(),
  candidate_id: z.string().uuid().nullable().optional(),
  fee_usd: z.number().positive().nullable().optional(),
  billing_status: z.string().min(1),   // free-form string (Pitfall 4)
  retention_flag_90d: z.boolean(),
  notes: z.string().nullable().optional(),
  confirmed_at: z.string().nullable().optional(),
})
type PlacementFormValues = z.infer<typeof placementSchema>

const form = useForm<PlacementFormValues>({
  resolver: zodResolver(placementSchema),
  defaultValues: {
    requisition_id: reqId,
    candidate_id: approvedCandidateId ?? null,
    billing_status: 'pending',
    retention_flag_90d: false,
  },
})
```

**Submit mutation**:
```typescript
const submitMutation = useMutation({
  mutationFn: (body: components['schemas']['CreatePlacementRequest']) =>
    apiClient.POST('/api/v1/ops/placements', { body }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-placements', reqId] })
    toast('Placement logged.')
    onOpenChange(false)
  },
  onError: () => {
    toast.error('Failed to log placement.')
  },
})

const onSubmit = form.handleSubmit((values) => {
  submitMutation.mutate(values as components['schemas']['CreatePlacementRequest'])
})
```

**Sheet structure** (copy `lead-detail-panel.tsx` lines 56-61 — same SheetContent props):
```typescript
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent
    side="right"
    className="w-[560px] max-w-[90vw] overflow-y-auto bg-card border-l border-border p-0"
  >
    <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
      <SheetTitle className="text-xl font-semibold">Log Placement</SheetTitle>
    </div>
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6 py-4">
      {/* fields */}
    </form>
  </SheetContent>
</Sheet>
```

---

### `apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Rule:** Read-only list of placements for this requisition. Fetch from `GET /api/v1/ops/requisitions/{req_id}/placements`. Displays fee, billing status, retention flag.

**Fetch pattern**:
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'

type PlacementResponse = components['schemas']['PlacementResponse']

const { data: placements } = useQuery({
  queryKey: ['ops-placements', reqId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET(
      '/api/v1/ops/requisitions/{req_id}/placements',
      { params: { path: { req_id: reqId } } },
    )
    if (error) throw error
    return data
  },
})
```

---

### `apps/console/app/(shell)/ops/interviews/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Rule:** Global read-heavy view (D-12). MSW-only — `GET /api/v1/ops/interviews` does not exist as a live endpoint (verified: `get?: never` in api.d.ts line 548). Filters by date/client/requisition/status using shadcn Select. Clicking a row links back to the requisition detail. Uses inline status Select for transitions (same mutation pattern as `interviews-section.tsx`).

**Imports pattern**:
```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
```

**MSW-only fetch pattern** (same as requisitions list):
```typescript
type InterviewResponse = components['schemas']['InterviewResponse']

const [statusFilter, setStatusFilter] = useState<string | null>(null)

const { data, isLoading, error } = useQuery({
  queryKey: ['ops-interviews-global', statusFilter],
  queryFn: async () => {
    // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint exists
    const url = new URL(
      '/api/v1/ops/interviews',
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
    )
    if (statusFilter) url.searchParams.set('status', statusFilter)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('Failed to fetch interviews')
    return res.json() as Promise<InterviewResponse[]>
  },
})
```

---

### `packages/mocks/src/handlers/ops.ts` (handler, request-response)

**Analog:** `packages/mocks/src/handlers/bd.ts`

**Rule:** Replace the empty `opsHandlers: HttpHandler[] = []` with a full handler suite. Follow the exact `bd.ts` file structure: imports at top, then `export const opsHandlers: HttpHandler[] = [...]`. Use `satisfies components['schemas']['...']` type assertions. Mark MSW-only handlers with `// NOTE: MSW-only — no live backend endpoint`.

**Imports pattern** (copy exactly from `bd.ts` lines 1-4):
```typescript
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'
```

**Handler suite structure** (from RESEARCH.md Pattern 6 — full handler list):
```typescript
export const opsHandlers: HttpHandler[] = [
  // --- Clients ---
  http.get(`${API_BASE}/api/v1/ops/clients`, () => {
    return HttpResponse.json([
      {
        id: '00000000-0000-0000-0000-client000001',
        name: 'Acme Corp',
        primary_contact_name: 'Jane Doe',
        primary_contact_email: 'jane@acme.com',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ] satisfies components['schemas']['ClientResponse'][])
  }),

  http.post(`${API_BASE}/api/v1/ops/clients`, async ({ request }) => {
    const body = await request.json() as components['schemas']['CreateClientRequest']
    return HttpResponse.json({
      id: crypto.randomUUID(),
      name: body.name,
      primary_contact_name: body.primary_contact_name ?? null,
      primary_contact_email: body.primary_contact_email ?? null,
      status: 'active',
      created_at: new Date().toISOString(),
    } satisfies components['schemas']['ClientResponse'], { status: 201 })
  }),

  // ... (full suite — see RESEARCH.md Pattern 6 for all endpoint stubs)

  // --- Requisitions ---
  // NOTE: MSW-only — no live GET /api/v1/ops/requisitions endpoint exists (api.d.ts get?: never)
  http.get(`${API_BASE}/api/v1/ops/requisitions`, ({ request }) => {
    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    // ... filter and return mock list
    return HttpResponse.json([/* ... */])
  }),

  // parse-jd 202 pattern (from RESEARCH.md Code Examples):
  http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/parse-jd`, ({ params }) => {
    return HttpResponse.json(
      {
        requisition_id: params.req_id as string,
        status: 'processing',
        role: '',
        seniority: null,
        skills: [],
        compensation_range: null,
        target_start_date: null,
      } satisfies components['schemas']['ParseJDResponse'],
      { status: 202 },
    )
  }),

  // --- Interviews ---
  // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint exists (api.d.ts get?: never)
  http.get(`${API_BASE}/api/v1/ops/interviews`, ({ request }) => {
    const url = new URL(request.url)
    const reqId = url.searchParams.get('requisition_id')
    const statusParam = url.searchParams.get('status')
    // ... filter and return mock list
    return HttpResponse.json([/* ... */])
  }),
]
```

**Poll cycle simulation** (copy stateful closure pattern from `bd.ts` lines 125-145 — for parse-jd polling):
```typescript
// Stateful poll counter — simulates parse completion after 2 polls
...((): HttpHandler[] => {
  const parsePollCounts: Record<string, number> = {}
  return [
    http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id`, ({ params }) => {
      const id = params.req_id as string
      parsePollCounts[id] = (parsePollCounts[id] ?? 0) + 1
      const isParsed = parsePollCounts[id] >= 2
      return HttpResponse.json({
        id,
        status: 'open',   // terminal — useAsyncJob statusMap maps 'open' → 'complete'
        title: 'Senior Engineer',
        client_id: 'mock-client-uuid',
        skills: isParsed ? ['TypeScript', 'React', 'Node.js'] : [],
        seniority: isParsed ? 'senior' : null,
        compensation_range: isParsed ? '$150k–$180k' : null,
        target_start_date: isParsed ? '2026-09-01' : null,
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies components['schemas']['RequisitionResponse'])
    }),
  ]
})(),
```

---

### `apps/console/src/__tests__/ops-*.test.tsx` (×5 test files, CRUD)

**Analog:** `apps/console/src/__tests__/lead-queue.test.tsx` and `apps/console/src/__tests__/async-flows.test.tsx`

**Rule:** Vitest + `@testing-library/react`. Logic-only tests (no DOM where avoidable). `makeWrapper()` for QueryClient. `vi.fn()` for `global.fetch`. `vi.restoreAllMocks()` in `afterEach`.

**Test wrapper pattern** (copy exactly from `async-flows.test.tsx` lines 6-11):
```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})
```

**Logic test pattern** (copy from `lead-queue.test.tsx` lines 7-19 — test pure functions, not DOM):
```typescript
// Test shortlist status badge logic (no DOM needed):
describe('Shortlist status badge (OPS-04)', () => {
  it('approved status maps to green badge class', () => {
    function shortlistStatusBadgeClass(status: string) {
      switch (status) {
        case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/40'
        case 'hold': return 'bg-amber-500/20 text-amber-700 border-amber-500/40'
        case 'passed': return 'bg-muted text-muted-foreground'
        default: return 'bg-primary/10 text-primary'
      }
    }
    expect(shortlistStatusBadgeClass('approved')).toContain('green')
    expect(shortlistStatusBadgeClass('hold')).toContain('amber')
    expect(shortlistStatusBadgeClass('passed')).toBe('bg-muted text-muted-foreground')
  })
})
```

**Async polling test** (copy from `async-flows.test.tsx` lines 18-53 — substitute JD parse statuses):
```typescript
it('useAsyncJob transitions to complete when RequisitionResponse.status=open is returned', async () => {
  let callCount = 0
  global.fetch = vi.fn().mockImplementation(() => {
    callCount++
    const status = callCount >= 2 ? 'open' : 'parsing'  // 'open' → mapped to 'complete'
    return Promise.resolve({
      ok: true,
      json: async () => ({
        id: 'req-1',
        status,
        title: 'Senior Engineer',
        client_id: 'client-1',
        skills: status === 'open' ? ['TypeScript'] : [],
        seniority: null,
        compensation_range: null,
        target_start_date: null,
        intake_details: null,
        shortlist: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })
  })

  const { useAsyncJob } = await import('@brynzit/hooks')
  const { result } = renderHook(
    () => useAsyncJob({
      jobId: 'req-1',
      endpoint: '/api/v1/ops/requisitions/{id}',
      statusMap: { open: 'complete', filled: 'complete', closed: 'complete', parsing: 'pending' },
    }),
    { wrapper: makeWrapper() },
  )

  await waitFor(() => expect(result.current.phase).toBe('complete'), { timeout: 5000 })
})
```

---

## Shared Patterns

### TanStack Query Client — Never Re-Create
**Source:** `apps/console/app/_components/console-providers.tsx`
**Apply to:** All `'use client'` files in `ops/`

```typescript
// QueryClient is at root via ConsoleProviders. NEVER create a new one in ops components:
// CORRECT:
const queryClient = useQueryClient()
// NEVER:
// const queryClient = new QueryClient(...)
```

### API Client Import Convention
**Source:** `packages/api-client/src/client.ts`
**Apply to:** All files that call backend endpoints

```typescript
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
// openapi-fetch pattern — always check error before using data:
const { data, error } = await apiClient.GET('/api/v1/...')
if (error) throw error
return data
```

### MSW-Only Fetch Pattern
**Source:** `apps/console/app/(shell)/bd/replies/page.tsx` + `sidebar-nav.tsx` lines 46-53
**Apply to:** `ops/requisitions/page.tsx`, `ops/interviews/page.tsx`, `interviews-section.tsx`

```typescript
// When no live GET endpoint exists — use raw fetch() so apiClient does not throw TS errors:
// Mark with comment: // NOTE: MSW-only — no live backend endpoint
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/ops/...`,
)
if (!res.ok) throw new Error('...')
return res.json() as Promise<SomeType>
```

### Loading + Error States
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` lines 279-295
**Apply to:** All page-level ops components

```typescript
if (isLoading) {
  return <div className="p-6"><p className="text-muted-foreground text-sm">Loading…</p></div>
}
if (error) {
  return (
    <div className="p-6">
      <p className="text-destructive text-sm">
        Couldn&apos;t load data. Check your connection or refresh the page.
      </p>
    </div>
  )
}
```

### Sonner Toast
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` lines 95-97, 124-145
**Apply to:** All mutation success/error handlers, JD parse failure (D-07)

```typescript
import { toast } from 'sonner'

// Success:
toast(`Client created — ${client.name}`)
// Error:
toast.error('Action failed.')
// JD parse failure (D-07):
toast.error('JD parsing failed — fill fields manually.')
// Interview invalid transition (Pitfall 5):
toast.error('Invalid status transition.')
```

### Sticky Page Header
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` lines 300-313
**Apply to:** All ops list pages (`clients/page.tsx`, `requisitions/page.tsx`, `interviews/page.tsx`)

```typescript
<div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/90 px-6 backdrop-blur">
  <h1 className="text-xl font-semibold">{pageTitle}</h1>
  <span className="text-sm text-muted-foreground">{count} items</span>
  {/* Actions on the right: */}
  <div className="ml-auto flex items-center gap-2">{/* ... */}</div>
</div>
```

### Skeleton Loading for Sheet Panels
**Source:** `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` lines 67-76 and 134-140
**Apply to:** `candidate-detail-panel.tsx`, `placement-panel.tsx`

```typescript
{isLoading ? (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-5/6" />
  </div>
) : data ? (
  // actual content
  null
) : null}
```

### MSW handler `satisfies` type assertion
**Source:** `packages/mocks/src/handlers/bd.ts` lines 48-52
**Apply to:** All `ops.ts` handler responses

```typescript
return HttpResponse.json({
  // fields...
} satisfies components['schemas']['SomeResponseType'])
// Use satisfies (not `as`) — catches missing/extra fields at compile time
```

### Two-Panel Independent Scroll Layout
**Source:** Derived from `lead-detail-panel.tsx` structure — see Pitfall 6 in RESEARCH.md
**Apply to:** `ops/clients/[id]/page.tsx` only

```typescript
// Parent: flex with fixed height (subtract nav bar)
// Each child: h-full overflow-y-auto — scrolls independently
<div className="flex h-[calc(100vh-3.5rem)]">
  <div className="w-[480px] shrink-0 overflow-y-auto border-r border-border p-6">
    {/* left panel */}
  </div>
  <div className="flex-1 overflow-y-auto p-6">
    {/* right panel */}
  </div>
</div>
```

---

## No Analog Found

All Phase 3 files have a clear Phase 2 analog. No greenfield patterns required.

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| — | — | — | All ops files map to established Phase 2 patterns |

---

## Critical Anti-Patterns (carry forward from Phase 2)

1. **Never use `apiClient.GET('/api/v1/ops/requisitions')` directly** — `get?: never` in api.d.ts. Use raw `fetch()` with MSW handler.
2. **Never use `apiClient.GET('/api/v1/ops/interviews')` directly** — same constraint.
3. **Never access shortlist fields without a local type cast** — response is `{ [key: string]: unknown }`.
4. **Never pass shortlist actions to an ops endpoint** — Approve/Hold/Pass use `PATCH /api/v1/supply/shortlists/{submission_id}`.
5. **Never omit `statusMap` override when calling `useAsyncJob` for JD parse** — `'open'` is not in DEFAULT_STATUS_MAP; polling will never terminate.
6. **Never render note text with `dangerouslySetInnerHTML`** — XSS risk from pasted Slack/WhatsApp content.

---

## Metadata

**Analog search scope:** `apps/console/`, `packages/hooks/`, `packages/mocks/`, `packages/api-client/`
**Files scanned:** 9 source files read directly + 1 Phase 2 PATTERNS.md
**Pattern extraction date:** 2026-06-14
