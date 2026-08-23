# Agent Setup Notes — Recruiter Module 6 Features

Identical copy lives in `../talent-platform/AGENT_SETUP_NOTES.md` (single record, two repos).

## Section 0 setup — what was done and why

1. **Claude Code best-practices conventions**: both repos already carry mature root `CLAUDE.md`
   files (backend: architecture rules, stack, GSD workflow; frontend: stack constraints, docs
   conventions, plus `apps/console/CLAUDE.md` and `apps/console/design-system/*`). Rather than
   add `.claude/rules/*.md` files duplicating guidance those documents already enforce, the
   existing convention was followed: new context lives in the tracking docs below, linked from
   each root `CLAUDE.md`. Subagents were used for isolated exploration and for the
   fresh-context review (step 3).
2. **Superpowers framework**: per the user's explicit decision (asked before starting), the
   external github.com/obra/superpowers package was NOT installed. Its workflow discipline was
   followed as a process: Brainstorm/explore (two parallel exploration subagents mapped both
   repos) → Spec (`FEATURE_SPEC.md` written before any code) → Plan (todo breakdown) → TDD
   (backend tests written before implementation; see `TEST_PLAN.md`) → implementation →
   fresh-context subagent review → fixes → finalize.
3. **Fresh-context subagent review**: performed over the full uncommitted diff of both repos
   against the acceptance criteria, with no memory of the implementation reasoning. Findings
   and dispositions below.
4. Steps 1–3 were not skipped.

## Exploration outcome that reshaped the task

The task assumed a bare recruiter module. Exploration (recorded in both repos'
`ARCHITECTURE_NOTES.md`) found most infrastructure already existed — assignments, submissions
with idempotent submit, a notification table + bell UI, config-driven pipeline stages, RBAC
capabilities in `packages/identity`. The implemented diff is therefore scoped to the real gaps;
several "features" became extensions of existing mechanisms rather than new systems (exactly
what the cross-cutting requirements demanded).

## Fresh-context review findings and dispositions

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | HIGH | Upload-mode "Keep yours" title choice silently ignored (backend stamps parsed role at parse time; wizard only patched the generated-title direction) | **Fixed** — wizard now restores the typed title when "Keep yours" is chosen in upload mode |
| 2 | MEDIUM | Review-decision tally could read "0 of 0" (submitted_at basis) and counted removed rows | **Fixed** — tally now computed over interested/approved/rejected statuses |
| 3 | MEDIUM | view_all managers got 403 editing compensation (mutation always sent acting_user_id) | **Fixed** — mirrors the fetch's canViewAll convention |
| 4 | MEDIUM | No MSW handlers for the two new endpoints → mock mode broken | **Fixed** — handlers added (ops 11a, supply 7b) |
| 5 | MEDIUM | Compensation PATCH was PUT-shaped (omitted field nulled) | **Fixed** — exclude_unset semantics; also added le=9_999_999_999 bound (finding 6b) |
| 6 | LOW | Unparseable comp input silently saved as null; no upper bound (DB 500) | **Fixed** — inline validation blocks save; backend 422s past the Numeric(12,2) bound |
| 7 | LOW | Recruiters notified of their own note/stage actions | **Accepted deviation** — documented in FEATURE_SPEC.md with upgrade path (endpoints carry no actor identity today) |
| 8 | LOW | Pipeline page query key excluded acting user (persona-switch cache leak) | **Fixed** — key includes acting user id |
| 9 | LOW | Pipeline page swallowed assignment-fetch errors | **Fixed** — included in hasError |
| 10 | LOW | Submit-disabled reason wrong in mixed state (submitted batch + screened-out actives) | **Fixed** — "already submitted" only when nothing actionable remains |
| 11a | LOW | 403-before-404 on scoped shortlist for nonexistent requisition | **Accepted** — identical to pre-existing assert_recruiter_assigned behavior; consistency over local fix, documented in FEATURE_SPEC.md |
| 11b | LOW | Synchronous PDF extraction blocked the event loop | **Fixed** — asyncio.to_thread |
| 12 | NIT | detail-array surfacing, row-level title also covers View Profile, TEST_PLAN reference | detail-array **fixed**; title placement accepted (harmless); TEST_PLAN.md now exists |

Clean areas confirmed by the review: migration correctness/chaining, notification atomicity
(no commit in the helper, no double-fire), no CTC/ECTC leak through any other serialization
surface, JD upload hygiene (temp-file cleanup, truncation bound, draft-no-matching), test
quality (non-tautological), no regressions in existing callers.

Full suites re-run after fixes: backend 739 passed; console 193 passed; web 117 passed;
typecheck clean.
