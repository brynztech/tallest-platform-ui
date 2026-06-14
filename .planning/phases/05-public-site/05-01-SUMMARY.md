---
phase: "05-public-site"
plan: "01"
subsystem: "apps/web + packages/mocks + packages/ui"
tags: ["dependencies", "vitest", "msw", "shadcn", "candidate-types", "test-scaffolds"]
dependency_graph:
  requires: []
  provides:
    - "apps/web runtime dependencies (react-hook-form, zod, react-dropzone, sonner, lucide-react, next-themes)"
    - "apps/web devDependencies (vitest, @vitejs/plugin-react, @testing-library/react, jsdom, @tailwindcss/postcss)"
    - "apps/web postcss pipeline (Tailwind v4 PostCSS plugin)"
    - "apps/web vitest test runner (jsdom environment)"
    - "apps/web candidate type definitions (7 exported types)"
    - "6 test scaffold files covering all 12 Phase 5 requirements"
    - "packages/mocks expanded candidate handlers (12 mock jobs, full profile, 4 new endpoints)"
    - "packages/ui form.tsx, command.tsx, scroll-area.tsx shadcn components"
  affects:
    - "apps/web (all Phase 5 feature plans)"
    - "packages/mocks (candidate handler tests)"
    - "packages/ui (component consumers)"
tech_stack:
  added:
    - "react-hook-form@catalog (apps/web)"
    - "@hookform/resolvers@catalog (apps/web + packages/ui)"
    - "zod@catalog (apps/web + packages/ui)"
    - "react-dropzone@^15.0.0 (apps/web)"
    - "sonner@^2.0.7 (apps/web)"
    - "lucide-react@catalog (apps/web)"
    - "next-themes@^0.4.6 (apps/web)"
    - "vitest@catalog devDep (apps/web)"
    - "@vitejs/plugin-react@^4.7.0 devDep (apps/web)"
    - "@testing-library/react@catalog devDep (apps/web)"
    - "jsdom@^26.1.0 devDep (apps/web)"
    - "@tailwindcss/postcss@^4.3.1 devDep (apps/web)"
    - "cmdk@^1.1.1 (packages/ui)"
  patterns:
    - "vitest + jsdom for apps/web unit tests (mirrors apps/console pattern)"
    - "shadcn form/command/scroll-area added via CLI, written to worktree"
    - "MSW stateful poll simulation via Map<parseId, pollCount>"
    - "Cursor pagination pattern: first 6 jobs on default, next 6 on cursor-page-2"
key_files:
  created:
    - "apps/web/postcss.config.mjs"
    - "apps/web/vitest.config.ts"
    - "apps/web/app/_lib/candidate-types.ts"
    - "apps/web/src/__tests__/landing.test.tsx"
    - "apps/web/src/__tests__/auth.test.tsx"
    - "apps/web/src/__tests__/onboarding.test.tsx"
    - "apps/web/src/__tests__/profile.test.tsx"
    - "apps/web/src/__tests__/job-board.test.tsx"
    - "apps/web/src/__tests__/job-detail.test.tsx"
    - "packages/ui/src/components/ui/form.tsx"
    - "packages/ui/src/components/ui/command.tsx"
    - "packages/ui/src/components/ui/scroll-area.tsx"
  modified:
    - "apps/web/package.json (added 7 runtime deps + 6 devDeps + test scripts)"
    - "packages/mocks/src/handlers/candidate.ts (replaced stubs with full handlers)"
    - "packages/ui/package.json (added react-hook-form, @hookform/resolvers, cmdk, zod)"
    - "pnpm-lock.yaml (lockfile updated)"
decisions:
  - "Shadcn CLI ran against main repo (not worktree) — files copied manually to worktree path"
  - "packages/ui/package.json updated to include react-hook-form, cmdk, @hookform/resolvers, zod as required by form.tsx and command.tsx"
  - "MSW stateful poll counter uses module-level Map (reset on complete) — correct for dev/test use"
  - "MOCK_PROFILE completeness_score=65 (below 70 gate) — apply button shows Complete your profile by default"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-06-15"
  tasks_completed: 2
  files_created: 12
  files_modified: 4
---

# Phase 5 Plan 01: Foundation Setup Summary

**One-liner:** Added all missing deps, vitest test runner, Tailwind PostCSS pipeline, 7 candidate type definitions, 6 test scaffold files, 12-job MSW mock dataset, and 3 shadcn components (form/command/scroll-area) to unblock all Phase 5 feature plans.

## What Was Built

### Task 1: Dependencies, PostCSS, Vitest, Candidate Types

- Updated `apps/web/package.json` with 7 runtime dependencies (react-hook-form, @hookform/resolvers, zod, react-dropzone, sonner, lucide-react, next-themes) and 6 devDependencies (vitest, @vitejs/plugin-react, @testing-library/react, jsdom, @tailwindcss/postcss + @testing-library/user-event). Added `test` and `test:watch` scripts.
- Created `apps/web/postcss.config.mjs` matching the console's Tailwind v4 PostCSS config.
- Created `apps/web/vitest.config.ts` with jsdom environment and @vitejs/plugin-react plugin.
- Created `apps/web/app/_lib/candidate-types.ts` exporting 7 types: `PublicJobItem`, `PublicJobsResponse`, `CandidateProfile`, `CandidateProfileUpdate`, `CandidateAuthResponse`, `CandidateApplication`, `CandidateApplicationsResponse`, `ResumeParseStatus`. Derived from `.planning/contracts/*.yaml`; replace with api.d.ts imports when the backend ships candidate endpoints.
- Created 6 test scaffold files in `apps/web/src/__tests__/` — all 56 tests are `.todo` stubs aligned to the 12 Phase 5 requirements (PUB-01 through PUB-06, JOB-01 through JOB-06).

### Task 2: Expanded MSW Handlers + shadcn Components

- Replaced stub `packages/mocks/src/handlers/candidate.ts` with expanded handlers including 12 realistic `MOCK_JOBS` entries covering full_time/part_time/contract employment types, junior/mid/senior/staff seniority levels, remote/onsite, 5 jobs with compensation ranges (120K-280K), and strong/partial/none/null match strengths.
- Added `MOCK_PROFILE` with all `CandidateProfile` fields, completeness_score=65 (below the 70 gate), and enrichment_status='pending'.
- Added 4 previously missing handlers: `GET /public/jobs/:id`, `POST /candidate/profile/resume`, `GET /candidate/profile/resume/status/:parse_id` (stateful: 2 processing polls then complete), `POST /candidate/applications`.
- Enhanced existing handlers: signup returns `access_token`, login returns 401 for 'wrongpassword', GET /public/jobs returns 6 real jobs with cursor pagination, PUT /candidate/profile recomputes `completeness_score`.
- Added `packages/ui/src/components/ui/form.tsx` (shadcn Form with react-hook-form integration).
- Added `packages/ui/src/components/ui/command.tsx` (shadcn Command for skills multi-select).
- Added `packages/ui/src/components/ui/scroll-area.tsx` (shadcn ScrollArea).
- Updated `packages/ui/package.json` to include react-hook-form, @hookform/resolvers, cmdk, zod.

## Verification Results

All checks passed:
- `pnpm install` exits 0
- `pnpm --filter @brynzit/ui exec tsc --noEmit` exits 0
- `pnpm --filter @brynzit/mocks exec tsc --noEmit` exits 0
- `pnpm --filter @brynzit/web typecheck` exits 0
- `pnpm --filter @brynzit/web test --run` reports 6 test files, 56 todo tests, 0 failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI wrote to main repo instead of worktree**
- **Found during:** Task 2
- **Issue:** Running `npx shadcn@latest add form/command/scroll-area --cwd=packages/ui` wrote files to the main repo's packages/ui path (shared physical directory, not the worktree copy).
- **Fix:** Read the created files from the main repo and wrote them manually to the correct worktree paths. Manually updated `packages/ui/package.json` in the worktree with the same dependency additions the CLI made to the main repo.
- **Files modified:** `packages/ui/src/components/ui/form.tsx`, `packages/ui/src/components/ui/command.tsx`, `packages/ui/src/components/ui/scroll-area.tsx`, `packages/ui/package.json`
- **Commit:** 0442908

## Known Stubs

All 56 tests in `apps/web/src/__tests__/` are `it.todo` stubs. These are intentional scaffolds — no implementation code exists yet. Each test maps to a specific requirement ID. Tests will be filled in by Plans 02-05.

`MOCK_PROFILE.completeness_score = 65` is intentionally below 70 to exercise the "Complete your profile" apply gate by default.

## Threat Flags

No new security-relevant surfaces introduced. All changes are development-only MSW mock data, test scaffolds, package configuration, and shadcn UI primitives.

Threat mitigations T-05-01 through T-05-04 (open redirect, XSS via JD content, prototype pollution via localStorage, URL injection) are documented and assigned to Plans 02 and 04 respectively.

## Self-Check: PASSED

Files confirmed present:
- `apps/web/postcss.config.mjs` — FOUND
- `apps/web/vitest.config.ts` — FOUND
- `apps/web/app/_lib/candidate-types.ts` — FOUND
- `apps/web/src/__tests__/` (6 files) — FOUND
- `packages/ui/src/components/ui/form.tsx` — FOUND
- `packages/ui/src/components/ui/command.tsx` — FOUND
- `packages/ui/src/components/ui/scroll-area.tsx` — FOUND
- `packages/mocks/src/handlers/candidate.ts` (12 MOCK_JOBS) — FOUND

Commits confirmed present:
- `1bdfb7e` (Task 1: chore(05-01)) — FOUND
- `0442908` (Task 2: feat(05-01)) — FOUND
