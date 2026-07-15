# Brynzit — Recruiting OS Design Spec

**Date:** 2026-07-15
**Status:** Draft for review
**Author:** Design session (Bhuvan + AI)
**Scope note:** This supersedes the informal "two faces of one product" framing in `.planning/PROJECT.md` by re-centering the product on a recruiter-driven **Client → Role → Submission** spine. It reuses — does not discard — the candidate-facing work already planned in `.planning/` (PUB-*, JOB-*, DASH-*) and the internal automation already built in `../talent-platform`.

---

## 1. What we are building

Brynzit is a **recruiting operating system** for an agency that sits **in the middle** between candidates and client companies.

- We hold the **client connections**. The platform connects a **recruiter** to two things: **candidate profiles** and a **client's requirement (role)**.
- A recruiter works role-by-role, sources/shortlists a small number of strong candidates, and **decides** which to submit to the client.
- AI does the heavy lifting everywhere (sourcing, parsing, scoring, matching, drafting). **Humans approve or override** at a few gates. AI never has the final say.
- Candidates get a polished public experience that makes them feel like they have a **personal recruiter** — they register, build a profile, apply, and track every application.

### First customer, SaaS-ready shape

- **Now:** we build this for **one professional recruiter** who does his own client research and brings his own clients. It is effectively single-user / single-workspace.
- **Later (not built now, but designed for):** the same shape becomes a **multi-tenant SaaS** where any agency signs up, brings their own recruiters and clients, and runs their own internal quality layer. The word "mediator" is a **role inside a workspace**, never the Brynzit company hardcoded into the product.

The single decision that buys the SaaS path cheaply: **every domain record is scoped to a `workspace` from day one.** We build no multi-tenant *features* now — only the *seam*.

---

## 2. Locked decisions (from the design session)

| # | Decision | Detail |
|---|----------|--------|
| D1 | Brynzit is the middleman/bridge | We own client connections; recruiter connects candidates ↔ client requirements. |
| D2 | AI advises, humans decide | AI sources/scores/drafts/matches; humans approve or **override**. No fully-automatic gate. |
| D3 | Configurable approval per role | Some roles require internal manager approval before the client sees a candidate; some let a trusted recruiter submit directly. Never hardcoded, never silently bypassable. |
| D4 | Human override of AI is a first-class right | Anyone with access can submit/hold/reject a candidate **even if AI rejected them**, and vice-versa. Every override is recorded. |
| D5 | Rejection is role-scoped, memory is global | Rejecting a candidate for Role A doesn't delete history or block Role B; the system **warns** on re-submission to the same client with prior context. A manager can set an explicit hard block. |
| D6 | Client side is out of scope | Clients do **not** log in. The recruiter/AM records client decisions as stage updates. Client comms happen over normal chat/email, outside the app. Data model stays portal-ready. |
| D7 | Identity now, real login later | Full user / role / assignment data model built now; actions attributed to a user via an "acting as" selector. Real authentication layered on later with no data-model change. |
| D8 | Reusable kit + generic pipeline engine | Package the generic ~60% (UI kit, identity, pipeline engine, dashboards) behind clean seams. The **configurable pipeline** is built as a genuinely domain-agnostic engine from v1. |
| D9 | Workspace scoping from day one | Every record belongs to a workspace. Single workspace now; multi-tenant SaaS later. |
| D10 | BD scraping / auto-feed is design-only for now | The job-scraping + automated client-prospecting pipeline is architected here but **not coded**. It is a separate upstream service that feeds a workspace, an optional accelerant — not the product's core. |
| D11 | Fee model deferred | No fee/commission modeling in this cycle (placement fee fields may exist but are not a focus). |
| D12 | Candidate "personal recruiter" feel is a goal | The candidate experience already planned (profile, onboarding, job board, application tracking) is preserved and treated as a first-class surface, not an afterthought. |

**Overriding design principle:** optimize for **quality recruiting, not candidate spam**. Every feature should help a recruiter understand the role, submit few strong candidates, remember people, and preserve candidate trust.

---

## 3. Personas & roles

| Role | Responsibility | Present in v1 (single recruiter)? |
|------|----------------|-----------------------------------|
| Recruiter | Works assigned roles, sources/shortlists/bookmarks candidates, submits to client | **Yes — primary daily user** |
| Account Manager / Ops | Owns client relationship, creates clients & roles, configures each role's pipeline, records client decisions | Yes — may be the same person as the recruiter in v1 |
| Recruitment / Quality Manager | Approves/rejects submissions internally before the client sees them (only when the role's gate is on) | Yes — role exists; gate is per-role |
| BD | Sources/prioritizes prospect clients from open-market job signals; outreach | Assisted by the design-only scraping pipeline; largely the recruiter's own research in v1 |
| Admin | Monitors AI cost, quotas, agent logs, prompts | Yes (already built in console) |
| Candidate | Registers, builds profile, applies, tracks applications | Yes — public site |
| Client reviewer | Reviews candidates on their side | **Out of scope** — not a system user (D6) |

In v1 one human may wear several hats. The **data model** keeps the roles distinct so SaaS can separate them without a rewrite.

---

## 4. End-to-end flow

```
                         ┌─────────────────── design-only, not coded now ───────────────────┐
 Open-market boards ─▶ Scrape/aggregate jobs ─▶ Prospect-client prioritization ─▶ BD outreach │
 (LinkedIn, Naukri…)                                                                          │
                         └───────────────── feeds prospects/jobs into a workspace ────────────┘
                                                        │
                                                        ▼
 Candidate site ──▶ candidate registers, builds profile, applies ──┐  (shared candidate identity)
                                                                    │
 Client won ──▶ AM creates Client + Role ──▶ configures role pipeline ──▶ assigns recruiter(s)
                                                                    │
                                                                    ▼
                                      Recruiter: search pool + applicants, Matchmaker
                                      suggestions, bookmark, shortlist a few strong candidates
                                                                    │
                                                          creates a SUBMISSION
                                                                    │
                              ┌─────────────────────────────────────┴───────────────────────┐
                              │ GATE (per-role, configurable — D3)                            │
                              │  • gate ON  → internal quality review (approve / reject / hold)│
                              │  • gate OFF → recruiter submits directly                       │
                              │  Either way: AI has pre-scored; a human can OVERRIDE (D4)      │
                              └─────────────────────────────────────┬───────────────────────┘
                                                                    │ approved / submitted
                                                                    ▼
                              Client review happens OFFLINE (D6). AM records each client-side
                              stage change (Founder Screen → Take Home → … → Offer) manually.
                                                                    │
                                                                    ▼
                              Every stage change emits an event → dashboards + candidate memory.
```

---

## 5. Core domain model

The heart of the system is the **Submission** — one candidate on one role. It carries status, current stage, who submitted it, the AI's recommendation, human decisions/overrides, and history.

| Entity | Layer | Purpose / key fields |
|--------|-------|----------------------|
| `Workspace` | Generic (tenant) | Root scope for every record. One now; many later. |
| `User` | Generic (identity) | A person acting in a workspace. |
| `Role` (permission) / `Assignment` | Generic (identity) | Role = recruiter / AM / quality manager / admin. Assignment links a user to clients/roles they can act on. |
| `Pod` | Generic (identity) | Optional grouping (1 BD + 1 outreach + 1 ops + ~10 recruiters). |
| `Client` (account) | Recruiting | A client company. Has an **owner** (AM or the recruiter himself — supports both D1 realities). |
| `Requisition` (role) | Recruiting | An open role at a client: JD, requirements, schedule, status, and **one configurable pipeline**. |
| `Pipeline` / `Stage` | **Generic engine** | Ordered, per-role stages. Each stage has a **type**: `internal_gate` vs `client_stage`. Transition rules. Not a global hardcoded list. |
| `Candidate` | Recruiting | **One identity** across the platform (self-registered on the site or sourced). Profile + resume + enrichment. |
| `Submission` | Recruiting (**core**) | Candidate × Requisition junction. Status, current stage, submitted_by, ai_recommendation, human_decision, override_reason, history. |
| `CandidateRelationship` (memory) | Derived | Everywhere a candidate was submitted/rejected/shortlisted/paused, across all roles & clients. Drives re-submission warnings. |
| `Bookmark` | Recruiting | Recruiter-saved strong candidate for later. |
| `MatchmakerSuggestion` | AI + override | Per-role likely-fit candidates with scores; always human-reviewable and overridable. |
| `StageEvent` | **Generic engine** | Every movement is an event; feeds dashboards and memory. Never a vanity counter. |

### The configurable pipeline (the reusable engine)

Stages are **data, not code**. Example config for one role:

```
[ BrynzIT Review (internal_gate) ] → [ Pending Approval (internal_gate) ]
  → [ Founder Screen (client_stage) ] → [ Take Home (client_stage) ]
  → [ Technical Interview (client_stage) ] → [ Final Round (client_stage) ]
  → [ Offer (client_stage) ]
```

- The **internal gate** stage(s) are Brynzit-owned and can be present (mediated) or absent (direct) per role — this *is* the D3 mechanism.
- The **client stages** mirror that client's real process and are configured by the AM per role.
- The engine (`@kit/pipeline`) knows nothing about recruiting — it manages ordered stages, types, transitions, and events. That's what makes it reusable across future ventures.

### The human-override rule (D4) in the model

Every `Submission` records both an `ai_recommendation` (e.g. `reject`, score 42) and a `human_decision` (e.g. `submit`, with `override_reason`). A recruiter **can** submit a candidate the AI rejected; a manager **can** reject one the AI loved. AI output is advisory metadata on the submission — never a lock. "Direct" (gate off) means *no approval step*, **not** *no record*.

### Identity, roles & the acting-as switcher (implemented in `@brynzit/identity`)

Per D7, there is no real login yet, but the role/permission logic is real. Implementation:

- **Switch by user, not by role.** A top-right dropdown lets you switch the **acting user** (a person who carries a role), so every action stays attributable ("who bookmarked / submitted / rejected this"). When real auth ships, the switcher is removed and the acting user comes from the session — no other change.
- **Capabilities are a single source-of-truth matrix**, not configured in the UI. Each role maps to a set of capabilities:

  | Capability | Recruiter | Account Mgr | Quality Mgr | Admin |
  |-----------|:--------:|:----------:|:----------:|:-----:|
  | View assigned roles | ✅ | — | — | ✅ |
  | View all roles | — | ✅ | ✅ | ✅ |
  | Manage client | — | ✅ | — | ✅ |
  | Manage requisition | — | ✅ | — | ✅ |
  | Configure pipeline / gate | — | ✅ | ✅ | ✅ |
  | Shortlist / bookmark / submit | ✅ | ✅ | ✅ | ✅ |
  | Approve/reject at internal gate | — | — | ✅ | ✅ |
  | Override an AI decision | ✅ | ✅ | ✅ | ✅ |
  | Hard-block a candidate | — | ✅ | ✅ | ✅ |
  | View internal ops | — | ✅ | ✅ | ✅ |
  | View admin | — | — | — | ✅ |

- **`can(capability)` seam.** A pure `hasCapability(role, capability)` function plus a `useCan()` hook drive nav visibility, button enable/disable, and route guards. The same checks move server-side unchanged when the backend gains auth.
- **Enforcement is client-side only today** (trusted single-user tool) — this is an explicit, temporary trade-off, isolated behind the `can()` seam so it can be enforced on the server later without touching screens.
- **Package is headless and reusable** (`@brynzit/identity`): types, capability matrix, seed users, SSR-safe storage, and the React context/hooks — no UI dependency. The presentational switcher lives in the console app using the shared UI kit.

---

## 6. Candidate experience (preserve what's planned; add personal-recruiter feel)

The candidate side is **already specified** in `.planning/` and partially built in `apps/web`. This spec **keeps all of it** and frames it around one goal: the candidate should feel like they have a personal recruiter.

Already planned / partially built (reuse, don't reinvent):

- **Profile & onboarding** (PUB-01…07): resume-first onboarding, async resume parse prefill, completeness meter gating 1-click apply, profile edit, GitHub/LinkedIn enrichment. Contract: `.planning/contracts/candidate-profile.yaml`.
- **Job board & apply** (JOB-01…06): public job board as an acquisition funnel (limited preview → signup), job detail with JSON-LD, 1-click apply with optional ≤200-char note, match-strength badges for signed-in candidates. Contract: `.planning/contracts/public-jobs.yaml`.
- **Application tracking** (DASH-01/02): each application moves through `Submitted → Under Review → Shortlisted → Interview Scheduled → Offer / Not Proceeding`, with **substep microcopy** ("Matching to open roles", "Recruiter notified"). Contract: `.planning/contracts/candidate-applications.yaml`. Currently a scaffold at `apps/web/app/dashboard/page.tsx`.

Personal-recruiter feel (how we elevate the above):

- The candidate's application status is a **projection of the internal `Submission`** — when a recruiter shortlists or a stage advances internally, the candidate's tracker reflects a human, specific message, not a generic label.
- The candidate profile is the **same `Candidate` identity** the recruiter sees in the console (shared, per the guardrail "one candidate identity across site + console").
- Candidate memory means a returning candidate is **remembered** — prior applications, where they got shortlisted, what they were paused on.

Explicitly still **mock-first / not real** until backend ships: candidate auth, public jobs, profile persistence, applications. This spec does not change that; it clarifies that the candidate tracker is downstream of the Submission model.

---

## 7. Recruiter workspace (the buildable core)

The primary daily surface. A recruiter:

1. Sees **only their assigned roles** (list of requisitions with status, counts, urgency).
2. Opens a role → sees the JD/requirements, the role's **pipeline**, current submissions by stage, and **Matchmaker suggestions** (AI-ranked candidates) plus free search over the talent pool and inbound applicants.
3. **Bookmarks** promising candidates for later.
4. **Shortlists & submits** a small number of strong candidates. On submit:
   - AI attaches its recommendation/score.
   - If the role's gate is **on**, it enters internal review; if **off**, it goes straight to the first client stage.
   - The recruiter can **override AI** (submit a candidate AI flagged) — captured with a reason.
5. Handles **exceptions**: hold, reject-with-reason, re-open, or manually move a submission's stage (e.g. after a client's verbal decision).
6. Sees **re-submission warnings** ("rejected 3 weeks ago for Backend Eng — reason: not enough scale") before submitting a candidate to a client they've been rejected at.

Managers additionally get the **internal approval queue** (submissions awaiting the gate) and can approve/reject/override.

---

## 8. Reusable architecture

Draw clean seams so the generic layer lifts into future ventures. Recruiting is the first tenant on top of a reusable kit.

| Package | Kind | Responsibility |
|---------|------|----------------|
| `@kit/ui` | Generic | Design system, tables, forms, entity-detail layouts, kanban/board UI. (Evolves today's `packages/ui`.) |
| `@kit/identity` | Generic | Workspaces, users, roles, pods, assignment, permission checks, "acting as". |
| `@kit/pipeline` | Generic | Config-driven stage engine + board UI + transition rules + stage events. |
| `@kit/dashboards` | Generic | Event-driven metric widgets fed by `StageEvent`s. |
| `domain/recruiting` | Specific | Clients, requisitions, candidates, submissions, quality gate, matchmaker, memory. |
| `apps/web` | Specific | Candidate site (reuses existing planned work). |
| `apps/console` | Specific | Internal workspace (recruiter / AM / quality / admin) on top of the kits. |

The current console's BD/Ops/Supply structure is **folded in as services that feed recruiters** (sourcing, matchmaker, scraping), not as the organizing structure.

---

## 9. What's built · what's left · how we make it

Grounded in the current code + `.planning/` (see the current-state analysis for evidence).

| Capability | Built today | Gap vs this spec | How we make it |
|------------|-------------|------------------|----------------|
| Monorepo, UI kit, typed API client, MSW, async polling | Yes (`packages/*`, Phase 1) | Rename/extract generic kits | Refactor `packages/ui` + new `@kit/*` seams |
| Identity / roles / workspace / assignment | **No** (no auth, no user model) | Entire identity layer | New `@kit/identity`; "acting as" selector; workspace scope on all records |
| Client & requisition management | Yes (Ops console, backend `/ops`) | Recruiter-owned client variant; per-role configurable pipeline | Extend ops model; add pipeline config |
| Configurable pipeline engine | **No** (interviews are a fixed state machine) | Generic ordered stages w/ types | New `@kit/pipeline`; migrate interview stages onto it |
| Candidate identity & profiles | Partial (supply search; public profile mock) | Unify site + console candidate identity | Single `Candidate` model shared across surfaces |
| Submission as first-class object | **Partial** (supply "shortlist submissions" is the seed) | Cross-role status + AI-rec + override + memory | Promote to core `Submission` entity |
| Candidate relationship memory + re-submission warnings | **No** | Global memory, warnings, hard-block override | Derive from submissions; warning UX on submit |
| Bookmarks | **No** | Recruiter saved candidates | New `Bookmark` entity + UI |
| Internal quality gate (per-role, override) | **Partial** (supply shortlist approve/reject exists) | Configurable on/off + override recording | Model gate as a pipeline stage type |
| AI Matchmaker (with override) | Yes (backend matching + supply search) | Surface per-role in recruiter workspace; ensure override | Reuse backend matching; new recruiter UI |
| Candidate site (landing/jobs/onboarding/apply) | Yes, mock-first (Phase 5/5.1) | Wire tracker to real Submission model | Keep as-is; connect when backend ships |
| Candidate dashboard / application tracking | **Scaffold** (Phase 6, DASH-01/02) | Build tracker as projection of Submission | Implement Phase 6 against submission projection |
| Admin monitoring (cost/quota/logs/prompts) | Yes | — | Reuse |
| BD scraping / auto-feed pipeline | **No** (backend has lead import + Apollo, not scraping) | Full daily multi-board scraping + prospect prioritization | **Design-only now** (§10) |

---

## 10. Design-only: BD scraping & automated client-prospecting pipeline

**Not coded in this cycle (D10).** Documented so the architecture is ready and the rest of the app has a clean integration point.

Intended shape — a **separate upstream service** that feeds a workspace:

```
Sources (LinkedIn, Naukri, other boards)
        │  scheduled daily scrape / API pulls
        ▼
Ingestion & normalization ──▶ dedup ──▶ raw job/company signals store
        │
        ▼
Enrichment (company data) ──▶ prospect scoring / prioritization (which companies are worth pursuing)
        │
        ▼
BD queue in workspace ──▶ (human) BD reviews & picks ──▶ AI-drafted outreach ──▶ (human) approves ──▶ send
        │
        └──▶ scraped open roles ALSO surface on the candidate site's job board
```

Integration contract with the core app (the only thing the core app depends on):
- The pipeline **writes** prospect clients / job signals into the workspace as suggestions.
- The core app treats these as **advisory inputs** a human accepts or ignores (consistent with D2/D4).
- It is **optional** — turning it off leaves the recruiter's own-research workflow fully intact.

Open items to resolve before this is planned: source list & legality/ToS of scraping each board, scheduling/orchestration (the backend's planned Temporal work is the natural home), and the prospect-scoring rubric.

---

## 11. Non-negotiable guardrails

- Hiring stages are **per-role config**, never a global hardcoded list.
- Recruiters cannot bypass internal quality review **unless the role explicitly allows it** (gate off).
- Rejection **never deletes** candidate history.
- **No blind re-submission** to the same client — always warn with prior history.
- BD vs Ops **ownership is explicit**, never ambiguous.
- Candidate site and console **share one candidate identity**.
- AI Matchmaker is **assistive, always human-reviewable**; humans can override any AI decision (D4).
- Dashboards reflect **real stage events**, not vanity counters.

---

## 12. Out of scope (this cycle)

- Client-facing login / portal (D6).
- Fee / commission modeling (D11).
- Coding the BD scraping pipeline (D10 — design only).
- Real authentication (D7 — identity model only).
- Real candidate backend endpoints (remain mock-first; backend repo owns them).
- Multi-tenant SaaS *features* (only the workspace *seam* now, D9).

---

## 13. Open questions

1. **BD centrality (asked to the recruiter):** is the tool's core job to *find/bring clients*, or to *manage candidates & submissions for clients he already has*? Current working assumption (from the latest conversation): **manage clients he brings himself**, with scraping as an optional accelerant. Confirmation slots into §10.
2. Where should implementation planning live — continue in the existing GSD `.planning/` phase structure, or a fresh milestone? (Process, not product.)

---

## 14. How we proceed (proposed phased roadmap)

| Phase | Name | Scope | Why here |
|-------|------|-------|----------|
| A | Foundations | `@kit/identity` (workspace/users/roles/assignment, acting-as) + `@kit/pipeline` (config-driven stage engine) + Client→Role model with per-role pipeline | Unblocks everything; establishes reusable seams |
| B | Recruiter workspace | Assigned-roles view, candidate search over pool + applicants, bookmark, shortlist, submit | The daily driver |
| C | Submission core + gate + memory | Submission entity, configurable internal gate, AI-rec + human override recording, global candidate memory, re-submission warnings | The quality/trust promise (D4/D5) |
| D | Pipelines + client tracking | Per-role client stages, AM records client decisions, stage transitions & events | Makes each client's real process visible |
| E | Dashboards | Role-specific and "my work" dashboards from `StageEvent`s | Activity → managed operations |
| F | AI Matchmaker surface | Per-role suggestions in the recruiter workspace, always overridable | Quality accelerant, never autopilot |
| — | Candidate site | Keep existing mock-first work; wire the dashboard tracker (Phase 6/DASH-*) to the Submission projection when backend ships | Preserve planned candidate experience |
| — | BD scraping pipeline | Design-only (§10); build later as a separate service | Optional accelerant |

---

*End of spec. Ready for review.*
