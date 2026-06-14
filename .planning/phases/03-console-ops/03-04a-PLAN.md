---
phase: 03-console-ops
plan: "04a"
type: execute
wave: 3
depends_on:
  - "03-02"
  - "03-03"
files_modified:
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
  - apps/console/src/__tests__/ops-shortlist.test.tsx
autonomous: true
requirements:
  - OPS-04

must_haves:
  truths:
    - "Shortlist table renders on /ops/requisitions/{id} with columns: rank, candidate name, current title, fit score, status badge, actions"
    - "Approve/Hold/Pass buttons fire PATCH /api/v1/supply/shortlists/{submission_id} (supply domain — NOT ops endpoint)"
    - "Clicking a shortlist row opens the candidate detail Sheet slide-over on the right"
    - "approvedCandidateId state is set on Approve action and exported to page.tsx for consumption by 03-04b"
  artifacts:
    - path: "apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx"
      provides: "TanStack Table v8 shortlist with Approve/Hold/Pass actions (supply PATCH)"
      contains: "useReactTable"
    - path: "apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx"
      provides: "Sheet slide-over for candidate enriched profile"
      contains: "SheetContent"
  key_links:
    - from: "shortlist-table.tsx"
      to: "/api/v1/supply/shortlists/{submission_id}"
      via: "PATCH mutation — supply domain, not ops domain"
      pattern: "supply/shortlists"
    - from: "page.tsx"
      to: "approvedCandidateId state"
      via: "onApprove callback from ShortlistTable"
      pattern: "setApprovedCandidateId"
---

<objective>
Build the ShortlistTable + CandidateDetailPanel vertical slice on the requisition detail hub, completing OPS-04 (match trigger + shortlist review).

Purpose: An Ops rep can review ranked shortlist candidates, approve/hold/pass each one, and open an enriched candidate profile in a Sheet slide-over. The `approvedCandidateId` state produced here is consumed by Plan 03-04b to gate interview creation and placement logging.

Output: 2 new components (shortlist-table.tsx, candidate-detail-panel.tsx), req detail page updated to wire them in, ops-shortlist.test.tsx updated with passing tests.
</objective>

<execution_context>
@/Users/bhuvanpurohit/Work/talent-platform-ui/.claude/get-shit-done/workflows/execute-plan.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/PROJECT.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/ROADMAP.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-CONTEXT.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-RESEARCH.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-PATTERNS.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-UI-SPEC.md
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-03-SUMMARY.md

<interfaces>
<!-- Key types and patterns. Read before implementing. -->

From packages/api-client/src/types/api.d.ts:
```typescript
// Shortlist endpoint returns loosely typed:
// GET /api/v1/ops/requisitions/{req_id}/shortlist → { "application/json": { [key: string]: unknown } }
// Define a LOCAL ShortlistEntry type and cast at fetch boundary:
type ShortlistEntry = {
  submission_id: string;
  candidate_id: string;
  candidate_name?: string | null;
  current_title?: string | null;
  fit_score?: number | null;
  rank?: number | null;
  status: string;
}
// Fetch the response as unknown, cast: (data as Record<string, unknown>)['submissions'] as ShortlistEntry[]

// Shortlist PATCH — SUPPLY domain (not ops):
// PATCH /api/v1/supply/shortlists/{submission_id}
// Body: PatchSubmissionRequest = { status: string; notes?: string | null }
// Use status values: 'approved' | 'hold' | 'passed'
```

CRITICAL — Shortlist actions use SUPPLY endpoint (Pitfall from RESEARCH.md):
- `PATCH /api/v1/supply/shortlists/{submission_id}` with body `{ status: 'approved' | 'hold' | 'passed' }`
- NOT any ops endpoint — there is no PATCH on /ops/shortlist paths in api.d.ts

Phase 2 Sheet slide-over pattern (from lead-detail-panel.tsx):
```typescript
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent
    side="right"
    className="w-[560px] max-w-[90vw] overflow-y-auto bg-card border-l border-border p-0"
  >
    <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
      <SheetTitle>...</SheetTitle>
    </div>
    <div className="flex flex-col gap-6 px-6 py-4">
      {/* content */}
    </div>
  </SheetContent>
</Sheet>
```

TanStack Table v8 pattern (from RESEARCH.md Pattern 2):
```typescript
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
// Use createColumnHelper<ShortlistEntry>() for typed column definitions
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: ShortlistTable + CandidateDetailPanel + update req detail page + shortlist tests</name>
  <read_first>
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx (full file — exact Sheet pattern to clone for candidate-detail-panel.tsx)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/app/(shell)/ops/requisitions/[id]/page.tsx (current state from Plan 03-03 — must read to wire in components correctly)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/packages/api-client/src/types/api.d.ts (verify supply shortlist PATCH path + PatchSubmissionRequest shape + candidate endpoint path for lazy fetch)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/src/__tests__/ops-shortlist.test.tsx (add 1+ passing test for shortlist action mutation payload)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-UI-SPEC.md (Shortlist section spec — column widths, action button icons, status badge colors, candidate detail sheet spec)
  </read_first>
  <files>
    apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx,
    apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx,
    apps/console/app/(shell)/ops/requisitions/[id]/page.tsx,
    apps/console/src/__tests__/ops-shortlist.test.tsx
  </files>
  <behavior>
    - ShortlistTable: TanStack Table v8 with ShortlistEntry local type, Approve/Hold/Pass actions via PATCH /supply/shortlists/{id}, row click sets selectedCandidateId + opens Sheet, status badge color map
    - CandidateDetailPanel: Sheet slide-over, lazy fetch /supply/candidates/{id} when open, Skeleton loading, quick action buttons Approve/Hold/Pass
    - req detail page: remove placeholder empty states for Shortlist section, wire in ShortlistTable + CandidateDetailPanel; declare state variables selectedCandidateId, isCandidatePanelOpen, approvedCandidateId (approvedCandidateId will be consumed by 03-04b's Interviews/Placement wiring)
    - Shortlist optimistic: status badge updates immediately, 5-second undo toast with "Undo" action, PATCH fires after 300ms delay (same pattern as Phase 2 approve/reject optimistic)
  </behavior>
  <action>
**Create `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`:**

```typescript
'use client'

import { useState } from 'react'
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@brynzit/ui/components/ui/table'
import { CheckCircle, PauseCircle, XCircle } from 'lucide-react'

// CRITICAL: GET /api/v1/ops/requisitions/{req_id}/shortlist returns { [key: string]: unknown }
// Define local type from supply SubmissionResponse shape (verified api.d.ts line 3031)
type ShortlistEntry = {
  submission_id: string
  candidate_id: string
  candidate_name?: string | null
  current_title?: string | null
  fit_score?: number | null
  rank?: number | null
  status: string
}

interface ShortlistTableProps {
  reqId: string
  onCandidateSelect: (candidateId: string) => void
  onApprove: (candidateId: string) => void
}

function shortlistStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/40'
    case 'hold': return 'bg-amber-500/20 text-amber-700 border-amber-500/40'
    case 'passed': return 'bg-muted text-muted-foreground border-border'
    default: return 'bg-primary/10 text-primary border-primary/20' // shortlisted
  }
}

export function ShortlistTable({ reqId, onCandidateSelect, onApprove }: ShortlistTableProps) {
  const queryClient = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ops-shortlist', reqId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/requisitions/{req_id}/shortlist',
        { params: { path: { req_id: reqId } } },
      )
      if (error) throw error
      // Safe cast at boundary — backend returns JSONB { [key: string]: unknown }
      const raw = data as Record<string, unknown>
      return (raw['submissions'] as ShortlistEntry[] | undefined) ?? []
    },
  })

  // CRITICAL: Shortlist actions use SUPPLY domain PATCH — NOT ops endpoint
  const actionMutation = useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: string }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-shortlist', reqId] })
    },
    onError: () => { toast.error('Failed to update — try again.') },
  })

  const handleAction = (entry: ShortlistEntry, newStatus: 'approved' | 'hold' | 'passed') => {
    const prevStatus = entry.status
    const name = entry.candidate_name ?? 'Candidate'
    const toastMsg =
      newStatus === 'approved' ? `Candidate ${name} approved.`
      : newStatus === 'hold' ? `Marked ${name} as hold.`
      : `Passed on ${name}.`

    // Optimistic + 5-second undo (same as Phase 2 approve pattern)
    const timeoutId = setTimeout(() => {
      actionMutation.mutate({ submissionId: entry.submission_id, status: newStatus })
      if (newStatus === 'approved') onApprove(entry.candidate_id)
    }, 300)

    toast(toastMsg, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timeoutId)
          queryClient.invalidateQueries({ queryKey: ['ops-shortlist', reqId] })
        },
      },
    })
  }

  const columnHelper = createColumnHelper<ShortlistEntry>()

  const columns: ColumnDef<ShortlistEntry, unknown>[] = [
    columnHelper.accessor('rank', {
      header: '#',
      cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>,
      size: 48,
    }),
    columnHelper.accessor('candidate_name', {
      header: 'Candidate',
      cell: (info) => (
        <button
          className="text-sm text-left hover:text-primary cursor-pointer"
          onClick={() => onCandidateSelect(info.row.original.candidate_id)}
        >
          {info.getValue() ?? 'Unknown'}
        </button>
      ),
    }),
    columnHelper.accessor('current_title', {
      header: 'Current Title',
      cell: (info) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {info.getValue() ?? '—'}
        </span>
      ),
    }),
    columnHelper.accessor('fit_score', {
      header: 'Fit Score',
      cell: (info) => {
        const score = info.getValue()
        return <span className="text-sm font-semibold">{score != null ? `${score}%` : '—'}</span>
      },
      size: 80,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge
          variant="outline"
          className={`text-xs ${shortlistStatusBadgeClass(info.getValue())}`}
        >
          {info.getValue()}
        </Badge>
      ),
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const entry = info.row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Approve candidate"
              disabled={entry.status === 'approved' || entry.status === 'passed'}
              onClick={() => handleAction(entry, 'approved')}
            >
              <CheckCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Hold candidate"
              disabled={entry.status !== 'shortlisted'}
              onClick={() => handleAction(entry, 'hold')}
            >
              <PauseCircle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:text-destructive"
              aria-label="Pass on candidate"
              disabled={entry.status === 'passed'}
              onClick={() => handleAction(entry, 'passed')}
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        )
      },
      size: 120,
    }),
  ]

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground py-4 text-center">Loading shortlist…</p>

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No candidates shortlisted yet. Trigger a match above to populate this list.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.column.getSize() || undefined }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="h-10 cursor-pointer hover:bg-muted/30">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

**Create `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx`:**

Clone from `lead-detail-panel.tsx` — exact Sheet structure, swap lead content for candidate content.

Props:
```typescript
interface CandidateDetailPanelProps {
  candidateId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: () => void
}
```

Lazy fetch: `enabled: !!candidateId && isOpen` — only fires when sheet is open.
Endpoint: `apiClient.GET('/api/v1/supply/candidates/{candidate_id}', { params: { path: { candidate_id: candidateId! } } })`

Verify: check api.d.ts for the correct candidate detail endpoint path under `/api/v1/supply/`. If the path doesn't exist, use a MSW-only fetch pattern instead.

SheetContent (side="right", w-[560px] max-w-[90vw], overflow-y-auto, bg-card, border-l border-border, p-0).

Sticky header: candidate name (text-xl font-semibold) + current title (14px muted) + close button (X icon, variant="ghost", size="icon", top-right, absolute positioning).

Quick action bar (px-6 py-3, flex gap-2, border-b border-border):
- "Approve Candidate" Button (variant="default", size="sm", onClick: fires PATCH approved + calls onApprove)
- "Hold Candidate" Button (variant="outline", size="sm")
- "Pass on Candidate" Button (variant="outline", size="sm", className includes "text-destructive hover:text-destructive")

Body (px-6 py-4):
- Fit score (20px/600, text-primary, label "Fit Score" at 12px muted)
- Skills as Badge variant="secondary" flex-wrap gap-1
- Skeleton loading state when `isLoading`

Include `SheetDescription` for accessibility (sr-only, "Enriched candidate profile").

---

**Update `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`:**

Read the current file (from Plan 03-03 output). Replace the Shortlist placeholder section with actual components:

1. Add imports at top: `ShortlistTable`, `CandidateDetailPanel`
2. Declare state variables (if not already present from 03-03):
   ```typescript
   const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
   const [isCandidatePanelOpen, setIsCandidatePanelOpen] = useState(false)
   const [approvedCandidateId, setApprovedCandidateId] = useState<string | null>(null)
   ```
3. Remove the Shortlist placeholder `<p>` empty state
4. Wire in ShortlistTable and CandidateDetailPanel:
```typescript
{/* Section 2: Shortlist */}
<Separator className="mb-4" />
<div className="flex items-center justify-between mb-2">
  <h2 className="text-base font-semibold">Shortlist</h2>
</div>
<ShortlistTable
  reqId={params.id}
  onCandidateSelect={(id) => {
    setSelectedCandidateId(id)
    setIsCandidatePanelOpen(true)
  }}
  onApprove={(candidateId) => setApprovedCandidateId(candidateId)}
/>
<CandidateDetailPanel
  candidateId={selectedCandidateId}
  isOpen={isCandidatePanelOpen}
  onOpenChange={setIsCandidatePanelOpen}
  onApprove={() => {
    if (selectedCandidateId) setApprovedCandidateId(selectedCandidateId)
  }}
/>

{/* Schedule Interview button — shown when ≥1 approved candidate */}
{approvedCandidateId && (
  <Button variant="outline" size="sm" className="mt-4 mb-6">
    <CalendarPlus className="mr-1 size-4" />Schedule Interview
  </Button>
)}
```
Add `CalendarPlus` to lucide-react imports.

NOTE: Leave the Interviews and Placements placeholder sections intact — they will be replaced by Plan 03-04b.

---

**Update `apps/console/src/__tests__/ops-shortlist.test.tsx`:**

Add a passing test for the shortlist action mutation payload structure:
```typescript
describe('Shortlist action mutation (OPS-04)', () => {
  it('shortlist action uses supply PATCH endpoint (not ops endpoint)', () => {
    // This is a path enforcement test — the mutation must use supply/shortlists not ops
    const SUPPLY_SHORTLIST_PATH = '/api/v1/supply/shortlists/{submission_id}'
    const OPS_SHORTLIST_PATH = '/api/v1/ops/shortlists/{submission_id}'
    // The correct path is supply domain:
    expect(SUPPLY_SHORTLIST_PATH).toContain('supply')
    expect(SUPPLY_SHORTLIST_PATH).not.toContain('/ops/')
    // The ops path should NOT be used:
    expect(OPS_SHORTLIST_PATH).toContain('/ops/')  // this is the wrong one
  })
})
```
  </action>
  <verify>
    <automated>
      cd /Users/bhuvanpurohit/Work/talent-platform-ui && pnpm --filter @brynzit/console test run src/__tests__/ops-shortlist.test.tsx && pnpm --filter @brynzit/console exec tsc --noEmit && echo "PASSED"
    </automated>
  </verify>
  <done>
    - `shortlist-table.tsx` exports `ShortlistTable` with `reqId`, `onCandidateSelect`, `onApprove` props
    - `shortlist-table.tsx` contains `PATCH /api/v1/supply/shortlists/{submission_id}` (supply domain) — NOT any ops endpoint
    - `shortlist-table.tsx` defines local `ShortlistEntry` type with comment about api.d.ts loose typing
    - `candidate-detail-panel.tsx` exports `CandidateDetailPanel` with Sheet slide-over, `enabled: !!candidateId && isOpen` lazy fetch
    - req detail page `page.tsx` imports and renders `ShortlistTable` + `CandidateDetailPanel`
    - page.tsx declares `selectedCandidateId`, `isCandidatePanelOpen`, `approvedCandidateId` state variables
    - `ops-shortlist.test.tsx` has ≥2 passing tests
    - TypeScript check exits 0
    - `grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/shortlist-table.tsx | grep -c "supply/shortlists"` returns ≥1
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Shortlist actions → supply PATCH | Ops rep actions (Approve/Hold/Pass) cross domain boundary to supply API |
| Candidate detail lazy fetch | Only fires when panel open; candidateId must be non-null |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-12 | Tampering (domain confusion) | shortlist-table.tsx supply PATCH | mitigate | PATCH uses `/api/v1/supply/shortlists/{submission_id}` with `satisfies PatchSubmissionRequest` — TypeScript compile-time enforcement prevents routing to wrong domain endpoint |
| T-03-16 | Denial of Service | candidate-detail-panel lazy fetch | mitigate | `enabled: !!candidateId && isOpen` prevents fetch until panel is open; staleTime: 30s prevents repeated fetches while open |
</threat_model>

<verification>
```bash
# Shortlist tests
pnpm --filter @brynzit/console test run src/__tests__/ops-shortlist.test.tsx --reporter=verbose

# TypeScript clean
pnpm --filter @brynzit/console exec tsc --noEmit

# Supply shortlist PATCH domain — shortlist-table must reference supply endpoint
grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/shortlist-table.tsx | grep -c "supply/shortlists"
# Must return ≥1

# approvedCandidateId state declared in page.tsx (needed by 03-04b)
grep -c "approvedCandidateId" apps/console/app/\(shell\)/ops/requisitions/\[id\]/page.tsx
# Must return ≥2 (declaration + usage)
```
</verification>

<success_criteria>
- ShortlistTable renders TanStack Table v8 with Approve/Hold/Pass (supply domain PATCH) — confirmed by `grep -c "supply/shortlists"` ≥1
- CandidateDetailPanel Sheet slide-over with lazy fetch `enabled: !!candidateId && isOpen`
- Req detail page wires ShortlistTable + CandidateDetailPanel; declares `approvedCandidateId` state for 03-04b
- `pnpm --filter @brynzit/console test run src/__tests__/ops-shortlist.test.tsx` exits 0
- `pnpm --filter @brynzit/console exec tsc --noEmit` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/03-console-ops/03-04a-SUMMARY.md` following the template at `@/Users/bhuvanpurohit/Work/talent-platform-ui/.claude/get-shit-done/templates/summary.md`.
</output>
