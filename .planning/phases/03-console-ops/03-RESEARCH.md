# Phase 3: Console Ops - Research

**Researched:** 2026-06-14
**Domain:** Console CRM — clients, requisitions, JD parsing, shortlist, interviews, placements
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Four core routes: `/ops/clients`, `/ops/clients/{id}`, `/ops/requisitions`, `/ops/requisitions/{id}`. Both list views exist independently (hybrid, not nested-only).
- **D-02:** `/ops/clients/{id}` — two-panel layout: left panel (client fields + compact requisitions list with "Create requisition" + "View all reqs for this client" link), right panel (notes paste log). Everything visible at once, no tab-switching.
- **D-03:** `/ops/requisitions` — global flat list across all clients, with client filter dropdown. Ops reps can scan all open work cross-client.
- **D-04:** `/ops/requisitions/{id}` is the main work hub: req fields + parsing status, shortlist table, interviews section, placements section — all on one scrollable page.
- **D-05:** JD paste lives inside the create-requisition form. Single flow: fill client + title, paste JD, click Create. The POST creates the record, then immediately POSTs to `/parse-jd` and begins polling with `useAsyncJob`.
- **D-06:** While parsing: structured fields (role, seniority, skills, comp, dates) are disabled with skeleton shimmer. When polling resolves they animate in with parsed values.
- **D-07:** Parse failure: fields unlock immediately for manual entry, Sonner toast "JD parsing failed — fill fields manually." Non-blocking — the requisition already exists and the Ops rep completes it by hand.
- **D-08:** Shortlist rendered as TanStack Table v8 on the requisition detail page.
- **D-09:** Three per-row actions: Approve / Hold / Pass. Status badge: Shortlisted / Approved / Hold / Passed.
- **D-10:** Clicking a shortlist row opens a right-side Sheet slide-over with the candidate's enriched profile.
- **D-11:** Interviews created from the requisition detail page (Interviews section below the shortlist).
- **D-12:** Global `/ops/interviews` page shows all interviews across clients/requisitions with filters. Read-heavy, links back to req detail.
- **D-13:** State transitions: inline status dropdown on interview row. Scheduled → Accepted / Declined / Completed.
- **D-14:** "Log Placement" action on the requisition detail page, opens right-side slide-over form.
- **D-15:** Placement fields: candidate (pre-filled), requisition (pre-filled), client (pre-filled), fee, billing terms, 90-day retention flag, optional notes.
- **D-16:** Notes on client detail page: plain-text append-only log, `POST /api/v1/ops/clients/{id}/notes`. Each note with timestamp.
- **D-17:** JD parsing reuses `useAsyncJob` from `packages/hooks`. Backend `/parse-jd` returns 202 with a job ID; polling reads requisition status.

### Claude's Discretion

None — all decisions were locked in discussion.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-01 | Ops rep can create, view, and edit clients, including a plain-text notes log | `ClientResponse`, `CreateClientRequest`, `PatchClientRequest`, `NoteResponse`, `CreateNoteRequest` all in api.d.ts; CRUD via live `/api/v1/ops/clients` and `/api/v1/ops/clients/{id}/notes` endpoints |
| OPS-02 | Ops rep can create a requisition, paste a JD, and watch async parsing fill structured fields | `CreateRequisitionRequest`, `ParseJDRequest`, `ParseJDResponse`, `RequisitionResponse` in api.d.ts; `useAsyncJob` (packages/hooks) handles 202 polling; parse-jd returns 202 → poll req for status |
| OPS-03 | Ops rep can view and edit requisition detail with status visible across its lifecycle | `RequisitionResponse` has `status`, `skills`, `seniority`, `compensation_range`, `target_start_date`; shortlist endpoint returns loosely typed `{ [key: string]: unknown }` — type narrowing needed |
| OPS-04 | Ops rep can trigger candidate matching on a requisition and review the ranked shortlist | `POST /api/v1/ops/requisitions/{req_id}/match` returns 202; `GET /api/v1/ops/requisitions/{req_id}/shortlist` returns loosely typed response (see Open Questions); shortlist actions (Approve/Hold/Pass) use supply shortlist PATCH endpoint |
| OPS-05 | Ops rep can create interviews and track them through scheduled / accepted / declined / completed | `InterviewResponse`, `CreateInterviewRequest`, `PatchInterviewRequest` in api.d.ts; PATCH has 409 guard on invalid state transition; **no list-all endpoint** — MSW-only for global view (see API Gap #1) |
| OPS-06 | Ops rep can log placements with fee, billing terms, and 90-day retention flag | `PlacementResponse`, `CreatePlacementRequest` in api.d.ts; `billing_status` field is a free-form string (not enum); `retention_flag_90d` is boolean |
</phase_requirements>

---

## Summary

Phase 3 builds the Ops section of the console: a CRM backbone covering clients, requisitions with async JD parsing, shortlisting, interview state tracking, and placement logging. All core types (`ClientResponse`, `RequisitionResponse`, `InterviewResponse`, `PlacementResponse`, `NoteResponse`) already exist in `packages/api-client/src/types/api.d.ts`. All live endpoints exist under `/api/v1/ops/*`. The tech stack is fully established from Phase 2 — no new libraries need to be installed.

The most technically complex element is the JD parse flow: POST create requisition → immediately POST parse-jd → `useAsyncJob` polling the requisition endpoint for status change → skeleton shimmer on form fields that animate in on completion. The `useAsyncJob` hook's status map may need extension for the JD parsing terminal states (verified the current DEFAULT_STATUS_MAP in packages/hooks).

Three significant API gaps need MSW bridges: (1) no `GET /api/v1/ops/interviews` list endpoint exists in the live API — the global `/ops/interviews` page needs an MSW-only handler; (2) no `GET /api/v1/ops/requisitions` list endpoint exists — the global `/ops/requisitions` list page needs an MSW-only handler; (3) `GET /api/v1/ops/requisitions/{req_id}/shortlist` returns `{ [key: string]: unknown }` — a local type cast is needed.

**Primary recommendation:** Mirror the Phase 2 BD patterns exactly. The routing, data-fetching, MSW handler, and component patterns are all established and stable. Phase 3 is a direct application of those patterns to the Ops domain.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Client list + create | API / Backend | Frontend (RSC-less client page) | Live endpoint exists; useQuery fetch via apiClient |
| Client detail (fields + notes) | API / Backend | Frontend two-panel layout | Live endpoints for both client CRUD and notes; two-panel is pure layout concern |
| Requisition list (global) | MSW / Mock | Frontend filter UI | No live `GET /api/v1/ops/requisitions` list endpoint; MSW-only handler with client filter |
| Requisition create + JD parse | API / Backend | Frontend async polling | POST create is live; parse-jd is live 202; polling via useAsyncJob |
| Requisition detail page | API / Backend | Frontend (scrollable hub) | Live GET endpoint; shortlist/interviews/placements are sub-sections on same page |
| Shortlist table + actions | API / Backend | Frontend TanStack Table v8 | Live shortlist GET; actions use supply shortlist PATCH (`/api/v1/supply/shortlists/{submission_id}`) |
| Interview create + state | API / Backend | Frontend inline dropdown | Live POST create + PATCH state; global list is MSW-only |
| Interview global view | MSW / Mock | Frontend filter table | No live list-all endpoint; MSW bridge needed |
| Placement logging | API / Backend | Frontend slide-over form | Live POST placement endpoint; fields pre-filled from requisition context |
| Sidebar Ops section unlock | Frontend only | — | Remove `opacity-40 cursor-not-allowed` stubs in sidebar-nav.tsx |

---

## Standard Stack

### Core (all already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.90 | All data fetching, mutations, polling | Established in Phase 1/2; `useQuery`, `useMutation`, `useQueryClient` |
| `@tanstack/react-table` | ^8.21 | Shortlist table (D-08) | Already in `apps/console/package.json`; v8 stable; v9 still beta |
| `react-hook-form` | ^7.66 | Create client, create requisition, placement forms | Established in Phase 1/2 |
| `zod` | ^4.0 | Form schema validation | Established; `@hookform/resolvers` v5 auto-detects v4 |
| `@brynzit/hooks` `useAsyncJob` | — | JD parse 202 polling (D-17) | Already built in packages/hooks; reuse directly |
| `msw` | ^2.x | Mock handlers for API gaps | Established; ops.ts is the target file |
| `sonner` | latest | Toast notifications (D-07 parse failure, placement confirm) | Established; ThemeProvider wrapping already in root layout |

[VERIFIED: packages/api-client/src/types/api.d.ts, packages/mocks/src/handlers/ops.ts, packages/hooks/src/use-async-job.ts, apps/console/package.json]

### Supporting (shadcn components — may need to add some)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Sheet` (shadcn) | already in packages/ui | Slide-overs: candidate profile (D-10), placement form (D-14) | Already installed from Phase 2 |
| `Table` (shadcn) | already in packages/ui | Shortlist table base | Already installed from Phase 2 |
| `Select` (shadcn) | already in packages/ui | Client filter dropdown (D-03), interview status dropdown (D-13) | Already installed from Phase 2 |
| `Dialog` (shadcn) | already in packages/ui | Create client modal, create requisition modal | Already installed from Phase 2 |
| `Skeleton` (shadcn) | **likely needs adding** | Shimmer on JD-parsed fields while polling (D-06) | `npx shadcn@latest add skeleton --cwd=packages/ui` |
| `Textarea` (shadcn) | **likely needs adding** | JD paste field, notes input (D-05, D-16) | `npx shadcn@latest add textarea --cwd=packages/ui` |
| `Input` (shadcn) | already in packages/ui | Form fields | Verify present; add if missing |
| `Checkbox` (shadcn) | already in packages/ui | Placement 90-day retention flag | Already installed from Phase 2 |
| `Badge` (shadcn) | already in packages/ui | Shortlist status badges, req status | Already installed from Phase 1 |
| `Separator` (shadcn) | **likely needs adding** | Section dividers on requisition detail page | `npx shadcn@latest add separator --cwd=packages/ui` |

[VERIFIED: packages/ui/src/components/ui/ — sheet.tsx, table.tsx, select.tsx, dialog.tsx, checkbox.tsx, badge.tsx present from Phase 2]

**Installation (new shadcn components only):**
```bash
npx shadcn@latest add skeleton --cwd=packages/ui
npx shadcn@latest add textarea --cwd=packages/ui
npx shadcn@latest add separator --cwd=packages/ui
```

---

## Architecture Patterns

### System Architecture Diagram

```
User action (Ops rep)
        |
        v
Next.js App Router page (apps/console/app/(shell)/ops/*)
  'use client' — useQuery/useMutation from TanStack Query
        |
        +--[live endpoint]--> apiClient (openapi-fetch) --> /api/v1/ops/*  (FastAPI)
        |
        +--[MSW gap]--> fetch() --> MSW handler (packages/mocks/src/handlers/ops.ts)
        |
        v
  QueryClient cache (ConsoleProviders root)
        |
    [JD parse flow]
        |
        v
  POST /api/v1/ops/requisitions  -> 201 RequisitionResponse (req_id captured)
        |
        v
  POST /api/v1/ops/requisitions/{req_id}/parse-jd  -> 202 ParseJDResponse (status field)
        |
        v
  useAsyncJob(jobId=req_id, endpoint='/api/v1/ops/requisitions/{id}')
    polls GET /api/v1/ops/requisitions/{req_id} every 2s
    terminal when status exits pending states
        |
        v
  [fields unlock, animate in with parsed values]
  OR [parse failure: fields unlock, toast error]
```

### Recommended Project Structure
```
apps/console/app/(shell)/ops/
├── clients/
│   ├── page.tsx                          # Client list (useQuery)
│   ├── new/
│   │   └── page.tsx                      # OR: Dialog on list page
│   └── [id]/
│       ├── page.tsx                      # Two-panel: fields + notes (D-02)
│       └── _components/
│           ├── client-fields.tsx         # Editable fields panel
│           ├── client-notes.tsx          # Append-only notes log panel
│           └── client-requisitions.tsx   # Compact req list in left panel
├── requisitions/
│   ├── page.tsx                          # Global flat list + client filter (MSW-only, D-03)
│   ├── new/
│   │   └── page.tsx                      # OR: Dialog/Sheet on list page
│   └── [id]/
│       ├── page.tsx                      # Scrollable hub (D-04)
│       └── _components/
│           ├── requisition-fields.tsx    # Fields + JD parse shimmer (D-05, D-06)
│           ├── shortlist-table.tsx       # TanStack Table v8 (D-08, D-09)
│           ├── candidate-detail-panel.tsx # Sheet slide-over (D-10)
│           ├── interviews-section.tsx    # Interview rows + status dropdown (D-11, D-13)
│           ├── placement-panel.tsx       # Sheet slide-over form (D-14, D-15)
│           └── placements-section.tsx   # Logged placements list
└── interviews/
    └── page.tsx                          # Global read-heavy view (MSW-only, D-12)
```

### Pattern 1: JD Parse Flow (D-05, D-06, D-07)

**What:** POST create req → POST parse-jd → useAsyncJob polling req endpoint → animate fields in on complete
**When to use:** Only on create-requisition flow (not on req edit)

```typescript
// Source: packages/hooks/src/use-async-job.ts (verified)
// Step 1: Create requisition, capture req_id
const createMutation = useMutation({
  mutationFn: async (body: CreateRequisitionRequest) => {
    const { data, error } = await apiClient.POST('/api/v1/ops/requisitions', { body })
    if (error) throw error
    return data
  },
  onSuccess: async (req) => {
    setReqId(req.id)
    // Step 2: immediately trigger parse-jd
    if (jdText.trim()) {
      const { error } = await apiClient.POST('/api/v1/ops/requisitions/{req_id}/parse-jd', {
        params: { path: { req_id: req.id } },
        body: { jd_text: jdText },
      })
      if (!error) setIsParsingJd(true)  // enable useAsyncJob
    }
  },
})

// Step 3: poll the requisition until status indicates parse complete
const { phase, data: reqData } = useAsyncJob<RequisitionResponse>({
  jobId: isParsingJd ? reqId : null,   // null = idle (disables polling)
  endpoint: '/api/v1/ops/requisitions/{id}',
  // Need to add JD-specific terminal statuses to statusMap
  // Check what status the backend sets on the requisition when parse completes
  statusMap: { open: 'complete', filled: 'complete', closed: 'complete' },
})

// Step 4: field behavior
const isParsing = phase === 'pending'
const parseFailed = phase === 'failed'
// Fields disabled + skeleton shimmer when isParsing
// Fields unlock + animate in when phase === 'complete'
// Toast error when parseFailed
```

[VERIFIED: packages/hooks/src/use-async-job.ts — useAsyncJob signature and statusMap pattern]

**Open question on terminal status:** The `RequisitionResponse.status` field is a plain `string` (not a union type). The DEFAULT_STATUS_MAP in useAsyncJob covers `'open'` as neither pending nor complete — the backend likely changes the requisition `status` to something like `'open'` after parse completes. The statusMap override above handles this, but the exact backend status value for "parse done" should be confirmed. The MSW handler can return `status: 'open'` to simulate completion.

### Pattern 2: TanStack Table v8 Shortlist (D-08, D-09, D-10)

**What:** Table with rank, name, fit score, status badge columns + per-row action buttons + row click opens Sheet
**When to use:** On `/ops/requisitions/{id}` page, shortlist section

```typescript
// Source: @tanstack/react-table v8 docs (verified pattern from Phase 2 PATTERNS.md)
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// ShortlistItem type — NOTE: GET /api/v1/ops/requisitions/{req_id}/shortlist
// returns { [key: string]: unknown } in api.d.ts (loosely typed).
// Define a local type from the supply SubmissionResponse shape:
type ShortlistItem = {
  submission_id: string
  candidate_id: string
  candidate_name?: string | null
  fit_score?: number | null
  rank?: number | null
  status: string
}

// Row click → open Sheet slide-over (D-10)
// Action buttons: Approve/Hold/Pass via PATCH /api/v1/supply/shortlists/{submission_id}
// Status badge maps: shortlisted → default, approved → green, hold → amber, passed → muted
```

[VERIFIED: @tanstack/react-table v8 already in apps/console/package.json]

**Critical finding:** Shortlist actions (Approve/Hold/Pass in D-09) use `PATCH /api/v1/supply/shortlists/{submission_id}` (supply domain endpoint), not an ops endpoint. The `PatchSubmissionRequest` body is `{ status: string, notes?: string | null }`. Status values: use `'approved'`, `'hold'` (inferred from D-09), `'passed'` — these should be confirmed against the backend but can be mocked with those values.

[VERIFIED: packages/api-client/src/types/api.d.ts — PatchSubmissionRequest shape]

### Pattern 3: Interview Inline Status Dropdown (D-13)

**What:** A Select component rendered inline on the interview row, firing PATCH on change
**When to use:** On every interview row in the requisition detail + global interviews page

```typescript
// Source: established Select pattern from Phase 2 (packages/ui/src/components/ui/select.tsx)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@brynzit/ui/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'

type InterviewStatus = 'scheduled' | 'accepted' | 'declined' | 'completed'

// Backend guard: PATCH returns 409 on invalid transition
// Valid transitions from D-13: scheduled → accepted, scheduled → declined, accepted → completed
const patchMutation = useMutation({
  mutationFn: ({ interviewId, status }: { interviewId: string; status: string }) =>
    apiClient.PATCH('/api/v1/ops/interviews/{interview_id}', {
      params: { path: { interview_id: interviewId } },
      body: { status } satisfies components['schemas']['PatchInterviewRequest'],
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['interviews', reqId] })
  },
  onError: () => {
    toast.error('Invalid status transition.')
  },
})
```

[VERIFIED: packages/api-client/src/types/api.d.ts — PatchInterviewRequest, 409 guard in API spec]

### Pattern 4: Placement Slide-Over Form (D-14, D-15)

**What:** Sheet slide-over with react-hook-form + Zod; pre-filled candidate/req/client fields
**When to use:** "Log Placement" action from requisition detail page

```typescript
// Source: react-hook-form + Zod v4 pattern established in Phase 2
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { components } from '@brynzit/api-client'

const placementSchema = z.object({
  requisition_id: z.string().uuid(),
  candidate_id: z.string().uuid().nullable().optional(),
  fee_usd: z.number().positive().nullable().optional(),
  billing_status: z.string().min(1),   // free-form string — not an enum in schema
  retention_flag_90d: z.boolean(),
  notes: z.string().nullable().optional(),
  confirmed_at: z.string().nullable().optional(),
})

type PlacementFormValues = z.infer<typeof placementSchema>

// Pre-fill from requisition context:
const form = useForm<PlacementFormValues>({
  resolver: zodResolver(placementSchema),
  defaultValues: {
    requisition_id: reqId,   // from page context
    candidate_id: approvedCandidateId ?? null,
    billing_status: 'pending',  // CreatePlacementRequest default
    retention_flag_90d: false,
  },
})
```

[VERIFIED: packages/api-client/src/types/api.d.ts — CreatePlacementRequest: billing_status is string (not enum), retention_flag_90d is boolean]

### Pattern 5: Client Notes Append-Only Log (D-16)

**What:** Display NoteResponse[] in reverse-chronological order; textarea input + POST on submit
**When to use:** Right panel of `/ops/clients/{id}` page

```typescript
// POST /api/v1/ops/clients/{client_id}/notes
// Body: CreateNoteRequest { text: string, channel: string, author?: string | null }
// Response: NoteResponse { id, client_id, text, channel, author, created_at }

const addNoteMutation = useMutation({
  mutationFn: (text: string) =>
    apiClient.POST('/api/v1/ops/clients/{client_id}/notes', {
      params: { path: { client_id: clientId } },
      body: { text, channel: 'other' },  // channel defaults to 'other' per schema
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['client-notes', clientId] })
    setNoteText('')  // clear textarea
  },
})
```

[VERIFIED: packages/api-client/src/types/api.d.ts — CreateNoteRequest.channel defaults to 'other']

### Pattern 6: MSW Ops Handler Expansion

**What:** Expand packages/mocks/src/handlers/ops.ts from empty [] to full suite
**When to use:** Wave 0 (prerequisite for all Phase 3 feature work)

```typescript
// Source: packages/mocks/src/handlers/bd.ts — established handler pattern (verified)
import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'
import type { components } from '@brynzit/api-client'

// NOTE: GET /api/v1/ops/requisitions (list all) does NOT exist in live API
// MSW-only — no live backend endpoint
// NOTE: GET /api/v1/ops/interviews (list all) does NOT exist in live API
// MSW-only — no live backend endpoint

export const opsHandlers: HttpHandler[] = [
  // Clients
  http.get(`${API_BASE}/api/v1/ops/clients`, ...),
  http.post(`${API_BASE}/api/v1/ops/clients`, ...),
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id`, ...),
  http.patch(`${API_BASE}/api/v1/ops/clients/:client_id`, ...),
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id/requisitions`, ...),
  http.get(`${API_BASE}/api/v1/ops/clients/:client_id/notes`, ...),
  http.post(`${API_BASE}/api/v1/ops/clients/:client_id/notes`, ...),
  // Requisitions
  http.get(`${API_BASE}/api/v1/ops/requisitions`, ...),         // MSW-only
  http.post(`${API_BASE}/api/v1/ops/requisitions`, ...),
  http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id`, ...),
  http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/parse-jd`, ...),
  http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/match`, ...),
  http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id/shortlist`, ...),
  http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id/placements`, ...),
  // Interviews
  http.get(`${API_BASE}/api/v1/ops/interviews`, ...),           // MSW-only
  http.post(`${API_BASE}/api/v1/ops/interviews`, ...),
  http.get(`${API_BASE}/api/v1/ops/interviews/:interview_id`, ...),
  http.patch(`${API_BASE}/api/v1/ops/interviews/:interview_id`, ...),
  // Placements
  http.post(`${API_BASE}/api/v1/ops/placements`, ...),
  http.get(`${API_BASE}/api/v1/ops/placements/:placement_id`, ...),
]
```

[VERIFIED: packages/mocks/src/handlers/ops.ts currently empty (`opsHandlers: HttpHandler[] = []`); browser.ts spreads opsHandlers — no change to browser.ts or node.ts needed]

### Pattern 7: Sidebar Ops Section Unlock

**What:** Replace dimmed stub divs with real Link components in sidebar-nav.tsx
**When to use:** Wave 0 prerequisite — sidebar must be functional before page work begins

The current sidebar-nav.tsx `STUB_SECTIONS` renders Ops as `opacity-40 cursor-not-allowed aria-disabled` divs. Phase 3 replaces the Ops stubs with:

```typescript
// Source: apps/console/app/(shell)/_components/sidebar-nav.tsx (verified)
// Pattern mirrors the existing BD_NAV structure:
const OPS_NAV = [
  { href: '/ops/clients', label: 'Clients', badgeKey: null },
  { href: '/ops/requisitions', label: 'Requisitions', badgeKey: null },
  { href: '/ops/interviews', label: 'Interviews', badgeKey: null },
] as const
// Rendered as Link components like BD_NAV — not dimmed divs
```

### Anti-Patterns to Avoid

- **Using `GET /api/v1/ops/requisitions` as if it's a live endpoint:** The backend only has `POST` on that path. The list view requires an MSW-only handler. [VERIFIED: api.d.ts line 444 — `get?: never` on `/api/v1/ops/requisitions`]
- **Using `GET /api/v1/ops/interviews` as if it's a live endpoint:** Backend only has `POST`. [VERIFIED: api.d.ts line 548 — `get?: never` on `/api/v1/ops/interviews`]
- **Treating shortlist submission actions as ops domain:** Approve/Hold/Pass use `PATCH /api/v1/supply/shortlists/{submission_id}` (supply domain). [VERIFIED: api.d.ts — no PATCH on any ops/shortlist path]
- **Passing `invalidateQueries` after multi-item bulk actions on infinite lists:** Use `resetQueries` to avoid cursor corruption. [ASSUMED — carry-forward from Phase 2 D-10 pattern]
- **Importing shadcn components from the app's own components directory:** Always import from `@brynzit/ui/components/ui/*`.
- **Using synchronous `next/headers`/`next/cookies`:** Fully removed in Next.js 16 — use `await` version. [CITED: CLAUDE.md]
- **Adding `useAsyncJob` without a proper `statusMap` for JD parsing terminal states:** `RequisitionResponse.status` values at parse-complete time are not in the DEFAULT_STATUS_MAP (which only has generic job statuses). Pass a `statusMap` override with the domain-specific values.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 202 async polling | Custom `useEffect` + `setInterval` loop | `useAsyncJob` (packages/hooks) | Already built, tested, handles terminal states, MSW-compatible |
| Table with sort/filter | `<div>`-based table grid | `@tanstack/react-table` v8 | Column resizing, sorting, virtual pagination built in; v8 is stable |
| Slide-over panel | Custom fixed-position div | Radix Sheet (shadcn) | Focus trap, Escape key, accessibility, animation all handled |
| Form with validation | Native HTML validation | react-hook-form + Zod | Uncontrolled, type-safe, `Controller` for shadcn primitives |
| Toast notifications | Custom alert component | Sonner (already wired) | Already in root layout; `toast()` / `toast.error()` just work |
| Skeleton loaders | `opacity-50` + CSS animation | shadcn Skeleton | Consistent pulsing animation matching design system |
| Interview state machine guard | Frontend-only enum validation | Rely on backend 409 + error toast | Backend already validates transitions; just surface the 409 as a toast |

**Key insight:** Every primitive needed for Phase 3 exists — either as a shared package (`useAsyncJob`, `apiClient`), an installed library (`@tanstack/react-table`, `react-hook-form`), or an already-added shadcn component (`Sheet`, `Select`, `Table`, `Dialog`, `Badge`). Phase 3 assembles; it does not invent.

---

## Common Pitfalls

### Pitfall 1: JD Parse Terminal Status Ambiguity
**What goes wrong:** `useAsyncJob` never transitions from `pending` to `complete` because the `RequisitionResponse.status` value when parsing finishes (`'open'`) is not in DEFAULT_STATUS_MAP.
**Why it happens:** DEFAULT_STATUS_MAP covers generic statuses (`done`, `complete`, etc.) but `RequisitionResponse.status` transitions to a domain-specific value (`'open'`) after parsing — which maps to neither pending nor terminal.
**How to avoid:** Always pass `statusMap: { open: 'complete', filled: 'complete', closed: 'complete' }` when using `useAsyncJob` for JD parse polling. Confirm exact backend status with live API or by inspecting the backend source (the default should be `'open'`).
**Warning signs:** Polling spinner never stops; `phase` stays `'pending'` indefinitely.

### Pitfall 2: Shortlist Schema is Loosely Typed
**What goes wrong:** `GET /api/v1/ops/requisitions/{req_id}/shortlist` returns `{ [key: string]: unknown }` in api.d.ts. Accessing `.submissions` or any array field crashes at runtime with no TS error.
**Why it happens:** The backend shortlist column stores JSONB; openapi-typescript reflects this as an unknown object.
**How to avoid:** Define a local `ShortlistEntry` type in the shortlist-table component and use `as` or a runtime check before accessing fields. Use the supply-domain `SubmissionResponse` schema as the reference shape (it has `submission_id`, `candidate_id`, `status`, `fit_score`, etc.).
**Warning signs:** TS compiles fine but runtime TypeError on field access.

[VERIFIED: api.d.ts line 3031 — `"application/json": { [key: string]: unknown }` for shortlist endpoint]

### Pitfall 3: No List Endpoint for Requisitions or Interviews
**What goes wrong:** Developer writes `apiClient.GET('/api/v1/ops/requisitions')` expecting a list. Compile error — `get?: never` on that path.
**Why it happens:** Backend only has POST (create) on these paths; no GET list endpoint was built.
**How to avoid:** The global `/ops/requisitions` and `/ops/interviews` pages must use MSW-only handlers. Mark clearly with `// NOTE: MSW-only — no live backend endpoint` comment in ops.ts.
**Warning signs:** TypeScript error "Property 'GET' does not exist on type..." when targeting these paths.

[VERIFIED: api.d.ts — `get?: never` on `/api/v1/ops/requisitions` (line 445) and `/api/v1/ops/interviews` (line 548)]

### Pitfall 4: Placement `billing_status` is an Open String, Not an Enum
**What goes wrong:** UI dropdown provides arbitrary values; backend accepts anything; no validation catches typos.
**Why it happens:** `CreatePlacementRequest.billing_status` is typed as `string` (not a union).
**How to avoid:** Define a local constant array of valid billing statuses in the Zod schema: `z.enum(['pending', 'invoiced', 'paid'])` (these are assumed common values — verify with backend or keep as free-form text input). If uncertain, use a plain text input.
**Warning signs:** [ASSUMED] — no runtime validation on backend, typos silently accepted.

### Pitfall 5: Interview PATCH Returns 409 on Invalid Transitions
**What goes wrong:** User clicks a status that isn't a valid transition (e.g., `declined` → `completed`). API returns 409. If `onError` doesn't surface this, the UI appears stuck.
**Why it happens:** Backend has a state-machine guard documented in api.d.ts description for `patch_interview_endpoint`.
**How to avoid:** The `useMutation` `onError` handler must call `toast.error('Invalid status transition.')` and optionally call `queryClient.invalidateQueries` to reset the optimistic update.
**Warning signs:** Status select appears to change but then snaps back with no feedback.

[VERIFIED: api.d.ts — OPS-04 description: "state-machine guard (409 on invalid transition)"]

### Pitfall 6: Two-Panel Layout on Client Detail — Scrolling Coordination
**What goes wrong:** The notes panel (right) scrolls independently but the left panel doesn't reach notes because user is scrolling the outer container.
**Why it happens:** D-02 says "everything visible at once" but both panels have independent content height.
**How to avoid:** Use `h-full overflow-y-auto` on each panel independently with the parent using `flex h-[calc(100vh-3.5rem)]` (subtract the header bar height). Each panel scrolls independently.
**Warning signs:** Notes log not reachable without page scroll bleeding into the main content area.

---

## API Gap Analysis

### Gap #1: No List-All Interviews Endpoint (CRITICAL for D-12)
**Gap:** `GET /api/v1/ops/interviews` returns `get?: never` in api.d.ts. The global `/ops/interviews` page (D-12) has no live backend to call.
**Resolution:** MSW-only handler in `ops.ts` returns a list of mock `InterviewResponse[]`. The handler should support optional `?requisition_id=` and `?status=` query params for the filter story. Mark as MSW-only in handler comments. This is acceptable — the global interviews page is "read-heavy" per D-12 and its primary use is linking back to requisition detail.
**Contract proposal:** Not required for Phase 3 (this is internal console, not candidate-facing). Document the gap in the plan.

### Gap #2: No List-All Requisitions Endpoint (CRITICAL for D-03)
**Gap:** `GET /api/v1/ops/requisitions` returns `get?: never` in api.d.ts. The global `/ops/requisitions` list page (D-03) has no live backend.
**Resolution:** MSW-only handler returns a list of `RequisitionResponse[]` with optional `?client_id=` filter param. Mark as MSW-only.

### Gap #3: Shortlist Returns Loosely Typed Object
**Gap:** `GET /api/v1/ops/requisitions/{req_id}/shortlist` returns `{ [key: string]: unknown }` — not a typed array of shortlist items.
**Resolution:** Define a local `ShortlistEntry` type in `shortlist-table.tsx` based on the supply `SubmissionResponse` schema. Cast the response at the component boundary. Add a comment explaining the loose typing.

---

## Code Examples

### Verified useAsyncJob for JD Parse
```typescript
// Source: packages/hooks/src/use-async-job.ts (verified)
const { phase, data: reqData } = useAsyncJob<
  components['schemas']['RequisitionResponse']
>({
  jobId: isParsingJd ? reqId : null,
  endpoint: '/api/v1/ops/requisitions/{id}',
  statusMap: {
    // RequisitionResponse.status values that indicate parse is done:
    open: 'complete',
    filled: 'complete',
    closed: 'complete',
    // If backend uses a specific 'parsing' status while in-progress:
    parsing: 'pending',
  },
  refetchInterval: 2000,
})
```

### MSW Handler for parse-jd (202 + polling simulation)
```typescript
// Source: packages/mocks/src/handlers/bd.ts pattern (verified)
// Simulate a two-step MSW dance: parse-jd returns 202, then req GET returns 'open'
http.post(`${API_BASE}/api/v1/ops/requisitions/:req_id/parse-jd`, ({ params }) => {
  return HttpResponse.json(
    {
      requisition_id: params.req_id,
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
// GET requisition returns status: 'open' (terminal) with populated fields
http.get(`${API_BASE}/api/v1/ops/requisitions/:req_id`, ({ params }) => {
  return HttpResponse.json({
    id: params.req_id as string,
    status: 'open',
    title: 'Senior Engineer',
    client_id: 'mock-client-uuid',
    skills: ['TypeScript', 'React', 'Node.js'],
    seniority: 'senior',
    compensation_range: '$150k–$180k',
    target_start_date: '2026-09-01',
    intake_details: null,
    shortlist: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies components['schemas']['RequisitionResponse'])
}),
```

### Skeleton Shimmer on Parsed Fields
```typescript
// Source: shadcn Skeleton component pattern [ASSUMED — standard shadcn usage]
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'

// While isParsing === true:
{isParsing ? (
  <div className="space-y-2">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
) : (
  // Actual field inputs, disabled={isParsing}
  <Input value={role} disabled={isParsing} />
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Table v9 (beta) | v8 (stable) | v9 still beta June 2026 | Use v8; v8 is already installed |
| `get?: never` on list endpoints | MSW-only handlers | API design decision | Global requisitions and interviews views are mock-only |
| `@dnd-kit/react` (new rewrite) | `@dnd-kit/core` v6 + `@dnd-kit/sortable` v7 | 0.5.x pre-release | Not relevant to Phase 3 (no DnD needed) |
| Custom polling loops | `useAsyncJob` (packages/hooks) | Established Phase 1 | Reuse directly for JD parse |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `RequisitionResponse.status` value when JD parse completes is `'open'` | Pattern 1 / Pitfall 1 | Polling never terminates; shimmer never clears. Fix: inspect backend source or live API response |
| A2 | Shortlist action statuses for Approve/Hold/Pass are `'approved'`, `'hold'`, `'passed'` | Pattern 2 | Wrong status strings sent to backend; PATCH returns 422 validation error. Fix: check backend enum or live API |
| A3 | `billing_status` common values are `'pending'`, `'invoiced'`, `'paid'` | Pitfall 4 | Incorrect dropdown values. Low risk — field is free-form string, backend accepts anything |
| A4 | Skeleton component is not yet in packages/ui | Standard Stack | If already present, skip install step. Risk: none — `npx shadcn add` is idempotent |
| A5 | Textarea component is not yet in packages/ui | Standard Stack | Same as A4 |
| A6 | Interview valid state transitions: scheduled → accepted, scheduled → declined, accepted → completed | Pattern 3 / Pitfall 5 | Incorrect transitions offered in dropdown; backend returns 409. Fix: check backend state machine source |

---

## Open Questions (RESOLVED)

1. **What status does `RequisitionResponse.status` have immediately after JD parsing completes?**
   - What we know: `useAsyncJob` polls the req endpoint; it needs a terminal status in its statusMap
   - What's unclear: The exact value the backend writes (likely `'open'` but unconfirmed)
   - Recommendation: Use `statusMap: { open: 'complete', filled: 'complete', closed: 'complete' }` and confirm with a live API call or backend source review. The MSW handler should simulate this.
   - **RESOLVED:** Plans use `statusMap: { open: 'complete', filled: 'complete', closed: 'complete', parsing: 'pending' }` in `requisition-fields.tsx`. MSW handler returns `status: 'open'` on terminal GET response.

2. **What are the exact valid status values for shortlist submission actions (Approve/Hold/Pass)?**
   - What we know: `PatchSubmissionRequest.status` is `string`; D-09 says Approve/Hold/Pass
   - What's unclear: Whether backend accepts `'approved'`/`'hold'`/`'passed'` or different casing/values
   - Recommendation: Mock with lowercase (`'approved'`, `'hold'`, `'passed'`); confirm with live test
   - **RESOLVED:** Plans use lowercase status values `'approved'`, `'hold'`, `'passed'` in `shortlist-table.tsx` PATCH body. Mocked via MSW supply handler; to be confirmed against live backend during execution.

3. **What are the valid state transitions for interviews?**
   - What we know: D-13 says `Scheduled → Accepted / Declined / Completed`; PATCH returns 409 on invalid
   - What's unclear: Whether `Declined → Completed` is valid, or `Accepted → Declined`, etc.
   - Recommendation: Only offer transitions documented in D-13; surface 409 as toast error
   - **RESOLVED:** Plans use `VALID_TRANSITIONS: { scheduled: ['accepted', 'declined'], accepted: ['completed'], declined: [], completed: [] }` in `interviews-section.tsx`. Only transitions from D-13 are offered; backend 409 surfaces as `toast.error('Invalid status transition.')`.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 3 is code/config changes only. No external tools or services beyond the project's existing stack are required. All dependencies (Node.js, pnpm, Next.js, FastAPI backend) are already confirmed available from Phase 2.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react |
| Config file | `apps/console/vitest.config.ts` (exists from Phase 2) |
| Quick run command | `pnpm --filter @brynzit/console test run` |
| Full suite command | `pnpm --filter @brynzit/console test run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | Client create → appears in list | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-clients.test.tsx` | Wave 0 |
| OPS-02 | JD paste → parsing state → fields populate | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-jd-parse.test.tsx` | Wave 0 |
| OPS-03 | Req detail displays correct status lifecycle values | unit | same file as OPS-02 | Wave 0 |
| OPS-04 | Shortlist table renders; Approve/Hold/Pass fires PATCH | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-shortlist.test.tsx` | Wave 0 |
| OPS-05 | Interview row status dropdown fires PATCH; 409 surfaces as toast | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-interviews.test.tsx` | Wave 0 |
| OPS-06 | Placement form submits correct payload with retention_flag_90d | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-placements.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @brynzit/console test run`
- **Per wave merge:** `pnpm --filter @brynzit/console test run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/console/src/__tests__/ops-clients.test.tsx` — covers OPS-01
- [ ] `apps/console/src/__tests__/ops-jd-parse.test.tsx` — covers OPS-02, OPS-03
- [ ] `apps/console/src/__tests__/ops-shortlist.test.tsx` — covers OPS-04
- [ ] `apps/console/src/__tests__/ops-interviews.test.tsx` — covers OPS-05
- [ ] `apps/console/src/__tests__/ops-placements.test.tsx` — covers OPS-06
- [ ] Skeleton and Textarea shadcn components in `packages/ui` (if not present)

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` (from config.json).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No console auth in v1 (explicit out of scope in REQUIREMENTS.md) |
| V3 Session Management | No | No auth, no sessions |
| V4 Access Control | No | Trusted-network internal tool; no auth model |
| V5 Input Validation | Yes | Zod v4 for all forms (create client, create req, placement); react-hook-form resolver |
| V6 Cryptography | No | No credentials or sensitive data in frontend |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via notes content (Slack/WhatsApp logs) | Tampering | All note text rendered as JSX text nodes — no `dangerouslySetInnerHTML`; never pass note content to `innerHTML` |
| Malformed JD text injection | Tampering | JD text sent as JSON string to API; no HTML rendering; API handles validation |
| Overly large note paste | DoS | Optional: textarea `maxLength` or character counter; API returns 422 if too large |
| Client filter bypass | Info Disclosure | No auth = no real access control; trusted-network assumption; Okta deferred to later phase |

---

## Sources

### Primary (HIGH confidence)
- `packages/api-client/src/types/api.d.ts` — all ops schemas, endpoint paths, request/response types, `get?: never` on list paths
- `packages/hooks/src/use-async-job.ts` — useAsyncJob signature, DEFAULT_STATUS_MAP, statusMap override pattern
- `packages/mocks/src/handlers/ops.ts` — current state (empty skeleton)
- `packages/mocks/src/browser.ts` — opsHandlers already spread (no change needed)
- `apps/console/app/(shell)/_components/sidebar-nav.tsx` — current Ops stub structure to unlock
- `apps/console/app/(shell)/bd/leads/page.tsx` — useInfiniteQuery, useMutation, keyboard shortcut patterns
- `.planning/phases/02-console-bd/02-PATTERNS.md` — all Phase 2 component patterns, imports, anti-patterns

### Secondary (MEDIUM confidence)
- `.planning/phases/03-console-ops/03-CONTEXT.md` — locked decisions D-01 through D-17
- `.planning/REQUIREMENTS.md` — OPS-01 through OPS-06 definitions
- `CLAUDE.md` — stack constraints, async next/headers requirement

### Tertiary (LOW confidence / ASSUMED)
- RequisitionResponse.status = `'open'` at parse-complete: inferred from domain model; not verified from backend source
- Shortlist submission status values (`'approved'`, `'hold'`, `'passed'`): inferred from D-09 naming; not verified from backend enum source
- Interview valid transitions: inferred from D-13 description; not verified from backend state machine code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json and api.d.ts
- Architecture: HIGH — patterns directly derived from verified Phase 2 code
- API gaps: HIGH — directly verified from api.d.ts `get?: never` annotations
- Pitfalls: HIGH (typing/routing gaps) / MEDIUM (statusMap values — assumptions flagged)
- Schema types: HIGH — all verified from api.d.ts

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable stack; api.d.ts is the contract floor — regenerate before implementing if backend schema changes)
