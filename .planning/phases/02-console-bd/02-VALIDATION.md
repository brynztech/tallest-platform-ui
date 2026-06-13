---
phase: 2
slug: console-bd
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 (already configured in packages/hooks; apps/console needs vitest config) |
| **Config file** | `apps/console/vitest.config.ts` (Wave 0 creates this) |
| **Quick run command** | `pnpm --filter @brynzit/console test -- --run` |
| **Full suite command** | `pnpm --filter @brynzit/console test -- --run && pnpm --filter @brynzit/hooks test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @brynzit/console test -- --run`
- **After every plan wave:** Run full suite (console + hooks)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | BD-01 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | BD-02 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | BD-03 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | BD-04 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | BD-05 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | BD-06 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | BD-07, BD-08 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |
| 2-04-01 | 04 | 3 | CUX-01, CUX-02, CUX-03 | — | N/A | unit | `pnpm --filter @brynzit/console test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/console/vitest.config.ts` — vitest config for jsdom environment
- [ ] `apps/console/src/__tests__/lead-queue.test.tsx` — stubs for BD-01, BD-02, BD-03
- [ ] `apps/console/src/__tests__/async-flows.test.tsx` — stubs for BD-04, BD-05
- [ ] `apps/console/src/__tests__/pipeline.test.tsx` — stubs for BD-06, BD-07, BD-08
- [ ] `apps/console/src/__tests__/keyboard-ux.test.tsx` — stubs for CUX-01, CUX-02, CUX-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lead card renders correctly with all fields | BD-01 | Visual layout and ICP score badge color tiers | Start dev server, open /bd/leads with MSW, verify card anatomy |
| Slide-over opens/closes with correct animation | CUX-01 | Visual animation and focus trap | Open lead, verify Sheet slides in, Esc closes, focus returns |
| Keyboard shortcuts work without conflicts | CUX-03 | Requires browser focus context | Navigate queue with J/K, press A/R/S, open ? overlay |
| Pipeline kanban renders drag placeholders | BD-06 | Visual DnD interaction | Open /bd/pipeline, verify status columns with lead counts |
| Snooze wake badge appears in sidebar | BD-08 | Time-based trigger; needs snoozed mock data | Set mock snooze date to past, verify nav badge appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
