# Phase 4: Console Supply + Admin — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 18 new/modified files
**Analogs found:** 18 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/console/app/(shell)/_components/sidebar-nav.tsx` | component | request-response | self (modify) | exact |
| `apps/console/app/(shell)/supply/search/page.tsx` | page | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` | exact |
| `apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx` | exact |
| `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx` | component | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` (inline filter logic) | role-match |
| `apps/console/app/(shell)/supply/search/_components/use-candidate-search.ts` | hook | request-response | `apps/console/app/(shell)/bd/leads/page.tsx` (inline query) | role-match |
| `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx` | component | request-response | `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx` | exact |
| `apps/console/app/(shell)/supply/ingest/page.tsx` | page | file-I/O | `apps/console/app/(shell)/bd/imports/page.tsx` | exact |
| `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx` | component | request-response | `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` | role-match |
| `apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx` | component | file-I/O | `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` | exact |
| `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` | component | file-I/O | `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` | exact |
| `apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx` | component | request-response | `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` (status card block) | exact |
| `apps/console/app/(shell)/supply/engagements/page.tsx` | page | request-response | `apps/console/app/(shell)/bd/outreach/page.tsx` | exact |
| `apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx` | component | request-response | `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` | exact |
| `apps/console/app/(shell)/admin/page.tsx` | page | request-response | `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` (Suspense + 'use client' shell) | role-match |
| `apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx` | component | request-response | `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` | role-match |
| `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx` | component | CRUD | `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` | exact |
| `apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx` | component | CRUD | `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` | role-match |
| `apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx` | component | request-response | `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` (badge/status pattern) | role-match |
| `apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx` | component | request-response | `apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx` | role-match |
| `apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx` | component | CRUD | `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` (dirty state + save) | role-match |
| `packages/mocks/src/handlers/supply.ts` | mock-handler | request-response | `packages/mocks/src/handlers/ops.ts` | exact |
| `packages/mocks/src/handlers/monitoring.ts` | mock-handler | request-response | `packages/mocks/src/handlers/bd.ts` | exact |
| `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` | page | request-response | self (modify — swap CandidateDetailPanel import) | exact |

---

## Pattern Assignments

### `apps/console/app/(shell)/_components/sidebar-nav.tsx` (component, request-response)

**Analog:** self — in-place modification

**Current nav constant pattern** (lines 11–30):
```typescript
// BD_NAV and OPS_NAV are fully wired constants; STUB_SECTIONS holds dimmed placeholders.
// Phase 4: add SUPPLY_NAV and ADMIN_NAV using the same shape; remove Supply + Admin from STUB_SECTIONS.

const BD_NAV = [
  { href: '/bd/leads', label: 'Leads', badgeKey: 'leads-count' as const },
  // ...
] as const

const STUB_SECTIONS = [
  { label: 'Supply', items: ['Candidates', 'Shortlists', 'Engagements'] },
  { label: 'Admin', items: ['Costs', 'Events', 'Quotas', 'Prompts'] },
] as const
```

**Nav section render pattern** (lines 139–161):
```typescript
// Ops section — copy this block twice for Supply and Admin:
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

**Phase 4 change:** Add before `STUB_SECTIONS`:
```typescript
const SUPPLY_NAV = [
  { href: '/supply/search', label: 'Candidates' },
  { href: '/supply/ingest', label: 'Ingest' },
  { href: '/supply/engagements', label: 'Engagements' },
] as const

const ADMIN_NAV = [
  { href: '/admin', label: 'Admin' },
] as const
```
Remove `{ label: 'Supply', ... }` and `{ label: 'Admin', ... }` entries from `STUB_SECTIONS`.

---

### `apps/console/app/(shell)/supply/search/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/page.tsx`

**Imports pattern** (lines 1–13):
```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { LeadCard } from './_components/lead-card'
import { LeadDetailPanel } from './_components/lead-detail-panel'
// → Replace with CandidateResultCard, CandidateProfileSheet, FilterSidebar
```

**Query pattern with explicit-submit gate** (lines 31–48 — adapted for search):
```typescript
// The key difference from leads: query uses useState(false) gate instead of infinite query.
// submittedFilters is a SEPARATE state from live form — only updated on submit click.
const [submittedFilters, setSubmittedFilters] = useState<SearchFilters | null>(null)
const [searchSubmitted, setSearchSubmitted] = useState(false)

const { data, isLoading } = useQuery({
  queryKey: ['supply-search', submittedFilters],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/supply/candidates/search', {
      params: {
        query: {
          q: submittedFilters?.q ?? '',   // required — always send even if empty
          skills: submittedFilters?.skills || undefined,
          location: submittedFilters?.location || undefined,
          seniority: submittedFilters?.seniority || undefined,
          top_k: submittedFilters?.limit ?? 10,
        }
      }
    })
    if (error) throw error
    return data  // TalentPoolSearchResponse: { results: CandidateSearchResult[], total: number }
  },
  enabled: searchSubmitted && !!submittedFilters,
  staleTime: 30 * 1000,
})
```

**Keyboard nav pattern** (lines 174–252 — copy directly, adapt key handlers):
```typescript
// J/K/Enter/? pattern — identical structure to leads page.
// Replace 'approve'/'reject' handlers with openDetail/shortlistAdd handlers.
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const activeEl = document.activeElement
    const isInputFocused =
      activeEl instanceof HTMLInputElement ||
      activeEl instanceof HTMLTextAreaElement ||
      (activeEl as HTMLElement)?.isContentEditable
    if (isInputFocused || isDetailOpen || isShortcutOpen) return
    // ... switch cases for j/k/Enter/?
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isDetailOpen, isShortcutOpen, focusedIndex, results])
```

**Layout pattern** — flex h-[calc(100vh-3.5rem)] with left sidebar + right scrollable column (NOT the leads page column layout — use split-panel like the UI-SPEC):
```typescript
return (
  <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
    <FilterSidebar onSubmit={handleSubmit} isLoading={isLoading} />
    <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
      {/* sticky results header with count + active filter chips */}
      {/* results list gap-2 px-4 py-4 */}
    </div>
  </div>
)
```

---

### `apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/leads/_components/lead-card.tsx`

**Full imports + component structure** (lines 1–10, 36–48):
```typescript
'use client'

import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@/lib/utils'
import { MapPin, Github, CheckCircle } from 'lucide-react'

type CandidateSearchResult = components['schemas']['CandidateSearchResult']

interface CandidateResultCardProps {
  candidate: CandidateSearchResult
  rank: number          // position in results array (0-indexed → display as rank+1)
  isFocused: boolean
  onOpenDetail: (id: string) => void
}
```

**Card root pattern** (lines 62–80 of lead-card.tsx):
```typescript
// Copy focused ring + role + tabIndex + onClick pattern:
<div
  role="article"
  tabIndex={0}
  onClick={() => onOpenDetail(candidate.candidate_id)}
  onKeyDown={(e) => { if (e.key === 'Enter') onOpenDetail(candidate.candidate_id) }}
  className={cn(
    'relative cursor-pointer rounded-xl border bg-card px-4 py-3 transition-all',
    'focus:outline-none',
    isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
  )}
>
```

**Rank badge pattern** (adapts ICP badge from lines 105–107):
```typescript
// ICP badge in lead-card: px-2.5 py-1 with icpBadgeClass color function
// Rank badge: same outer shape, color only for top-3, muted for others
{rank <= 2 ? (
  <Badge className="shrink-0 text-xs font-semibold px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
    #{rank + 1}
  </Badge>
) : (
  <span className="text-xs text-muted-foreground shrink-0">#{rank + 1}</span>
)}
```

**Multi-row card body pattern** (lines 116–139 of lead-card.tsx — translate to candidate fields):
```typescript
// Row 1: rank badge + name + availability badge (ml-auto)
// Row 2: "title at company" (mt-0.5 text-sm text-muted-foreground)
// Row 3: location (MapPin) + top 3 skills badges (gap-4 mt-2)
// Row 4: match reason text (text-xs muted, line-clamp-2, mt-2 — only if present)
// Row 5: secondary badges (email verified, github repos — only if present)
```

---

### `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx`

**Full imports pattern** (lines 1–17 of candidate-detail-panel.tsx):
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@brynzit/ui/components/ui/sheet'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { toast } from 'sonner'
import { X, Sparkles, MapPin, Github, Mail, CheckCircle, ExternalLink, Download } from 'lucide-react'
```

**Props interface** (lines 19–25 — extend with Phase 4 props):
```typescript
interface CandidateProfileSheetProps {
  candidateId: string | null
  submissionId?: string | null   // for shortlist PATCH (source="shortlist")
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  source?: 'search' | 'shortlist'
  requisitionId?: string
}
```

**Lazy query pattern** (lines 37–49 — copy exactly):
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['supply-candidate', candidateId],
  queryFn: async () => {
    const { data, error } = await apiClient.GET(
      '/api/v1/supply/candidates/{candidate_id}',
      { params: { path: { candidate_id: candidateId! } } },
    )
    if (error) throw error
    return data
  },
  enabled: !!candidateId && isOpen,
  staleTime: 30 * 1000,
})
```

**Shortlist action mutation** (lines 52–69 — copy exactly for source="shortlist"):
```typescript
const actionMutation = useMutation({
  mutationFn: ({ status }: { status: string }) =>
    apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
      params: { path: { submission_id: submissionId! } },
      body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
    queryClient.invalidateQueries({ queryKey: ['supply-shortlist'] })
  },
  onError: () => {
    toast.error('Failed to update — try again.')
  },
})
```

**Sheet root + sticky header** (lines 76–113 — copy structure):
```typescript
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent
    side="right"
    className="w-[560px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
  >
    {/* Sticky header with name, title, Enrich button, X close */}
    <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
      <SheetDescription className="sr-only">Enriched candidate profile.</SheetDescription>
      {isLoading ? (
        <>
          <SheetTitle className="sr-only">Candidate detail</SheetTitle>
          <Skeleton className="h-6 w-48" />
        </>
      ) : (
        <div className="flex flex-1 min-w-0 flex-col">
          <SheetTitle className="text-xl font-semibold leading-tight">
            {candidate?.name ?? 'Unknown Candidate'}
          </SheetTitle>
          {talentPool?.current_title && (
            <p className="mt-0.5 text-sm text-muted-foreground">{talentPool.current_title}</p>
          )}
        </div>
      )}
      {/* Enrich button — only when needsEnrichment and not enriching */}
      <Button variant="ghost" size="icon" className="absolute right-4 top-4 size-8"
        onClick={() => onOpenChange(false)} aria-label="Close candidate panel">
        <X className="size-4" />
      </Button>
    </div>
    {/* Quick action bar — only when source="shortlist" and submissionId set */}
    {/* Body — flex flex-col gap-6 px-6 py-4 */}
  </SheetContent>
</Sheet>
```

**Enrichment detection pattern** (from 04-RESEARCH.md Pattern 2):
```typescript
// DO NOT use useAsyncJob for enrichment — CandidateProfileResponse has no .status field.
// Manual polling via setInterval + queryClient.fetchQuery:
const [isEnriching, setIsEnriching] = useState(false)
const queryClient = useQueryClient()

useEffect(() => {
  if (!isEnriching || !candidateId) return
  const interval = setInterval(async () => {
    await queryClient.invalidateQueries({ queryKey: ['supply-candidate', candidateId] })
    const cached = queryClient.getQueryData(['supply-candidate', candidateId]) as
      components['schemas']['CandidateProfileResponse'] | undefined
    const tp = cached?.talent_pool
    if (tp?.email_verified !== null || tp?.github_public_repos !== null) {
      setIsEnriching(false)
      toast.success('Candidate enriched.')
    }
  }, 2000)
  const timeout = setTimeout(() => setIsEnriching(false), 30000)
  return () => { clearInterval(interval); clearTimeout(timeout) }
}, [isEnriching, candidateId, queryClient])

// Enrichment detection: show Enrich button when both are null
const needsEnrichment =
  talentPool?.github_public_repos == null && talentPool?.email_verified == null
```

**Skeleton shimmer during enrichment** (from candidate-detail-panel.tsx lines 148–154 pattern):
```typescript
// While isEnriching=true, replace GitHub/Contact sections with Skeleton:
{isEnriching ? (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
) : (
  /* enriched content */
)}
```

**Placement note:** `CandidateProfileSheet` belongs at `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx` (shell-level shared component, not inside `/supply/` or `/ops/`). The Phase 3 `candidate-detail-panel.tsx` import in `ops/requisitions/[id]/page.tsx` is swapped for this shared component.

---

### `apps/console/app/(shell)/supply/ingest/page.tsx` (page, file-I/O)

**Analog:** `apps/console/app/(shell)/bd/imports/page.tsx`

**Page shell pattern** (lines 1–18 of imports/page.tsx):
```typescript
'use client'

import { useState } from 'react'
import { Separator } from '@brynzit/ui/components/ui/separator'
// Add: import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'

export default function IngestPage() {
  // Local state array — no API list endpoint for jobs (RESEARCH.md A4)
  const [jobs, setJobs] = useState<IngestJob[]>([])

  return (
    <div className="overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Ingest Candidates</h1>
      </div>
      {/* shadcn Tabs for LinkedIn | CSV | Resume */}
      <Separator className="my-6" />
      {/* Recent Jobs section */}
      <h2 className="mb-4 text-base font-semibold">Recent Jobs</h2>
      <div className="flex flex-col gap-2">
        {jobs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent ingest jobs. Submit above to get started.
          </p>
        ) : (
          jobs.map((job) => <IngestJobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  )
}
```

---

### `apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx` and `resume-form.tsx` (component, file-I/O)

**Analog:** `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx`

**Dropzone + native fetch pattern** (lines 1–58):
```typescript
'use client'

import { useDropzone } from 'react-dropzone'
import { cn } from '@brynzit/ui/lib/utils'
import { UploadCloud } from 'lucide-react'

// CRITICAL: native fetch, NOT apiClient.POST — browser sets multipart boundary automatically
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/candidates/ingest/csv`,
  { method: 'POST', body: formData },
  // No Content-Type header
)

// Dropzone root props pattern:
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'text/csv': ['.csv'] },   // CSV form
  // accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], ... } // Resume form
  maxFiles: 1,
  onDropRejected: (rejections) => {
    setUploadError(rejections[0]?.errors[0]?.message ?? 'File type not accepted.')
  },
  onDrop: async (acceptedFiles) => { /* ... native fetch ... */ },
})

// Dropzone area visual pattern (lines 129–146):
<div
  {...getRootProps()}
  className={cn(
    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors',
    isDragActive
      ? 'border-primary bg-primary/5 text-primary'
      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
  )}
>
  <input {...getInputProps()} />
  <UploadCloud className="mb-3 h-8 w-8" />
  {isDragActive ? (
    <p className="text-sm font-medium">Drop file here</p>
  ) : (
    <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
  )}
</div>
```

**Resume form difference:** endpoint is `/api/v1/supply/resumes/upload` (202), response has `task_id`. After POST, set job card to "processing" state and poll until candidate_id appears. CSV is 200 (sync) — set job card to "done" immediately.

---

### `apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` (status card block, lines 67–122)

**Status card pattern** (lines 67–122 of import-dropzone.tsx):
```typescript
// The BD ImportDropzone renders a status card after upload. Extract this as IngestJobCard:
<div className="rounded-xl border border-border bg-card p-6">
  <div className="flex items-start justify-between gap-4">
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{job.label}</p>  {/* "LinkedIn", "CSV Import", "Resume Upload" */}
      <div className="flex items-center gap-2">
        {job.status === 'processing' && (
          <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">...</svg>
            Processing
          </Badge>
        )}
        {job.status === 'done' && (
          <Badge className="text-xs text-white" style={{ backgroundColor: 'oklch(0.45 0.15 145)' }}>
            Done
          </Badge>
        )}
        {job.status === 'failed' && (
          <Badge variant="destructive" className="text-xs">Failed</Badge>
        )}
        {job.status === 'queued' && (
          <Badge variant="outline" className="text-xs">Queued</Badge>
        )}
        <span className="text-sm text-muted-foreground">{job.progressText}</span>
      </div>
    </div>
  </div>
</div>
```

---

### `apps/console/app/(shell)/supply/engagements/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/bd/outreach/page.tsx`

**Page shell + list query pattern** (lines 1–80 of outreach/page.tsx):
```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'

export default function EngagementsPage() {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // NOTE: engagements list requires iterating candidates — use a flat mock or
  // a dedicated endpoint. For Phase 4 MSW: GET /api/v1/supply/engagements (MSW-only list).
  const { data, isLoading, error } = useQuery({
    queryKey: ['supply-engagements'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/engagements`,
      )
      if (!res.ok) throw new Error('Failed to fetch engagement sequences')
      return res.json() as Promise<{ sequences: components['schemas']['EngagementSequenceResponse'][] }>
    },
  })

  // Empty state + list pattern (lines 58–79 of outreach/page.tsx):
  if (sequences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center">
        <h2 className="text-xl font-semibold">No engagement sequences</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate sequences from candidate profiles in search results.
        </p>
      </div>
    )
  }
}
```

---

### `apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx` (component, request-response)

**Analog:** `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx`

**StepEditor pattern** (lines 25–96 of sequence-editor.tsx — copy nearly verbatim):
```typescript
// Each step is a bordered card with subject Input + body textarea:
<div className="rounded-lg border border-border p-4">
  <div className="mb-3 flex items-center justify-between">
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Step {step.step_index} — Day {step.scheduled_day}
    </span>
  </div>
  <div className="flex flex-col gap-3">
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Subject</label>
      <Input value={subject} onChange={...} className="text-sm" />
    </div>
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Body</label>
      <textarea value={body} onChange={...} rows={5}
        className={cn(
          'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none',
        )}
      />
    </div>
  </div>
</div>
```

**Approve/Reject mutation pattern** (lines 109–149 of sequence-editor.tsx):
```typescript
// Supply engagement approve — use apiClient.POST (typed) instead of native fetch:
const approveMutation = useMutation({
  mutationFn: () =>
    apiClient.POST('/api/v1/supply/engagement/{sequence_id}/approve', {
      params: { path: { sequence_id: sequence.id } },
    }),
  onSuccess: () => {
    toast('Sequence approved.')
    queryClient.invalidateQueries({ queryKey: ['supply-engagements'] })
    onOpenChange(false)
  },
  onError: () => toast.error('Approval failed — try again.'),
})

// CRITICAL: if steps were edited locally, PATCH first, then POST approve:
// 1. PATCH /api/v1/supply/engagement/{id} with { steps: editedSteps }
// 2. Then POST /api/v1/supply/engagement/{id}/approve

// Reject uses 5-second undo toast (CUX-02) — same as shortlist actions:
// toast('Sequence rejected.', { duration: 5000, action: { label: 'Undo', onClick: clearTimeout } })
// After 5s: POST /api/v1/supply/engagement/{id}/reject
```

**Sheet wrapper** (from lead-detail-panel.tsx pattern — same Sheet/SheetContent structure):
```typescript
// EngagementSequenceSheet wraps the sequence editor in a Sheet (w-[600px]):
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent side="right"
    className="w-[600px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0">
    {/* Sticky header: "Engagement Sequence" label (muted uppercase) + candidate name (20px/600) + X */}
    {/* Action bar: Approve Sequence + Reject Sequence buttons (when status="draft") */}
    {/* Body: flex flex-col gap-4 px-6 py-4 — StepEditor cards */}
  </SheetContent>
</Sheet>
```

---

### `apps/console/app/(shell)/admin/page.tsx` (page, request-response)

**Analog:** `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx` (Suspense + 'use client' shell)

**Suspense boundary pattern** (from 04-RESEARCH.md Pattern 5 — Pitfall 7):
```typescript
// admin/page.tsx — outer shell, handles Suspense for useSearchParams
import { Suspense } from 'react'
import { AdminContent } from './_components/admin-content'  // or inline

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminContent />
    </Suspense>
  )
}

// AdminContent (inline or separate file) is 'use client':
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'

export function AdminContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get('tab') ?? 'overview'

  function handleTabChange(value: string) {
    router.push(`${pathname}?tab=${value}`)
  }

  return (
    <div className="overflow-y-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><AdminOverviewTab /></TabsContent>
        {/* ... */}
      </Tabs>
    </div>
  )
}
```

**Params usage pattern** (from `ops/requisitions/[id]/page.tsx` lines 19–25):
```typescript
// Next.js 16: params is a Promise in 'use client' pages — unwrap with React.use()
// Admin page has no dynamic segments, so no params needed. Use useSearchParams instead.
```

---

### `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`

**TanStack Table v8 imports + setup** (lines 1–26 of shortlist-table.tsx):
```typescript
'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@brynzit/ui/components/ui/table'

type AgentEventOut = components['schemas']['AgentEventOut']
const columnHelper = createColumnHelper<AgentEventOut>()
```

**Column definition pattern** (lines 145–254 of shortlist-table.tsx):
```typescript
// Use any[] to avoid TypeScript contravariance issues (same workaround as shortlist-table.tsx line 150):
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
  columnHelper.accessor('created_at', {
    header: 'Timestamp',
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {new Date(info.getValue()).toLocaleString()}
      </span>
    ),
    size: 140,
  }),
  columnHelper.accessor('domain', { header: 'Domain', size: 100 }),
  // ... task_type, model, tokens_in/out, cost_usd, duration_ms, status
]

const table = useReactTable({
  data: events,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

**Table render pattern** (lines 278–318 of shortlist-table.tsx — copy exactly):
```typescript
<div className="overflow-hidden rounded-lg border border-border">
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
        <TableRow key={row.id} className="h-10">
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
```

**Pagination + limit+offset query** (from 04-RESEARCH.md Pattern for ADM-02):
```typescript
const [offset, setOffset] = useState(0)
const [filters, setFilters] = useState({ domain: '', status: '' })
const [taskTypeFilter, setTaskTypeFilter] = useState('')  // client-side only
const LIMIT = 25

const { data: events = [] } = useQuery({
  queryKey: ['monitoring-events', filters, offset],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/monitoring/agent-events', {
      params: { query: { domain: filters.domain || undefined, status: filters.status || undefined, limit: LIMIT, offset } }
    })
    if (error) throw error
    return data  // AgentEventOut[]
  },
})

// task_type is client-side filter only (no API param on /monitoring/agent-events):
const displayedEvents = taskTypeFilter
  ? events.filter(e => e.task_type?.includes(taskTypeFilter))
  : events
```

---

### `apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx` (component, CRUD)

**Analog:** `apps/console/app/(shell)/bd/outreach/_components/sequence-editor.tsx` (dirty state + save pattern)

**Dirty state + mutation pattern** (from 04-RESEARCH.md Pattern 6):
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Button } from '@brynzit/ui/components/ui/button'
import { toast } from 'sonner'
import { Save, RotateCcw } from 'lucide-react'

// Hardcoded prompt names (no list endpoint — see RESEARCH.md Pitfall 6):
const KNOWN_PROMPTS = ['icp_scoring', 'outreach_generation', 'jd_parse', 'engagement_generation']

// Dirty state tracked locally, NOT via react-hook-form isDirty
// (content comparison is simpler than RHF for a single textarea):
const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null)
const [editedContent, setEditedContent] = useState('')

const { data: promptData } = useQuery({
  queryKey: ['prompt', selectedPromptName],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/monitoring/prompts/{name}', {
      params: { path: { name: selectedPromptName! } }
    })
    if (error) throw error
    return data  // PromptContentResponse: { name, content, versions[] }
  },
  enabled: !!selectedPromptName,
})

// Sync editedContent when prompt data loads (reset dirty state):
useEffect(() => {
  if (promptData?.content !== undefined) {
    setEditedContent(promptData.content)
  }
}, [promptData?.content, selectedPromptName])

const isDirty = editedContent !== (promptData?.content ?? '')

const saveMutation = useMutation({
  mutationFn: ({ name, content }: { name: string; content: string }) =>
    apiClient.PUT('/api/v1/monitoring/prompts/{name}', {
      params: { path: { name } },
      body: { content } satisfies components['schemas']['PromptSaveRequest'],
    }),
  onSuccess: () => {
    toast.success('Prompt saved.')
    queryClient.invalidateQueries({ queryKey: ['prompt', selectedPromptName] })
  },
  onError: () => toast.error('Failed to save prompt — try again.'),
})
```

**Split-view layout** (mirrors BD outreach expanded content layout but as persistent panels):
```typescript
<div className="flex h-[calc(100vh-14rem)] gap-0">
  {/* Left: prompt list — w-[280px] border-r */}
  <div className="flex w-[280px] flex-shrink-0 flex-col overflow-y-auto border-r border-border">
    <div className="border-b border-border px-3 py-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompts</span>
    </div>
    {KNOWN_PROMPTS.map((name) => (
      <button key={name} onClick={() => setSelectedPromptName(name)}
        className={cn('px-3 py-2.5 rounded-md cursor-pointer flex items-center gap-2 text-left',
          selectedPromptName === name
            ? 'bg-accent/50 text-foreground font-medium border-l-2 border-primary pl-[10px]'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}>
        <span className="flex-1 truncate text-sm">{name}</span>
        {/* amber dot if active + dirty */}
      </button>
    ))}
  </div>

  {/* Right: editor — flex-1 */}
  <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
    <Textarea
      className="min-h-[400px] w-full resize-y font-mono text-sm bg-muted/30"
      value={editedContent}
      onChange={(e) => setEditedContent(e.target.value)}
      placeholder="Select a prompt from the list to view and edit"
      disabled={!selectedPromptName}
    />
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="outline" size="sm" disabled={!isDirty} onClick={handleReset}>
        <RotateCcw className="mr-1 size-4" /> Reset
      </Button>
      <Button size="sm" disabled={!isDirty || saveMutation.isPending}
        onClick={() => selectedPromptName && saveMutation.mutate({ name: selectedPromptName, content: editedContent })}>
        <Save className="mr-1 size-4" />
        {saveMutation.isPending ? 'Saving…' : 'Save Prompt'}
      </Button>
    </div>
  </div>
</div>
```

---

### `packages/mocks/src/handlers/supply.ts` (mock-handler, request-response)

**Analog:** `packages/mocks/src/handlers/ops.ts` (full handler suite structure)

**Handler file structure** (lines 1–9 of ops.ts):
```typescript
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

// Supply domain MSW handlers.
// MSW only activates when NEXT_PUBLIC_API_MOCKING=enabled.
export const supplyHandlers: HttpHandler[] = [

  // GET /api/v1/supply/candidates/search
  http.get(`${API_BASE}/api/v1/supply/candidates/search`, ({ request }) => {
    const url = new URL(request.url)
    const top_k = parseInt(url.searchParams.get('top_k') ?? '10')
    return HttpResponse.json({
      results: mockCandidates.slice(0, top_k),
      total: mockCandidates.length,
    } satisfies components['schemas']['TalentPoolSearchResponse'])
  }),

  // POST /api/v1/supply/candidates/:candidate_id/enrich
  http.post(`${API_BASE}/api/v1/supply/candidates/:candidate_id/enrich`,
    () => HttpResponse.json({}, { status: 202 }),
  ),

  // POST /api/v1/supply/candidates/ingest (LinkedIn — 201 sync)
  http.post(`${API_BASE}/api/v1/supply/candidates/ingest`, async ({ request }) => {
    const body = await request.json() as { linkedin_url: string }
    void body
    return HttpResponse.json(
      { candidate_id: crypto.randomUUID(), name: 'Mock Candidate', source: 'linkedin' },
      { status: 201 },
    )
  }),

  // ... all supply endpoints
]
```

**Path ordering critical rule** (from bd.ts lines 55–62 comment):
```typescript
// Register specific paths BEFORE wildcard :param paths — MSW uses first-match-wins.
// Example: /supply/candidates/ingest BEFORE /supply/candidates/:candidate_id
// Example: /supply/candidates/search BEFORE /supply/candidates/:candidate_id
```

**satisfies pattern** (from bd.ts lines 48–52, ops.ts lines 32–49):
```typescript
// Always use `satisfies` with the schema type for compile-time safety:
return HttpResponse.json(
  { ... } satisfies components['schemas']['TalentPoolSearchResponse']
)
// Use status option for non-200 codes:
return HttpResponse.json({ ... }, { status: 202 })
return HttpResponse.json({ ... }, { status: 201 })
```

---

### `packages/mocks/src/handlers/monitoring.ts` (mock-handler, request-response)

**Analog:** `packages/mocks/src/handlers/bd.ts` (same file structure as ops.ts)

**Handler file structure:**
```typescript
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

export const monitoringHandlers: HttpHandler[] = [

  // GET /api/v1/monitoring/cost?period=
  http.get(`${API_BASE}/api/v1/monitoring/cost`, ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') ?? 'month'
    void period
    return HttpResponse.json({
      rows: [
        { domain: 'bd', model_used: 'gpt-4o', task_type: 'icp_scoring', total_usd: 1.23, call_count: 45 },
        { domain: 'ops', model_used: 'gpt-4o-mini', task_type: 'jd_parse', total_usd: 0.12, call_count: 8 },
      ],
      total_usd: 1.35,
    } satisfies components['schemas']['CostResponse'])
  }),

  // GET /api/v1/monitoring/quota
  http.get(`${API_BASE}/api/v1/monitoring/quota`, () =>
    HttpResponse.json({
      model: 'gpt-4o',
      used_tokens: 48000,
      cap_tokens: 100000,
      percent: 48,
      warning: false,
    } satisfies components['schemas']['QuotaResponse'])
  ),

  // GET /api/v1/monitoring/prompts/:name
  http.get(`${API_BASE}/api/v1/monitoring/prompts/:name`, ({ params }) =>
    HttpResponse.json({
      name: params.name as string,
      content: `You are an AI agent. Task: ${params.name as string}.\n\nInstructions here.`,
      versions: ['v1'],
    } satisfies components['schemas']['PromptContentResponse'])
  ),

  // PUT /api/v1/monitoring/prompts/:name
  http.put(`${API_BASE}/api/v1/monitoring/prompts/:name`, async ({ params, request }) => {
    const body = await request.json() as components['schemas']['PromptSaveRequest']
    return HttpResponse.json({
      name: params.name as string,
      content: body.content,
      saved_at: new Date().toISOString(),
    } satisfies components['schemas']['PromptSaveResponse'])
  }),
]
```

---

## Shared Patterns

### Sheet Slide-Over
**Source:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx` lines 76–114
**Apply to:** `CandidateProfileSheet`, `EngagementSequenceSheet`
```typescript
<Sheet open={isOpen} onOpenChange={onOpenChange}>
  <SheetContent
    side="right"
    className="w-[560px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
  >
    <SheetDescription className="sr-only">...</SheetDescription>
    {/* Sticky header: sticky top-0 z-10 bg-card/95 backdrop-blur px-6 py-4 border-b */}
    {/* Action bar: flex gap-2 border-b px-6 py-3 */}
    {/* Body: flex flex-col gap-6 px-6 py-4 */}
  </SheetContent>
</Sheet>
```

### Undo Toast (5-second)
**Source:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` lines 100–143
**Apply to:** `EngagementSequenceSheet` (reject), `CandidateProfileSheet` shortlist actions
```typescript
const [pendingTimeouts] = useState(() => new Map<string, ReturnType<typeof setTimeout>>())

const timeoutId = setTimeout(() => {
  pendingTimeouts.delete(entry.submission_id)
  actionMutation.mutate(...)
}, 5000)

pendingTimeouts.set(entry.submission_id, timeoutId)

toast(toastMsg, {
  duration: 5000,
  action: {
    label: 'Undo',
    onClick: () => {
      const t = pendingTimeouts.get(entry.submission_id)
      if (t) { clearTimeout(t); pendingTimeouts.delete(entry.submission_id) }
      queryClient.invalidateQueries(...)
    },
  },
})
```

### Spinner SVG (inline, no import needed)
**Source:** `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` lines 77–79
**Apply to:** All loading states in ingest job cards, enriching state
```typescript
<svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
```

### Native Fetch for Multipart
**Source:** `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` lines 43–56
**Apply to:** `csv-form.tsx`, `resume-form.tsx`
```typescript
// IMPORTANT: Use native fetch, NOT apiClient.POST for multipart
const formData = new FormData()
formData.append('file', file)
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/...`,
  { method: 'POST', body: formData },
  // No Content-Type header — browser sets multipart/form-data boundary automatically
)
if (!res.ok) {
  const text = await res.text()
  setUploadError(`Upload failed (${res.status}). ${text.slice(0, 200)}`)
  return
}
```

### TanStack Query Stale Time Convention
**Source:** Throughout `lead-detail-panel.tsx`, `candidate-detail-panel.tsx`, `shortlist-table.tsx`
**Apply to:** All `useQuery` calls in Phase 4
```typescript
// Profile/detail data: staleTime: 30 * 1000 (30 seconds)
// Count badges / sidebar data: staleTime: 60 * 1000 (60 seconds)
// Monitoring data: staleTime: 60 * 1000 (frequently changing but not real-time)
```

### Error State Pattern
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` lines 287–295
**Apply to:** All page-level error states
```typescript
if (error) {
  return (
    <div className="p-6">
      <p className="text-destructive text-sm">
        Couldn&apos;t load [resource]. Check your connection or refresh the page.
      </p>
    </div>
  )
}
```

### Loading State Pattern
**Source:** `apps/console/app/(shell)/bd/leads/page.tsx` lines 279–285
**Apply to:** All page-level loading states
```typescript
if (isLoading) {
  return (
    <div className="p-6">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  )
}
```

### MSW `API_BASE` Import
**Source:** `packages/mocks/src/base-url.ts`
**Apply to:** `supply.ts`, `monitoring.ts` handlers
```typescript
import { API_BASE } from '../base-url'
// API_BASE resolves to NEXT_PUBLIC_API_URL or 'http://localhost:8000'
// All handler URLs: `${API_BASE}/api/v1/...`
```

### TanStack Table Column Helper with `any[]` Workaround
**Source:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` line 150
**Apply to:** `admin-events-tab.tsx`, `admin-costs-tab.tsx`
```typescript
// Avoids TypeScript contravariance errors when mixing accessor and display columns:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: any[] = [
  columnHelper.accessor(...),
  columnHelper.display(...),
]
```

---

## No Analog Found

All files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| `admin/_components/admin-overview-tab.tsx` | component | request-response | 4-card summary grid has no direct analog, but uses the same Card/Badge/Button primitives and useQuery pattern from existing pages. The 4-parallel-useQuery pattern is new but trivial. |
| `admin/_components/admin-quotas-tab.tsx` | component | request-response | shadcn `Progress` component is new (install via CLI Wave 0). The quota warning color logic is new but uses established OKLCH color constants from `sidebar-nav.tsx`. |
| `admin/_components/admin-pipeline-tab.tsx` | component | request-response | StatusCountCard grid pattern is new but composed from established Card primitives. |

---

## Critical Anti-Patterns (Do Not Replicate)

| Anti-Pattern | Where Tempting | Correct Approach |
|---|---|---|
| `apiClient.POST` for file upload | `csv-form.tsx`, `resume-form.tsx` | Native `fetch` with `FormData` — no `Content-Type` header. Source: `import-dropzone.tsx` lines 43–56 |
| `useAsyncJob` for enrichment polling | `candidate-profile-sheet.tsx` | Manual `setInterval` + `queryClient.invalidateQueries`. `CandidateProfileResponse` has no `.status` field. |
| Separate routes `/admin/costs`, `/admin/events` | `admin/page.tsx` | Single page with `?tab=` URL search param + `useSearchParams` in Suspense boundary |
| `useAsyncJob` for LinkedIn/CSV ingest | `linkedin-form.tsx`, `csv-form.tsx` | No polling needed — both return 201/200 synchronously. Only `resume-form.tsx` (202) uses polling. |
| `task_type` as API filter param | `admin-events-tab.tsx` | Client-side `Array.filter()` on returned `AgentEventOut[]` — `/monitoring/agent-events` has no `task_type` param |
| Fetching prompt list from API | `admin-prompts-tab.tsx` | Hardcode `KNOWN_PROMPTS` constant — no list endpoint exists |
| Duplicate `CandidateDetailPanel` | Phase 3 ops page | Replace import in `ops/requisitions/[id]/page.tsx` — swap to shared `CandidateProfileSheet` |

---

## Metadata

**Analog search scope:** `apps/console/app/(shell)/`, `packages/mocks/src/handlers/`, `packages/hooks/src/`
**Files scanned:** 23 source files read
**Pattern extraction date:** 2026-06-14
