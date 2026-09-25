# Public candidate site (apps/web) and the Brynz design system

Scope: every page of `apps/web`: home, `/jobs`, `/jobs/[id]`, login, signup, the three
onboarding steps, the dashboard and profile edit. The console (`apps/console`) has its own
system. `packages/ui` is shared and never edited for web work.

Visible product name is **Brynz**. Package names (`@brynzit/*`), the `brynzit.com` canonical
URL, localStorage keys and JSON-LD strings stay as they are, they are identifiers not copy.

## Source of truth

- Design system artifact: https://claude.ai/artifact/Lam7THmhVm72bTT6UMevHT. Read it with the
  Artifact tool: `project/README.md`, `project/tokens.json`, `project/components/<Name>/README.md`.
  If this doc and the artifact disagree, the artifact wins. It was updated to the compact scale
  on 2026-09-25 (artifact version 4, `tokens.json` version 2), so the numbers below and the
  artifact agree. Style names changed in v2: `label-lg`, `body-lg`, `meta` and `caption` are gone,
  `heading-xl`, `heading`, `label`, `body` are new.
- The jobs list and job detail follow the "Brynz pages restyled" mockup (2026-09-24). It is not
  readable as an artifact, so sizes were measured from screenshots and checked against the tokens
  (nav pill 40, buttons 48, card padding 40, logo 56 all line up).

## Tokens (globals.css is the only place they live)

| DS token | Value | In code |
|---|---|---|
| canvas | `#f7f3f0` | `bg-background` |
| canvas-rule | `#f4f0ed` | `border-canvas-rule` (header rule) |
| surface | `#ffffff` | `bg-card` |
| surface-muted | `#f0f0f0` | `bg-muted` (search fill, hovered card) |
| ink / on-ink | `#000000` / `#ffffff` | `bg-primary` / `text-primary-foreground`, `text-foreground` |
| ink-muted | `#6b6b6b` | `text-muted-foreground` |
| link | `#3860bc` | `text-link` (category links only), focus ring, `outline-link` |
| divider | `#b4b4c0` | `bg-divider` |
| border-card / border-control / border-input | `#e8e7e5` / `#e5e5e5` / `#707070` | `border-border` / `border-border-control` / `border-border-input` |
| brand | `#080e5a` | `bg-brand`, logo only |
| shadow-raised / shadow-badge | see file | `shadow-raised` (hovered card, floating overlay) / `shadow-badge` |

Shape: every control is a full pill. Cards and blocks are `rounded-[20px]`. Almost flat: no
gradients, no glass, no backdrop blur. Font is Inter, weights 400, 500 and 600 only
(`layout.tsx`).

**Compact scale (2026-09-25, on request).** The design system was updated to these numbers, so
they are now the DS. The first DS version had larger ones, kept here for history. Colours, pills
and hairlines never changed:

| Thing | First DS version | Now (DS v2) |
|---|---|---|
| Type sizes | 56 / 20 / 18 / 16 / 13, bold | 48 / 32 / 24 / 16 / 14, weights 400-600 |
| Hero headline | 56/64 bold | 48/52 semibold, -0.035em (34/38 on phones) |
| Hero search | 810 x 116, label left | 640 x 56 pill, arrow 40, label centered |
| Header | 80px, buttons 48, nav pill 40 | 64px, buttons 40, nav pill 36 |
| Job card | padding 40, logo 56, radius 28, about 230 tall | padding 20, logo 40, radius 20, about 138 tall |
| Card Apply | 44px, 18px text | 32px, 14px text |
| Filter pills | 44px, 16px text | 36px, 14px text |
| Content width | 1180 to 1384 | 1120 (hero, grid, `/jobs`), 880 (detail) |

Type uses arbitrary values, for example `text-[14px] leading-5 font-medium`. Do not register
`--text-*` tokens (see gotcha 1). Spacing steps: 4, 8, 12, 16, 20, 24, 32, 48.

## Where things live

| Piece | File |
|---|---|
| Header | `app/_components/site-nav.tsx` (real routes only, no "For Talent / For Companies") |
| Hero | `app/_components/hero-section.tsx` |
| Search pill (one size, 56px, used by the hero and the jobs toolbar) | `app/_components/search-field.tsx` |
| Category links | `app/_components/category-links.tsx` (links to `/jobs?q=`, or fills the search when `onSelect` is set) |
| Home job teaser | `app/_components/featured-jobs.tsx` |
| Job card | `app/jobs/_components/job-card.tsx` (the only card, home and `/jobs`) |
| Toolbar: search, filter pills, chips, category links | `app/jobs/_components/filter-bar.tsx` |
| Anonymous gate | `app/jobs/_components/locked-jobs-overlay.tsx` |
| Save | `app/_lib/saved-jobs.ts`, `app/jobs/_components/save-job-button.tsx` |
| Shared class strings (buttons, panel, notice, fields) | `app/_lib/ui-classes.ts` |
| Removable chip (skills, filters) | `app/_components/removable-chip.tsx` |
| Account pages | `app/login`, `app/signup`, `app/onboarding/1-3`, `app/dashboard`, `app/profile/edit` |
| Job detail and apply flow | `app/jobs/[id]/page.tsx`, `app/jobs/[id]/_components/apply-section.tsx` |

## Behaviour

- Hero search and category links go to `/jobs?q=`. `/jobs` seeds its search from `q`.
- The toolbar is mounted once. It used to render in three branches, so each new query remounted
  it and dropped the input's focus and text.
- Search calls the backend `q`, which matches job title and company name only
  (`talent-platform/candidate/feed.py`). It does not match skills, so the placeholder says
  "roles or companies". The old Skills input is gone: 0 of 432 jobs had skills on 2026-09-24.
- Card head row is logo, title (plus pay and match text) and the save heart, in one row. The DS
  shows no company name text, identity comes from the logo or a letter tile.
- Pay is `compensation_label` exactly as the backend formats it, never reformatted. 0 of 432
  jobs had pay on 2026-09-24, so the line is usually absent.
- Meta line: type, work setup, location, openings, applicants (`!= null`, a real 0 shows).
  The title clamps to 2 lines and the meta to 1 (full text in the `title` attribute), so one
  long posting cannot stretch its whole grid row. The full text is on the detail page.
- Match strength and the top two reasons show as text for signed-in candidates, not as badges,
  because the DS allows no tags on a card. Skills show on the detail page only.
- Saving is browser-only (`brynz_saved_jobs` in localStorage) until a saved-jobs API exists.
- Locked cards are `inert` and blurred. Anonymous visitors still auto-load further pages, which
  moves the overlay down with the list. Open, not fixed.
- Account pages are one flat panel on `canvas` (420px sign-in and sign-up, 560px onboarding, about
  690px profile). Fields are 40px `border-input` pills from `ui-classes.ts`, one full-width
  primary button per panel, skills as removable chips, application status as a chip.
- Protected pages (dashboard, onboarding, profile) redirect to login on a hard reload even when
  signed in: their redirect effect runs before the auth provider reads localStorage. They work
  when reached by client-side navigation. Open, not fixed.
- The dropzone's helper line still reads "up to mock limit". Placeholder copy, not changed.
- Detail page: apply row sits above the description. Scraped jobs get "Apply on {company}" plus
  Save and a notice that Brynz cannot track the application. Our own requisitions use
  `ApplySection`.

## Gotchas

1. `text-nav` style names share the `text-*` namespace with colours. `tailwind-merge` (inside
   `cn()`) cannot tell them apart and dropped `text-primary-foreground` from the primary
   button, giving black text on black. Use `text-[14px]`. Guarded in `visual-polish.test.tsx`.
2. `SelectTrigger` ships `data-[size=default]:h-9` (36px, the current pill size). For anything
   taller a plain `h-*` loses on specificity, pass `data-[size=default]:h-*` so tailwind-merge
   replaces it.
3. `MSWProvider` renders nothing until it mounts client-side, so `curl` returns an empty body.
   Verify UI in a real browser (Playwright), not from HTML.
4. Company logos use a plain `<img>`: `next.config` has no `remotePatterns`, and `next/image`
   throws for unknown hosts.
5. Never run two web dev servers, they share `apps/web/.next` and corrupt the Turbopack cache.

## Tests (`apps/web/src/__tests__`)

These read source files and assert strings. When a design value changes, change the test in the
same pass. What they guard: token values and the no `--text-*` rule (`visual-polish`), one
display headline and the `/jobs?q=` hand-off (`landing`), card hover, focus outlines and flat
overlay (`visual-polish`), match text, openings, hybrid and skills on the detail page
(`job-feed-canonical`), single toolbar mount, inert locked cards and saved-jobs safety
(`job-board`), and the account pages: no glass, heavy shadow or font-light, and visible copy
says Brynz (`visual-polish-forms`).

## Decisions log

- 2026-09-23: Brynz DS adopted for the home page. Hand-built system removed.
- 2026-09-24: `/jobs` and `/jobs/[id]` restyled to the mockup. Skills input and the old heading
  block dropped (a screen-reader-only `h1` remains). Card head row fixed to a single row.
- 2026-09-24: Logos and pay depend on backend enrichment. Only the LinkedIn source carried logos
  at first, see the backend logo prompt. No fake values are ever shown.
- 2026-09-25: Cards, the hero search and the blocks were too big and heavy on laptop screens.
  Compact scale applied to the header, hero, home teaser, `/jobs`, `/jobs/[id]` (table above).
  Hero content is centered end to end, dividers between category links hide on phones, and the
  search pill got a visible keyboard focus outline (it had none). The small labels above the
  banner and overlay headings were kept because the mockup and tests carry them.
- 2026-09-25: Design system artifact updated to the compact scale (version 4, tokens v2), with
  new forms and panels guidance and matching previews. Dashboard, login, signup, onboarding and
  profile edit restyled to it: flat panels, pill fields, chips, no backdrop blur or heavy
  shadows, "Brynzit" in visible copy changed to "Brynz".
