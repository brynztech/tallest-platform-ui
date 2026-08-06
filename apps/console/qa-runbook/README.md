# Console QA Runbook

This folder tracks console QA findings across agent runs. Use it with `apps/console/QA.md`:

1. Pick a persona and flow from `../QA.md`.
2. Record every observed issue in `issues.md`.
3. Mark fixed issues only after code changes are verified.
4. Leave remaining issues with a clear owner hint and retest path.

## Status Labels

- `Fixed`: Code changed and verification passed.
- `Remaining`: Reproduced or still expected to fail.
- `Blocked`: Could not test because data, auth, backend, or environment was unavailable.
- `Watch`: Fixed or not reproduced, but worth checking in the next full QA pass.

## Current Focus

The current ledger records the issues found by the Composer and Grok QA passes for the console recruiter, BD, Ops, Supply, and Admin flows.
