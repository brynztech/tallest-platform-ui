# Test Plan — Recruiter Module 6 Features (Frontend)

Backend test plan: `../talent-platform/TEST_PLAN.md`. Spec: `../talent-platform/FEATURE_SPEC.md`.

Run: `pnpm --filter @brynzit/console test` and `pnpm --filter @brynzit/console typecheck`.
**Status: 193 console tests pass (188 pre-existing + 5 new), 117 web tests pass, typecheck clean —
no regressions.**

## New tests — `apps/console/src/__tests__/recruiter-module-features.test.ts` (5 tests) ✅

| Test | Covers |
|---|---|
| `updateCandidateCompensation PATCHes the scoped endpoint` | Feature 3 write path: URL, acting_user_id, method, body |
| `throws on a 403 (unassigned caller)` | Feature 3 authorization edge surfaced to the caller |
| `fetchRecruiterShortlist sends acting_user_id only when given` | Feature 6: scoped vs legacy-caller fetch variants |
| `fetchPipelineSubmissions sends acting_user_id and drops 403 requisitions` | Feature 6: server-denied requisitions fall out of the pipeline rather than erroring the page |
| `fetchPipelineSubmissions omits acting_user_id for view-all managers` | Feature 6: manager path unchanged |

## Why no component-render tests

This repo's vitest pipeline does not transform JSX (no existing test renders a component —
all 25 pre-existing suites test `_lib/*.ts` logic or hooks via `renderHook`). Component behavior
is covered by `tsc --noEmit` plus the manual checks below.

## Manual verification checklist (mock mode: `NEXT_PUBLIC_API_MOCKING=enabled`)

- **Feature 1**: Ops → Requisitions → New requisition → "Upload existing JD" → pick a PDF/DOCX →
  Upload & parse → review step shows editable seniority/skills/comp + title choice → assign →
  publish. Wrong file type / >10 MiB rejected client-side with a toast. MSW handler added
  (`packages/mocks/src/handlers/ops.ts` 11a) so mock mode works end-to-end.
- **Feature 2**: My Roles → [role]: active queue vs "Submission History" section; submitted
  cards show actions disabled with "Already submitted on {date}" title; Submit Applications
  button title explains each disabled state (unscreened / nothing interested / all submitted).
- **Feature 3**: CTC/Expected row on each shortlist card; Edit → numeric inputs → Save; invalid
  input (e.g. "12L") blocks save with an inline message instead of wiping the value. MSW handler
  added (`packages/mocks/src/handlers/supply.ts` 7b).
- **Feature 6**: switch identity to a recruiter → /pipeline requisition picker only lists their
  assigned roles; switch to AM/admin → full picker. Persona switch does not serve the other
  persona's cached rows (query key includes acting user).
- **Features 4/5**: bell shows review-decision/note/stage notifications after AM actions
  (requires the real backend; mock mode seeds only the pre-existing more-candidates event).
