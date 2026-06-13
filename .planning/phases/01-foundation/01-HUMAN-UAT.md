---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: 2026-06-13T00:00:00Z
updated: 2026-06-13T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Walking skeleton page renders rejection reasons

Start apps/console with MSW enabled:
```bash
NEXT_PUBLIC_API_MOCKING=enabled pnpm --filter @brynzit/console dev
```
Open http://localhost:3001 (or the port Next.js assigns), navigate to /bd/leads.

expected: Page shows "Brynzit Console" heading, 7 rejection reasons list (NOT_ICP_FIT, WRONG_SENIORITY, NO_OPEN_ROLES, COMPETITOR, BAD_TIMING, ALREADY_A_CLIENT, OTHER), and DevTools Console shows "[MSW] Mocking enabled."
result: [pending]

### 2. Public web shell renders placeholder

Start apps/web:
```bash
pnpm --filter @brynzit/web dev
```
Open http://localhost:3000.

expected: Page shows "Brynzit is coming." heading (or similar placeholder), no console errors, no blank flash on load
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
