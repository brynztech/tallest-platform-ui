---
phase: 3
slug: console-ops
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `apps/console/vitest.config.ts` (exists from Phase 2) |
| **Quick run command** | `pnpm --filter @brynzit/console test run` |
| **Full suite command** | `pnpm --filter @brynzit/console test run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @brynzit/console test run`
- **After every plan wave:** Run `pnpm --filter @brynzit/console test run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| OPS-01 | 03-01 | 1 | OPS-01 | — | Note text rendered as JSX text nodes, no innerHTML | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-clients.test.tsx` | ❌ W0 | ⬜ pending |
| OPS-02 | 03-02 | 2 | OPS-02 | — | JD text sent as JSON string, no HTML rendering | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-jd-parse.test.tsx` | ❌ W0 | ⬜ pending |
| OPS-03 | 03-02 | 2 | OPS-03 | — | N/A | unit | same as OPS-02 | ❌ W0 | ⬜ pending |
| OPS-04 | 03-02 | 2 | OPS-04 | — | N/A | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-shortlist.test.tsx` | ❌ W0 | ⬜ pending |
| OPS-05 | 03-03 | 3 | OPS-05 | — | 409 surfaces as toast error, not silent failure | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-interviews.test.tsx` | ❌ W0 | ⬜ pending |
| OPS-06 | 03-03 | 3 | OPS-06 | — | N/A | unit | `pnpm --filter @brynzit/console test run src/__tests__/ops-placements.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/console/src/__tests__/ops-clients.test.tsx` — stubs for OPS-01 (client create → list)
- [ ] `apps/console/src/__tests__/ops-jd-parse.test.tsx` — stubs for OPS-02, OPS-03 (JD parse flow)
- [ ] `apps/console/src/__tests__/ops-shortlist.test.tsx` — stubs for OPS-04 (shortlist actions)
- [ ] `apps/console/src/__tests__/ops-interviews.test.tsx` — stubs for OPS-05 (interview state transitions)
- [ ] `apps/console/src/__tests__/ops-placements.test.tsx` — stubs for OPS-06 (placement form)
- [ ] Skeleton shadcn component in `packages/ui` (`npx shadcn@latest add skeleton --cwd=packages/ui`)
- [ ] Textarea shadcn component in `packages/ui` (`npx shadcn@latest add textarea --cwd=packages/ui`)
- [ ] Separator shadcn component in `packages/ui` (`npx shadcn@latest add separator --cwd=packages/ui`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JD parse shimmer animation → field animate-in | OPS-02 | Visual animation cannot be asserted with jsdom | Open `/ops/requisitions/new`, paste JD, submit; verify shimmer shows then fields populate |
| Two-panel layout on client detail — independent scroll | OPS-01 | Layout/scroll behavior requires real browser | Open `/ops/clients/{id}`; verify left and right panels scroll independently |
| Shortlist Table row → Sheet slide-over opens | OPS-04 | Radix Sheet focus trap behavior | Click a shortlist row; verify sheet opens with candidate profile on right |
| Sidebar Ops section unlocked | OPS-01 | Visual navigation check | Verify Clients, Requisitions, Interviews links are clickable in sidebar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
