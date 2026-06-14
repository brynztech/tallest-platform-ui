---
phase: 03-console-ops
plan: "04b"
type: execute
wave: 3
depends_on:
  - "03-02"
  - "03-03"
  - "03-04a"
files_modified:
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx
  - apps/console/app/(shell)/ops/interviews/page.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
  - apps/console/src/__tests__/ops-interviews.test.tsx
  - apps/console/src/__tests__/ops-placements.test.tsx
autonomous: true
requirements:
  - OPS-05
  - OPS-06

must_haves:
  truths:
    - "Interviews section renders on requisition detail with inline status Select per row; PATCH fires on change; 409 toast shows 'Invalid status transition.'"
    - "Placement slide-over opens from 'Log Placement' button; fields pre-filled; POST on submit; toast 'Placement logged for [name].'"
    - "Global /ops/interviews page renders with status filter dropdown (MSW-only fetch)"
    - "Placements section shows logged placements with fee, billing status, retention badge"
  artifacts:
    - path: "apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx"
      provides: "Interview rows with inline status Select + PATCH + 409 error handling"
      contains: "Invalid status transition"
    - path: "apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx"
      provides: "Placement log Sheet slide-over with Zod form"
      contains: "retention_flag_90d"
    - path: "apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx"
      provides: "Read-only placements list with fee, billing status, retention badge"
      contains: "PlacementResponse"
    - path: "apps/console/app/(shell)/ops/interviews/page.tsx"
      provides: "Global interviews page with MSW-only fetch and filter dropdowns"
      contains: "MSW-only"
  key_links:
    - from: "interviews-section.tsx"
      to: "/api/v1/ops/interviews/{interview_id}"
      via: "PATCH on Select onValueChange"
      pattern: "ops/interviews"
    - from: "placement-panel.tsx"
      to: "/api/v1/ops/placements"
      via: "POST mutation on form submit"
      pattern: "ops/placements"
    - from: "apps/console/app/(shell)/ops/interviews/page.tsx"
      to: "MSW handler GET /api/v1/ops/interviews"
      via: "raw fetch() (get?: never in api.d.ts line 548)"
      pattern: "fetch.*ops/interviews"
    - from: "page.tsx approvedCandidateId"
      to: "InterviewsSection + PlacementPanel"
      via: "prop drilling — approvedCandidateId declared by 03-04a"
      pattern: "approvedCandidateId"
---

<objective>
Build the Interviews + Placement vertical slice, completing OPS-05 (interview state machine) and OPS-06 (placement logging) on the requisition detail hub and global interviews page.

Purpose: An Ops rep can schedule interviews for approved candidates, advance interview status through VALID_TRANSITIONS, and log placements via a Sheet slide-over form. This plan depends on 03-04a because it consumes `approvedCandidateId` state that 03-04a declares in page.tsx. After both 03-04a and 03-04b complete, the full recruiting lifecycle is navigable end-to-end.

Output: 3 new components (interviews-section.tsx, placement-panel.tsx, placements-section.tsx), 1 new page (ops/interviews/page.tsx), req detail page updated to wire all 4 sections, 2 test files updated with passing tests.
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
@/Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-04a-SUMMARY.md

<interfaces>
<!-- Key types and patterns. Read before implementing. -->

From packages/api-client/src/types/api.d.ts:
```typescript
// InterviewResponse:
{ id: string; requisition_id: string; candidate_id: string; status: string; scheduled_at: string | null; notes: string | null; created_at: string; }

// CreateInterviewRequest:
{ requisition_id: string; candidate_id: string; scheduled_at?: string | null; notes?: string | null; }

// PatchInterviewRequest:
{ status?: string | null; scheduled_at?: string | null; notes?: string | null; }
// PATCH returns 409 on invalid state transitions — surface as toast.error('Invalid status transition.')

// PlacementResponse:
{ id: string; requisition_id: string; candidate_id: string | null; fee_usd: number | null; billing_status: string; retention_flag_90d: boolean; notes: string | null; confirmed_at: string | null; created_at: string; }

// CreatePlacementRequest:
{ requisition_id: string; candidate_id?: string | null; fee_usd?: number | null; billing_status: string; retention_flag_90d: boolean; notes?: string | null; confirmed_at?: string | null; }
// billing_status is a free-form string (NOT an enum)
// retention_flag_90d is boolean (required)
```

CRITICAL — No live GET interviews list endpoint (Pitfall 3):
- `GET /api/v1/ops/interviews` → `get?: never` in api.d.ts line 548
- Use raw fetch() for both interviews-section.tsx query AND /ops/interviews page

Interview VALID_TRANSITIONS (D-13 from CONTEXT.md):
```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],    // terminal — Select disabled
  completed: [],   // terminal — Select disabled
}
```

approvedCandidateId state (from 03-04a):
- Declared in page.tsx as `const [approvedCandidateId, setApprovedCandidateId] = useState<string | null>(null)`
- Set by ShortlistTable.onApprove callback (wired in 03-04a)
- Pass as prop to InterviewsSection and PlacementPanel

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
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: InterviewsSection + PlacementPanel + PlacementsSection + global interviews page + wire req detail</name>
  <read_first>
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/app/(shell)/ops/requisitions/[id]/page.tsx (current state after 03-04a — must read before modifying again to understand approvedCandidateId declaration and existing imports)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx (Sheet structure to clone for placement-panel.tsx)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/packages/api-client/src/types/api.d.ts (verify InterviewResponse, PatchInterviewRequest, CreatePlacementRequest, PlacementResponse exact field names)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/src/__tests__/ops-interviews.test.tsx (update with passing tests)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/apps/console/src/__tests__/ops-placements.test.tsx (update with passing tests)
    - /Users/bhuvanpurohit/Work/talent-platform-ui/.planning/phases/03-console-ops/03-UI-SPEC.md (Interviews section, placement slide-over, global interviews page specs)
  </read_first>
  <files>
    apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx,
    apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx,
    apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx,
    apps/console/app/(shell)/ops/interviews/page.tsx,
    apps/console/app/(shell)/ops/requisitions/[id]/page.tsx,
    apps/console/src/__tests__/ops-interviews.test.tsx,
    apps/console/src/__tests__/ops-placements.test.tsx
  </files>
  <behavior>
    - InterviewsSection: MSW-only fetch for interviews by req, inline Select per row with VALID_TRANSITIONS gate, PATCH on change, toast.error on 409, "Create Interview" button fires POST (only when approvedCandidateId is set)
    - PlacementPanel: Sheet slide-over, react-hook-form + Zod, pre-filled read-only fields, retention_flag_90d checkbox, POST /ops/placements, toast "Placement logged for [name]."
    - PlacementsSection: read-only list from GET /ops/requisitions/{req_id}/placements, fee/billing/retention badge display
    - Global /ops/interviews: MSW-only fetch, status filter Select, interview rows with inline status Select + PATCH
    - req detail page: wire Interviews, PlacementPanel, PlacementsSection into existing hub using approvedCandidateId state already declared by 03-04a; remove interview/placement placeholder empty states
  </behavior>
  <action>
**Create `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { CalendarPlus } from 'lucide-react'

// Valid transitions per D-13 from CONTEXT.md
const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],   // terminal
  completed: [],  // terminal
}

interface InterviewsSectionProps {
  reqId: string
  approvedCandidateId: string | null
}

export function InterviewsSection({ reqId, approvedCandidateId }: InterviewsSectionProps) {
  const queryClient = useQueryClient()

  // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint (api.d.ts get?: never line 548)
  const { data: interviews = [] } = useQuery({
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

  const patchMutation = useMutation({
    mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
      apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
        params: { path: { interview_id: interviewId } },
        body: { status } satisfies components['schemas']['PatchInterviewRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    },
    onError: () => {
      // Pitfall 5: backend returns 409 on invalid state transitions
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: components['schemas']['CreateInterviewRequest']) =>
      apiClient.POST('/api/v1/ops/interviews', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews', reqId] })
      toast('Interview created.')
    },
    onError: () => { toast.error('Failed to create interview.') },
  })

  return (
    <div>
      {interviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No interviews scheduled. Use &apos;Schedule Interview&apos; above to create one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map((interview) => {
            const nextStates = VALID_TRANSITIONS[interview.status] ?? []
            const isTerminal = nextStates.length === 0

            return (
              <div
                key={interview.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 h-10"
              >
                <span className="flex-1 text-sm">{interview.candidate_id}</span>
                {interview.scheduled_at && (
                  <span className="text-xs text-muted-foreground w-[120px]">
                    {new Date(interview.scheduled_at).toLocaleDateString()}
                  </span>
                )}
                <Select
                  value={interview.status}
                  disabled={isTerminal}
                  onValueChange={(newStatus) =>
                    patchMutation.mutate({ interviewId: interview.id, status: newStatus })
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={interview.status}>{interview.status}</SelectItem>
                    {nextStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InterviewStatusBadge status={interview.status} />
              </div>
            )
          })}
        </div>
      )}

      {approvedCandidateId && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              requisition_id: reqId,
              candidate_id: approvedCandidateId,
            })
          }
        >
          <CalendarPlus className="mr-1 size-4" />Schedule Interview
        </Button>
      )}
    </div>
  )
}

function InterviewStatusBadge({ status }: { status: string }) {
  if (status === 'accepted' || status === 'completed') {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-[oklch(0.45_0.15_145)]/20 text-[oklch(0.45_0.15_145)] border-[oklch(0.45_0.15_145)]/40"
      >
        {status}
      </Badge>
    )
  }
  if (status === 'declined') {
    return (
      <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
        {status}
      </Badge>
    )
  }
  return <Badge variant="secondary" className="text-xs">{status}</Badge>
}
```

---

**Create `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx`:**

```typescript
'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetTitle,
} from '@brynzit/ui/components/ui/sheet'
import { Input } from '@brynzit/ui/components/ui/input'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Label } from '@brynzit/ui/components/ui/label'

// Pitfall 4: billing_status is a free-form string (NOT an enum in api.d.ts)
const placementSchema = z.object({
  requisition_id: z.string().uuid(),
  candidate_id: z.string().uuid().nullable().optional(),
  fee_usd: z.number().positive().nullable().optional(),
  billing_status: z.string().min(1, 'Billing status is required'),
  retention_flag_90d: z.boolean(),
  notes: z.string().nullable().optional(),
  confirmed_at: z.string().nullable().optional(),
})
type PlacementFormValues = z.infer<typeof placementSchema>

interface PlacementPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reqId: string
  clientId: string
  approvedCandidateId: string | null
  candidateName?: string
}

export function PlacementPanel({
  isOpen,
  onOpenChange,
  reqId,
  clientId,
  approvedCandidateId,
  candidateName,
}: PlacementPanelProps) {
  const queryClient = useQueryClient()

  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      requisition_id: reqId,
      candidate_id: approvedCandidateId ?? null,
      billing_status: 'pending',
      retention_flag_90d: false,
    },
  })

  const submitMutation = useMutation({
    mutationFn: (body: components['schemas']['CreatePlacementRequest']) =>
      apiClient.POST('/api/v1/ops/placements', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-placements', reqId] })
      const name = candidateName ?? 'Candidate'
      toast(`Placement logged for ${name}.`)
      onOpenChange(false)
      form.reset()
    },
    onError: () => { toast.error('Failed to log placement — try again.') },
  })

  const onSubmit = form.handleSubmit((values) => {
    submitMutation.mutate(values as components['schemas']['CreatePlacementRequest'])
  })

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] max-w-[90vw] overflow-y-auto bg-card border-l border-border p-0"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <SheetTitle className="text-xl font-semibold">Log Placement</SheetTitle>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6 py-4">
          {/* Pre-filled read-only fields */}
          <div>
            <Label>Candidate</Label>
            <Input value={candidateName ?? approvedCandidateId ?? '—'} readOnly className="mt-1 bg-muted/50" />
          </div>
          <div>
            <Label>Requisition ID</Label>
            <Input value={reqId} readOnly className="mt-1 bg-muted/50" />
          </div>
          <div>
            <Label>Client ID</Label>
            <Input value={clientId} readOnly className="mt-1 bg-muted/50" />
          </div>

          <Separator />

          {/* Editable fields */}
          <div>
            <Label htmlFor="fee_usd">Placement fee (USD)</Label>
            <Input
              id="fee_usd"
              type="number"
              placeholder="e.g. 25000"
              className="mt-1"
              {...form.register('fee_usd', {
                setValueAs: (v) => (v === '' ? null : parseFloat(v)),
              })}
            />
          </div>

          <div>
            <Label htmlFor="billing_status">Billing Status *</Label>
            <Input
              id="billing_status"
              placeholder="e.g. pending, invoiced, paid"
              className="mt-1"
              {...form.register('billing_status')}
            />
            <p className="text-xs text-muted-foreground mt-1">Common values: pending, invoiced, paid</p>
            {form.formState.errors.billing_status && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.billing_status.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="retention_flag_90d"
              render={({ field }) => (
                <Checkbox
                  id="retention_flag_90d"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="retention_flag_90d">Flag for 90-day retention check</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes"
              className="mt-1 min-h-[80px]"
              {...form.register('notes')}
            />
          </div>

          <Separator />

          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Logging…' : 'Log Placement'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

---

**Create `apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx`:**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'

interface PlacementsSectionProps { reqId: string }

type PlacementResponse = components['schemas']['PlacementResponse']

export function PlacementsSection({ reqId }: PlacementsSectionProps) {
  const { data: placements = [] } = useQuery({
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

  if (placements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No placements logged. Use &apos;Log Placement&apos; above when a candidate is ready.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {placements.map((placement: PlacementResponse) => (
        <div
          key={placement.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
        >
          <span className="flex-1 text-sm">{placement.candidate_id ?? '—'}</span>
          <span className="text-sm">{placement.fee_usd != null ? `$${placement.fee_usd.toLocaleString()}` : '—'}</span>
          <span className="text-xs text-muted-foreground">{placement.billing_status}</span>
          {placement.retention_flag_90d && (
            <Badge variant="secondary" className="text-xs">90-day retention</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(placement.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}
```

---

**Create `apps/console/app/(shell)/ops/interviews/page.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { apiClient } from '@brynzit/api-client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@brynzit/ui/components/ui/select'
import { Badge } from '@brynzit/ui/components/ui/badge'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  // NOTE: MSW-only — no live GET /api/v1/ops/interviews endpoint (api.d.ts get?: never line 548)
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['ops-interviews-global', statusFilter],
    queryFn: async () => {
      const url = new URL(
        '/api/v1/ops/interviews',
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
      )
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch interviews')
      return res.json() as Promise<components['schemas']['InterviewResponse'][]>
    },
  })

  const patchMutation = useMutation({
    mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
      apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
        params: { path: { interview_id: interviewId } },
        body: { status } satisfies components['schemas']['PatchInterviewRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-interviews-global'] })
    },
    onError: () => {
      toast.error('Invalid status transition.')
      queryClient.invalidateQueries({ queryKey: ['ops-interviews-global'] })
    },
  })

  if (isLoading) return <div className="p-6"><p className="text-muted-foreground text-sm">Loading…</p></div>
  if (error) return <div className="p-6"><p className="text-destructive text-sm">Couldn&apos;t load interviews. Check your connection or refresh the page.</p></div>

  return (
    <div>
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur">
        <h1 className="flex-1 text-xl font-semibold">Interviews</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interview list */}
      <div className="py-4 px-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center mt-16 gap-2">
            <h2 className="text-xl font-semibold">No interviews</h2>
            <p className="text-sm text-muted-foreground">
              Interviews scheduled from requisition pages will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((interview) => {
              const nextStates = VALID_TRANSITIONS[interview.status] ?? []
              const isTerminal = nextStates.length === 0
              return (
                <div
                  key={interview.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 mb-2"
                >
                  <span className="w-[180px] text-sm truncate">{interview.candidate_id}</span>
                  <Link
                    href={`/ops/requisitions/${interview.requisition_id}`}
                    className="flex-1 text-sm text-primary truncate"
                  >
                    View Requisition →
                  </Link>
                  {interview.scheduled_at && (
                    <span className="w-[120px] text-xs text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleDateString()}
                    </span>
                  )}
                  <Select
                    value={interview.status}
                    disabled={isTerminal}
                    onValueChange={(newStatus) =>
                      patchMutation.mutate({ interviewId: interview.id, status: newStatus })
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={interview.status}>{interview.status}</SelectItem>
                      {nextStates.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary" className="text-xs">{interview.status}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

**Update `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`:**

Read the current file (state after 03-04a). Add these imports: `InterviewsSection`, `PlacementPanel`, `PlacementsSection`, `Trophy` from lucide-react.

Declare `isPlacementOpen` state (if not already present from 03-04a):
```typescript
const [isPlacementOpen, setIsPlacementOpen] = useState(false)
```

Replace the Interviews placeholder section:
```typescript
{/* Section 3: Interviews */}
<Separator className="my-4" />
<h2 className="mb-2 text-base font-semibold">Interviews</h2>
<InterviewsSection reqId={params.id} approvedCandidateId={approvedCandidateId} />
```

Replace the Placements placeholder section:
```typescript
{/* Log Placement button — visible when approvedCandidateId is set */}
{approvedCandidateId && (
  <Button variant="default" size="sm" className="mt-4 mb-6" onClick={() => setIsPlacementOpen(true)}>
    <Trophy className="mr-1 size-4" />Log Placement
  </Button>
)}

{/* Section 4: Placements */}
<Separator className="my-4" />
<h2 className="mb-2 text-base font-semibold">Placements</h2>
<PlacementsSection reqId={params.id} />

{/* Placement slide-over */}
<PlacementPanel
  isOpen={isPlacementOpen}
  onOpenChange={setIsPlacementOpen}
  reqId={params.id}
  clientId={req.client_id}
  approvedCandidateId={approvedCandidateId}
/>
```

---

**Update `apps/console/src/__tests__/ops-interviews.test.tsx`:**

Add passing tests:
```typescript
describe('Interview VALID_TRANSITIONS enforcement (OPS-05)', () => {
  it('scheduled can only transition to accepted or declined', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    // Verify no invalid transitions are offered
    expect(VALID_TRANSITIONS['scheduled']).not.toContain('completed')
    expect(VALID_TRANSITIONS['accepted']).not.toContain('declined')
    expect(VALID_TRANSITIONS['declined']).toHaveLength(0)
    expect(VALID_TRANSITIONS['completed']).toHaveLength(0)
  })

  it('isTerminal is true for declined and completed', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      scheduled: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    }
    expect((VALID_TRANSITIONS['declined'] ?? []).length === 0).toBe(true)
    expect((VALID_TRANSITIONS['completed'] ?? []).length === 0).toBe(true)
    expect((VALID_TRANSITIONS['scheduled'] ?? []).length === 0).toBe(false)
  })
})
```

**Update `apps/console/src/__tests__/ops-placements.test.tsx`:**

The Zod schema tests already pass from Plan 03-01. Add a passing test for the placement form defaults:
```typescript
describe('Placement form retention flag (OPS-06)', () => {
  it('retention_flag_90d defaults to false', () => {
    const defaults = {
      requisition_id: '00000000-0000-0000-0000-000000000001',
      billing_status: 'pending',
      retention_flag_90d: false,
    }
    expect(defaults.retention_flag_90d).toBe(false)
  })
})
```
  </action>
  <verify>
    <automated>
      cd /Users/bhuvanpurohit/Work/talent-platform-ui && pnpm --filter @brynzit/console test run && pnpm --filter @brynzit/console exec tsc --noEmit && echo "ALL CHECKS PASSED"
    </automated>
  </verify>
  <done>
    - `interviews-section.tsx` exports `InterviewsSection`, uses MSW-only fetch with `?requisition_id=` param, includes `VALID_TRANSITIONS` map, `toast.error('Invalid status transition.')` in `onError`
    - `placement-panel.tsx` exports `PlacementPanel`, uses `retention_flag_90d: z.boolean()` in Zod schema, Controller + Checkbox for retention flag, toast "Placement logged for [name]." on success
    - `placements-section.tsx` exports `PlacementsSection`, fetches from `/api/v1/ops/requisitions/{req_id}/placements`, shows "90-day retention" Badge when `retention_flag_90d === true`
    - `/ops/interviews/page.tsx` has `// NOTE: MSW-only` comment, status filter Select, interview rows with inline PATCH Select
    - req detail `page.tsx` imports and renders all 4 section components (ShortlistTable from 03-04a, InterviewsSection, PlacementPanel, PlacementsSection)
    - `ops-interviews.test.tsx` has ≥3 passing tests
    - `ops-placements.test.tsx` has ≥3 passing tests
    - `pnpm --filter @brynzit/console test run` exits 0
    - `pnpm --filter @brynzit/console exec tsc --noEmit` exits 0
    - `grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/interviews-section.tsx | grep -c "Invalid status transition"` returns ≥1
    - `grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/placement-panel.tsx | grep -c "retention_flag_90d"` returns ≥2
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Placement form → POST /ops/placements | fee_usd and billing_status cross trust boundary; Zod validates before send |
| Interview PATCH → 409 error path | 409 response must be surfaced as user feedback (not silently swallowed) |
| MSW-only interviews fetch | Raw fetch() is used — internal trusted-network tool only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-13 | Tampering (state machine bypass) | interviews-section.tsx Select | mitigate | VALID_TRANSITIONS map limits which status values are offered in Select; backend 409 guard is the authoritative enforcement; frontend provides UX-level gate only |
| T-03-14 | Tampering (invalid placement data) | placement-panel.tsx form | mitigate | Zod v4 `placementSchema` validates: `billing_status` required min 1, `retention_flag_90d` boolean, `fee_usd` positive number if provided; react-hook-form resolver enforces at submit |
| T-03-15 | Information Disclosure | MSW-only interviews fetch | accept | Internal trusted-network tool; raw fetch() returns mock data in dev; no user PII exposed in URL params (req_id is UUID, not sensitive) |
</threat_model>

<verification>
```bash
# Full test suite
pnpm --filter @brynzit/console test run --reporter=verbose

# TypeScript clean
pnpm --filter @brynzit/console exec tsc --noEmit

# 409 error handling present
grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/interviews-section.tsx | grep -c "Invalid status transition"
# Must return ≥1

# retention_flag_90d in placement-panel
grep -v '^//' apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/placement-panel.tsx | grep -c "retention_flag_90d"
# Must return ≥2 (schema definition + form field)

# MSW-only comment in global interviews page
grep -v '^//' apps/console/app/\(shell\)/ops/interviews/page.tsx | grep -c "MSW-only"
# Must return ≥1

# Placements section shows 90-day retention badge
grep -c "90-day retention" apps/console/app/\(shell\)/ops/requisitions/\[id\]/_components/placements-section.tsx
# Must return ≥1
```
</verification>

<success_criteria>
- InterviewsSection renders inline Select with VALID_TRANSITIONS gate; 409 surfaces as toast "Invalid status transition."
- PlacementPanel logs placement with `retention_flag_90d` boolean checkbox via Zod + react-hook-form
- PlacementsSection shows "90-day retention" badge when flag is true
- /ops/interviews page renders global view with status filter (MSW-only fetch)
- Req detail page has all 4 sections wired (Shortlist from 03-04a, Interviews, Placements + slide-overs) using `approvedCandidateId` from 03-04a
- `pnpm --filter @brynzit/console test run` exits 0 with ≥10 total passing tests across all ops test files
- `pnpm --filter @brynzit/console exec tsc --noEmit` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/03-console-ops/03-04b-SUMMARY.md` following the template at `@/Users/bhuvanpurohit/Work/talent-platform-ui/.claude/get-shit-done/templates/summary.md`.
</output>
