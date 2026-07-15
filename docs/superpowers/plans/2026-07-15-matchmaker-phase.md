# Implementation Plan — Phase F: AI Matchmaker surface

**Date:** 2026-07-15
**Spec:** `docs/superpowers/specs/2026-07-15-brynzit-recruiting-os-design.md` (Phase F)
**Status:** In progress

## Goal

Surface, per role, the AI-ranked likely-fit candidates so a recruiter can review
them and act — always with a human decision that can override the AI (spec D4:
"AI Matchmaker is assistive, always human-reviewable"). Never auto-advance.

## What exists

- Backend matching: `POST /ops/requisitions/{id}/match` (trigger) and the ranked
  shortlist via `GET /supply/shortlists/{requisition_id}` (submissions carry
  `match_score` + rationale) and `GET /ops/requisitions/{id}/shortlist`.
- Console already renders a shortlist table on the requisition detail page.
- `@brynzit/recruiting` already models submissions + AI-vs-human override.

## Scope (this phase)

1. **Domain helpers** in `@brynzit/recruiting` (`matchmaker.ts`), pure + tested:
   - `recommendationFromScore(score)` → `advance | reject | unknown` (threshold
     mirrors backend `ADVANCE_THRESHOLD = 60`).
   - `matchStrength(score)` → `strong | partial | weak` for badge display.
   - `rankSuggestions(list)` → score-desc ordering, null scores last.
2. **Matchmaker surface** in the console: for a requisition, show AI-ranked
   suggestions with score + strength badge + recommendation, and a human action
   (shortlist / dismiss) that records an override when it contradicts the AI.
   Gated by `candidate.shortlist` / `submission.override_ai`.
3. **Verify:** unit tests, typecheck, lint, and browser check against the real
   backend (requisitions with `matching_complete` have real shortlists).

## Out of scope

- Re-running/tuning the matching algorithm (backend concern).
- Persisting match feedback for retraining (already a separate backend table).

## Reuse / no-patch

- Reuse the existing `AiRecommendation` type and override semantics from
  `submission.ts`; do not duplicate.
- Build on the existing shortlist fetch + candidate profile sheet rather than a
  parallel data path.
