# Implementation Plan — Client → Role per-role pipeline (engine-backed)

**Date:** 2026-07-15
**Spec:** `docs/superpowers/specs/2026-07-15-brynzit-recruiting-os-design.md` (Phase A)
**Status:** In progress

## Context / what already exists

A per-role "Hiring Process" is already implemented in the console:

- `apps/console/app/(shell)/ops/requisitions/[id]/_lib/hiring-process.ts` — reads/writes ordered stages from `requisition.intake_details.hiring_process.stages`; stage `kind ∈ {internal_review, client_screen, technical, final, offer}`.
- `.../_components/hiring-process-panel.tsx` — displays stages and an editor dialog (add / reorder / remove / rename / set kind), persisted via `PATCH /api/v1/ops/requisitions/{id}` (MSW-backed; `intake_details` round-trips through the mock).

Gaps vs the spec:
1. Not backed by the generic `@brynzit/pipeline` engine (D8) — ordering/validation/gate-detection are hand-rolled.
2. The internal quality gate (mediated vs direct, D3) is implicit; there is no explicit per-role toggle and no mediated/direct indicator.
3. Editing is not capability-gated — any role can edit (violates `pipeline.configure`).

## Goal

Make the per-role pipeline **engine-backed, gate-aware, and capability-gated**, without backend changes and without breaking the existing persistence shape.

## Approach (no backend changes; mock-first preserved)

1. **Wire `@brynzit/pipeline` into the console** (dependency + `transpilePackages`).
2. **Bridge layer** `.../_lib/requisition-pipeline.ts`:
   - `hiringKindToStageType(kind)`: `internal_review → internal_gate`; everything else → `client_stage`.
   - `getRequisitionPipeline(req)`: builds a validated generic `Pipeline` (via `definePipeline`) from the requisition's stages, carrying the original `kind` for display.
   - `pipelineIsMediated(req)`: delegates to engine `hasInternalGate`.
   - `withMediationGate(stages, enabled)`: ensures a leading internal-gate stage when enabled, strips internal-gate stages when disabled — the D3 toggle mechanism.
   - Reuses the existing `buildIntakeDetailsWithHiringProcess` for writes (persistence shape unchanged).
3. **Enhance `HiringProcessPanel`**:
   - Header badge: **Mediated** (has internal gate) vs **Direct**.
   - Editor: a "Route through internal quality review" toggle wired to `withMediationGate`.
   - Per-stage badge shows engine `StageType` (Internal gate / Client stage) alongside the existing kind label.
   - Gate **Edit Process** behind `useCan('pipeline.configure')` — recruiters see read-only, AM/QM/Admin can edit.
4. **Tests** for the bridge (`kind → type` mapping, mediated detection, `withMediationGate` add/remove, engine validation of the built pipeline).

## Out of scope (this step)

- Moving submissions through the pipeline (Phase C — submission lifecycle).
- Persisting `StageEvent`s (Phase D/E).
- Replacing the raw-`fetch` PATCH with the typed client (endpoint is MSW-only; unchanged).

## Verification

- `@brynzit/pipeline` + console typecheck clean; new bridge unit tests green.
- Browser: as **Recruiter** the Edit Process control is hidden/read-only; as **Account Manager** the editor opens, the mediation toggle flips the header between Mediated/Direct, and Save persists.
