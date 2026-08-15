# Console Route Inventory (as of 2026-08-15)

One app, route-group `(shell)`, gated by `apps/console/app/(shell)/_lib/route-capabilities.ts`
(single source of truth — the sidebar and every route's `layout.tsx` both read
this same map; see `docs/console-admin-and-rbac.md` for the full RBAC story).

## Recruiter-portal routes (no capability gate — every role can reach these)

| Route | Purpose |
|---|---|
| `/overview` | Landing/summary page |
| `/dashboard` | Recruiter-facing summary dashboard |
| `/submit` | Candidate submission flow |
| `/pipeline` | Recruiter pipeline view (capability-scoped by content, not route) |
| `/my-roles` | Requisitions assigned to the acting recruiter (via `role.view_assigned` / `role.view_all`) |
| `/matchmaker` | AI matchmaker summary panel |
| `/jobs` | Job listing |
| `/clients` | Client listing (recruiter-facing) |
| `/calendar` | Calendar |
| `/messages` | Messages |
| `/cross-list` | Cross-list view |
| `/rewards` | Rewards |
| `/bookmarks` | Bookmarked candidates — gated on `candidate.bookmark`, but every current role holds it, so it's a no-op gate today (kept for when a future role doesn't) |

## Internal Ops routes — gated on `internal_ops.view`

| Route | Purpose |
|---|---|
| `/bd/leads` | BD lead review queue (fat cards, approve/reject/snooze, keyboard shortcuts) |
| `/bd/imports` | CSV import (async `useAsyncJob` polling) |
| `/bd/outreach` | Outreach sequence review/edit/approve |
| `/bd/pipeline` | Pipeline kanban (discovered → converted) |
| `/bd/replies` | Reply triage |
| `/ops/clients` | Client CRM (create, notes log) |
| `/ops/requisitions` | Requisition list + detail (JD parse, match, shortlist, interviews, placements, **Assigned Recruiters card**) |
| `/ops/interviews` | Global interviews view |
| `/ops/quality-review` | Internal approve/reject gate before client submission — view-only for `internal_ops.view`, approve/reject actions further gated in-page on `submission.approve_gate` |
| `/supply/search` | Talent pool search (hard filters + semantic) |
| `/supply/ingest` | LinkedIn / CSV / resume ingestion (resume now supports multi-file upload) |
| `/supply/engagements` | Engagement sequence review/approve/reject |

## Admin — gated on `admin.view` (hard block, no partial view)

| Route | Purpose |
|---|---|
| `/admin` (tabs: Overview, Costs, Events, Quotas, Pipeline, Prompts, Candidates, Job Sources) | Cost dashboard, agent event log, quota monitor, pipeline health, prompt editor, candidate cleanup list, job-source crawl admin (proxied through a server-side route holding `ADMIN_API_TOKEN`) |

## Roles → capabilities (from `@brynzit/identity`)

| Role | Key capabilities |
|---|---|
| Recruiter | `role.view_assigned`, `candidate.shortlist`, `candidate.bookmark`, `candidate.submit`, `submission.override_ai` |
| Account Manager | `role.view_all`, `client.manage`, `requisition.manage`, `pipeline.configure`, `candidate.shortlist/bookmark/submit`, `submission.override_ai`, `candidate.hard_block`, `internal_ops.view` |
| Quality Manager | `role.view_all`, `pipeline.configure`, `candidate.shortlist/bookmark/submit`, `submission.approve_gate`, `submission.override_ai`, `candidate.hard_block`, `internal_ops.view` |
| Admin | all of the above (`ALL_CAPABILITIES`) |

No real auth in v1 — role is chosen via the identity switcher (top-right),
persisted to `localStorage`, seeded from `@brynzit/identity`'s `SEED_USERS`
(4 fixed accounts, one per role).

## Async / polling surfaces (useAsyncJob or manual polling)

- CSV import (`/bd/imports`), outreach generation, resume upload/parse
  (`/supply/ingest` — resume path only, now multi-file), candidate enrichment
  (`/supply/search`, manual `setInterval` not `useAsyncJob` since the response
  has no `.status` field), requisition JD parse (`/ops/requisitions`, with a
  `statusMap` override since `open/filled/closed` don't match the generic
  terminal states), job-source crawl runs (`/admin`, 2s poll).
