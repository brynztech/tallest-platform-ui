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
  (`supply/services/resume_ingest.py`'s `parse_and_map_resume`, scheduled via
  the router's `_schedule()`), each closing over its own
  `tmp_path`/`candidate_id` — no shared mutable state between concurrent
  parses.
- **Pre-existing edge case, not introduced by this change:** if two resumes in
  the same batch parse to the *same email* (i.e., the same real person
  uploaded twice), the backend's existing email-dedupe logic in
  `map_to_candidate_and_pool` merges the later-finishing placeholder into the
  first candidate's record (`status="merged"`) rather than creating a
  duplicate profile — but still backfills the placeholder's own row so its job
  card reaches "done" instead of hanging. Different people with different
  emails — the normal multi-resume case — get fully independent profiles.

## Gmail as a second source (2026-09-10)

The same backend path now also runs unattended against a watched Gmail inbox:
an email whose subject contains an admin-configured string has its PDF/DOCX
attachments parsed into the pool exactly as if they had been dropped on this
form. Console surface is the Admin → **Gmail** tab
(`app/(shell)/admin/_components/admin-gmail-tab.tsx`), not this page — the
ingest page stays the manual path.

Both sources share `supply/services/resume_ingest.py` in the backend, which is
why the staging and parsing helpers referenced above moved out of
`supply/router.py`. Behaviour on this page is unchanged; the only difference
between the two sources is the `source` value stamped on the `Candidate` row
(`"resume_upload"` vs `"gmail_ingest"`).

Full detail: `../talent-platform/docs/gmail-resume-ingest.md`.

## Duplicate files short-circuit (2026-09-10)

The backend now checksums every ingested file (SHA-256 on
`talent_pool.resume_sha256`). Uploading a byte-identical resume returns
`status: "duplicate"` with the **existing** candidate's id instead of creating
a new placeholder — no re-parse, no ghost `merged`/`parse_failed` rows in the
admin Candidates list. `resume-form.tsx` shows "Already in talent pool" for
that branch and polls the returned candidate as usual (it is already parsed,
so the job card completes immediately). This also removed the concurrent-batch
edge case documented above: the second identical file in one drop is stopped
at the door rather than racing the first into the unique-email constraint. An
*updated* resume (different bytes) still parses and refreshes the profile.

## Tests

No new test added for the dropzone interaction itself — there was no existing
RTL/Playwright coverage of drag-and-drop file selection for this form before
this change either (see `docs/console-admin-and-rbac.md` §5 for the known
new-`.tsx`-file Vitest/JSX transform bug that makes adding one non-trivial).
The changed concurrency behavior (`Promise.all` over self-catching per-file
uploads, so one rejection can't block the batch) is a stdlib guarantee, not
custom logic requiring a bespoke test. Full console suite (135 tests) and
`tsc --noEmit` pass unchanged after this edit.
