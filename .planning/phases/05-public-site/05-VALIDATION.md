---
phase: 5
slug: public-site
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.8 |
| **Config file** | `apps/web/vitest.config.ts` — Wave 0 gap |
| **Quick run command** | `pnpm --filter @brynzit/web test --run` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @brynzit/web test --run`
- **After every plan wave:** Run `pnpm turbo test` (full monorepo)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PUB-01 | — | No XSS in hero copy | smoke | `pnpm --filter @brynzit/web test --run landing` | ❌ Wave 0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PUB-02 | T-05-03 | Open redirect param sanitized | unit | `pnpm --filter @brynzit/web test --run auth` | ❌ Wave 0 | ⬜ pending |
| 05-02-01 | 02 | 2 | JOB-01 | — | Filter params do not allow prototype pollution | unit | `pnpm --filter @brynzit/web test --run job-board` | ❌ Wave 0 | ⬜ pending |
| 05-02-02 | 02 | 2 | JOB-03 | T-05-02 | JD text rendered as plain text (no dangerouslySetInnerHTML) | unit | `pnpm --filter @brynzit/web test --run job-detail` | ❌ Wave 0 | ⬜ pending |
| 05-02-03 | 02 | 2 | JOB-04 | — | Apply button gated by completeness_score | unit | `pnpm --filter @brynzit/web test --run job-detail` | ❌ Wave 0 | ⬜ pending |
| 05-02-04 | 02 | 2 | JOB-05 | — | Match badge hidden for logged-out visitors | unit | `pnpm --filter @brynzit/web test --run job-board` | ❌ Wave 0 | ⬜ pending |
| 05-02-05 | 02 | 2 | JOB-06 | — | Cards beyond index 4 have blur class when logged out | unit | `pnpm --filter @brynzit/web test --run job-board` | ❌ Wave 0 | ⬜ pending |
| 05-03-01 | 03 | 3 | PUB-03 | — | Resume parse uses useAsyncJob polling | unit | `pnpm --filter @brynzit/web test --run onboarding` | ❌ Wave 0 | ⬜ pending |
| 05-03-02 | 03 | 3 | PUB-04 | — | Onboarding step 2 pre-populates from parse | unit | `pnpm --filter @brynzit/web test --run onboarding` | ❌ Wave 0 | ⬜ pending |
| 05-03-03 | 03 | 3 | PUB-05 | — | Completeness meter shows score and gate label when <70 | unit | `pnpm --filter @brynzit/web test --run onboarding` | ❌ Wave 0 | ⬜ pending |
| 05-03-04 | 03 | 3 | PUB-06 | T-05-04 | GitHub/LinkedIn URLs validated (no javascript: protocol) | unit | `pnpm --filter @brynzit/web test --run profile` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — vitest setup with jsdom environment
- [ ] `apps/web/src/__tests__/landing.test.tsx` — covers PUB-01
- [ ] `apps/web/src/__tests__/auth.test.tsx` — covers PUB-02
- [ ] `apps/web/src/__tests__/onboarding.test.tsx` — covers PUB-03, PUB-04, PUB-05
- [ ] `apps/web/src/__tests__/profile.test.tsx` — covers PUB-06
- [ ] `apps/web/src/__tests__/job-board.test.tsx` — covers JOB-01, JOB-05, JOB-06
- [ ] `apps/web/src/__tests__/job-detail.test.tsx` — covers JOB-02, JOB-03, JOB-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing page visual polish (contrario.ai style) | PUB-01 | Aesthetic quality cannot be automated | Open `/` in browser; verify 120px light-weight Geist headline, white background, generous negative space, single CTA |
| JSON-LD passes Google Rich Results Test | JOB-03 | Requires external Google tool | Run Google Rich Results Test on `/jobs/[id]`; verify zero errors |
| Resume dropzone drag-and-drop UX | PUB-03 | Drag interaction requires browser | Drag PDF onto dropzone; verify upload + parse animation plays |
| Onboarding step auto-advance (800ms delay) | PUB-03 | Timing behavior requires real browser | After parse complete, verify auto-advance to step 2 after ~800ms |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
