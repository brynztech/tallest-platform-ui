# Architecture Notes — Recruiter Module 6-Feature Work

Findings from exploring this repo before implementing the 6-feature recruiter-module ask.
Companion doc in the backend repo: `../talent-platform/ARCHITECTURE_NOTES.md` (data model, auth
model, service layer). Backend spec/API/notification docs: `../talent-platform/FEATURE_SPEC.md`,
`../talent-platform/API_CHANGES.md`, `../talent-platform/NOTIFICATION_EVENTS.md`.

## Repo shape

Two apps: `apps/web` (public candidate site) and `apps/console` (internal tool — this is where
all 6 features live). Console already ships its own extracted design-system docs at
`apps/console/design-system/{tokens.json,components.md,routes.md}` and `apps/console/CLAUDE.md`
— read those for anything below that needs more detail.

## What already exists — reuse, do not rebuild

- **State management**: TanStack Query for all server state, plain `useState` for local UI
  state. No Redux/Zustand (deliberately rejected — see this repo's root `CLAUDE.md`). Provider:
  `apps/console/app/_components/console-providers.tsx`.
- **API layer**: two coexisting, intentional patterns — `@brynzit/api-client` (openapi-fetch,
  typed from generated `api.d.ts`) for endpoints already in the generated schema, and a
  hand-written `_lib/*.ts` native-`fetch` module (same shape as `_lib/notifications.ts`) for
  anything not yet generated. New endpoints follow whichever pattern matches.
- **RBAC / role model**: real and reusable — `packages/identity` (`@brynzit/identity`).
  `Role = 'recruiter' | 'account_manager' | 'quality_manager' | 'admin'`,
  `ROLE_CAPABILITIES` map in `capabilities.ts`, `useActingUser()`/`useCan()` hooks. **No real
  auth backs this** — `identity-switcher.tsx` lets you pick among 4 seeded users, persisted to
  `localStorage`; the seam is designed so real auth later only changes where `useActingUser`'s
  value comes from. Every new role check should go through `useCan()`, never a parallel check.
- **Design system**: shadcn/ui "new-york" on Tailwind v4, Radix underneath. Shared components in
  `packages/ui/src/components/ui/`. Status colors are 3 literal `oklch(...)` values reused
  everywhere (documented in `tokens.json`), not tokenized — reuse the exact values.
- **Notification UI**: real, not a stub — `apps/console/app/(shell)/_components/notification-bell.tsx`
  polls `GET /api/v1/ops/notifications` every 30s, generic free-text `message` field, mark-read
  wired up. One event already flows end-to-end ("Request More Candidates" →
  `lifecycle-controls.tsx`). Extend this pipeline for Features 4/5, don't build a second one.
- **Pipeline UI**: `apps/console/app/(shell)/pipeline/page.tsx` is the recruiter-facing pipeline,
  already partially read-only — `CandidatePipelineCard` (no mutation buttons, "Awaiting Review"/
  "Rejected" columns) vs. `PipelineCandidateCard` (Advance/Notes/Remove, other columns). Reuse
  this component split for Feature 6 rather than building a new board.
- **JD creation**: `create-requisition-wizard.tsx` is a generate-first flow (brief + company URL
  → LLM-generated JD → preview/edit → assign → publish). The old upload/parse-text path was
  deliberately removed (commit history + the wizard's own header comment). Feature 1 adds a new
  intake mode alongside this wizard, it does not revive the removed path.
- **Submit-application button state**: `apps/console/app/(shell)/my-roles/[id]/_lib/shortlist.ts`
  — `canSubmitApplications()` (enablement predicate) + `submitInterestedCandidates()` (idempotent
  bulk submit) + `UnscreenedCandidatesError` (409). This already does most of Feature 2.

## Real gaps found

- **No Tooltip primitive anywhere** (zero `Tooltip` imports, no `@radix-ui/react-tooltip`
  dependency). The one existing "disabled + explanation" precedent is a native `title` attribute
  (`pipeline-candidate-card.tsx`). Feature 2's "tooltip explaining why" either adds a real Tooltip
  to `packages/ui` (small, correct) or reuses the native-`title` convention (lazier, consistent
  with what's already there) — see [FEATURE_SPEC.md](../talent-platform/FEATURE_SPEC.md) for
  which one was chosen.
- **CTC/ECTC**: not referenced anywhere in the frontend. `compensation_range` (a free string on
  `Requisition`, not per-candidate) is the only comp-adjacent field in the generated API types.
- **No requisition-assignment filtering anywhere in the UI**: the `/pipeline` page's requisition
  picker (`fetchRequisitionsForClients`) lists every requisition across every client, regardless
  of who's assigned. Any acting user can currently browse any requisition's pipeline. This is the
  concrete UI-side gap Feature 6 closes, paired with the backend enforcing the same scoping.
- **Notes/stage-transition actions do not notify**: `pipeline/_lib/pipeline-actions.ts`'s
  `addSubmissionNote()`/`advanceSubmissionStage()` only POST and invalidate the local query cache
  — no notification call. Same for approve/reject in the Ops shortlist table.

## Data flow relevant to auth-sensitive features

Every acting-user identity crossing to the backend today is a **client-supplied plain string**
(`user_id`/`acting_user_id` query param) — there is no session token verifying it server-side (see
the backend's `ARCHITECTURE_NOTES.md` for why: v1 has no per-user console auth by design). Features
3 and 6 must send `actingUser.id` from `useActingUser()` on every request that needs scoping, and
the backend checks it against `ops_assignments` — consistent with, not weaker than, the existing
matching-trigger endpoint's `acting_user_id` convention.
