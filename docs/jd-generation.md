# JD Generation — Console

Status: implemented · Last updated: 2026-08-22

Backend contract: `../talent-platform/docs/jd-generation.md`. That doc is
authoritative for field names, storage and the `.docx` template; this one covers
only what lives in this repo.

## 1. Where it appears

A **Job Description** card on the requisition detail screen
(`app/(shell)/ops/requisitions/[id]/page.tsx`), between `RequisitionFields` and
`HiringProcessPanel`. Everything happens in a centred dialog on that same
screen — no new route.

| File | Role |
|---|---|
| `_lib/jd.ts` | Types + native-fetch data layer + the pure helpers the preview consumes |
| `_components/jd-panel.tsx` | The card, the dialog, generate/regenerate/download actions |
| `_components/jd-preview.tsx` | Paper-faithful render of the JD JSON |

## 2. Two faces, one dialog

- **No JD yet** → the card's primary action is *Generate JD* and the dialog
  opens on the inputs form: requirement paragraph, company website, reference
  memo, Resdex criteria memo, extra green flags, extra red flags. Generate stays
  disabled until the requirement paragraph is ≥20 chars **and** a website is
  filled — the backend 422s otherwise, and there is no reason to make the
  operator discover that server-side.
- **JD exists** → the action becomes *Preview JD*, the dialog opens on the
  preview, and the footer offers *Regenerate* (back to the form) and
  *Download .docx*. A Download button also sits on the card itself, so
  exporting does not require opening the dialog.

Generation runs through a TanStack mutation with a spinner in the footer
button. On failure the toast shows the backend's `detail` string verbatim
(`generateJd` unwraps it), so "A company website is required…" reaches the
operator instead of "422".

## 3. Caching

`useQuery(['ops-requisition-jd', reqId])` with a 5-minute `staleTime`, so
re-opening the preview never regenerates. A successful generation writes the
result into that cache with `setQueryData` and invalidates
`['ops-requisition', reqId]` — `intake_details` changed server-side, and the
hiring-process panel reads it.

Regenerate prefills from `req.intake_details.jd_inputs`, which the backend
caches on generation. The account manager does not retype the requirement
paragraph to re-run after an edit.

## 4. Why the preview uses document colours, not console tokens

`jd-preview.tsx` renders the *document*: Arial, navy `#1B2A4A` title band,
`#166534` green-flag bullets, `#991B1B` red-flag bullets, the 3×3 quick-facts
grid, the accent-ruled section headings — all lifted verbatim from
`../talent-platform/ops/services/jd_docx.py` so what the operator approves on
screen is what the downloaded file contains. The console's own tokens govern
everything *around* the paper: card, dialog, buttons, labels, toasts, the
Resdex/hard-filters blocks below the preview. Console rules still apply — light
theme only, no `dark:` variants.

The one intentional divergence: the `.docx` header carries the Brynz logo mark,
the web preview shows the wordmark alone (the image asset lives in the backend
repo).

Below the paper the dialog shows two operational blocks that are **not** part
of the JD document — the Naukri Resdex search criteria (the generator's second
output) and the hard requirements + application requirements that matching
applies as filters.

## 5. Native fetch, not `apiClient`

`/ops/requisitions/{id}/jd`, `.../jd/generate` and `.../jd/download` are not in
this repo's generated `api.d.ts` yet, so `_lib/jd.ts` uses native `fetch` — the
documented convention for paths absent from the generated client
(`apps/console/CLAUDE.md` gotcha #5, same as `my-roles/[id]/_lib/shortlist.ts`).
After the next `pnpm generate:api` these can move to `apiClient`.

The download is a plain `<a href download>` pointing at the backend endpoint.
The browser never builds the file.

## 6. Tests

`src/__tests__/ops-jd-generate.test.ts` (11 tests) covers the pure helpers and
the fetch layer: the quick-facts 3×3 order, `"Not specified"` for blank or
missing cells, a missing `quick_facts` object still yielding nine cells, the
title-band subtitle skipping unset parts, `fetchJd` returning `null` on 404
versus throwing on 500, and `generateJd` surfacing the backend's `detail`.

**No render test for `JdPreview`.** Component rendering is still blocked in this
app's Vitest — importing any `.tsx` component into a test fails to transform
(gotcha #3; no existing unit test imports a component either, only pure-TS
helpers). The rendered contract is covered instead by `tsc --noEmit` plus the
backend's `.docx` test, which asserts the real deliverable's section order and
palette. A Playwright spec is the way to cover it here if it becomes worth a
production build.
