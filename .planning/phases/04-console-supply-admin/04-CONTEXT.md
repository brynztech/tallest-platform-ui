# Phase 4: Console Supply + Admin - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent workstreams sharing one phase:

1. **Supply rep** can search the talent pool with combined hard filters + semantic text, view and enrich candidate profiles in a slide-over, ingest candidates via LinkedIn profile URL / CSV / resume upload (all async), manage per-requisition shortlists, and approve engagement sequences.
2. **Admin** can view a monitoring dashboard overview (cost, quota, pipeline health, recent agent events) and drill into each area via tabs, plus read/edit agent prompts in a split-view editor.

The phase covers SUP-01 through SUP-05 and ADM-01 through ADM-05.

</domain>

<decisions>
## Implementation Decisions

### Talent Search Interface (D-01–D-04)
- **D-01:** Layout: **left filter sidebar + results grid**. Collapsible left panel holds all hard filters (skills, title, location, seniority, remote pref) plus a semantic text query field at top. Results fill the right column.
- **D-02:** Search triggers on **explicit submit** (Search button click or Enter in the semantic query field). Filters can be freely edited without refetching. Search button shows loading state while fetching. Active filter chips update after submit. Results remain stable while adjusting filters.
- **D-03:** Ranking: **rank badge** (#1, #2, #3) + **short match reason** text (e.g., "Matches Python, FastAPI, distributed systems"). No raw semantic percentage in v1. Order communicates ranking; rank badge makes it explicit; match reason helps the rep trust the result.
- **D-04:** Candidate result card fields: rank badge, name, current title + company, location / remote preference, top 3 skills, availability/status badge, short match reason (if available). Secondary small badges: email verified (if true), GitHub enriched (if present). GitHub/repos/email are NOT main card content (may be null for unenriched candidates).

### Candidate Profile Panel (D-05–D-07)
- **D-05:** Profile slide-over is **scrollable single panel**: summary header → experience → skills → GitHub signals → contact/email verification → resume link. Consistent with Phase 3's candidate slide-over pattern (no tabs).
- **D-06:** Enrichment: **single "Enrich" button in the profile header**. Appears when enrichment is missing or stale. Click → POST `/supply/candidates/{id}/enrich` → `useAsyncJob` polling. Button changes to "Enriching…" (disabled). GitHub, email verification, and resume/profile signal sections show skeleton shimmer while polling. On done: refetch candidate profile, replace skeletons with enriched data. On failure: "Enrichment failed — retry" inline in the header.
- **D-07:** **`CandidateProfileSheet` is a shared component** usable from both search results and shortlist rows. Props: `candidate_id` (required), `source: "search" | "shortlist"` (optional context), `requisition_id` (optional, when opened from shortlist). Phase 3's shortlist slide-over stub (D-10 in 03-CONTEXT.md) gets filled in with this full profile component.

### Ingest Paths (D-08–D-11)
- **D-08:** **Single `/supply/ingest` page with 3 mode tabs**: LinkedIn | CSV | Resume. All ingest types in one destination.
- **D-09:** **Persistent "Recent Jobs" section** below the tab form shows all in-progress and completed ingest jobs (queued → processing → done / failed). Same pattern as BD's `/bd/imports` page. Allows monitoring multiple concurrent ingests without manual refresh (`useAsyncJob` polling).
- **D-10:** **LinkedIn ingest form**: single `linkedin_url` text input + Submit button. Matches POST `/supply/candidates/ingest` contract (one Proxycurl profile URL per submission). No search URL / query / skill filter / location / limit in Phase 4.
- **D-11:** **CSV and Resume** paths: file upload via `react-dropzone` (file area + submit). Async status surfaces in the persistent jobs section below.

### Admin Screens (D-12–D-16)
- **D-12:** **Dashboard overview + tabbed drilldowns** all under `/admin`. Default view is the overview. Tabs: Overview | Costs | Events | Quotas | Pipeline | Prompts. Clicking a summary widget navigates to the relevant tab.
- **D-13:** Overview summary cards (4):
  1. **Total spend** (last 30d) — `GET /monitoring/cost?period=month` — total USD + top domain/model/task row — links to Costs tab
  2. **Quota usage** — `GET /monitoring/quota` — used_tokens / cap_tokens progress bar + warning color when `warning=true` or percent is high — links to Quotas tab
  3. **Pipeline health** — `GET /monitoring/pipeline` — lead status counts + sequence status counts + `failed_agent_events_24h` — links to Pipeline tab
  4. **Recent agent events** — `GET /monitoring/agent-events?limit=5` — latest 5 events with domain, task type, status, cost — highlights error/quota_exhausted — links to Events tab
- **D-14:** Drilldown tabs are tabs on `/admin` (not separate `/admin/*` routes). Tab = shallow client-side navigation (e.g., search param or hash). One Next.js page file.
- **D-15:** Agent Events tab (`ADM-02`): filterable event log (domain, task type, date) with `GET /monitoring/agent-events`. Limit+offset pagination (as per api.d.ts docstring D-11).
- **D-16:** **Prompt editor**: split-view layout in the Prompts tab. Left panel: scrollable list of prompt names. Right panel: editor with prompt name heading, version/backup info (if API returns it), full-width monospace `<textarea>`, dirty state indicator ("Unsaved changes"), Save button (enabled only when dirty), Reset/reload button. Save flow: `PUT /api/v1/monitoring/prompts/{name}` → on success: Sonner toast "Prompt saved" + clear dirty state; on error: toast error + keep unsaved content.

### Carried Forward (unchanged from prior phases)
- **CUX-01:** Slide-over right-panel pattern for all detail views (established Phase 2, extended to `CandidateProfileSheet` here)
- **CUX-02:** 5-second undo toast on destructive actions
- **CUX-03:** Keyboard shortcuts (J/K/A/R/S/?) with `?` overlay — apply to candidate search results queue
- **`useAsyncJob`** from `packages/hooks`: all 202 async polling (enrich, ingest, engagement generate)
- **Shortlist PATCH** endpoint: `PATCH /api/v1/supply/shortlists/{submission_id}` — confirmed in Phase 3 (Approve / Hold / Pass)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — SUP-01 through SUP-05, ADM-01 through ADM-05 requirement definitions
- `.planning/ROADMAP.md` §Phase 4 — Goal, success criteria, cross-cutting constraints

### API Contract (Supply)
- `packages/api-client/src/types/api.d.ts` — Supply paths: `/api/v1/supply/candidates/search`, `/api/v1/supply/candidates/{id}`, `/api/v1/supply/candidates/{id}/enrich`, `/api/v1/supply/candidates/ingest`, `/api/v1/supply/candidates/ingest/csv`, `/api/v1/supply/resumes/upload`, `/api/v1/supply/shortlists/{requisition_id}`, `PATCH /api/v1/supply/shortlists/{submission_id}`, `/api/v1/supply/candidates/{id}/engagement/*`, `/api/v1/supply/engagement/{sequence_id}/*`
- `packages/api-client/src/types/api.d.ts` — Monitoring paths: `/api/v1/monitoring/cost`, `/api/v1/monitoring/agent-events`, `/api/v1/monitoring/quota`, `/api/v1/monitoring/pipeline`, `/api/v1/monitoring/prompts/{name}` (GET + PUT)

### Existing Infrastructure (reuse, don't rebuild)
- `packages/hooks/src/use-async-job.ts` — Polling primitive for enrich, ingest, engagement generate async flows
- `apps/console/app/(shell)/bd/imports/` — BD imports page: tab form + persistent jobs section pattern to replicate for `/supply/ingest`
- `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` — Slide-over Sheet pattern reference for `CandidateProfileSheet`
- `apps/console/app/(shell)/ops/requisitions/[id]/_components/` — ShortlistTable + candidate slide-over stub (Phase 3 D-10) — `CandidateProfileSheet` fills this in
- `apps/console/app/(shell)/_components/sidebar-nav.tsx` — Supply and Admin sections currently dimmed stubs — Phase 4 unlocks them

### Phase History (patterns to carry forward)
- `.planning/phases/03-console-ops/03-CONTEXT.md` — Phase 3 decisions, especially shortlist PATCH endpoint, slide-over pattern, `useAsyncJob` statusMap override
- `.planning/phases/02-console-bd/02-CONTEXT.md` — Fat card density decisions (D-01, D-04 here mirror BD fat cards), CUX-01/02/03 canonical patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAsyncJob` (`packages/hooks`): handles 202-polling, terminal states, error — reuse for enrich, LinkedIn ingest, CSV ingest, resume ingest, engagement generate
- `Sheet` slide-over (`packages/ui`): right-panel for `CandidateProfileSheet` (search + shortlist contexts)
- Sonner toast: established for error/success feedback (enrich failure, prompt save, ingest complete)
- TanStack Table v8: already in `apps/console/package.json` — use for agent events log table (ADM-02)
- `react-dropzone`: for CSV and resume upload inputs (ingest page)
- `react-hook-form` + Zod v4: for ingest forms and prompt save (any validated input)
- Skeleton shimmer: use for enrichment pending state in profile panel (matches JD parse shimmer in Phase 3)

### Established Patterns
- **MSW handler pattern**: Import `API_BASE` from `../base-url`; prefix all handler URLs. `packages/mocks/src/handlers/supply.ts` is currently an empty stub — Phase 4 fills all supply handlers.
- **Monitoring MSW**: `packages/mocks/src/handlers/monitoring.ts` — check if stub exists and expand.
- **Sidebar unlock**: remove `opacity-40 cursor-not-allowed` from Supply and Admin sidebar stubs in `sidebar-nav.tsx` when Phase 4 routes are added.
- **useInfiniteQuery** with cursor pagination: for candidate search results (if API supports cursor) — or standard `useQuery` if paginated by offset.
- **useMutation + optimistic update**: for shortlist Approve/Hold/Pass (same pattern as Phase 3 shortlist actions).

### Integration Points
- Phase 3 shortlist slide-over stub (`ops/requisitions/[id]/_components/`) gets replaced by the shared `CandidateProfileSheet` — no duplicate code
- Supply sidebar nav items unlock: Candidates, Shortlists, Engagements
- Admin sidebar nav items unlock: Costs, Events, Quotas, Pipeline (or just "Admin" leading to `/admin`)
- `packages/mocks/src/handlers/supply.ts` and `monitoring.ts`: expand from stubs to full handler suite

</code_context>

<specifics>
## Specific Ideas

- The search form philosophy matches BD fat cards: enough signal to decide without opening the profile. Rank badge + match reason replaces ICP score badge in the BD world.
- The "Enrich" button should only appear when enrichment is missing or stale — not on already-enriched profiles. The enrichment shimmer mirrors JD parse shimmer from Phase 3 exactly.
- Admin overview is a health dashboard, not a reporting tool. 4 summary cards, each linking to its detail tab. Quota card has warning color above 80% — exact threshold from ADM-03.
- Prompt editor split view is intentional: prompt list stays visible while editing so admin can switch between prompts without navigating back. Dirty state indicator prevents accidental navigation away.
- LinkedIn ingest is one-profile-at-a-time in Phase 4. The backend uses Proxycurl per URL — no batch LinkedIn search in scope.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Console Supply + Admin*
*Context gathered: 2026-06-14*
