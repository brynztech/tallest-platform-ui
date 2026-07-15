# Implementation Plan — Phase E: Dashboards

**Date:** 2026-07-15
**Spec:** `docs/superpowers/specs/2026-07-15-brynzit-recruiting-os-design.md` (Phase E)
**Status:** In progress

## Goal

Role-specific, "my work" dashboards that reflect **real** pipeline state — never
vanity counters (spec guardrail). Every metric ties to a real backend record and
links through to it.

## Approach (no vanity, no new backend)

There is no persisted stage-event log yet, so rather than fabricate trend/velocity
counters, the dashboard aggregates **live record state** — which *is* the current
stage of each entity:

- Requisitions by status (open vs filled/closed).
- Submissions by internal status via shortlists (awaiting internal review /
  approved-to-client / rejected / hold).
- Interviews by status.
- Placements.

**Capability scoping:**
- Recruiters (`role.view_assigned`) see only their assigned roles' metrics — a
  true "my work" view (via `@brynzit/recruiting.visibleByAssignment` + the
  assignments endpoint).
- Account Managers / Quality / Admin (`role.view_all`) see all roles.
Header badge switches between "My work" and "All roles".

## Steps

1. **Domain helper** `@brynzit/recruiting/pipeline-summary.ts` (pure + tested):
   `summarizePipeline(statuses)` → counts awaiting-internal-review / approved /
   rejected / hold / total. Mirrors backend submission statuses.
2. **Enhance `RecruiterDashboard`** (used by `/dashboard` + `/overview`):
   - Scope requisitions by assignment for non-view-all users.
   - Add real metric cards: open roles, awaiting internal review, approved to
     client, interviews scheduled, placements — each drill-through.
   - "My work" vs "All roles" badge from capability.
   - Reuse existing `recruiter-data` fetchers (`fetchRequisitionsForClients`,
     `fetchOpsInterviews`, `fetchPipelineSubmissions`, `fetchPlacementsForRequisitions`)
     + the internal-review queue endpoint.
3. **Verify:** unit tests, typecheck, lint, browser against the real backend for
   a recruiter (scoped) vs a manager (all).

## Out of scope / future

- A persisted `stage_events` history table for velocity/trend charts over time —
  a genuine future enhancement once transitions emit events.
