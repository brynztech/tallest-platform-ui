---
phase: 4
slug: console-supply-admin
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | apps/console/vitest.config.ts |
| **Quick run command** | `pnpm --filter @brynzit/console test --run` |
| **Full suite command** | `pnpm --filter @brynzit/console test --run && pnpm --filter @brynzit/console typecheck` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @brynzit/console test --run`
- **After every plan wave:** Run `pnpm --filter @brynzit/console test --run && pnpm --filter @brynzit/console typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | SUP-01..05, ADM-01..05 | — | N/A | setup | `npx shadcn@latest add tabs progress --cwd=packages/ui && pnpm build` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | SUP-01..05, ADM-01..05 | — | N/A | setup | `pnpm --filter @brynzit/console typecheck` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SUP-01 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/supply-search.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | SUP-02 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/supply-enrich.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | SUP-03 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/supply-ingest.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | SUP-04 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/supply-engagements.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 1 | SUP-05 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/supply-engagements.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 2 | ADM-01..05 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/admin-costs.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 2 | ADM-02 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/admin-events.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-03 | 05 | 2 | ADM-03 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/admin-quotas.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-04 | 05 | 2 | ADM-05 | — | N/A | unit | `pnpm --filter @brynzit/console test --run apps/console/src/__tests__/admin-prompts.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/console/src/__tests__/supply-search.test.tsx` — test stubs for SUP-01 (filter submit, result cards render)
- [ ] `apps/console/src/__tests__/supply-enrich.test.tsx` — stubs for SUP-02 (enrichment flow states)
- [ ] `apps/console/src/__tests__/supply-ingest.test.tsx` — stubs for SUP-03 (LinkedIn/CSV/resume submission states)
- [ ] `apps/console/src/__tests__/supply-engagements.test.tsx` — stubs for SUP-05 (sequence approve/reject flow)
- [ ] `apps/console/src/__tests__/admin-costs.test.tsx` — stubs for ADM-01, ADM-04 (cost table render, pipeline grids)
- [ ] `apps/console/src/__tests__/admin-events.test.tsx` — stubs for ADM-02 (events pagination, client-side task_type filter)
- [ ] `apps/console/src/__tests__/admin-quotas.test.tsx` — stubs for ADM-03 (quota warning threshold)
- [ ] `apps/console/src/__tests__/admin-prompts.test.tsx` — stubs for ADM-05 (prompt dirty state, save flow)
- [ ] `packages/ui/src/components/ui/tabs.tsx` + `progress.tsx` — shadcn components (net-new)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Enrichment polling resolves with GitHub/email data | SUP-02 | setInterval-based polling with 30s timeout requires browser/real-time verification | Open CandidateProfileSheet, click Enrich, observe shimmer then data populate within 30s |
| Filter chip × removes filter and re-submits | SUP-01 | DOM interaction sequence | Click Search, add filters, verify chips, click × on one chip, verify re-fetch with updated params |
| Prompt dirty state prevents navigation | ADM-05 | Browser navigation prevention | Edit prompt, click different prompt in list, verify "Unsaved changes" warning appears |
| Sidebar Supply + Admin sections unlock | CUX | Visual navigation unlock | Confirm Supply/Admin nav items are clickable (not dimmed/disabled) after Wave 0 |
| Admin tabs preserve URL state on refresh | ADM-01..05 | URL param persistence | Navigate to ?tab=costs, refresh page, verify Costs tab is active |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
