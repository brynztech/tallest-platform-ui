# Phase 4: Console Supply + Admin — Research

**Researched:** 2026-06-14
**Domain:** React/Next.js console feature screens — talent pool search, candidate profiles, async ingest, engagement sequences, admin monitoring dashboard
**Confidence:** HIGH (all critical claims verified from codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Layout: left filter sidebar + results grid. Collapsible left panel holds all hard filters (skills, title, location, seniority, remote pref) plus a semantic text query field at top.

**D-02:** Search triggers on explicit submit (Search button click or Enter). Filters can be freely edited without refetching. Active filter chips update after submit.

**D-03:** Ranking: rank badge (#1, #2, #3) + short match reason text. No raw semantic percentage.

**D-04:** Candidate result card fields: rank badge, name, current title + company, location/remote pref, top 3 skills, availability/status badge, short match reason (if available). Secondary small badges: email verified (if true), GitHub enriched (if present).

**D-05:** Profile slide-over is scrollable single panel: summary header → experience → skills → GitHub signals → contact/email verification → resume link. No tabs.

**D-06:** Enrichment: single "Enrich" button in profile header. Click → POST /supply/candidates/{id}/enrich → useAsyncJob polling. GitHub, email verification, and resume sections show skeleton shimmer while polling.

**D-07:** CandidateProfileSheet is a shared component from both search results and shortlist rows. Props: candidate_id (required), source?: "search" | "shortlist", requisition_id? (optional).

**D-08:** Single /supply/ingest page with 3 mode tabs: LinkedIn | CSV | Resume.

**D-09:** Persistent "Recent Jobs" section below tab form for all ingest job states. Same pattern as BD's /bd/imports page.

**D-10:** LinkedIn ingest form: single linkedin_url text input + Submit button. One Proxycurl profile URL per submission.

**D-11:** CSV and Resume paths: file upload via react-dropzone. Async status in persistent jobs section.

**D-12:** Dashboard overview + tabbed drilldowns under /admin. Tabs: Overview | Costs | Events | Quotas | Pipeline | Prompts. Clicking summary widget navigates to relevant tab.

**D-13:** Overview summary cards (4): Total Spend, Quota Usage, Pipeline Health, Recent Events.

**D-14:** Drilldown tabs on /admin via URL search param ?tab=. One Next.js page file.

**D-15:** Agent Events tab (ADM-02): filterable event log with limit+offset pagination.

**D-16:** Prompt editor: split-view. Left panel: prompt list. Right panel: monospace textarea, dirty state, Save/Reset. Save flow: PUT /api/v1/monitoring/prompts/{name}.

### Claude's Discretion

None — all decisions pre-answered in context.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUP-01 | Supply rep can search the talent pool with hard filters + free-text semantic search and see ranked results | `GET /api/v1/supply/candidates/search` verified in api.d.ts — q (required), skills, location, seniority, min_years, top_k params. TalentPoolSearchResponse returns results[] + total. Sidebar layout pattern established via D-01. |
| SUP-02 | Supply rep can view an enriched candidate profile and trigger enrichment with inline async status | `GET /api/v1/supply/candidates/{candidate_id}` → CandidateProfileResponse + TalentPoolSummary. `POST .../enrich` → 202. useAsyncJob polling on GET candidate endpoint. CandidateProfileSheet replaces Phase 3 stub. |
| SUP-03 | Supply rep can ingest candidates via LinkedIn query, CSV import, or resume upload with async status tracking | Three endpoints confirmed: POST /supply/candidates/ingest (201, sync), POST /supply/candidates/ingest/csv (200, sync), POST /supply/resumes/upload (202, async). useAsyncJob for resume only. BD import dropzone pattern to replicate. |
| SUP-04 | Supply rep can review per-requisition shortlist submissions and approve or reject individual candidates | `GET /api/v1/supply/shortlists/{requisition_id}` → ShortlistResponse. `PATCH /api/v1/supply/shortlists/{submission_id}` → SubmissionResponse. Phase 3 shortlist action pattern already established. |
| SUP-05 | Supply rep can review, edit, and approve or reject AI-generated 2-step engagement sequences | GET /supply/candidates/{id}/engagement (list), POST .../generate (201), PATCH /supply/engagement/{id} (edit steps), POST .../approve, POST .../reject. EngagementSequenceResponse + EngagementStep shapes verified. |
| ADM-01 | Admin can view AI spend broken down by domain, model, and task type | `GET /api/v1/monitoring/cost?period=today|week|month` → CostResponse with rows[] of CostBreakdownRow (domain, model_used, task_type, total_usd, call_count). |
| ADM-02 | Admin can browse and filter the agent event log (domain, task type, date) | `GET /api/v1/monitoring/agent-events` → AgentEventOut[]. CRITICAL: only domain, status, limit, offset filter params exist in monitoring path — task_type filter is NOT a param on this endpoint (see Pitfalls). |
| ADM-03 | Admin can monitor quota usage vs caps with warning state above 80% | `GET /api/v1/monitoring/quota` → QuotaResponse (model, used_tokens, cap_tokens, percent, warning). Warning threshold per API docstring is 60%, not 80% — warning boolean is the canonical signal. |
| ADM-04 | Admin can see pipeline health as status counts per stage across domains | `GET /api/v1/monitoring/pipeline` → platform__monitoring_router__PipelineResponse (lead_counts: {[key]: number}, sequence_counts: {[key]: number}, failed_agent_events_24h: number). |
| ADM-05 | Admin can read and edit agent prompts with save confirmation | `GET /api/v1/monitoring/prompts/{name}` → PromptContentResponse (name, content, versions[]). `PUT .../prompts/{name}` with PromptSaveRequest {content} → PromptSaveResponse. |

</phase_requirements>

---

## Summary

Phase 4 is a feature-dense phase that touches two independent workstreams. The Supply workstream builds candidate discovery (search + profile + enrichment), three ingest paths, shortlist review, and engagement sequence approval. The Admin workstream builds a monitoring dashboard with 6 tabs and a split-view prompt editor. Both workstreams reuse established patterns extensively — the phase introduces zero new infrastructure.

The codebase is well-prepared: `useAsyncJob` handles all 202 flows, the Sheet slide-over pattern is established in both `LeadDetailPanel` and `CandidateDetailPanel`, the `ImportDropzone` demonstrates the exact ingest card pattern to replicate, and `ShortlistTable` shows TanStack Table v8 with column helpers and undo-toast actions. MSW stubs for supply and monitoring are empty, ready to populate. Two shadcn components (tabs, progress) need to be added via CLI.

The most critical technical finding is an API contract discrepancy: the UI-SPEC's AdminEventsTab describes `task_type` and `agent_type` text filters, but the actual `GET /api/v1/monitoring/agent-events` operation only accepts `domain`, `status`, `limit`, `offset`. The other endpoint `/api/v1/agent-events` does support `task_type` and `agent_type` but it is a different route. The planner must decide whether to: (a) implement task_type filtering as client-side in-memory filtering, or (b) use the `/api/v1/agent-events` endpoint instead of the monitoring path.

**Primary recommendation:** Build Phase 4 as two parallel wave chains — Supply (search → profile/enrich → ingest → engagements) and Admin (MSW handlers → overview/quotas/pipeline/costs → events → prompts). The established patterns (Sheet, useAsyncJob, TanStack Table, undo toast) eliminate most architecture decisions.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Candidate search form + filter sidebar | Browser / Client | — | All filtering state is local React state; query fires on explicit submit to API |
| Search results rendering + keyboard nav | Browser / Client | — | Static list after fetch; J/K/Enter keyboard handlers are client-only |
| CandidateProfileSheet (detail + enrichment) | Browser / Client | API / Backend | Client manages open state and polling; backend owns enrichment via POST + GET |
| Enrichment polling (useAsyncJob) | Browser / Client | API / Backend | Polling GET /supply/candidates/{id} every 2s until signals appear |
| Ingest form tabs (LinkedIn/CSV/Resume) | Browser / Client | API / Backend | Client owns form state; backend owns processing |
| Resume upload async polling | Browser / Client | API / Backend | POST returns 202 task_id; client polls status field on candidate record |
| Ingest Recent Jobs section | Browser / Client | — | Local useState array of job records — no dedicated job-list endpoint |
| Shortlist review (from Phase 3 table) | Browser / Client | API / Backend | PATCH /supply/shortlists/{submission_id} with optimistic undo toast |
| Engagement sequence review/edit/approve | Browser / Client | API / Backend | Sheet with RHF-controlled step fields; PATCH then POST approve |
| Admin monitoring data fetching | Browser / Client | API / Backend | All monitoring reads are simple GET queries, no mutations except prompt PUT |
| Admin tab navigation | Browser / Client | — | useSearchParams + useRouter for ?tab= param — client-only SPA routing |
| Prompt editor dirty state + save | Browser / Client | API / Backend | isDirty controlled by RHF; PUT on save; no polling needed |
| MSW handlers (supply + monitoring) | Browser / Client (dev only) | — | supplyHandlers and monitoringHandlers stubs expand to full suites |
| Sidebar Supply + Admin unlock | Browser / Client | — | Remove STUB_SECTIONS entries; add SUPPLY_NAV + ADMIN_NAV constants |

---

## Standard Stack

### Core (already installed in apps/console)

| Library | Version | Purpose | Verified |
|---------|---------|---------|---------|
| next | catalog (^16.2) | App Router pages for /supply/* and /admin | [VERIFIED: apps/console/package.json] |
| react | catalog (^19.2) | UI runtime | [VERIFIED: apps/console/package.json] |
| @tanstack/react-query | catalog (^5.90) | Data fetching; useQuery for search, profile, monitoring; useMutation for PATCH/POST | [VERIFIED: apps/console/package.json] |
| @tanstack/react-table | catalog (^8.21) | AdminEventsTab and AdminCostsTab tables; same pattern as ShortlistTable | [VERIFIED: apps/console/package.json] |
| react-hook-form | catalog (^7.66) | All ingest forms (LinkedIn, CSV, Resume), engagement step editing, prompt save | [VERIFIED: apps/console/package.json] |
| @hookform/resolvers | catalog (^5.2) | Zod v4 adapter for RHF in ingest forms | [VERIFIED: apps/console/package.json] |
| zod | catalog (^4.0) | Form schemas for linkedin_url (url validation), csv/resume (file presence) | [VERIFIED: apps/console/package.json] |
| react-dropzone | ^15.0.0 | CSV and Resume upload dropzones — already installed | [VERIFIED: apps/console/package.json] |
| lucide-react | catalog | Icons throughout: MapPin, Github, Mail, CheckCircle, Sparkles, Zap, Save, RotateCcw | [VERIFIED: apps/console/package.json] |
| sonner | ^2.0.7 | Toast feedback: enrich success/failure, ingest complete, prompt saved, shortlist undo | [VERIFIED: apps/console/package.json] |

### Internal Packages (reuse as-is)

| Package | Purpose | Status |
|---------|---------|--------|
| @brynzit/hooks / useAsyncJob | Polling for enrich (GET candidate), resume upload (GET candidate), engagement generate | [VERIFIED: packages/hooks/src/use-async-job.ts] |
| @brynzit/ui / Sheet, Badge, Button, Skeleton, Separator, Textarea, Table, Input, Select, Label, Checkbox | All UI primitives — confirmed installed in Phase 2/3 | [VERIFIED: packages/ui/src/components/ui/] |
| @brynzit/api-client / apiClient | Typed fetch client for all supply and monitoring endpoints | [VERIFIED: packages/api-client] |
| @brynzit/mocks | supplyHandlers (empty stub) + monitoringHandlers (empty stub) to populate | [VERIFIED: packages/mocks/src/handlers/] |

### New shadcn Components to Add

| Component | Purpose | Install Command |
|-----------|---------|-----------------|
| `tabs` | Admin /admin tab navigation (6 tabs); /supply/ingest mode tabs (3 tabs) | `npx shadcn@latest add tabs --cwd=packages/ui` |
| `progress` | Quota usage progress bar in AdminQuotasTab + AdminOverviewTab quota card | `npx shadcn@latest add progress --cwd=packages/ui` |

**Install command (Wave 0 step):**
```bash
npx shadcn@latest add tabs progress --cwd=packages/ui
```

**Already present — do not re-install:** avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, select, separator, sheet, skeleton, sonner, table, textarea.

---

## Architecture Patterns

### System Architecture Diagram

```
User Action                 Client Layer                   API Layer
-----------                 ------------                   ---------

[Search submit]
     │
     ▼
Filter sidebar ──────────── useQuery(search) ─────────────► GET /supply/candidates/search
     │                      (fires on submit only)               │
     │                           │                               │
     │                      TalentPoolSearchResponse ◄───────────┘
     │                           │
     ▼                           ▼
Results grid ◄────── CandidateResultCard[] ──── (click) ──► CandidateProfileSheet
                                                                  │
                                                          useQuery(candidate profile)
                                                                  │
                                                          ► GET /supply/candidates/{id}
                                                                  │
                                                          CandidateProfileResponse ◄─┘
                                                                  │
                                                     [Enrich click]
                                                                  │
                                                          POST /supply/candidates/{id}/enrich
                                                                  │ (202)
                                                          useAsyncJob polls GET /supply/candidates/{id}
                                                          every 2s until enrichment signals appear

[Ingest tab submit]
     │
     ├── LinkedIn ──────── useMutation ───────────────────► POST /supply/candidates/ingest (201, sync)
     ├── CSV ────────────── native fetch multipart ─────────► POST /supply/candidates/ingest/csv (200, sync)
     └── Resume ──────────── native fetch multipart ─────────► POST /supply/resumes/upload (202)
                                                                  │
                                                          useAsyncJob polls GET /supply/candidates/{id}

[Engagements page]
     │
     ├── List ────────────── useQuery ──────────────────────► GET /supply/candidates/{id}/engagement
     └── Sheet open
          │
          ├── Edit steps (RHF local) ──── [Approve click if edited] ──► PATCH /supply/engagement/{id}
          │                                                               then POST .../approve
          └── [Approve click if not edited] ────────────────────────► POST /supply/engagement/{id}/approve

[Admin /admin?tab=...]
     │
     ├── Overview tab ──── 4 parallel useQuery ─────────────► GET /monitoring/cost
     │                                                         GET /monitoring/quota
     │                                                         GET /monitoring/pipeline
     │                                                         GET /monitoring/agent-events?limit=5
     ├── Costs tab ──────── useQuery(period) ───────────────► GET /monitoring/cost?period=
     ├── Events tab ─────── useQuery(filters, page) ─────────► GET /monitoring/agent-events
     ├── Quotas tab ─────── useQuery ───────────────────────► GET /monitoring/quota
     ├── Pipeline tab ───── useQuery ───────────────────────► GET /monitoring/pipeline
     └── Prompts tab
          │
          ├── List ────────── useQuery (all prompt names) ────► GET /monitoring/prompts/{name} (per name)
          └── Editor ─────── [Save click] ──────────────────► PUT /monitoring/prompts/{name}
```

### Recommended File Structure

```
apps/console/app/(shell)/
├── supply/
│   ├── search/
│   │   ├── page.tsx                  # /supply/search — filter sidebar + results grid
│   │   └── _components/
│   │       ├── filter-sidebar.tsx    # Collapsible left panel with all filter inputs
│   │       ├── candidate-result-card.tsx  # Fat card with rank badge, skills, match reason
│   │       └── use-candidate-search.ts    # Search state + submit logic hook
│   ├── ingest/
│   │   ├── page.tsx                  # /supply/ingest — mode tabs + recent jobs
│   │   └── _components/
│   │       ├── linkedin-form.tsx      # RHF form for linkedin_url
│   │       ├── csv-form.tsx           # react-dropzone + RHF for CSV upload
│   │       ├── resume-form.tsx        # react-dropzone + RHF for resume upload
│   │       └── ingest-job-card.tsx    # Status card in Recent Jobs section
│   └── engagements/
│       ├── page.tsx                   # /supply/engagements — list + EngagementSequenceSheet
│       └── _components/
│           └── engagement-sequence-sheet.tsx
├── admin/
│   ├── page.tsx                       # /admin — shadcn Tabs via ?tab= param
│   └── _components/
│       ├── admin-overview-tab.tsx     # 4 summary cards
│       ├── admin-costs-tab.tsx        # TanStack Table v8 cost breakdown
│       ├── admin-events-tab.tsx       # TanStack Table v8 event log + pagination
│       ├── admin-quotas-tab.tsx       # Progress bar + warning banner
│       ├── admin-pipeline-tab.tsx     # Lead + sequence status count grids
│       └── admin-prompts-tab.tsx      # Split-view prompt editor

packages/ui/src/components/ui/
├── tabs.tsx                           # NEW — shadcn tabs component
└── progress.tsx                       # NEW — shadcn progress component

packages/mocks/src/handlers/
├── supply.ts                          # EXPAND from empty stub to full handler suite
└── monitoring.ts                      # EXPAND from empty stub to full handler suite

apps/console/app/(shell)/_components/
└── sidebar-nav.tsx                    # MODIFY — unlock Supply + Admin sections

apps/console/app/(shell)/ops/requisitions/[id]/_components/
└── candidate-detail-panel.tsx         # REPLACE Phase 3 stub with shared CandidateProfileSheet
```

Note: `CandidateProfileSheet` is shared between search results and shortlist context. Locate it in `packages/ui/src/components/domain/` or in a shared `_components/` location at the console shell level, not inside either `/supply/` or `/ops/`.

---

### Pattern 1: Search + Explicit Submit (SUP-01)

The search API requires `q` as a non-optional query param. The UI-SPEC allows all fields to be optional from the user's perspective, but the API requires `q` to always be sent. When q is empty in the form, pass `q=""` (empty string) — the backend will still run the PG hard-filter query.

```typescript
// Source: apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx (pattern)
// and packages/api-client/src/types/api.d.ts operations.search_candidates (verified)
const { data, isLoading } = useQuery({
  queryKey: ['supply-search', submittedFilters],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/supply/candidates/search', {
      params: {
        query: {
          q: submittedFilters.q ?? '',   // required — send empty string if blank
          skills: submittedFilters.skills || null,
          location: submittedFilters.location || null,
          seniority: submittedFilters.seniority || null,
          top_k: submittedFilters.limit ?? 10,
        }
      }
    })
    if (error) throw error
    return data  // TalentPoolSearchResponse: { results: CandidateSearchResult[], total: number }
  },
  enabled: searchSubmitted,  // only fires after explicit submit
  staleTime: 30 * 1000,
})
```

**Key constraint:** `submittedFilters` is a separate state from the live sidebar form values. Update `submittedFilters` only on submit button click or Enter key. Active filter chips reflect `submittedFilters`, not the live form.

### Pattern 2: Enrichment Polling (SUP-02)

The enrich endpoint returns 202 with an opaque `{ [key: string]: unknown }` body — no task_id to poll. Poll the candidate profile endpoint directly and detect enrichment completion by checking if signals appear.

```typescript
// Source: 04-CONTEXT.md D-06, packages/hooks/src/use-async-job.ts (verified)
// POST /supply/candidates/{id}/enrich returns 202
// Poll: GET /supply/candidates/{id} — detect completion when signals appear

const [isEnriching, setIsEnriching] = useState(false)
const [enrichCandidateId, setEnrichCandidateId] = useState<string | null>(null)

// useAsyncJob uses the candidate profile endpoint as poll URL
// statusMap override: the candidate profile has no .status field for enrichment
// So override with custom logic — use a refetchInterval function that checks data directly
// The hook's refetchInterval callback stops polling when terminal phase detected

// IMPORTANT: useAsyncJob checks data?.status — but CandidateProfileResponse has no status
// for enrichment progress. Instead, poll with a plain useQuery and detect completion manually:
const queryClient = useQueryClient()
useEffect(() => {
  if (!isEnriching || !candidateId) return
  const interval = setInterval(async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: ['supply-candidate', candidateId],
      queryFn: () => apiClient.GET('/api/v1/supply/candidates/{candidate_id}', { ... }),
    })
    const tp = fresh?.talent_pool
    if (tp?.email_verified !== null || tp?.github_public_repos !== null) {
      setIsEnriching(false)  // enrichment complete
      queryClient.invalidateQueries({ queryKey: ['supply-candidate', candidateId] })
    }
  }, 2000)
  const timeout = setTimeout(() => { setIsEnriching(false) }, 30000)
  return () => { clearInterval(interval); clearTimeout(timeout) }
}, [isEnriching, candidateId, queryClient])
```

**Alternative simpler approach:** Since `useAsyncJob` expects a `status` field in the polled response, and `CandidateProfileResponse` does not have one, the polling for enrichment should be done via a plain interval + queryClient.invalidateQueries rather than useAsyncJob. The UI-SPEC says to "poll GET /supply/candidates/{id} every 2 seconds" — implement this directly without useAsyncJob.

### Pattern 3: File Upload (Multipart — SUP-03)

Match the exact BD import pattern from `import-dropzone.tsx`. Use native `fetch`, not `apiClient`, for multipart uploads.

```typescript
// Source: apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx (verified)
// Native fetch for multipart — apiClient does not support FormData without Content-Type issues
const formData = new FormData()
formData.append('file', file)

const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/supply/resumes/upload`,
  { method: 'POST', body: formData },
  // No Content-Type header — browser sets multipart/form-data boundary automatically
)
const data = await res.json() as components['schemas']['ResumeUploadResponse']
// data.task_id is returned but no status endpoint exists — poll GET /supply/candidates/{id}
// using data.candidate_id once it appears
```

**LinkedIn ingest** uses JSON body (not multipart) — use apiClient.POST normally.
**CSV ingest** returns 200 (not 202) — no polling, display result immediately.
**Resume upload** returns 202 with `candidate_id` (may be null initially) and `task_id`.

### Pattern 4: TanStack Table v8 (ADM-01, ADM-02)

Established pattern from `shortlist-table.tsx`. Copy the columnHelper + useReactTable structure.

```typescript
// Source: apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx (verified)
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'

const columnHelper = createColumnHelper<AgentEventOut>()

// Use 'any[]' for columns array to avoid TypeScript contravariance issues
// (same workaround as shortlist-table.tsx line 150)
const columns: any[] = [
  columnHelper.accessor('created_at', { header: 'Timestamp', ... }),
  columnHelper.accessor('domain', { header: 'Domain', ... }),
  // ...
]

const table = useReactTable({ data: events, columns, getCoreRowModel: getCoreRowModel() })
```

For AdminCostsTab, a plain shadcn `<Table>` (not TanStack Table) may suffice since the cost table has no sorting, filtering, or virtualization needs. Use TanStack Table only for AdminEventsTab which has server-side pagination.

### Pattern 5: Admin Tab Navigation (D-14)

```typescript
// Source: 04-UI-SPEC.md D-14 (verified pattern, Next.js 16 useSearchParams)
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@brynzit/ui/components/ui/tabs'

export default function AdminPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = searchParams.get('tab') ?? 'overview'

  function handleTabChange(value: string) {
    router.push(`${pathname}?tab=${value}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        // ...
      </TabsList>
      <TabsContent value="overview"><AdminOverviewTab /></TabsContent>
      // ...
    </Tabs>
  )
}
```

**Note:** useSearchParams requires the page to be wrapped in a Suspense boundary in Next.js 16 when used in a 'use client' component. Either use Suspense in the page or wrap the tab-reading logic in a child component.

### Pattern 6: Prompt Editor Dirty State (ADM-05)

```typescript
// Source: 04-CONTEXT.md D-16, 04-UI-SPEC.md AdminPromptsTab (verified)
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

// Dirty state: local useState tracks edits separately from fetched content
const [editedContent, setEditedContent] = useState('')
const isDirty = editedContent !== (promptData?.content ?? '')

// On save:
const saveMutation = useMutation({
  mutationFn: ({ name, content }: { name: string; content: string }) =>
    apiClient.PUT('/api/v1/monitoring/prompts/{name}', {
      params: { path: { name } },
      body: { content } satisfies components['schemas']['PromptSaveRequest'],
    }),
  onSuccess: () => {
    toast.success('Prompt saved.')
    queryClient.invalidateQueries({ queryKey: ['prompt', selectedPromptName] })
    // After invalidate, the new fetched content matches editedContent → isDirty becomes false
  },
  onError: () => toast.error('Failed to save prompt — try again.'),
})
```

### Pattern 7: Sidebar Unlock

```typescript
// Source: apps/console/app/(shell)/_components/sidebar-nav.tsx (verified)
// Current: Supply + Admin in STUB_SECTIONS (lines 27-30)
// Phase 4: Remove from STUB_SECTIONS, add as real nav constants

const SUPPLY_NAV = [
  { href: '/supply/search', label: 'Candidates' },
  { href: '/supply/ingest', label: 'Ingest' },
  { href: '/supply/engagements', label: 'Engagements' },
] as const

const ADMIN_NAV = [
  { href: '/admin', label: 'Admin' },
] as const

// Remove these from STUB_SECTIONS:
// { label: 'Supply', items: ['Candidates', 'Shortlists', 'Engagements'] },
// { label: 'Admin', items: ['Costs', 'Events', 'Quotas', 'Prompts'] },

// Render using existing BD_NAV/OPS_NAV Link pattern (lines 103-135)
```

### Anti-Patterns to Avoid

- **Using apiClient for multipart file upload:** apiClient.POST does not correctly handle FormData; use native fetch without Content-Type header (same as import-dropzone.tsx).
- **Using useAsyncJob for enrichment polling:** CandidateProfileResponse has no `.status` field — useAsyncJob won't detect terminal state. Use manual interval polling + queryClient.invalidateQueries.
- **Single-page routing for Admin tabs:** Do not create `/admin/costs`, `/admin/events` etc. as separate Next.js route files — keep all tabs on `/admin` with `?tab=` search param (D-14).
- **Mapping `title` as a search filter param:** The API only accepts `q`, `skills`, `location`, `seniority`, `min_years`, `top_k` — there is no `title` filter param. The UI-SPEC's "Title" field should be included in the `q` semantic query or omitted.
- **Filtering agent events by `task_type` via API:** `GET /api/v1/monitoring/agent-events` does not accept a `task_type` param (see Pitfalls). Use client-side filtering or the `/api/v1/agent-events` endpoint.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async 202 polling | Custom interval + state | useAsyncJob from @brynzit/hooks | Already handles refetchInterval function, terminal state detection, idle phase |
| File drag-and-drop | Custom ondragover | react-dropzone (already in deps) | Already installed at ^15.0.0; pattern established in import-dropzone.tsx |
| Tabbed navigation | Custom tab state + panels | shadcn Tabs (add via CLI) | Radix Tabs is the standard; handles ARIA, keyboard, focus correctly |
| Progress bar | Custom div with width% | shadcn Progress (add via CLI) | Radix Progress with ARIA role="progressbar"; accessible |
| Table with pagination | Custom table markup | TanStack Table v8 | Already used in ShortlistTable; getCoreRowModel + flexRender established |
| Slide-over panel | Custom fixed panel | shadcn Sheet (already installed) | Focus trap, keyboard close, overlay — established in CandidateDetailPanel |
| Toast notifications | Custom toast state | Sonner (already installed) | Established in shortlist undo toast, JD parse feedback |
| Form validation | Manual input validation | react-hook-form + Zod v4 | Already in deps; established in Phase 3 create dialogs |
| Optimistic shortlist updates | Manual state + revert | useMutation + toast undo (5s) | Identical pattern in shortlist-table.tsx — copy, don't rebuild |

**Key insight:** This phase is primarily assembly work — every individual pattern is already established in the codebase. The risk is incorrectly wiring them together, not building wrong primitives.

---

## Common Pitfalls

### Pitfall 1: Title Filter Not in Search API

**What goes wrong:** The UI-SPEC sidebar includes a "Title" filter field, but `GET /api/v1/supply/candidates/search` has no `title` query param. Sending it as a query param is silently ignored or causes a 422 validation error.

**Why it happens:** The UI-SPEC was designed from the user's mental model; the API reflects what the backend implements (PG filter + Qdrant semantic).

**How to avoid:** Include the Title field value in the `q` semantic query string (e.g., prepend it: `q = [titleValue, semanticQuery].filter(Boolean).join(' ')`), or omit the Title field from the filter sidebar in v1. The planner must choose one approach.

**Warning signs:** 422 response from the search endpoint when a title value is set.

### Pitfall 2: Agent Events `task_type` Filter Not in Monitoring Path

**What goes wrong:** The UI-SPEC's AdminEventsTab shows a "Task type" text input filter, but `GET /api/v1/monitoring/agent-events` only accepts `domain`, `status`, `limit`, `offset`. Sending `task_type` is silently ignored.

**Why it happens:** There are TWO agent event endpoints: `/api/v1/agent-events` (with task_type + agent_type params, returns AgentEventSchema[]) and `/api/v1/monitoring/agent-events` (without, returns AgentEventOut[]). The UI-SPEC references the monitoring path but specifies filters that only exist on the other path.

**How to avoid:** Choose one of:
- (a) Use `/api/v1/agent-events` instead (has task_type filter) — adjust MSW handlers accordingly.
- (b) Use `/api/v1/monitoring/agent-events` and implement task_type filtering client-side (filter the response array).

**Recommendation:** Use `/api/v1/monitoring/agent-events` (consistent with other monitoring endpoints) and implement task_type as client-side in-memory filter. Mark as `[ASSUMED]` until planner confirms.

**Warning signs:** Task type filter input appears to do nothing when submitted.

### Pitfall 3: Enrichment Polling Has No Status Field

**What goes wrong:** Passing enrichment state through `useAsyncJob` fails silently because `CandidateProfileResponse` has no `.status` field on the root object — only `source` and `status` are on `Candidate`, and `talent_pool` (TalentPoolSummary) has no status field either.

**Why it happens:** useAsyncJob reads `data?.status` to determine phase. For enrichment, the "done" signal is the presence of enrichment data (github_public_repos or email_verified), not a status string transition.

**How to avoid:** Do not use useAsyncJob for enrichment. Use a manual `setInterval` that calls `queryClient.fetchQuery` and checks talent_pool fields directly. Stop polling when `email_verified !== null || github_public_repos !== null` or after 30 seconds.

### Pitfall 4: Ingest Sync vs Async Confusion

**What goes wrong:** Treating LinkedIn and CSV ingest as async (adding polling) when they are synchronous.

**Why it happens:** Resume upload returns 202 (async). LinkedIn ingest returns 201 (sync). CSV ingest returns 200 (sync). All three look similar from the form's perspective.

**How to avoid:**
- LinkedIn (POST /supply/candidates/ingest): 201 → display IngestJobCard immediately in "done" state. No polling.
- CSV (POST /supply/candidates/ingest/csv): 200 → display IngestJobCard in "done" state. No polling.
- Resume (POST /supply/resumes/upload): 202 → display IngestJobCard in "processing" state → poll GET /supply/candidates/{candidate_id} until candidate has name/email populated.

**Warning signs:** LinkedIn/CSV ingest cards stuck in "processing" state indefinitely.

### Pitfall 5: CandidateProfileSheet vs CandidateDetailPanel Duplication

**What goes wrong:** Building `CandidateProfileSheet` as a new component that duplicates `CandidateDetailPanel` from Phase 3, then leaving both in the codebase.

**Why it happens:** Phase 3 built `CandidateDetailPanel` as a partial stub; Phase 4 was always intended to replace it with a fuller component.

**How to avoid:** The plan must explicitly replace the import in `ops/requisitions/[id]/page.tsx` — swap `CandidateDetailPanel` for `CandidateProfileSheet` with `source="shortlist"` prop. The old `candidate-detail-panel.tsx` file can either be deleted or repurposed as a thin wrapper.

**Warning signs:** Two Sheet components both opening when a shortlist row is clicked.

### Pitfall 6: Prompt List Has No List Endpoint

**What goes wrong:** Trying to fetch a list of all prompt names from the API. There is no `GET /api/v1/monitoring/prompts` list endpoint — only `GET /api/v1/monitoring/prompts/{name}` for individual prompts.

**Why it happens:** The backend PROMPT_REGISTRY is a static set of known prompt names, not a dynamic list.

**How to avoid:** Hardcode the known prompt names in the MSW handler (and as a static constant in the UI). In the MSW handler, populate a mock list of prompt names. In production, when the backend is live, the UI will need a way to know which names exist. For Phase 4 (MSW), hardcode names like `["icp_scoring", "outreach_generation", "jd_parse", "engagement_generation"]`. The split-view loads each prompt's content on selection via GET /monitoring/prompts/{name}.

**Warning signs:** Empty prompt list panel with no items.

### Pitfall 7: useSearchParams Suspense Boundary

**What goes wrong:** Next.js 16 throws "A component used `useSearchParams()` needs to be wrapped in a Suspense boundary" at build time or render time.

**Why it happens:** In Next.js 16 App Router, `useSearchParams()` in a `'use client'` component without a Suspense ancestor causes the entire route to opt out of static rendering.

**How to avoid:** Wrap the admin page content (or at minimum the tab-reading component) in `<Suspense fallback={...}>`. Example:

```tsx
// apps/console/app/(shell)/admin/page.tsx
import { Suspense } from 'react'
import { AdminContent } from './_components/admin-content'

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <AdminContent />
    </Suspense>
  )
}
// AdminContent is a 'use client' component that uses useSearchParams
```

---

## Code Examples

### MSW Supply Handler Pattern

```typescript
// Source: packages/mocks/src/handlers/bd.ts + ops.ts (verified pattern)
// packages/mocks/src/handlers/supply.ts — expand from empty stub

import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

export const supplyHandlers: HttpHandler[] = [
  // GET /api/v1/supply/candidates/search
  http.get(`${API_BASE}/api/v1/supply/candidates/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    const top_k = parseInt(url.searchParams.get('top_k') ?? '10')

    const mockResults: components['schemas']['CandidateSearchResult'][] = [
      {
        candidate_id: '00000000-0000-0000-0000-cand000001',
        name: 'Alice Chen',
        current_title: 'Senior Backend Engineer',
        current_company: 'DataCo',
        seniority: 'senior',
        location: 'London, UK',
        skills: ['python', 'fastapi', 'postgresql', 'redis', 'docker'],
        total_years_experience: 7,
        availability_status: 'available',
        email_verified: true,
        github_public_repos: 42,
        source: 'linkedin',
      },
      // ... more mock candidates
    ]

    return HttpResponse.json({
      results: mockResults.slice(0, top_k),
      total: mockResults.length,
    } satisfies components['schemas']['TalentPoolSearchResponse'])
  }),

  // POST /api/v1/supply/candidates/{candidate_id}/enrich
  http.post(
    `${API_BASE}/api/v1/supply/candidates/:candidate_id/enrich`,
    () => HttpResponse.json({}, { status: 202 }),
  ),
]
```

### CandidateProfileSheet Core Pattern

```typescript
// Source: apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx
// (verified pattern — CandidateProfileSheet is an expanded version of CandidateDetailPanel)

interface CandidateProfileSheetProps {
  candidateId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  source?: 'search' | 'shortlist'
  requisitionId?: string
  submissionId?: string   // needed for shortlist PATCH
}

export function CandidateProfileSheet({
  candidateId,
  isOpen,
  onOpenChange,
  source,
  requisitionId,
  submissionId,
}: CandidateProfileSheetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['supply-candidate', candidateId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/candidates/{candidate_id}',
        { params: { path: { candidate_id: candidateId! } } },
      )
      if (error) throw error
      return data  // CandidateProfileResponse
    },
    enabled: !!candidateId && isOpen,
    staleTime: 30 * 1000,
  })

  const talentPool = data?.talent_pool   // TalentPoolSummary | null

  // Enrichment check: show Enrich button when both are null
  const needsEnrichment =
    talentPool?.github_public_repos == null && talentPool?.email_verified == null

  // ... enrichment polling + shortlist action mutation follow Phase 3 patterns
}
```

### AdminEventsTab Pagination (ADM-02)

```typescript
// Limit+offset pagination — no infinite query needed
const [offset, setOffset] = useState(0)
const [filters, setFilters] = useState({ domain: '', status: '' })
const LIMIT = 25

const { data: events = [], isLoading } = useQuery({
  queryKey: ['monitoring-events', filters, offset],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/api/v1/monitoring/agent-events', {
      params: {
        query: {
          domain: filters.domain || null,
          status: filters.status || null,
          limit: LIMIT,
          offset,
        }
      }
    })
    if (error) throw error
    return data  // AgentEventOut[]
  },
})

// task_type filtering is client-side only (not a server param on this endpoint)
const displayedEvents = taskTypeFilter
  ? events.filter(e => e.task_type.includes(taskTypeFilter))
  : events
```

---

## API Contract: Key Shapes Verified

### Supply Endpoints

| Endpoint | Method | Response Type | Status Code | Notes |
|----------|--------|---------------|-------------|-------|
| /supply/candidates/search | GET | TalentPoolSearchResponse | 200 | q is required; no title param |
| /supply/candidates/{id} | GET | CandidateProfileResponse | 200 | Includes nested talent_pool?: TalentPoolSummary |
| /supply/candidates/{id}/enrich | POST | {[key: string]: unknown} | 202 | No task_id; poll candidate GET |
| /supply/candidates/ingest | POST | IngestLinkedInResponse | 201 | JSON body: {linkedin_url} |
| /supply/candidates/ingest/csv | POST | CsvIngestResponse | 200 | Multipart form; sync response |
| /supply/resumes/upload | POST | ResumeUploadResponse | 202 | Multipart form; task_id + candidate_id (may be null) |
| /supply/shortlists/{req_id} | GET | ShortlistResponse | 200 | Returns submissions[] |
| /supply/shortlists/{sub_id} | PATCH | SubmissionResponse | 200 | status: "approved"|"rejected"|"hold"|"passed" |
| /supply/candidates/{id}/engagement/generate | POST | EngagementSequenceResponse | 201 | Body: {requisition_id?} |
| /supply/candidates/{id}/engagement | GET | EngagementSequenceResponse[] | 200 | All sequences for candidate |
| /supply/engagement/{id} | PATCH | EngagementSequenceResponse | 200 | Body: {steps: EngagementStep[]} |
| /supply/engagement/{id}/approve | POST | EngagementSequenceResponse | 200 | No body |
| /supply/engagement/{id}/reject | POST | EngagementSequenceResponse | 200 | Optional notes query param |

### Monitoring Endpoints

| Endpoint | Method | Response Type | Filter Params |
|----------|--------|---------------|--------------|
| /monitoring/cost | GET | CostResponse | period?: "today"|"week"|"month" |
| /monitoring/agent-events | GET | AgentEventOut[] | domain?, status?, limit?, offset? — NO task_type |
| /monitoring/quota | GET | QuotaResponse | none |
| /monitoring/pipeline | GET | platform__monitoring_router__PipelineResponse | none |
| /monitoring/prompts/{name} | GET | PromptContentResponse | none |
| /monitoring/prompts/{name} | PUT | PromptSaveResponse | body: {content} |

### TalentPoolSummary Fields (key for enrichment detection)

```typescript
// Source: packages/api-client/src/types/api.d.ts line 2082 (verified)
TalentPoolSummary: {
  skills?: string[] | null
  current_title?: string | null
  seniority?: string | null
  availability_status: string     // always present
  total_years_experience?: number | null
  location?: string | null
  email_verified?: boolean | null  // null = not enriched
  email_score?: number | null
  github_url?: string | null
  github_public_repos?: number | null  // null = not enriched
  github_top_languages?: string[] | null
  resume_file_path?: string | null
  extraction_method?: string | null
}
```

Enrichment is "done" when `email_verified !== null` OR `github_public_repos !== null`. Both being null means not enriched. This is the detection logic for the enrichment polling loop.

### CandidateSearchResult — Note: No `name` match reason field

```typescript
// Source: packages/api-client/src/types/api.d.ts line 1218 (verified)
// CandidateSearchResult does NOT include a match_reason or rank field
// The rank badge (#1, #2, #3) comes from the array index (position in results[])
// The "match reason text" from D-03 is NOT in the API response
// Either display position-based ranking only, or add match_reason to MSW mock data
// as a contract proposal for future backend implementation
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| CandidateDetailPanel (Phase 3 stub) | CandidateProfileSheet (Phase 4 full component) | Replace the import in requisition detail page |
| Supply + Admin as STUB_SECTIONS (dimmed) | SUPPLY_NAV + ADMIN_NAV constants (real links) | Sidebar unlock — remove opacity-40 |
| supplyHandlers = [] | Full supply handler suite | All supply routes need MSW stubs |
| monitoringHandlers = [] | Full monitoring handler suite | All monitoring routes need MSW stubs |
| No tabs/progress in packages/ui | tabs + progress added via shadcn CLI | Wave 0 must run shadcn add before any feature work |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `title` search filter field in the UI-SPEC should map its value into the `q` semantic query string (since no `title` API param exists) | Pattern 1, Pitfall 1 | If the backend adds a title param later, the behavior is different; low impact for now |
| A2 | task_type filtering on AdminEventsTab should be implemented client-side (filtering AgentEventOut[] in memory) since GET /monitoring/agent-events has no task_type param | Pitfall 2, Code Examples | Planner should confirm; could use /api/v1/agent-events endpoint instead which does have task_type |
| A3 | Hardcode a static list of known prompt names in the UI (e.g., ["icp_scoring", "outreach_generation", "jd_parse", "engagement_generation"]) since no list endpoint exists | Pitfall 6 | If prompt names differ from hardcoded list, prompt editor shows nothing or broken state |
| A4 | Recent Jobs section on /supply/ingest uses local useState array (not a persisted API list) since no ingest-jobs-list endpoint exists | Architecture Patterns, system diagram | State lost on page refresh; acceptable for MVP |
| A5 | Engagement generate endpoint (POST .../generate) returns a 201 EngagementSequenceResponse synchronously, not a 202 — useAsyncJob is NOT needed | API Contract table | If backend is actually async (202), the UI would miss the done state |

---

## Open Questions (RESOLVED)

1. **Title filter field in search sidebar**
   - What we know: UI-SPEC includes a Title field; API has no `title` param
   - What's unclear: Should title be folded into q, omitted, or is a backend change planned?
   - **RESOLVED (Q1):** Title field value is folded into the `q` semantic query string — `q = [titleValue, semanticQuery].filter(Boolean).join(' ')`. No `title` param sent to API. Implemented in plan 04-02 Task 1.

2. **Match reason text on CandidateSearchResult**
   - What we know: D-03 specifies "short match reason text" on cards; CandidateSearchResult has no `match_reason` field
   - What's unclear: Is this a backend field to be added, or should it be omitted in v1?
   - **RESOLVED (Q2):** MSW mock-only — `match_reason?: string` is added to mock CandidateSearchResult data as a contract proposal. The UI renders it when present but the real API will return it as undefined until the backend adds the field. Implemented in plan 04-01 Task 1 (MSW supply handler).

3. **Prompt list — hardcoded names**
   - What we know: No list endpoint for prompts; backend has PROMPT_REGISTRY (static)
   - What's unclear: What are the actual registered prompt names?
   - **RESOLVED (Q3):** `KNOWN_PROMPTS` constant is hardcoded in the UI as `["icp_scoring", "outreach_generation", "jd_parse", "engagement_generation"]` with an inline comment to verify against live backend before production. Implemented in plan 04-05 Task 2.

4. **Engagement generate sync vs async**
   - What we know: POST .../generate returns 201 (EngagementSequenceResponse) per api.d.ts
   - What's unclear: The UI-SPEC mentions useAsyncJob polling for generate — but 201 is synchronous
   - **RESOLVED (Q4):** POST .../generate returns 201 synchronously (not 202). The returned sequence lands in `status: "generating"` initially; the engagements page polls `GET /supply/candidates/{id}/engagement` until a sequence with `status: "draft"` appears. useAsyncJob is NOT used here (no .status field on the polled response root). Implemented in plan 04-06 Task 1.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| react-dropzone | CSV + Resume upload | Yes | ^15.0.0 | — |
| @tanstack/react-table | Events + Costs tables | Yes | v8 (catalog) | — |
| shadcn Tabs | Admin tabs + Ingest tabs | No (not yet added) | — | Run: `npx shadcn@latest add tabs --cwd=packages/ui` |
| shadcn Progress | Quota progress bar | No (not yet added) | — | Run: `npx shadcn@latest add progress --cwd=packages/ui` |
| @brynzit/hooks / useAsyncJob | Resume upload polling | Yes | workspace | — |

**Missing dependencies (no fallback — must install in Wave 0):**
- `tabs` shadcn component: `npx shadcn@latest add tabs --cwd=packages/ui`
- `progress` shadcn component: `npx shadcn@latest add progress --cwd=packages/ui`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (config at apps/console/vitest.config.ts) |
| Config file | apps/console/vitest.config.ts — environment: 'jsdom', globals: true |
| Quick run command | `pnpm --filter @brynzit/console test` |
| Full suite command | `pnpm --filter @brynzit/console test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUP-01 | Search endpoint called on submit (not on filter edit); result count updates | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/supply-search.test.tsx` | Wave 0 |
| SUP-02 | Enrich button appears when not enriched; disappears when enriched | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/supply-enrich.test.tsx` | Wave 0 |
| SUP-03 | Resume upload initiates polling; CSV returns sync result | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/supply-ingest.test.tsx` | Wave 0 |
| SUP-04 | Shortlist PATCH uses supply domain; undo toast delays mutation 5s | unit | Covered by existing ops-shortlist.test.tsx pattern — new test for supply context | Wave 0 |
| SUP-05 | Engagement sequence approve without edit sends POST directly; with edit sends PATCH then POST | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/supply-engagements.test.tsx` | Wave 0 |
| ADM-01 | Cost table renders rows from CostResponse; period select triggers refetch | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/admin-costs.test.tsx` | Wave 0 |
| ADM-02 | Events table paginates; Previous/Next disabled at boundaries | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/admin-events.test.tsx` | Wave 0 |
| ADM-03 | Quota warning banner shows at percent >= 60 or warning=true | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/admin-quotas.test.tsx` | Wave 0 |
| ADM-04 | Pipeline tab renders lead_counts and sequence_counts grids | unit | Included in admin-costs.test.tsx or separate file | Wave 0 |
| ADM-05 | Save button disabled when not dirty; prompt PUT called on save | unit | `pnpm --filter @brynzit/console test -- --run src/__tests__/admin-prompts.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @brynzit/console test -- --run`
- **Per wave merge:** `pnpm --filter @brynzit/console test -- --run` + typecheck
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/console/src/__tests__/supply-search.test.tsx` — covers SUP-01
- [ ] `apps/console/src/__tests__/supply-enrich.test.tsx` — covers SUP-02
- [ ] `apps/console/src/__tests__/supply-ingest.test.tsx` — covers SUP-03
- [ ] `apps/console/src/__tests__/supply-engagements.test.tsx` — covers SUP-05
- [ ] `apps/console/src/__tests__/admin-costs.test.tsx` — covers ADM-01, ADM-04
- [ ] `apps/console/src/__tests__/admin-events.test.tsx` — covers ADM-02
- [ ] `apps/console/src/__tests__/admin-quotas.test.tsx` — covers ADM-03
- [ ] `apps/console/src/__tests__/admin-prompts.test.tsx` — covers ADM-05

---

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1 console — trusted network |
| V3 Session Management | No | No session — stateless console |
| V4 Access Control | No | All reps have full access in v1 |
| V5 Input Validation | Yes | Zod v4 schemas for all form inputs (linkedin_url, file type/size) |
| V6 Cryptography | No | No crypto operations in the UI |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious file upload (non-CSV/non-PDF) | Tampering | react-dropzone `accept` prop limits MIME types; backend validates server-side |
| XSS via prompt content display | Tampering | Render prompt content in a `<textarea>` (plain value) — never `dangerouslySetInnerHTML` |
| URL injection via linkedin_url | Tampering | Zod `z.string().url()` validates format; backend validates SSRF restrictions |
| Open redirect via ?tab= param | Tampering | Only use tab param value as-is for Tabs `value` prop (shadcn validates against known values) — never as an href |

---

## Project Constraints (from CLAUDE.md)

All CLAUDE.md directives apply. Key constraints for this phase:

| Directive | Impact on Phase 4 |
|-----------|-------------------|
| Use App Router (`app/`) exclusively | All new pages in `app/(shell)/supply/` and `app/(shell)/admin/` |
| `await cookies()`, `await headers()`, `await params` everywhere | RequisitionDetailPage already uses `use(params)` — new pages must do same if they have dynamic segments |
| `@tanstack/react-table@^8.21` (v8, not v9) | ShortlistTable uses v8 API — AdminEventsTab uses same pattern |
| `@dnd-kit/core@^6` (not @dnd-kit/react 0.5.x) | Not relevant for Phase 4 (no DnD) |
| Zod v4 (`zod@^4.0.0`) | Use Zod v4 for all form schemas |
| MSW v2 (`msw@^2`) | Use `http.get`, `HttpResponse.json` (not `rest.get`, `ctx.json`) |
| No Redux/Zustand | All state in TanStack Query (server) or React useState/useReducer (UI) |
| `tailwindcss-animate` deprecated | Use `tw-animate-css` — but this is already handled in packages/ui |
| No Storybook | Use Vitest + Testing Library for component tests |
| Native fetch for multipart | Confirmed by import-dropzone.tsx — do not use apiClient for file uploads |

---

## Sources

### Primary (HIGH confidence — verified from codebase)
- `packages/api-client/src/types/api.d.ts` — All supply and monitoring endpoint shapes, operation params, response types (verified 2026-06-14)
- `packages/hooks/src/use-async-job.ts` — useAsyncJob hook full signature, statusMap, DEFAULT_STATUS_MAP, polling logic
- `packages/mocks/src/handlers/supply.ts` — Confirmed empty stub (supplyHandlers = [])
- `packages/mocks/src/handlers/monitoring.ts` — Confirmed empty stub (monitoringHandlers = [])
- `apps/console/app/(shell)/_components/sidebar-nav.tsx` — STUB_SECTIONS structure and BD/OPS nav patterns
- `apps/console/app/(shell)/bd/imports/_components/import-dropzone.tsx` — react-dropzone + native fetch + useAsyncJob pattern
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx` — Sheet + useQuery + useMutation candidate pattern
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx` — TanStack Table v8 + undo toast pattern
- `apps/console/package.json` — Confirmed: react-dropzone@^15.0.0 already installed
- `packages/ui/src/components/ui/` — Confirmed existing components list; tabs and progress absent
- `apps/console/vitest.config.ts` — jsdom environment, globals: true, no setup files
- `apps/console/src/__tests__/` — 9 existing test files, all unit tests

### Secondary (HIGH confidence — from planning artifacts)
- `.planning/phases/04-console-supply-admin/04-CONTEXT.md` — All 16 locked decisions D-01 through D-16
- `.planning/phases/04-console-supply-admin/04-UI-SPEC.md` — Full component inventory, interaction contracts, copywriting
- `.planning/REQUIREMENTS.md` — SUP-01 through SUP-05, ADM-01 through ADM-05
- `.planning/config.json` — nyquist_validation: true, security_enforcement: true

---

## Metadata

**Confidence breakdown:**
- API contract shapes: HIGH — verified directly from api.d.ts
- MSW handler pattern: HIGH — verified from bd.ts and ops.ts
- Component patterns: HIGH — verified from candidate-detail-panel.tsx, shortlist-table.tsx, import-dropzone.tsx
- shadcn tabs/progress: HIGH — confirmed absent from packages/ui/src/components/ui/
- Enrichment polling approach: MEDIUM — useAsyncJob limitation verified; manual polling approach is ASSUMED to be correct approach
- Prompt name list: LOW — no list endpoint and actual registered names unknown from codebase alone

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (30 days — stable codebase)
