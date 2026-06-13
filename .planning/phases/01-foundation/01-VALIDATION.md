---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 |
| **Config file** | `packages/hooks/vitest.config.ts` (Wave 0 — create during scaffold) |
| **Quick run command** | `pnpm --filter @brynzit/hooks test -- --run` |
| **Full suite command** | `turbo run test` |
| **Estimated runtime** | ~15 seconds (hooks unit tests only); ~90 seconds (full turbo run) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @brynzit/hooks test -- --run`
- **After every plan wave:** Run `turbo run build && turbo run typecheck`
- **Before `/gsd-verify-work`:** `turbo run build` green + all unit tests green
- **Max feedback latency:** 15 seconds (quick), 90 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-FOUND01 | FOUND-01 | 1 | FOUND-01 | — | N/A | integration (build gate) | `turbo run build` | ❌ W0 | ⬜ pending |
| 1-FOUND02 | FOUND-02 | 2 | FOUND-02 | — | Nullable fields typed as `T \| null` | unit (typecheck) | `pnpm --filter @brynzit/api-client typecheck` | ❌ W0 | ⬜ pending |
| 1-FOUND03 | FOUND-03 | 2 | FOUND-03 | T-MSW-01 | MSW only enabled with `NEXT_PUBLIC_API_MOCKING=enabled` | file existence check | `turbo run build --filter @brynzit/mocks` | ❌ W0 | ⬜ pending |
| 1-FOUND04a | FOUND-04 | 2 | FOUND-04 | — | N/A | unit | `pnpm --filter @brynzit/hooks test -- --run` | ❌ W0 | ⬜ pending |
| 1-FOUND04b | FOUND-04 | 2 | FOUND-04 | — | N/A | unit | `pnpm --filter @brynzit/hooks test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/hooks/vitest.config.ts` — Vitest config for hooks package
- [ ] `packages/hooks/src/__tests__/use-async-job.test.ts` — unit tests for FOUND-04 (idle/pending/complete/failed phases, custom statusMap, polling stops on terminal state)
- [ ] `packages/api-client/src/smoke-test.ts` — compile-time nullable assertions for FOUND-02 (BulkActionRequest.rejection_reason, ResumeUploadResponse.candidate_id, etc.)
- [ ] Shared TypeScript configs (`packages/config/tsconfig/base.json`, `nextjs.json`, `library.json`) — Wave 0 infrastructure needed for all typecheck commands

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `generate:api:live` fetches live schema and updates snapshot | FOUND-02 | Requires running backend at localhost:8000 | Run `pnpm generate:api:live`, verify `packages/api-client/openapi.json` updates and types regenerate |
| MSW Service Worker installs in browser | FOUND-03 | Browser environment, not testable in Vitest node mode | Run `pnpm dev --filter apps/web`, open DevTools > Application > Service Workers, confirm `mockServiceWorker.js` is registered |
| Live backend smoke test (one endpoint per domain) | ROADMAP Success Criteria 6 | Requires running backend | Run `pnpm generate:api:live`, then call `/api/v1/bd/leads`, `/api/v1/ops/clients`, `/api/v1/supply/candidates`, `/api/v1/monitoring/cost` and assert response shapes match generated types |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
