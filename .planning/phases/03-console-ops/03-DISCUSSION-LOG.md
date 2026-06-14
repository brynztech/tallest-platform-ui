# Phase 3: Console Ops - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 3-Console Ops
**Areas discussed:** Client→Requisition navigation, JD parse interaction, Shortlist surface + actions, Interview & placement entry

---

## Client→Requisition Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Nested: /ops/clients/{id} with tabs | Client detail is the hub; requisitions and notes are tabs inside it | |
| Flat: separate /ops/clients and /ops/requisitions lists | Two independent list pages; requisitions has a client filter | |
| Hybrid: flat list views + quick-link from client to its reqs | Both flat lists exist, plus cross-links between them | ✓ |

**User's choice:** Hybrid with requisition detail as the main work hub. Build `/ops/clients`, `/ops/clients/{id}`, `/ops/requisitions`, `/ops/requisitions/{id}`. Client detail shows compact reqs list + "Create requisition". Requisitions page shows all reqs cross-client with client filter.

**Notes:** Ops needs both CRM context and cross-client work queues. Nested-only is too account-centric; flat-only loses client context. Hybrid matches real recruiting ops.

---

## Client Detail Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single scrollable page | Client fields → notes log → compact req list | |
| Two-panel: left (fields + compact reqs) + right (notes log) | Side-by-side, always visible | ✓ |
| Tabs: Overview \| Notes \| Requisitions | Three tabs, forces context-switching | |

**User's choice:** Two-panel layout — fields and compact requisitions list on the left, notes paste log on the right.

**Notes:** Notes need to stay visible alongside structured data because Ops reps take notes during client calls.

---

## JD Parse Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Inside create-requisition form: paste + Create fires parsing | Single flow, fewer clicks | ✓ |
| Two-step: create first, then paste JD on detail page | More flexible, two navigations | |
| Modal paste: modal opens after creation | Clean form, but required modal step | |

**User's choice:** JD paste inside the create-requisition form. Single flow: fill client + title, paste JD, hit Create.

---

## JD Parse UX (while in progress)

| Option | Description | Selected |
|--------|-------------|----------|
| Fields disabled with skeleton shimmer, then fill in | Clean, can't overwrite in-progress parsing | ✓ |
| Fields editable with 'Parsing…' banner | Faster for power users, may overwrite manual edits | |
| Fields hidden until parsing resolves | Collapsed until done | |

**User's choice:** Fields disabled with skeleton shimmer.

---

## JD Parse Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Fields unlock for manual entry + toast | Non-blocking, manual fallback | ✓ |
| Retry button with error message | Fields stay skeleton, explicit retry | |
| Auto-retry up to 2 times then unlock | Silent retries | |

**User's choice:** Fields unlock for manual entry + Sonner toast "JD parsing failed — fill fields manually."

---

## Shortlist Surface

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Table: sortable rows with fit score | Dense table, sortable, existing dep | ✓ |
| Card list: one card per candidate | Fat-card pattern from Phase 2 | |
| Split pane: list left, detail right inline | More screen real estate, no slide-over | |

**User's choice:** TanStack Table v8 with columns: rank, candidate name, current title, fit score, status badge, actions.

---

## Shortlist Actions

| Option | Description | Selected |
|--------|-------------|----------|
| Approve + Pass (two actions) | Two-state decision | |
| Approve / Hold / Pass with status badge | Three-state with badge | ✓ |
| Bulk select + action toolbar | Efficient for large shortlists | |

**User's choice:** Three row actions: Approve (enables interview creation), Hold (keep for later), Pass (remove from active shortlist). Status badge: Shortlisted / Approved / Hold / Passed.

---

## Candidate Detail View from Shortlist

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-over Sheet from shortlist row | Reuses Phase 2 pattern, table stays visible | ✓ |
| Full-page navigation: /ops/candidates/{id} | Loses requisition context | |
| Inline row expansion | Table gets very tall | |

**User's choice:** Right-side Sheet slide-over, same pattern as Phase 2 lead detail panel.

---

## Interview Creation Location

| Option | Description | Selected |
|--------|-------------|----------|
| From requisition detail: Interviews section below shortlist | Context-scoped, no separate nav | |
| Dedicated /ops/interviews page | Global visibility | |
| Both: req-scoped creation + global /ops/interviews | Full coverage | ✓ |

**User's choice:** Both. Create/manage from `/ops/requisitions/{id}` (Interviews section). Global read-heavy `/ops/interviews` page with filters by date/client/requisition/status. From global view, clicking an interview links back to requisition detail.

---

## Interview State Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Inline status dropdown on interview row | One click, no modal | ✓ |
| Context-aware action buttons per state | More explicit | |
| Click to open interview detail slide-over | Heavier, allows adding notes with transition | |

**User's choice:** Inline status dropdown: Scheduled → Accepted / Declined / Completed.

---

## Placement Logging

| Option | Description | Selected |
|--------|-------------|----------|
| From requisition detail: 'Log Placement' action | Context-scoped, terminal state of req | ✓ |
| Dedicated /ops/placements create page | Loses requisition context | |
| Combined with final interview action | Assumes one interview → placement | |

**User's choice:** "Log Placement" from `/ops/requisitions/{id}`. Appears when candidate is approved or interview is accepted/completed. Right-side slide-over form: candidate (pre-filled), requisition (pre-filled), client (pre-filled), fee, billing terms, 90-day retention flag, optional notes. On submit: create placement, mark req filled/closed, show in placements section.

---

## Claude's Discretion

None — user made explicit decisions for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
