# Brynzit — Talent Platform UI

## What This Is

The frontend for the Talent Platform backend (`../talent-platform`), shipped as two faces of one product under the **Brynzit** brand:

1. **Public candidate site** (`apps/web`) — a polished, contrario.ai/workatastartup-style site where candidates discover Brynzit, onboard (profile + resume), browse open roles, apply, and track their applications in a dashboard. This is how Brynzit onboards more job-seeking candidates into the supply pool.
2. **Internal console** (`apps/console`) — the ops tool where the internal team (2–4 people) runs the AI-automated recruiting pipelines: BD reps review leads and approve outreach, Ops reps manage clients → requisitions → interviews → placements, Supply reps source/search/shortlist/engage candidates, and Admin monitors agent costs, quotas, and prompts.

## Core Value

Every human gate in the recruiting pipeline — lead review, outreach approval, shortlist review, engagement approval — is a fast, obvious screen in the console; and candidates get a public experience polished enough that they want to join the pool.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Foundation**
- [ ] Turborepo + pnpm monorepo: `apps/web` (public), `apps/console` (internal), `packages/ui` (shared components/design tokens), typed API client generated from the FastAPI OpenAPI schema
- [ ] TanStack Query data layer against `/api/v1`; MSW mocks for endpoints the backend doesn't have yet

**Console — BD section**
- [ ] LeadQueue: paginated lead review (fat cards: ICP score, open roles, decision-maker, suggested angle) with approve/reject(+reason)/snooze and bulk actions — under-30-second review loop
- [ ] OutreachPreview: 3-email sequence review/edit (PATCH step), approve/reject
- [ ] PipelineView: kanban of lead statuses (discovered → converted) from `/bd/pipeline`
- [ ] CSV lead import with async status tracking (`/bd/imports`)
- [ ] Reply/task surface: urgent BD tasks (interested replies + briefings), snoozed items

**Console — Ops section**
- [ ] Clients CRM: client list/detail, notes (Slack/WhatsApp logs)
- [ ] Requisitions: create, JD paste → parse, structured fields, status
- [ ] Match & shortlist: trigger matching, review ranked shortlist
- [ ] Interviews: schedule, accept/decline/complete state tracking
- [ ] Placements: log with fee/billing/90-day retention flag

**Console — Supply section**
- [ ] TalentPool search: hard filters (skills/title/location/seniority) + semantic search results
- [ ] CandidateProfile: enriched profile view (GitHub, email verification, resume), trigger enrichment
- [ ] Ingestion: LinkedIn query, CSV import, resume upload (async parse status)
- [ ] ShortlistReview: per-requisition submissions, approve/reject
- [ ] Engagement: review/edit/approve 2-step engagement sequences

**Console — Admin section**
- [ ] CostDashboard (by domain/model/task), AgentLogs (filterable event feed), QuotaMonitor, WorkflowMonitor (pipeline status counts), PromptEditor (read/edit prompts)

**Public site (Brynzit)**
- [ ] Landing page: contrario-grade polish, explains Brynzit, drives candidate signup
- [ ] Candidate onboarding: profile form + resume upload (reuses existing supply ingest/resume endpoints where possible)
- [ ] Job board: browse open roles (requires new public backend endpoint — mock-first)
- [ ] Apply flow: candidate applies to a role, feeding the submission pipeline (new backend — mock-first)
- [ ] Candidate dashboard: logged-in area tracking application/interview status (requires candidate auth — mock-first)

### Out of Scope

- Internal console auth — backend has no auth yet; console runs on trusted network in v1, Okta later
- Client-facing portal — clients are served by the internal Ops team, not self-serve (backend decision, unchanged)
- Billing/invoicing UI beyond the placement log fields — no payment processing in v1
- Real backend candidate-auth implementation — lives in the backend repo; this repo defines the contract and mocks it
- Mobile apps — web-first

## Context

**Backend (complete, separate repo at `../talent-platform`):** Python/FastAPI + PostgreSQL/Redis/Qdrant, 10 of 11 phases done, 195 tests passing. All internal-console endpoints exist today under `/api/v1`:

- `/bd` — imports (+status), lead queue (cursor pagination), lead fat card, bulk-action (approve/reject/snooze), pipeline kanban counts, rejection-reasons, outreach generate/get/patch/approve/reject/deliver, Instantly webhook, reconcile
- `/ops` — clients CRUD + notes, requisitions (create/get/parse-jd/match/shortlist), interviews (create/get/patch), placements (create/get/list)
- `/supply` — candidates ingest (LinkedIn/CSV), resume upload, candidate search, candidate profile, enrich, shortlists (get/patch submission, submit), engagement (patch/approve/reject)
- `/monitoring` — cost, agent-events, quota, pipeline, prompts (get/put); plus `/api/v1/agent-events`

Key UI-relevant backend facts: many operations are async (202 + status polling: imports, outreach generation, resume parse, enrichment); lead review uses cursor pagination; rejection reasons are a 7-value enum served by the API; reply classification routes to 4 categories (OOO/unsubscribe/not-now/interested with briefing); statuses flow discovered → icp_scored → approved → outreach_sent → … → converted. See `../talent-platform/PLATFORM_FLOWS.md` for full flow diagrams and the ER model.

**Candidate-facing gap:** The backend was built internal-only (candidate self-serve was explicitly out of scope there). The public site's job board, apply flow, and candidate dashboard need new backend endpoints + candidate auth. Strategy: **mock-first** — this repo defines the proposed API contract, builds against MSW mocks, and swaps to real endpoints when the backend ships them.

**Design approach:** UI built with the Taste Skill agent skill (`npx skills add Leonxlnx/taste-skill`) to avoid generic AI-generated interfaces. References: contrario.ai and workatastartup.com for the public site. Internal console is **hybrid**: dense, keyboard-friendly queues for review screens (Linear/Attio feel); richer card layouts for detail views (lead fat card, candidate profile).

**Team:** Same small team (2–4) that built the backend.

## Constraints

- **Tech stack**: TypeScript, Next.js (App Router), TanStack Query, Turborepo + pnpm workspaces — matches what the backend repo's planning anticipated
- **API boundary**: Backend repo is independent; the OpenAPI schema at `/api/v1` is the contract. No backend code changes from this repo — gaps are mocked and contract proposals documented
- **Async UX**: 202-style endpoints (imports, outreach generation, resume parse, enrichment) require polling/status patterns in the UI
- **No auth in v1 console**: trusted-network internal tool; structure should not make adding Okta later painful
- **Design**: Taste Skill governs generation; public site must reach contrario-level polish — a generic dashboard look is a failure condition for the public face

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two apps (web + console) in a Turborepo | Public candidate site and internal ops tool have different audiences, polish bars, and security boundaries; shared packages/ui keeps them coherent | — Pending |
| Console = one app, four sections | BD/Ops/Supply/Admin as route groups in a single app — one deploy, shared nav, far less overhead for a 2–4 person team | — Pending |
| Next.js + TanStack Query + generated API client | App Router for public SEO/marketing pages; TanStack Query fits the poll-heavy async API; OpenAPI codegen keeps the contract typed | — Pending |
| Mock-first for candidate-facing endpoints | UI never blocks on backend; MSW mocks encode the proposed contract the backend repo will implement | — Pending |
| No console auth in v1 | Backend has none; Okta deferred there too — don't invent throwaway auth | — Pending |
| Taste Skill for UI generation | Public face must not look AI-generic; skill enforces brief inference + design-system mapping | — Pending |
| Brand: Brynzit | User-provided product name for the public site | — Pending |
| Hybrid internal aesthetic | Reps clear queues all day (dense) but detail views sell decisions (rich cards) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-12 after initialization*
