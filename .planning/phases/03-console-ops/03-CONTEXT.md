# Phase 3: Console Ops - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

An Ops rep can manage the full recruiting lifecycle from client creation through placement:
create/edit clients with a notes log, create requisitions with async JD parsing, trigger
candidate matching, review a ranked shortlist, track interviews through state transitions,
and log placements. The phase covers all 6 OPS requirements across a hybrid routing structure
with client-scoped and global views.

</domain>

<decisions>
## Implementation Decisions

### Routing & Navigation (D-01–D-04)
- **D-01:** Four core routes: `/ops/clients`, `/ops/clients/{id}`, `/ops/requisitions`, `/ops/requisitions/{id}`. Both list views exist independently (hybrid, not nested-only).
- **D-02:** `/ops/clients/{id}` — two-panel layout: left panel (client fields + compact requisitions list with "Create requisition" + "View all reqs for this client" link), right panel (notes paste log). Everything visible at once, no tab-switching.
- **D-03:** `/ops/requisitions` — global flat list across all clients, with client filter dropdown. Ops reps can scan all open work cross-client.
- **D-04:** `/ops/requisitions/{id}` is the main work hub: req fields + parsing status, shortlist table, interviews section, placements section — all on one scrollable page.

### JD Parse Flow (D-05–D-07)
- **D-05:** JD paste lives inside the create-requisition form. Single flow: fill client + title, paste JD, click Create. The POST creates the record, then immediately POSTs to `/parse-jd` and begins polling with `useAsyncJob`.
- **D-06:** While parsing: structured fields (role, seniority, skills, comp, dates) are disabled with skeleton shimmer. When polling resolves they animate in with parsed values.
- **D-07:** Parse failure: fields unlock immediately for manual entry, Sonner toast "JD parsing failed — fill fields manually." Non-blocking — the requisition already exists and the Ops rep completes it by hand.

### Shortlist (D-08–D-10)
- **D-08:** Shortlist rendered as TanStack Table v8 on the requisition detail page. Columns: rank, candidate name, current title, fit score, status badge, actions.
- **D-09:** Three per-row actions with status badge: **Approve** (marks approved, enables interview creation), **Hold** (keeps on shortlist for later review), **Pass** (removes from active shortlist / marks rejected). Status badge: Shortlisted / Approved / Hold / Passed.
- **D-10:** Clicking a shortlist row opens a right-side Sheet slide-over with the candidate's enriched profile — same pattern as Phase 2 lead detail panel. Shortlist table remains visible.

### Interviews (D-11–D-13)
- **D-11:** Interviews are created from the requisition detail page (Interviews section below the shortlist), typically from an approved candidate row. The Interviews section shows all interviews for that requisition.
- **D-12:** A global `/ops/interviews` page shows all interviews across clients/requisitions. It is read-heavy (filters by date, client, requisition, status). Clicking an interview links back to the requisition detail.
- **D-13:** State transitions use an inline status dropdown on the interview row: Scheduled → Accepted / Declined / Completed. One click, no modal for simple transitions.

### Placements (D-14–D-15)
- **D-14:** "Log Placement" action lives on the requisition detail page — appears when a candidate is approved or an interview is accepted/completed. Opens a right-side slide-over form.
- **D-15:** Placement slide-over fields: candidate (pre-filled), requisition (pre-filled), client (pre-filled), fee, billing terms, 90-day retention flag, optional notes. On submit: create placement, mark requisition filled/closed if backend supports it, show placement in requisition placements section.

### Notes Log (D-16)
- **D-16:** Notes on the client detail page are a plain-text append-only log (paste Slack/WhatsApp logs). Uses `POST /api/v1/ops/clients/{id}/notes`. Each note displays with timestamp. No structured parsing of note content.

### Async Pattern (D-17)
- **D-17:** JD parsing reuses `useAsyncJob` from `packages/hooks` (same hook used for CSV imports in Phase 2). The backend `/parse-jd` endpoint returns 202 with a job ID; polling is `useAsyncJob`'s standard responsibility.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — OPS-01 through OPS-06 requirement definitions
- `.planning/ROADMAP.md` §Phase 3 — Goal, success criteria, cross-cutting constraints

### Existing Infrastructure (reuse, don't rebuild)
- `packages/hooks/src/use-async-job.ts` — Polling primitive for JD parse async flow (D-17)
- `apps/console/app/(shell)/bd/leads/page.tsx` — Pattern reference: useInfiniteQuery, optimistic mutations, Sonner toast
- `apps/console/app/(shell)/bd/leads/_components/lead-detail-panel.tsx` — Slide-over Sheet pattern (D-10, D-14)
- `apps/console/app/(shell)/_components/sidebar-nav.tsx` — Sidebar structure; Ops section needs to be unlocked with nav items

### API Contract
- `packages/api-client/src/types/api.d.ts` — Generated Ops schemas: `ClientResponse`, `ShortlistResponse`, `SubmissionResponse`, `InterviewResponse`, `PlacementResponse`, `NoteResponse`; all ops endpoints under `/api/v1/ops/*`
- `packages/mocks/src/handlers/ops.ts` — Existing Ops MSW stub (likely skeletal — needs expansion for all Phase 3 endpoints)

### Phase 2 Summary (patterns to carry forward)
- `.planning/phases/02-console-bd/02-01-SUMMARY.md` — Sidebar, MSW, test infra patterns
- `.planning/phases/02-console-bd/02-02-SUMMARY.md` — Table/card/slide-over patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAsyncJob` (`packages/hooks`): handles 202-polling, terminal states, error — reuse directly for JD parse (D-17)
- Sheet slide-over (`packages/ui`): right-side panel for candidate detail (D-10) and placement form (D-14)
- Sonner toast: established for error/success feedback (D-07, placement confirmation)
- TanStack Table v8: already in `apps/console/package.json` — use for shortlist (D-08)
- `react-hook-form` + Zod v4: use for create-client, create-requisition, and placement forms

### Established Patterns
- `useInfiniteQuery` with cursor pagination: use for client list and requisitions list
- `useMutation` + optimistic update: use for shortlist row actions (Approve/Hold/Pass) and interview state transitions
- MSW handlers with typed `satisfies` assertions: all new Ops handlers follow the Phase 2 bd.ts pattern
- Sidebar Ops section: currently `opacity-40 cursor-not-allowed` stubs — Phase 3 must unlock them with real routes

### Integration Points
- Sidebar nav: unlock Ops section (Clients, Requisitions, Interviews) — remove opacity/cursor-not-allowed stubs from `sidebar-nav.tsx`
- `packages/mocks/src/handlers/ops.ts`: expand from skeleton to full Phase 3 endpoint suite
- `packages/api-client`: no new type extensions needed — all Ops types exist in generated `api.d.ts`

</code_context>

<specifics>
## Specific Ideas

- The `/ops/clients/{id}` two-panel layout mirrors a consulting CRM mental model: notes stay visible alongside structured data because Ops reps take notes during client calls
- The `/ops/requisitions/{id}` page is intentionally long/scrollable (fields → shortlist → interviews → placements) — no tabs, full context on one screen
- The global `/ops/interviews` page is read-heavy with filters — not a workflow page, more of a scheduling overview
- Placement creation closes the loop on a requisition: the action appears contextually (not from a separate nav item) to reinforce the lifecycle narrative

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Console Ops*
*Context gathered: 2026-06-14*
