# Supply Ingest — Resume Upload

Status: implemented on `frontend-dev` · Last updated: 2026-08-14

`apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` — one of
three ingest paths on `/supply/ingest` (LinkedIn query, CSV, resume), all
sharing the ingest page's job-card list (`IngestJobCard` / `onJobAdded` /
`onJobUpdated`).

## Multi-resume upload

The dropzone accepts multiple files in one drop/browse (`useDropzone({
multiple: true })`, previously `maxFiles: 1`). Each file becomes its own job
card and its own independent upload + poll cycle (`uploadOne()`, run
concurrently via `Promise.all`) — one file failing to upload or parse does not
block or fail the others in the batch.

No backend change was needed: `POST /api/v1/supply/resumes/upload`
(`../talent-platform`'s `supply/router.py`) already accepts one file per call
and was already designed to be called once per resume. Verified in the
backend source (not just the route signature) that this is safe to call
concurrently:

- Each call creates a **new placeholder `Candidate` + `TalentPool` row**
  synchronously, with a fresh UUID, before background parsing starts and
  before the 202 response is returned — so N concurrent uploads always get N
  distinct `candidate_id`s up front.
- Parsing runs as an independent `asyncio.Task` per upload
  (`supply/services/resume_parser.py`'s `_parse_and_map`, scheduled via
  `_schedule()`), each closing over its own `tmp_path`/`candidate_id` — no
  shared mutable state between concurrent parses.
- **Pre-existing edge case, not introduced by this change:** if two resumes in
  the same batch parse to the *same email* (i.e., the same real person
  uploaded twice), the backend's existing email-dedupe logic in
  `map_to_candidate_and_pool` merges the later-finishing placeholder into the
  first candidate's record (`status="merged"`) rather than creating a
  duplicate profile — but still backfills the placeholder's own row so its job
  card reaches "done" instead of hanging. Different people with different
  emails — the normal multi-resume case — get fully independent profiles.

## Tests

No new test added for the dropzone interaction itself — there was no existing
RTL/Playwright coverage of drag-and-drop file selection for this form before
this change either (see `docs/console-admin-and-rbac.md` §5 for the known
new-`.tsx`-file Vitest/JSX transform bug that makes adding one non-trivial).
The changed concurrency behavior (`Promise.all` over self-catching per-file
uploads, so one rejection can't block the batch) is a stdlib guarantee, not
custom logic requiring a bespoke test. Full console suite (135 tests) and
`tsc --noEmit` pass unchanged after this edit.
