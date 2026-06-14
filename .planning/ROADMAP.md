# Roadmap: Brynzit — Talent Platform UI

## Overview

Six phases build Brynzit from a bare monorepo to a complete dual-face product: an internal ops console (backed by a live FastAPI API from day one) and a polished public candidate site (mock-first until the backend candidate APIs ship). Foundation comes first because every phase depends on its typed API client and MSW contract architecture. The console is built before the public site because all console endpoints exist today. Within the console, BD leads because it contains the reusable async-polling and cursor-pagination primitives every later phase borrows. Admin and Supply share Phase 4 because they are independent of each other and both reuse established patterns. The public site ships as a coherent vertical slice in Phase 5, with the candidate dashboard and enrichment display closing out Phase 6.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Monorepo, shared packages, typed API client, MSW contract architecture, and candidate-facing OpenAPI contracts *(completed 2026-06-13)*
- [ ] **Phase 2: Console BD** - Full BD review loop — lead queue, outreach, pipeline kanban, CSV import, reply triage, and cross-cutting console UX patterns
- [ ] **Phase 3: Console Ops** - CRM backbone — clients, requisitions with async JD parse, match + shortlist, interviews, and placements
- [ ] **Phase 4: Console Supply + Admin** - Talent pool search, candidate profiles, ingestion, shortlist review, engagement sequences, and all Admin monitoring screens
- [ ] **Phase 5: Public Site** - Contrario-grade landing, candidate signup/onboarding, job board with SEO + JSON-LD, apply flow
- [ ] **Phase 6: Candidate Dashboard** - Application status tracker, substep microcopy, enrichment display, profile edit, and mock-swap readiness

## Phase Details

### Phase 1: Foundation
**Goal**: The monorepo scaffold exists, both Next.js apps build cleanly, shared packages are wired up, the typed API client generates from the live backend schema with Pydantic v2 nullables verified, and MSW contract proposal files are in place for every candidate-facing endpoint before any feature code is written.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. `turbo run build` completes without errors across all packages and both apps from a clean checkout
  2. `pnpm generate:api` regenerates `packages/api-client` from the live backend OpenAPI schema; a smoke test asserts that at least 5 representative nullable fields are typed as `T | null` (not just `T`), verifying Pydantic v2 anyOf handling
  3. MSW handler files exist in `packages/mocks/src/handlers/` with one file per domain (bd, ops, supply, monitoring, candidate); the `candidate.ts` file contains typed contract-mock handlers for all proposed candidate-facing endpoints, typed against generated OpenAPI types
  4. `useAsyncJob` polling primitive exists in a shared location, covers all 202-style terminal states, and has a passing unit test
  5. OpenAPI contract proposal files exist in `.planning/contracts/` for every candidate-facing endpoint (`/public/jobs`, `/candidate/auth/*`, `/candidate/profile`, `/candidate/applications`) before any mock handler is written against them
  6. Generated types are smoke-tested against the **live backend** for all four existing domains: at least one representative endpoint from `/api/v1/bd`, `/api/v1/ops`, `/api/v1/supply`, and `/api/v1/monitoring` is called and the response shape is asserted against the generated TypeScript types — catching any drift between the OpenAPI schema and the actual running API before any feature phase begins
**Plans**: 4/4 complete
Plans:
- Wave 1: 01-01-PLAN.md ✓ — Monorepo scaffold: turbo.json, pnpm catalog, shared tsconfigs, packages/ui tokens, packages/api-client client, packages/mocks domain handlers, packages/hooks useAsyncJob
- Wave 2 *(blocked on Wave 1)*: 01-02-PLAN.md ✓ — API codegen + useAsyncJob tests + OpenAPI contract YAML files for candidate endpoints
- Wave 2 *(blocked on Wave 1)*: 01-03-PLAN.md ✓ — Both Next.js 16 app shells (apps/web + apps/console) with MSW provider, globals.css, App Router structure
- Wave 3 *(blocked on Wave 2)*: 01-04-PLAN.md ✓ — Walking skeleton: shadcn init, rejection-reasons MSW handler, 4-domain live smoke test, human verify
**Cross-cutting constraints:** MSW only initialized with `NEXT_PUBLIC_API_MOCKING=enabled`; `@theme` owned exclusively by `packages/ui`; all packages use `@brynzit/*` scope and `catalog:` version references
**UI hint**: yes

### Phase 2: Console BD
**Goal**: A BD rep can open the console, clear an entire lead review queue in under 30 seconds per lead, approve outreach sequences, monitor the pipeline, process CSV imports asynchronously, triage replies, and use keyboard shortcuts throughout — with side-panel slide-overs keeping queue context intact.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BD-01, BD-02, BD-03, BD-04, BD-05, BD-06, BD-07, BD-08, CUX-01, CUX-02, CUX-03
**Success Criteria** (what must be TRUE):
  1. BD rep can scroll a cursor-paginated lead queue of fat cards (ICP score, open roles, decision-maker, suggested angle visible without opening any detail page), open a lead's enriched detail in a side-panel slide-over, and approve, reject with one of the 7 API rejection reasons, or snooze a lead inline — all within one screen
  2. BD rep can bulk-select visible leads and apply approve / reject (with shared reason) / snooze to all of them in a single action; bulk actions use the pending-overlay pattern (items stay visible with a processing state) and the queue re-fetches on settlement without cursor corruption
  3. BD rep can upload a CSV and see the import move through queued → processing (with count) → done/failed states via async polling, with no manual refresh required
  4. BD rep can review a 3-email outreach sequence, edit any step inline, and approve or reject it before delivery
  5. BD rep can see a live pipeline kanban (discovered → converted status columns with counts), triage reply tasks (interested replies surfaced with AI briefing, OOO/not-now/unsubscribe with quick-actions), and see a nav badge when snoozed leads have woken
  6. Every review queue supports J/K navigation, A approve, R reject, S snooze, and ? shortcut overlay; every destructive action shows a 5-second undo toast before committing
**Plans**: 4 plans
Plans:
- [ ] Wave 1: 02-01-PLAN.md — Shell sidebar + shadcn components + all BD MSW handlers + Vitest infra + ThemeProvider dark-mode fix
- [ ] Wave 2 *(blocked on Wave 1)*: 02-02-PLAN.md — Lead queue: fat cards, slide-over, approve/reject/snooze optimistic undo, bulk actions, keyboard shortcuts (BD-01, BD-02, BD-03, CUX-01, CUX-02, CUX-03)
- [ ] Wave 2 *(blocked on Wave 1)*: 02-03-PLAN.md — Async flows: CSV import with useAsyncJob polling + outreach sequence review/edit/approve (BD-04, BD-05)
- [ ] Wave 3 *(blocked on Wave 2)*: 02-04-PLAN.md — Pipeline kanban (dnd-kit v6) + reply triage + human verify (BD-06, BD-07, BD-08)
**Cross-cutting constraints:** Keyboard shortcuts disabled when Sheet/Dialog/Popover is open; @dnd-kit/sortable v10 (not @dnd-kit/react 0.5.x); native fetch for multipart CSV upload (not apiClient); queryClient.resetQueries (not invalidate) after bulk actions
**UI hint**: yes

### Phase 3: Console Ops
**Goal**: An Ops rep can manage the full recruiting lifecycle from client creation through placement, with async JD parsing filling requisition fields automatically, match results visible as a ranked shortlist, and interview/placement state machines tracked on screen.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06
**Success Criteria** (what must be TRUE):
  1. Ops rep can create a client, view/edit its detail, and paste Slack/WhatsApp notes into a plain-text notes log that persists
  2. Ops rep can create a requisition, paste a full JD, and watch async parsing populate structured fields (role, seniority, skills, comp, dates) via polling — with a manual fallback if parsing fails
  3. Ops rep can trigger candidate matching on a requisition and review a ranked shortlist of candidates with their fit indicators
  4. Ops rep can create interviews and update them through scheduled → accepted / declined → completed states, and log placements with fee, billing terms, and a 90-day retention flag
**Plans**: 5 plans
Plans:
- [x] Wave 1: 03-01-PLAN.md ✓ — textarea shadcn component + all Ops MSW handlers (20 handlers) + sidebar Ops section unlock + 5 Wave-0 test stubs
- [x] Wave 2 *(blocked on Wave 1)*: 03-02-PLAN.md ✓ — Client CRM vertical: client list, create dialog, two-panel detail layout, editable fields, append-only notes log (OPS-01)
- [x] Wave 2 *(blocked on Wave 1)*: 03-03-PLAN.md ✓ — Requisition + JD Parse vertical: global req list (MSW-only), create dialog with async parse polling, req detail hub page, fields card (OPS-02, OPS-03)
- [x] Wave 3 *(blocked on Wave 2)*: 03-04a-PLAN.md ✓ — ShortlistTable + CandidateDetailPanel vertical: TanStack Table v8 shortlist, candidate slide-over, approvedCandidateId state (OPS-04)
- [x] Wave 3 *(blocked on Wave 2, 03-04a)*: 03-04b-PLAN.md ✓ — Interviews + Placement vertical: interview state machine, placement slide-over form, global interviews page (OPS-05, OPS-06)
**Cross-cutting constraints:** GET /api/v1/ops/requisitions and GET /api/v1/ops/interviews are MSW-only (get?: never in api.d.ts); shortlist Approve/Hold/Pass use PATCH /api/v1/supply/shortlists/{submission_id}; useAsyncJob statusMap override required for JD parse (open/filled/closed → complete); note text rendered as JSX text nodes (never dangerouslySetInnerHTML)
**UI hint**: yes

### Phase 4: Console Supply + Admin
**Goal**: A Supply rep can search the talent pool with combined hard filters and semantic text, view and enrich candidate profiles, ingest candidates from multiple sources asynchronously, manage per-requisition shortlists, and approve engagement sequences; simultaneously, an Admin can monitor costs, agent events, quotas, pipeline health, and edit prompts.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, ADM-01, ADM-02, ADM-03, ADM-04, ADM-05
**Success Criteria** (what must be TRUE):
  1. Supply rep can enter hard filters (skills, title, location, seniority, remote preference) plus free-text semantic query and receive ranked candidate results; result set updates without full page reload
  2. Supply rep can open an enriched candidate profile showing experience, skills, GitHub signals, email verification status, and resume; can trigger enrichment and see an inline async "Enriching…" state that resolves to updated data
  3. Supply rep can ingest candidates via LinkedIn query, CSV upload, or resume upload — all three paths surface async status (queued / processing / done / failed) without manual refresh
  4. Supply rep can view per-requisition shortlist submissions and approve or reject individual candidates, and can review, edit, and approve or reject 2-step AI-generated engagement sequences
  5. Admin can view AI cost breakdown by domain/model/task, browse and filter the agent event log, see quota usage with a warning state above 80%, view pipeline health as status counts per stage, and read/edit agent prompts with save confirmation
**Plans**: TBD
**UI hint**: yes

### Phase 5: Public Site
**Goal**: A visitor can discover Brynzit on a contrario-grade landing page, sign up as a candidate, upload their resume to prefill their profile via async parsing, complete a stepped onboarding flow, browse and search a job board where every listing has JobPosting JSON-LD for Google for Jobs, view job detail pages, and apply with one click (or a short override form if their profile is incomplete) — all against MSW contract mocks.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06, JOB-01, JOB-02, JOB-03, JOB-04, JOB-05
**Success Criteria** (what must be TRUE):
  1. A visitor landing on `/` sees a Brynzit landing page at contrario.ai reference polish — editorial typography, clear value proposition, candidate-facing CTA driving signup — not a generic AI-generated dashboard
  2. A candidate can sign up, log in (mocked auth), upload a resume and watch async parsing prefill their profile, then complete a stepped onboarding flow with progress indication and a completeness meter that gates 1-click apply
  3. A candidate can edit their profile after onboarding without restarting the flow
  4. A visitor can browse a job board with instant-update search and filters (role type, location, remote, seniority, skills) with removable filter pills, and open job detail pages with full JD, company context, and compensation where available
  5. Every job listing page renders `JobPosting` JSON-LD structured data and a canonical URL from first ship; running the Google Rich Results Test on any job page returns no errors
  6. A logged-in candidate with a complete profile can apply in one click; a candidate with an incomplete profile receives a short completion prompt; both paths accept an optional note of ≤200 characters (no cover letter field); match-strength badges appear on roles
**Plans**: TBD
**UI hint**: yes

### Phase 6: Candidate Dashboard
**Goal**: A logged-in candidate can track every application through clearly named status stages with specific substep microcopy, see their GitHub/LinkedIn enrichment reflected on their profile, and edit their profile at any time; the MSW mock-swap procedure is validated end-to-end so deleting a handler file is the only change needed when the backend ships real candidate endpoints.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, PUB-07
**Success Criteria** (what must be TRUE):
  1. Logged-in candidate sees a dashboard listing each application with its current status (Submitted → Under Review → Shortlisted → Interview Scheduled → Offer / Not Proceeding) and specific substep microcopy ("Matching to open roles", "Recruiter notified") rather than generic labels
  2. Candidate profile page shows GitHub/LinkedIn enrichment signals with an "Enriching…" async state while processing, resolving to updated data when complete
  3. Mock-swap procedure verified: for at least one endpoint, deleting its handler from `packages/mocks/src/handlers/candidate.ts` routes traffic to the real backend with no app code changes — documented in `.planning/contracts/SWAP_PROCEDURE.md`
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-06-13 |
| 2. Console BD | 0/4 | In progress | - |
| 3. Console Ops | 0/5 | Not started | - |
| 4. Console Supply + Admin | 0/TBD | Not started | - |
| 5. Public Site | 0/TBD | Not started | - |
| 6. Candidate Dashboard | 0/TBD | Not started | - |
