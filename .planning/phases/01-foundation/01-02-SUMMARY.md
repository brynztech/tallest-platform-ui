---
phase: 01-foundation
plan: 02
subsystem: api-client
tags: [codegen, openapi, typescript, contracts, testing]
dependency_graph:
  requires: [01-01]
  provides: [packages/api-client/src/types/api.d.ts, .planning/contracts/*.yaml]
  affects: [packages/api-client, packages/config, packages/hooks, packages/mocks, packages/ui]
tech_stack:
  added:
    - openapi-typescript@7.13.0 (codegen CLI)
    - @types/node added to catalog
  patterns:
    - Turborepo shared tsconfig via @brynzit/config package with exports map
    - Compile-time nullable assertions using TypeScript conditional types
    - OpenAPI 3.1 YAML contract proposals for mock-first candidate endpoints
key_files:
  created:
    - packages/api-client/src/types/api.d.ts
    - packages/api-client/tsconfig.json
    - packages/ui/tsconfig.json
    - packages/mocks/tsconfig.json
    - packages/hooks/tsconfig.json
    - packages/config/tsconfig.json
    - .planning/contracts/public-jobs.yaml
    - .planning/contracts/candidate-auth.yaml
    - .planning/contracts/candidate-profile.yaml
    - .planning/contracts/candidate-applications.yaml
    - .gitignore
  modified:
    - packages/api-client/src/smoke-test.ts
    - packages/api-client/package.json
    - packages/config/package.json
    - packages/hooks/package.json
    - packages/mocks/package.json
    - packages/ui/package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
decisions:
  - Chose LeadFatCardResponse.rejection_reason + enrichment_status + BDTaskSummary.due_at as smoke-test assertions 3-5 because EnrichCandidateResponse and snoozed_until do not exist in the live backend schema
  - Fixed @brynzit/config package.json exports from ./tsconfig/*.json to ./tsconfig/* to prevent double-extension resolution bug
metrics:
  duration: "5 minutes"
  completed: "2026-06-13"
  tasks_completed: 2
  files_created: 11
  files_modified: 8
---

# Phase 1 Plan 02: API Codegen + useAsyncJob Tests + OpenAPI Contract YAML Files Summary

**One-liner:** openapi-typescript@7.13.0 codegen against live FastAPI backend producing 137 nullable fields in api.d.ts, verified by 5 compile-time smoke-test assertions; 6/6 useAsyncJob unit tests pass; 4 OpenAPI 3.1 contract YAML files establish the mock-first candidate API surface.

## What Was Built

### Task 1: Package tsconfig.json files + Codegen + Smoke-test

**Package tsconfig.json files (5 packages):**
All packages now have tsconfig.json files extending `@brynzit/config/tsconfig/library.json`:
- `packages/api-client/tsconfig.json`
- `packages/ui/tsconfig.json`
- `packages/mocks/tsconfig.json`
- `packages/hooks/tsconfig.json`
- `packages/config/tsconfig.json` (meta-config with composite: true)

**API Codegen:**
- Ran `pnpm generate:api:live` against the running backend at `http://localhost:8000`
- Generated `packages/api-client/src/types/api.d.ts` via openapi-typescript 7.13.0
- Backend OpenAPI 3.1.0 schema confirmed: 47 paths, 65+ component schemas, 137 nullable fields

**Smoke-test.ts:**
- 5 compile-time assertions covering confirmed nullable fields from the live schema:
  1. `BulkActionRequest.rejection_reason` — `string | null | undefined` (optional, nullable)
  2. `ResumeUploadResponse.candidate_id` — `string | null` (null until parse completes)
  3. `LeadFatCardResponse.rejection_reason` — `string | null` (null for non-rejected leads)
  4. `LeadFatCardResponse.enrichment_status` — `string | null` (null before enrichment runs)
  5. `BDTaskSummary.due_at` — `string | null` (null for tasks without deadline)
- `pnpm --filter @brynzit/api-client typecheck` exits 0

### Task 2: useAsyncJob Tests + Contract YAML Files

**useAsyncJob unit tests:**
All 6 tests pass with vitest 4.1.8:
- `returns phase=idle when jobId is null`
- `returns phase=idle when enabled=false`
- `maps backend "complete" status to phase=complete and stops polling`
- `maps backend "processing" status to phase=pending with isPolling=true`
- `maps custom statusMap override — outreach_review → complete`
- `maps "failed" status to phase=failed`

**OpenAPI 3.1 contract YAML files (.planning/contracts/):**
- `public-jobs.yaml`: GET /api/v1/public/jobs cursor-paginated job board endpoint
- `candidate-auth.yaml`: POST /api/v1/candidate/auth/signup + /login paths
- `candidate-profile.yaml`: GET/PUT /api/v1/candidate/profile with completeness_score field
- `candidate-applications.yaml`: GET /api/v1/candidate/applications with substep_label field

All 4 contracts use `anyOf + null` pattern matching Pydantic v2 backend convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Fixed @brynzit/config package.json exports map**
- **Found during:** Task 1 — first typecheck run
- **Issue:** `packages/config/package.json` exports map used `"./tsconfig/*": "./tsconfig/*.json"` causing TypeScript to look for `library.json.json` (double extension)
- **Fix:** Changed to `"./tsconfig/*": "./tsconfig/*"` — TypeScript resolves the full filename including `.json`
- **Files modified:** `packages/config/package.json`
- **Commit:** 66b88dd

**2. [Rule 3 - Blocker] Added @brynzit/config devDependency to all packages**
- **Found during:** Task 1 — packages couldn't resolve @brynzit/config for tsconfig extends
- **Fix:** Added `"@brynzit/config": "workspace:*"` to devDependencies in api-client, ui, mocks, hooks
- **Files modified:** all 4 package.json files
- **Commit:** 66b88dd

**3. [Rule 3 - Blocker] Added @types/node to pnpm catalog**
- **Found during:** Task 1 — `client.ts` uses `process.env` which requires @types/node
- **Fix:** Added `"@types/node": "^22.0.0"` to pnpm-workspace.yaml catalog; added to api-client devDependencies
- **Files modified:** `pnpm-workspace.yaml`, `packages/api-client/package.json`
- **Commit:** 66b88dd

**4. [Rule 2 - Missing] Added typecheck script to api-client package.json**
- **Found during:** Task 1 — plan requires `pnpm --filter @brynzit/api-client typecheck` to work
- **Fix:** Added `"typecheck": "tsc --noEmit"` to scripts
- **Files modified:** `packages/api-client/package.json`
- **Commit:** 66b88dd

**5. [Rule 2 - Missing] Created .gitignore**
- **Found during:** Task 1 — no .gitignore existed; node_modules/ would be committed
- **Fix:** Created .gitignore excluding node_modules, dist, .next, .turbo, .env files
- **Files modified:** `.gitignore` (created)
- **Commit:** 66b88dd

**6. Schema name substitution for smoke-test assertions 3-5**
- **Found during:** Task 1 — plan expected `EnrichCandidateResponse` and `LeadResponse.snoozed_until` but these do not exist in the actual live backend schema
- **Fix:** Substituted with actual schema names: `LeadFatCardResponse.rejection_reason`, `LeadFatCardResponse.enrichment_status`, `BDTaskSummary.due_at` — all confirmed nullable in generated types
- The plan explicitly anticipated this: "If the generated api.d.ts uses different schema names, substitute as needed"

## Success Criteria Verification

- [x] `packages/api-client/src/types/api.d.ts` exists and contains `paths` + `components` exports
- [x] Generated types include `| null` patterns (137 occurrences — Pydantic v2 anyOf confirmed)
- [x] `smoke-test.ts` contains 5 type assertions (ROADMAP SC-2) — `grep -c 'null extends\|extends.*null'` returns 5
- [x] `pnpm --filter @brynzit/api-client typecheck` exits 0 with all 5 assertions compiling
- [x] `pnpm --filter @brynzit/hooks test -- --run` exits 0, all 6 tests green
- [x] All 4 contract YAML files in `.planning/contracts/` with correct OpenAPI 3.1 structure
- [x] `candidate-applications.yaml` has `substep_label` field
- [x] All 5 package directories have `tsconfig.json` files extending `@brynzit/config`

## Known Stubs

None. All 4 contract YAML files define complete, deployable schemas. The smoke-test assertions cover real field paths from the generated types.

## Threat Flags

None. The generated `api.d.ts` is a types-only file with no runtime behavior. Contract YAML files live in `.planning/` (not shipped). T-02-01 through T-02-04 from the plan's threat model are accepted per the plan's dispositions.

## Self-Check: PASSED

Files verified:
- packages/api-client/src/types/api.d.ts: FOUND
- packages/api-client/src/smoke-test.ts: FOUND (5 assertions)
- packages/api-client/tsconfig.json: FOUND
- packages/ui/tsconfig.json: FOUND
- packages/mocks/tsconfig.json: FOUND
- packages/hooks/tsconfig.json: FOUND
- packages/config/tsconfig.json: FOUND
- .planning/contracts/public-jobs.yaml: FOUND
- .planning/contracts/candidate-auth.yaml: FOUND
- .planning/contracts/candidate-profile.yaml: FOUND
- .planning/contracts/candidate-applications.yaml: FOUND

Commits verified:
- 66b88dd: feat(01-02): package tsconfigs, API codegen, and smoke-test nullable assertions
- 208e20f: feat(01-02): useAsyncJob tests pass (6/6) + OpenAPI 3.1 contract YAML files
