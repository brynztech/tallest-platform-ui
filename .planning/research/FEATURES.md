# Feature Research

**Domain:** Dual-face recruitment platform — public candidate job board + internal recruiting-ops console
**Researched:** 2026-06-12
**Confidence:** HIGH (core features) / MEDIUM (differentiators) / HIGH (anti-features)

---

## Part 1: Public Candidate Site (apps/web)

### Table Stakes — Candidate Site

Features candidates expect from any polished job board. Missing these = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Landing page with clear value prop | First impression; explains "why join Brynzit vs LinkedIn" | LOW | Must reach contrario/Wellfound polish bar — generic dashboard = failure |
| Email/Google signup + login | Gate for dashboard + apply flow | LOW | Candidate auth is mocked in v1; contract defined here, backend ships later |
| Resume upload → parsed prefill | 49% of candidates abandon long forms; parsing is now table stakes (Workday, Greenhouse both do this) | MEDIUM | Backend `/supply/resume` endpoint exists; parse is async (202 + poll); show "Parsing resume…" inline |
| Profile form covering work history, skills, location, seniority | Candidate profile becomes their application on every role (Wellfound model) | MEDIUM | Fields: name, title, skills[], location, remote_pref, seniority, github_url, linkedin_url, email_verified |
| Profile completeness indicator | Motivates users to fill gaps; increases match quality | LOW | Checklist or % bar — standard SaaS onboarding pattern; show inline next to unfilled sections |
| Job board with browsable open roles | Core reason candidates visit | MEDIUM | Mock-first; proposed API contract: `/public/jobs` paginated list |
| Job search + filter panel | Users expect to narrow by role type, location, remote/hybrid, seniority, skills | MEDIUM | Sidebar filters on desktop; drawer on mobile. Instant-update results (not submit-on-apply). Active filter pills with individual remove |
| Job detail page | Full JD with company context, responsibilities, requirements | LOW | `/public/jobs/:id`; include company name, role, location, compensation if present |
| Apply flow (1-click or short form) | "Apply with profile" — single click if profile is complete; short override form if not | MEDIUM | Single-click: sends candidate profile as submission. Incomplete profile: prompt to complete first. Show confirmation screen |
| Application status tracking dashboard | Candidates want to know where they stand; ghosting = trust destruction | MEDIUM | Statuses: Submitted → Under Review → Shortlisted → Interview Scheduled → Offer / Not Proceeding. Pull (status page) + push (email) |
| Email notifications on status change | Push updates reduce anxious polling (Nielsen Norman: offer both push and pull) | LOW | Transactional: status change, interview invite, rejection. Out of scope to implement in v1 backend but contract should be defined |
| Mobile-responsive layout | 60% of job applications are submitted via mobile | MEDIUM | Responsive from day one; full-form apply must work on mobile |

### Differentiators — Candidate Site

Features that make Brynzit feel better than a generic job board.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "You're being considered" signal | Candidates at Wellfound see whether an employer has viewed/replied/let-expire — transparency creates loyalty | LOW | Surface view timestamp or "recruiter interested" badge on dashboard card |
| GitHub / LinkedIn enrichment display | Lets candidates know their profile is richer than a resume — signal of seriousness | MEDIUM | Backend enrichment is async; profile shows "Enriching…" state, then renders verified fields |
| Role match score visible to candidate | Show candidates how well they match a role before applying — reduces misfire applications | MEDIUM | Requires matching endpoint to be public-facing; mock-first. Show as "Strong match" / "Partial match" badges |
| Warm intro framing | Brynzit positions as curated network, not spray-and-pray board — copy and UX reinforce this | LOW | Copywriting + design choice: "Your application is reviewed by a human recruiter" |
| Async status visibility with specific substeps | "Your profile is being matched" vs generic "Under Review" — reduces candidate anxiety | LOW | Use specific microcopy for each status: "Reviewing profile", "Matching to open roles", "Recruiter notified" |
| Profile edit after submission | Allow candidates to update skills/resume without reapplying | LOW | PATCH `/candidates/:id`; link from dashboard |
| Onboarding progress bar with step labels | Multi-step onboarding with clear completion signal; motivates completion | LOW | 3–4 steps: Account → Resume → Profile → Done. LinkedIn/contrario-style |

### Anti-Features — Candidate Site

Things that look good but hurt the product.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cover letter requirement | Employers want context | 45% of candidates abandon applications that require cover letters; Wellfound removed them entirely | Let candidate write an optional note at apply time (≤ 200 chars) |
| Salary filter with show/hide toggle | Candidates want to filter by pay | If most roles don't post compensation, activating the filter hides 80%+ of jobs (Wellfound's known bug) | Show salary where available as a display field; don't use it as a hard filter gate |
| Social feed / activity stream | Feels "community-like" | Adds content moderation burden, irrelevant to core value prop, and dilutes focus | Invest time in better match quality instead |
| Candidate referral program | Growth mechanic | Complex to implement correctly; incentive misalignment; out of scope for 2–4 person team | Word-of-mouth from great placement outcomes is the real referral engine |
| In-app messaging between candidate and recruiter | Candidates want direct contact | Adds real-time infra; internal team uses Slack; candidate-facing chat creates support burden | Status updates + scheduled interview confirmations cover the communication need |
| Job alerts / saved search with push notifications | Popular job board feature | Firebase/push infra complexity for v1; email notifications on status change covers the high-value case | Email digest of new matching roles is sufficient v1 |
| Company review / ratings | Glassdoor-style credibility | Moderation nightmare; candidates mostly care about role fit, not social proof at this stage | Showcase company details on job card |

---

## Part 2: Internal Console (apps/console)

### Table Stakes — Console (BD Section)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Lead queue with paginated list | Primary daily workflow for BD reps; cursor-paginated from backend | MEDIUM | Cursor-based pagination (`/bd/leads`); "load more" or infinite scroll |
| Fat card per lead | ICP score, company, open roles, decision-maker, suggested outreach angle — all visible without opening detail | MEDIUM | Card must show: company name, ICP score badge, role(s), DM name+title, suggested angle, status badge |
| Approve / Reject (+ reason) / Snooze actions inline | Under-30-second review loop requirement; every action must be reachable without navigating away | LOW | Rejection: 7-value enum from API (`/bd/rejection-reasons`). Snooze: date picker or preset (tomorrow / next week / custom) |
| Bulk select + bulk action | High-volume queues; select-all visible + action | MEDIUM | Checkbox per card + bulk action bar. Actions: bulk approve, bulk reject (shared reason), bulk snooze |
| Async import status tracking (CSV uploads) | `/bd/imports` returns 202; user must see progress without blocking | MEDIUM | Status row in an "Imports" sidebar or dedicated page: queued / processing / done (N leads) / failed. Poll on interval with exponential backoff |
| Outreach sequence preview + edit | Review 3-email sequence before approving delivery | MEDIUM | Step-by-step view: subject + body for each email; PATCH individual steps; Approve / Reject buttons |
| Reply triage surface | Interested replies + briefings are urgent tasks that must surface fast | MEDIUM | Separate "Tasks" or "Inbox" tab; 4 reply types (OOO / unsubscribe / not-now / interested+briefing); each with relevant quick-action |
| Pipeline kanban (BD statuses) | Visual overview of lead funnel: discovered → icp_scored → approved → outreach_sent → … → converted | MEDIUM | Read-only or drag-to-move; column counts from `/bd/pipeline`; color-coded by status age |
| Snoozed items resurfacing | Snoozed leads must reappear on the correct date | LOW | Snooze queue sorted by wake_at date; badge on nav when items are due |

### Table Stakes — Console (Ops Section)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client list + detail | Core CRM; without this, Ops reps have no client context | LOW | CRUD; list view + side panel or full-page detail. Notes section (Slack/WhatsApp log) |
| Requisition create + JD paste → parse | Ops enters job description; backend parses to structured fields | MEDIUM | Async parse (`/ops/requisitions/parse-jd` → 202 + poll); show inline parsing state |
| Requisition detail with structured fields | Title, seniority, skills[], location, comp range, status | LOW | Editable fields; status machine: open → matched → shortlisted → interviewing → filled / closed |
| Match trigger + shortlist review | One click to run AI matching; then review ranked candidates per requisition | MEDIUM | "Run Match" button → async → result list with rank + score. Approve / reject per candidate |
| Interview scheduling | Create interview record; accept / decline / complete state tracking | LOW | `/ops/interviews` CRUD; status: scheduled → accepted → completed / declined |
| Placement logging | Log final placement with fee, billing terms, 90-day retention flag | LOW | `/ops/placements` CRUD; retention flag with timer/date |
| Status machine visibility | Reps need to see where each requisition/interview is in the pipeline | LOW | Status badges throughout; filter by status in list views |

### Table Stakes — Console (Supply Section)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Talent pool search with hard filters | Core sourcing tool; skills, title, location, seniority | MEDIUM | Left-panel filters: skills[] (multi-select), title (text), location, seniority dropdown, remote_pref toggle. Instant filter updates |
| Semantic search input | Free-text "find me a senior React engineer who has worked at a fintech" | HIGH | Passes query to `/supply/candidates/search`; display semantic match scores |
| Candidate profile view (enriched) | GitHub verification, email validation, resume, enrichment data | MEDIUM | Two-panel: summary card + tab sections (Experience, Skills, Enrichment, Activity) |
| Trigger enrichment | Manually trigger enrichment for a candidate; async status | LOW | Button on profile → 202 → polling inline |
| LinkedIn / CSV ingestion | Supply reps add candidates from external sources | MEDIUM | LinkedIn: paste query or URL. CSV: file upload with async import status (same pattern as BD imports) |
| Resume upload (supply-side) | Manually add resume for sourced candidate | LOW | Drag-and-drop upload → async parse → prefilled profile fields |
| Shortlist review per requisition | Per-requisition view of submissions; approve / reject individual candidates | MEDIUM | `/supply/shortlists/:req_id`; fat card per candidate with score; approve/reject buttons |
| Engagement sequence review + approval | Review/edit AI-generated 2-step engagement before sending | MEDIUM | Same pattern as outreach preview: step view, edit, approve/reject per step |

### Table Stakes — Console (Admin Section)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cost dashboard by domain / model / task | Admin monitors AI spend; without this, runaway costs are invisible | MEDIUM | Time-series chart + breakdown table (domain × model × cost). `/monitoring/cost` |
| Agent event log | Filterable feed of agent actions; debugging + audit | LOW | Infinite scroll or paginated log; filters: domain, event_type, date range. `/monitoring/agent-events` |
| Quota monitor | Show current vs. limit for each quota type | LOW | Simple gauges or table; alert if > 80%. `/monitoring/quota` |
| Workflow / pipeline monitor | Status counts per pipeline stage; health overview | LOW | Status count cards: "12 leads pending ICP score", "3 outreach sequences awaiting approval". `/monitoring/pipeline` |
| Prompt editor | Read / edit prompts used by agents | MEDIUM | List of prompt keys; click to edit with a text area; save with confirmation. `/monitoring/prompts` GET/PUT |

### Differentiators — Console (Applies to All Sections)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Keyboard shortcuts for review actions | Linear/Superhuman model: J/K to navigate cards, A to approve, R to reject, S to snooze — rep clears queue without mouse | MEDIUM | Global keybinding registry; display shortcut hints on hover or `?` overlay; only on list/queue views |
| Command palette (Cmd+K) | Jump to any candidate, requisition, client, or action instantly | MEDIUM | Figma/Linear style; search across entities; launch common actions |
| Status-specific empty states | "Queue is clear" states that reinforce productivity — "You're all caught up!" vs generic blank table | LOW | Different illustration/copy per empty state type; motivational framing |
| Async operation status inline (not page-level) | Show parse/enrichment/import progress within the triggering surface, not on a separate status page | MEDIUM | Inline spinner → "Parsing… 2s" → field prefill animation. Avoids context switch. Pattern: 202 → poll → optimistic update |
| Side-panel detail view (no full-page navigation) | Clicking a lead/candidate opens a slide-over panel; reps stay in queue context | MEDIUM | Common in Attio / Linear; keeps list context while showing detail. Escape/back closes |
| Rejection reason enforcement | Backend has 7-value enum; UI should surface reason labels with descriptions, not raw enum values | LOW | Dropdown with human-readable labels; "Not ICP fit", "No open roles", "Already in pipeline", etc. |
| Snooze with smart presets | "Tomorrow", "Next Monday", "In 2 weeks" + custom date picker — faster than date picker alone | LOW | Standard pattern in tools like Superhuman/Missive |
| Per-action undo toast | After approve/reject/snooze: 5-second "Undo" toast before committing mutation | LOW | TanStack optimistic update pattern; cancel mutation on undo click |
| Agent cost breakdown per workflow run | Show cost per lead scored, per outreach generated, per match run — not just aggregate | MEDIUM | Drilldown from cost dashboard; ties action to cost; surfaces ROI |

### Anti-Features — Console

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time websocket updates everywhere | Modern apps feel "live" | Massively increases infra complexity; polling with TanStack Query is sufficient for a 2–4 person internal tool at this stage | Poll on focus/interval; optimistic updates for own actions |
| Fully custom drag-and-drop kanban column configuration | Power users want to customize | Overkill for a fixed status machine with backend-defined stages; columns must match backend enum exactly | Allow column ordering preference stored in localStorage |
| Rich text / markdown pipeline notes | Feels like a notes upgrade | Adds editor complexity, markdown parsing, storage concerns; inline notes at this scale are plain text | Plain textarea for notes; Slack/WhatsApp logs are copy-pasted text anyway |
| Client portal (external client access) | Clients want self-serve visibility | Explicitly out of scope (PROJECT.md); adds auth complexity, different design system requirements, client-specific data isolation | Ops team manages client relationship; provide PDF/email summaries if needed |
| Inline calendar scheduling / calendar sync | Interview scheduling feels like it should integrate with Google Calendar | Requires OAuth per user, calendar API integration, timezone handling — significant scope for v1 | Store interview datetime + notes; Google Meet/Zoom links manually pasted into interview record |
| Mobile app for ops console | Reps might want to review from phone | Dense keyboard-driven UI doesn't translate to mobile; internal tool on trusted network assumption | Responsive-ish layout so it's not broken on tablet; mobile is not primary target |
| Automated email sending directly from console | Route outreach through Brynzit's own SMTP | Instantly.ai handles deliverability; bypassing it breaks the backend flow | Console sends approve → backend sends via Instantly; console shows delivery status |
| Notification center / bell icon | SaaS convention | Adds real-time complexity; for a 2–4 person team, reply tasks surface in the Tasks tab — a notification bell duplicates this | Tasks tab + badge count on nav item is sufficient |

---

## Feature Dependencies

```
Candidate Auth (mocked)
    └──required by──> Apply Flow
    └──required by──> Candidate Dashboard
    └──required by──> Application Status Tracking

Resume Upload (supply endpoint reuse)
    └──enables──> Resume Parse → Prefill
                      └──enhances──> Profile Completeness

Profile Complete
    └──enables──> 1-Click Apply (no form needed)

Job Board (public /jobs endpoint)
    └──required by──> Job Detail Page
    └──required by──> Apply Flow

BD Lead Queue (fat card)
    └──required by──> Bulk Actions
    └──required by──> Outreach Preview (leads must be approved first)

Import (async 202)
    └──required by──> Async Status Pattern (shared across BD imports, supply ingestion, resume parse, enrichment, JD parse)

Candidate Profile (supply)
    └──required by──> Shortlist Review (per-requisition)
    └──required by──> Talent Pool Search results

Requisition
    └──required by──> Match + Shortlist
    └──required by──> Interviews
    └──required by──> Placements

Keyboard Shortcuts
    └──enhances──> Lead Queue Review (30-second loop goal)
    └──enhances──> Shortlist Review

Side Panel Detail
    └──enhances──> Lead Queue (open fat card without leaving list)
    └──enhances──> Talent Pool Search (open candidate without leaving results)

Async Status Pattern (202 + poll)
    └──required by──> BD CSV Import Status
    └──required by──> Supply Resume Upload
    └──required by──> Supply LinkedIn Ingestion
    └──required by──> Supply Enrichment Trigger
    └──required by──> Ops JD Parse
    └──required by──> Outreach Generation
```

### Dependency Notes

- **Candidate auth requires mocked contract first:** The entire candidate-facing flow (apply, dashboard, status tracking) depends on a mock-first auth contract. This must be established before any of those features are built, even in mock form.
- **Async status pattern is a shared primitive:** All 202-pattern endpoints across BD, Supply, and Ops use the same poll-and-render loop. Build this pattern once as a shared hook (`useAsyncJob`) and reuse everywhere.
- **Profile completeness gates 1-click apply:** Without a complete profile, apply flow must degrade gracefully to a short-form; completeness indicator is a UX requirement, not an enhancement.
- **Side-panel conflicts with full-page navigation:** If the console uses full-page navigation for detail views, adding slide-over panels later requires layout refactoring. Decide at architecture stage.

---

## MVP Definition

### Launch With (v1)

**Console (hard prerequisite — backend is complete):**
- [ ] BD Lead Queue with fat cards, approve/reject/snooze, rejection reasons — under-30s loop
- [ ] Bulk select + bulk action on lead queue
- [ ] Async import status (BD CSV upload + supply ingestion)
- [ ] Outreach sequence preview, edit, approve/reject
- [ ] BD Pipeline kanban (read-only, counts from API)
- [ ] Reply / task triage surface
- [ ] Clients CRM (list + detail + notes)
- [ ] Requisitions (create, JD paste → async parse, structured fields, status)
- [ ] Match trigger + shortlist review per requisition
- [ ] Interviews (CRUD + status machine)
- [ ] Placements (CRUD + fee + retention flag)
- [ ] Talent pool search (hard filters + semantic input)
- [ ] Candidate profile (enriched view + trigger enrichment)
- [ ] Supply ingestion (LinkedIn query + CSV + resume upload)
- [ ] Shortlist review per requisition (approve/reject submissions)
- [ ] Engagement sequence review + approve/reject
- [ ] Admin: cost dashboard, agent log, quota monitor, workflow monitor, prompt editor

**Public site (mock-first):**
- [ ] Landing page at contrario/Wellfound polish level
- [ ] Candidate signup / login (mocked auth)
- [ ] Onboarding: resume upload → parse → prefill + profile form + completeness indicator
- [ ] Job board with search + filter panel (mocked data)
- [ ] Job detail page
- [ ] Apply flow (1-click if profile complete; short form otherwise)
- [ ] Candidate dashboard with application status tracker

### Add After Validation (v1.x)

- [ ] Keyboard shortcuts on review queues — add once reps have used the tool for 2+ weeks and the queue shape is stable
- [ ] Command palette (Cmd+K) — once entities and actions are fully defined
- [ ] Per-action undo toasts — after core mutations are stable
- [ ] Side-panel slide-over for lead + candidate detail — if reps report context-switch friction
- [ ] Email notification on application status change — once candidate auth backend ships
- [ ] Role match score visible to candidate — once matching endpoint is public-facing

### Future Consideration (v2+)

- [ ] Candidate-to-recruiter messaging — requires real-time infra + moderation
- [ ] Job alert / saved search emails — requires background job scheduler on public side
- [ ] Calendar integration (Google Calendar OAuth) — high complexity, defer until interview volume warrants it
- [ ] Mobile-optimized console — defer until team grows beyond 4 or reps report mobile need
- [ ] Agent cost breakdown per workflow run (drilldown) — useful at scale; aggregate dashboard covers v1

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| BD Lead Queue (fat cards + actions) | HIGH | MEDIUM | P1 |
| Outreach sequence review/edit/approve | HIGH | MEDIUM | P1 |
| Async import status (202 + poll) | HIGH | MEDIUM | P1 — shared primitive |
| Talent pool search (hard filters + semantic) | HIGH | HIGH | P1 |
| Candidate profile (enriched) | HIGH | MEDIUM | P1 |
| Shortlist review per requisition | HIGH | MEDIUM | P1 |
| Engagement sequence review/approve | HIGH | MEDIUM | P1 |
| Landing page (contrario-grade polish) | HIGH | MEDIUM | P1 |
| Onboarding (resume upload → prefill → profile) | HIGH | MEDIUM | P1 |
| Job board + search/filter | HIGH | MEDIUM | P1 |
| Apply flow | HIGH | MEDIUM | P1 |
| Candidate dashboard + status tracking | HIGH | MEDIUM | P1 |
| Admin cost dashboard + agent log | MEDIUM | LOW | P1 — operational |
| Clients CRM | MEDIUM | LOW | P1 |
| Requisitions + JD parse | MEDIUM | MEDIUM | P1 |
| Interview + placement CRUD | MEDIUM | LOW | P1 |
| Keyboard shortcuts on queues | MEDIUM | MEDIUM | P2 |
| Command palette (Cmd+K) | MEDIUM | HIGH | P2 |
| Side-panel slide-over detail | MEDIUM | MEDIUM | P2 |
| Per-action undo toast | MEDIUM | LOW | P2 |
| Candidate match score badge (public) | MEDIUM | MEDIUM | P2 |
| Prompt editor (admin) | LOW | LOW | P2 — useful but not urgent |
| Email notifications (status change) | MEDIUM | LOW | P2 — blocked on backend |
| Calendar integration | LOW | HIGH | P3 |
| In-app candidate messaging | LOW | HIGH | P3 |
| Job alerts / saved search emails | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Wellfound | Greenhouse (internal) | Ashby (internal) | Brynzit approach |
|---------|-----------|----------------------|------------------|------------------|
| 1-click apply | Yes (profile = application) | No (full ATS form) | Partial | Yes — profile-as-application |
| Resume parse → prefill | Yes | Yes | Yes | Yes (via existing backend endpoint) |
| Profile completeness indicator | Partial | No (internal tool) | No | Yes — with step-by-step checklist |
| Application status tracking | View + reply tracking | Internal only | Internal only | Candidate dashboard with pull status + push email |
| Kanban pipeline | Not candidate-facing | Yes (visual pipeline) | Yes | Yes (BD section) |
| Bulk review actions | No | Yes | Yes | Yes — bulk approve/reject/snooze |
| Keyboard shortcuts | No | Limited | Yes | Yes (P2, post-launch) |
| Fat card detail view | No (list items) | Minimal card | Yes | Yes — fat card is core BD pattern |
| Async status indicators | No | No explicit UI | Partial | Yes — 202 + poll is a first-class pattern throughout |
| Side-panel detail | No | No | No | P2 — architectural decision needed early |
| Command palette | No | No | No | P2 |
| Semantic candidate search | No | No | Partial (AI screening) | Yes — Qdrant-backed semantic search |
| Outreach sequence editor | No | No | No | Yes (unique to Brynzit's AI-first approach) |
| AI cost monitoring | N/A | N/A | N/A | Yes (admin section — differentiator at this size) |

---

## Sources

- Wellfound (formerly AngelList Talent): candidate profile, 1-click apply, application status visibility patterns — https://www.remotejobassistant.com/blog/wellfound-review
- Greenhouse visual pipeline docs — https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline
- Greenhouse bulk review — https://support.greenhouse.io/hc/en-us/articles/115003558531-Review-applications-in-bulk
- Ashby ATS features — https://www.ashbyhq.com/platform/recruiting/ats
- Linear keyboard shortcuts (J/K navigation, triage) — https://shortcuts.design/tools/toolspage-linear/
- Async UI patterns (LogRocket) — https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/
- Filtering UX best practices (LogRocket) — https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/
- Status tracker design guidelines (NN/g) — https://www.nngroup.com/articles/status-tracker-progress-update/
- Semantic vs boolean search in recruiting — https://www.pin.com/blog/semantic-search-recruitment/
- Application abandonment rates (49% long forms) — https://www.jobboardly.com/blog/ultimate-guide-to-job-board-conversion-metrics
- Onboarding UX patterns (task list, completeness meter) — https://ui-patterns.com/patterns/CompletenessMeter
- LLM cost monitoring dashboard patterns — https://satgate.io/blog/llm-cost-management
- CSV import UI patterns — https://blog.csvbox.io/best-ui-patterns-for-file-uploads/

---

*Feature research for: Brynzit talent platform — dual-face recruitment UI*
*Researched: 2026-06-12*
