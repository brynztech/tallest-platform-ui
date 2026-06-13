# Requirements: Brynzit — Talent Platform UI

**Defined:** 2026-06-13
**Core Value:** Every human gate in the recruiting pipeline is a fast, obvious screen in the console; candidates get a public experience polished enough that they want to join the pool.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Turborepo + pnpm monorepo with `apps/web`, `apps/console`, `packages/ui` (shared design tokens + components), `packages/api-client`, `packages/mocks`
- [ ] **FOUND-02**: Typed API client generated from the backend's OpenAPI schema with a repeatable `generate:api` task; nullability verified against Pydantic v2 output
- [ ] **FOUND-03**: MSW mock layer with domain-split handlers; candidate-facing endpoints defined as written contract proposals; mocking toggled per-app via env flag
- [ ] **FOUND-04**: Shared `useAsyncJob` polling primitive for all 202-style endpoints (imports, resume parse, JD parse, outreach generation, enrichment) with terminal-state handling

### Console — BD

- [ ] **BD-01**: BD rep can review a cursor-paginated lead queue of fat cards showing company, ICP score, open roles, decision-maker, and suggested angle without opening a detail page
- [ ] **BD-02**: BD rep can approve, reject (with one of the 7 API rejection reasons), or snooze (smart presets + custom date) a lead inline — full review loop under 30 seconds
- [ ] **BD-03**: BD rep can bulk-select leads and bulk approve / reject (shared reason) / snooze
- [ ] **BD-04**: BD rep can upload a CSV of leads and watch async import progress (queued / processing / done with count / failed)
- [ ] **BD-05**: BD rep can review a 3-email outreach sequence, edit individual steps, and approve or reject the sequence before delivery
- [ ] **BD-06**: BD rep can see the pipeline as a kanban of status columns (discovered → converted) with live counts
- [ ] **BD-07**: BD rep can triage replies in a tasks surface — interested replies surface urgently with their AI briefing; OOO/not-now/unsubscribe show appropriate quick-actions
- [ ] **BD-08**: Snoozed leads resurface on their wake date with a badge on the nav

### Console — Ops

- [ ] **OPS-01**: Ops rep can create, view, and edit clients, including a plain-text notes log (Slack/WhatsApp paste-ins)
- [ ] **OPS-02**: Ops rep can create a requisition, paste a JD, and watch async parsing fill structured fields (role, seniority, skills, comp, dates)
- [ ] **OPS-03**: Ops rep can view and edit requisition detail with status visible across its lifecycle (open → filled/closed)
- [ ] **OPS-04**: Ops rep can trigger candidate matching on a requisition and review the ranked shortlist
- [ ] **OPS-05**: Ops rep can create interviews and track them through scheduled / accepted / declined / completed
- [ ] **OPS-06**: Ops rep can log placements with fee, billing terms, and 90-day retention flag

### Console — Supply

- [ ] **SUP-01**: Supply rep can search the talent pool with hard filters (skills, title, location, seniority, remote pref) combined with free-text semantic search and see ranked results
- [ ] **SUP-02**: Supply rep can view an enriched candidate profile (experience, skills, GitHub signals, email verification, resume) and trigger enrichment with inline async status
- [ ] **SUP-03**: Supply rep can ingest candidates via LinkedIn query, CSV import, or resume upload, each with async status tracking
- [ ] **SUP-04**: Supply rep can review per-requisition shortlist submissions and approve or reject each candidate
- [ ] **SUP-05**: Supply rep can review, edit, and approve or reject AI-generated 2-step engagement sequences

### Console — Admin

- [ ] **ADM-01**: Admin can view AI spend broken down by domain, model, and task type
- [ ] **ADM-02**: Admin can browse and filter the agent event log (domain, task type, date)
- [ ] **ADM-03**: Admin can monitor quota usage vs caps with a warning state above 80%
- [ ] **ADM-04**: Admin can see pipeline health as status counts per stage across domains
- [ ] **ADM-05**: Admin can read and edit agent prompts with save confirmation

### Console — Cross-cutting UX

- [ ] **CUX-01**: Detail views (lead fat card, candidate profile) open as side-panel slide-overs, keeping queue context
- [ ] **CUX-02**: Approve/reject/snooze actions show a 5-second undo toast before committing
- [ ] **CUX-03**: Review queues support keyboard navigation and actions (J/K navigate, A approve, R reject, S snooze, ? shows shortcut overlay)

### Public — Landing & Onboarding

- [ ] **PUB-01**: Visitor sees a contrario-grade landing page explaining Brynzit's value and driving signup
- [ ] **PUB-02**: Candidate can sign up and log in (mocked auth contract; swappable for real backend auth)
- [ ] **PUB-03**: Candidate can upload a resume and watch async parsing prefill their profile
- [ ] **PUB-04**: Candidate can complete a profile (work history, skills, location, remote pref, seniority, links) through a stepped onboarding flow with progress indication
- [ ] **PUB-05**: Candidate sees a profile completeness meter that gates 1-click apply gracefully
- [ ] **PUB-06**: Candidate can edit their profile after onboarding without reapplying
- [ ] **PUB-07**: Candidate sees their GitHub/LinkedIn enrichment on their profile with an "Enriching…" async state

### Public — Job Board & Apply

- [ ] **JOB-01**: Visitor can browse a job board of open roles with instant-update search and filters (role type, location, remote, seniority, skills) and removable filter pills
- [ ] **JOB-02**: Visitor can view a job detail page with full JD, company context, and compensation where available
- [ ] **JOB-03**: Job listings render `JobPosting` JSON-LD and canonical URLs for SEO from first ship
- [ ] **JOB-04**: Candidate with a complete profile can apply in one click; incomplete profiles get a short completion prompt; optional note ≤200 chars (no cover letter)
- [ ] **JOB-05**: Candidate sees match-strength badges ("Strong match" / "Partial match") on roles before applying (mock-first)

### Public — Candidate Dashboard

- [ ] **DASH-01**: Candidate can track each application through statuses (Submitted → Under Review → Shortlisted → Interview Scheduled → Offer / Not Proceeding)
- [ ] **DASH-02**: Status displays use specific substep microcopy ("Matching to open roles", "Recruiter notified") rather than generic labels

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Console

- **CUX-04**: Command palette (Cmd+K) across entities and actions
- **ADM-06**: Cost drilldown per workflow run (cost per lead scored / outreach generated / match run)
- **CUX-05**: Column-order preference for kanban stored locally

### Public

- **NOTF-01**: Email notifications on application status change (blocked on backend candidate auth)
- **NOTF-02**: Email digest of new matching roles
- **PUB-08**: Real candidate authentication wired to backend (replaces mocked contract)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Console auth (v1) | Backend has no auth; trusted-network internal tool; Okta later |
| Client-facing portal | Clients are served by the Ops team, not self-serve (backend decision) |
| Cover letter requirement | 45% abandonment; optional ≤200-char note instead |
| Salary as a hard filter | Hides most roles when comp isn't posted; display-only field |
| Real-time websockets | Polling suffices for a 2–4 person team; TanStack Query interval/focus refetch |
| In-app candidate↔recruiter messaging | Real-time infra + moderation burden; status updates cover the need |
| Calendar integration (OAuth) | High complexity; interview datetime + pasted meet links suffice |
| Notification bell / center | Tasks tab + nav badge covers it at this team size |
| Social feed, company reviews, referral program | Moderation burden / off core value |
| Mobile app / mobile-optimized console | Public site is responsive; dense console is desktop-first |
| Payment processing UI | Placement log fields only in v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| BD-01 | Phase 2 | Pending |
| BD-02 | Phase 2 | Pending |
| BD-03 | Phase 2 | Pending |
| BD-04 | Phase 2 | Pending |
| BD-05 | Phase 2 | Pending |
| BD-06 | Phase 2 | Pending |
| BD-07 | Phase 2 | Pending |
| BD-08 | Phase 2 | Pending |
| CUX-01 | Phase 2 | Pending |
| CUX-02 | Phase 2 | Pending |
| CUX-03 | Phase 2 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 3 | Pending |
| OPS-03 | Phase 3 | Pending |
| OPS-04 | Phase 3 | Pending |
| OPS-05 | Phase 3 | Pending |
| OPS-06 | Phase 3 | Pending |
| SUP-01 | Phase 4 | Pending |
| SUP-02 | Phase 4 | Pending |
| SUP-03 | Phase 4 | Pending |
| SUP-04 | Phase 4 | Pending |
| SUP-05 | Phase 4 | Pending |
| ADM-01 | Phase 4 | Pending |
| ADM-02 | Phase 4 | Pending |
| ADM-03 | Phase 4 | Pending |
| ADM-04 | Phase 4 | Pending |
| ADM-05 | Phase 4 | Pending |
| PUB-01 | Phase 5 | Pending |
| PUB-02 | Phase 5 | Pending |
| PUB-03 | Phase 5 | Pending |
| PUB-04 | Phase 5 | Pending |
| PUB-05 | Phase 5 | Pending |
| PUB-06 | Phase 5 | Pending |
| JOB-01 | Phase 5 | Pending |
| JOB-02 | Phase 5 | Pending |
| JOB-03 | Phase 5 | Pending |
| JOB-04 | Phase 5 | Pending |
| JOB-05 | Phase 5 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| PUB-07 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 45 total (note: planning_context stated 38; actual count from requirements list is 45 — no orphans, all mapped)
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-13*
*Last updated: 2026-06-13 after roadmap creation*
