# Public candidate site (apps/web) and the Brynz design system

Scope: every page of `apps/web`: home, the company pages (`/startups`, `/enterprises`,
`/frontier-ai`, `/iit-talent`, `/contact`), `/jobs`, `/jobs/[id]`, login, signup, the three
onboarding steps, the dashboard and profile edit. The console (`apps/console`) has its own
system. `packages/ui` is shared and never edited for web work.

Visible product name is **Brynz**. Package names (`@brynzit/*`), localStorage keys and
JSON-LD strings stay as they are, they are identifiers not copy. The job page canonical link
points at `https://talent.trybrynz.com/jobs/<id>` (it was `brynzit.com` until 2026-09-26).

## Source of truth

- **Design source (v3, 2026-10-14):** the static Brynz site the user supplied (`brynz-site/`:
  `index`, `candidates`, `startups`, `enterprises`, `frontier-ai`, `iit-talent`, `contact`, plus
  `assets/styles.css`, `motion.js`, `app.js`). It replaces the compact v2 system (black ink, Inter,
  pills only) from 2026-09-25. Those screens are the reference for the home page, every company page
  and the talent page. Any new page is composed from the classes below, never from new one-off CSS.
- **Design system artifact (v3):** https://claude.ai/artifact/6BBDASmYu3CU3BMUUi9xbk (created
  2026-10-15: README, tokens, 16 components with live previews, logo). The v2 artifact
  (`Lam7THmhVm72bTT6UMevHT`) belongs to another account and is retired. If the artifact and `globals.css` disagree, `globals.css` is right (it is the code) and
  the artifact is stale: fix the artifact.
- **Code:** `apps/web/app/globals.css` is the only place tokens and classes live. It holds the
  design stylesheet as written (minus the palette picker and dark mode), then an "App pieces"
  section for the candidate screens the design never drew. Add to that section, never per page.

## How the CSS is wired

- Tailwind v4 still loads (packages/ui primitives use it). The Brynz classes sit in
  `@layer components`, so preflight loses to them and Tailwind utilities beat them.
- Consequence: do not put a Brynz class on a shadcn `Button` or `Input`. Their built-in utilities
  win and undo the class. Use plain `<button className="btn btn-primary">`, `<Link className="btn …">`
  and native `<input>` inside `.field`. shadcn stays only where it brings behaviour: `DropdownMenu`
  (account menu), `Skeleton`-free loading, `Dialog`, Radix `Select` where a native select cannot do.
- The shadcn colour names (`--color-background`, `--color-primary`…) are mapped onto Brynz values at
  the top of `globals.css`, so primitives match without per-component styling.
- Tailwind utilities are fine for one-off layout (`flex`, `gap-3`, `mt-2`). Never use them for colour,
  type size, radius or shadow: those come from Brynz classes.
- Class name rule: no Brynz class may share a name with a Tailwind utility. `.ring` (the guarantee
  dial) was renamed `.odo-ring` because Tailwind generated a `ring` box-shadow for it.

## Tokens (`:root` in globals.css)

| Token | Value | Use |
|---|---|---|
| `--brand` | `#141A4D` midnight navy | logo, primary button, navy panels, bars |
| `--brand-2` | `#2A3593` | glow inside navy panels, chat bubble |
| `--accent` / `--blue` | `#2F44C9` | links, focus ring, small labels (`.sub`, `.stepn`) |
| `--bg` | `#F3F2EE` | page |
| `--surface` | `#FFFFFF` | cards, panels |
| `--field` | `#ECEBE6` | search fill, chips, empty bars |
| `--ink` / `--ink-2` / `--muted` | `#0F1013` / `#45464E` / `#6D6E77` | text: headings / body / meta |
| `--line` | `#E1DFD8` | every border |
| `--on-navy` | `#F3F2EE` | text on navy |
| `--yc` | `#F26522` | YC tile, saved heart, "hot" dots |
| `--tint-a/b/c/d` | `#DFE3F7` / `#ECE5D5` / `#D9E8DD` / `#D6E6F2` | card visual backgrounds, in that order |
| `--ok`, `--ok-bg`, `--warn`, `--warn-bg`, `--err` | green, amber, red | status pills, errors |
| `--shadow`, `--shadow-lg` | soft navy shadows | raised card / hover |
| `--r-md` / `--r-lg` | 18px / 28px | cards / big panels and bands |
| `--wrap` / `--gutter` | 1200px / clamp(16px, 4vw, 40px) | page width via `.wrap` |

Fonts (`layout.tsx`, `next/font`): **Figtree** for all UI text (`--f-sans`), **Newsreader** serif for
display (`--f-serif`): `.d1`, `.d2`, card titles in doors and tracks, big numbers. Italic `<em>` inside
`.d1`/`.d2` is the signature accent: one word per headline ("Talent that *ships*.").

## Class catalog

| Need | Classes |
|---|---|
| Page width | `.wrap` (always), sections `.section` / `.section-tight`, `.pt0` to drop top padding |
| Type | `.d1` hero (one per page, add `.fit` to keep it on one line), `.d2` section head, `.d3` card title, `.h4`, `.lede` intro, `.small` |
| Section heading | `.section-head` (+ `.center`) wrapping a `.d2` and optional `.lede` |
| Hero | `.hero` (text only, centred), `.trust` pill with `.yc` tile, `.hero-ctas`, `.rise .r1-.r4` entrance |
| Buttons | `.btn` + `.btn-primary` (navy) / `.btn-ghost` (outlined) / `.btn-light` + `.btn-outline-light` (on navy), `.btn-sm`, `.btn-block` |
| Cards | `.door` (home audience doors), `.hcard` (visual + step text, 3-up), `.vcard`/`.vpair` (2-up statements), `.bento` (+`.four`, `.prac .feat`), `.vt` (industry with `.ticker`), `.model` (engagement diagrams), `.stile` (stat tiles), `.path`, `.cmp` |
| Navy bands | `.cta-band` (closing call to action, every page ends with one), `.story`, `.problem`, `.funnel`, `.netband` |
| Lists | `.rows` (editorial rows), `.track` + `.tstep` (process stages), `.rail`, `.faq` (`<details>`), `.proof` chips, `.marquee` |
| Small parts | `.chip` (`.on`, `.ok`), `.pill-ok`, `.pill-n`, `.status[data-s=0-3]`, `.mini` (white floating card inside visuals), `.kv` (definition list) |
| Forms | `.note-form` or `.form` panel, `.field` (label + input/select/textarea + `.err`), `.row2`, `.seg` (pill radio group), `.file-drop`, `.done` |
| Talent search | `.search-hero`, `.searchbar`, `.taglinks`, `.toolbar` + `.count` + `.filters` (native selects) + `.toggle` + `.clear`, `.jobs` grid, `.job` card, `.empty`, `.more` |
| Header / footer | `.nav` (+`.scrolled`), `.mobile-menu`, `.footer` (`site-nav.tsx`, `site-footer.tsx`) |
| App pieces (account screens) | `.page` (+`.narrow` 640, `.mid` 880) inside `.wrap`, `.page-head`, `.panel`, `.notice` (+`.err`, `.ok`), `.divider`, `.inline-link`, `.steps` (onboarding progress), `.avatar-btn` |

## Motion (`app/_lib/motion.ts`, run by `SiteMotion` in the layout)

Pages stay server components. Animation is declared in markup with a `data-*` hook and one client
runner starts it for the current route and stops everything on navigation. Rule: the server HTML
already shows the final state, motion only replays it while it is on screen, and nothing moves
under `prefers-reduced-motion`.

`data-live` (adds `.live` while visible, drives `.a-in`/`.a-grow`/`.a-pop`/`.a-stamp`), `data-flow`,
`data-typer`, `data-cycle`, `data-thread`, `data-net`, `data-funnel`, `data-odo`, `data-days`,
`data-ring`, `data-pool`, `data-pitch`, `data-kw`, `data-track`, `data-ticker`, `data-type-ph`
(typing placeholder), `data-tabs`, `data-form`, `data-copy`, `.fit`, `.file-drop`.

Company forms (`data-form`): validated in the browser, then the visitor gets a "Book a 15-minute
call" link (`BOOKING_URL` in `app/_lib/site.ts`). No backend endpoint takes these notes yet.

## Where things live

| Piece | File |
|---|---|
| Tokens and classes | `app/globals.css` |
| Fonts, header, footer, motion runner | `app/layout.tsx` |
| Header (5 audience links, Log in or Dashboard + account menu, Hire talent) | `app/_components/site-nav.tsx` |
| Footer | `app/_components/site-footer.tsx` |
| Logo mark (inline SVG, also `public/brand/brynz-mark.svg` as the favicon) | `app/_components/brynz-logo.tsx` |
| Motion and form behaviour | `app/_lib/motion.ts`, `app/_components/site-motion.tsx` |
| Home, company pages | `app/page.tsx`, `app/{startups,enterprises,frontier-ai,iit-talent,contact}/page.tsx` |
| Talent page (search, feed, how it works) | `app/jobs/page.tsx`, `_components/{job-card,filter-bar,locked-jobs-overlay,talent-sections}.tsx` |
| Save | `app/_lib/saved-jobs.ts`, `app/jobs/_components/save-job-button.tsx` |
| Account pages | `app/login`, `app/signup`, `app/onboarding/1-3`, `app/dashboard`, `app/profile/edit` |
| Sign-in and sign-up cards (Clerk headless underneath) | `app/login/_components/clerk-sign-in.tsx`, `app/signup/_components/clerk-sign-up.tsx`, `app/sso-callback/page.tsx` |
| Auth hand-off, redirect check, shared bits | `app/_lib/use-finish-auth.ts`, `app/_lib/safe-redirect.ts`, `app/_components/auth-parts.tsx` |
| Job detail and apply flow | `app/jobs/[id]/page.tsx`, `app/jobs/[id]/_components/apply-section.tsx` |

## Behaviour

- Home is a hub for four audiences (Talent, Startups, Enterprises, Frontier AI doors) plus the IIT
  Talent strip. It has no search box; "Talent" goes to `/jobs`. Links like `/jobs?q=Backend` still
  prefill the search.
- Company pages are static server pages ported 1:1 from the design source. Their forms
  (`data-form`) validate in the browser and then offer a booking link; nothing is sent anywhere.
- `/jobs` is the design's talent page fed by the real API: serif hero, `.searchbar` with the typing
  placeholder, `.taglinks` categories (click again to clear), `.toolbar` with the count and native
  filter selects, then the `.jobs` grid, "How Brynz works" and the profile call to action.
- The toolbar is mounted once, so typing never remounts it.
- QA fixes (2026-10-17, from the Brynz-Talent-app-observations sheet):
  - The whole job card opens the job (the title link stretches over the card). The heart and
    Apply sit above it, and the locked overlay lets clicks through outside its panel.
  - Saving while logged out goes to `/signup?redirect=<this page>` (`useSavedJob`).
  - Anonymous visitors get one page of previews: no auto-loading and no "Show more roles".
  - Sign out also ends the Clerk session. Before, only localStorage was cleared and the Clerk
    bridge signed the candidate back in on the next load.
  - The job summary ends at its last full sentence (`app/_lib/end-at-sentence.ts`). The backend
    cuts `description_summary` at a fixed length, the full text is not in the public API.
  - Fields turn red (border and label) once touched or submitted while invalid (`:user-invalid`).
- Second QA round (2026-10-17, backend side in `../talent-platform/docs/job-discovery-spec.md` §15):
  - Job page shows the full description (`description`, detail endpoint only) as paragraphs and
    bullet lists (`job-description.tsx`); a line right above a list reads as its heading. Jobs
    without it fall back to the summary cut at its last sentence.
  - Apply presses are recorded: "Apply on {company}" and "Apply now" call `recordApplyClick`
    (`POST /public/jobs/{id}/apply-click`, fire and forget).
  - Dashboard lists saved jobs under the applications, fetched one by one from the ids in this
    browser. Closed jobs drop out.
  - Profile edit has a Resume panel: upload a newer resume, the profile and job matches refresh,
    saved jobs are untouched. Upload and polling live in `app/_lib/use-resume-upload.ts`, shared
    with onboarding step 1.
  - Search matches each word, the feed shows tech roles only, and signed-in ranking puts the
    candidate's city first, then their country. All three are backend changes.
- Search calls the backend `q`, which matches job title and company name only
  (`talent-platform/candidate/feed.py`). It does not match skills, so the placeholder says
  "roles or companies". The old Skills input is gone: 0 of 432 jobs had skills on 2026-09-24.
- Job card (design `.job`): logo or a letter tile in a steady per-company colour (`logoColor`),
  title (links to the detail page), company, "Posted N days ago on company site", save heart, then
  match text and pay, and the type · workplace, location line with an outlined Apply.
- Pay is `compensation_label` exactly as the backend formats it, never reformatted. 0 of 432
  jobs had pay on 2026-09-24, so the line is usually absent.
- Meta line: type, work setup, location, openings, applicants (`!= null`, a real 0 shows).
  The title clamps to 2 lines and the meta to 1 from `sm` up (2 on phones, where the list is one
  column) with the full text in the `title` attribute, so one long posting cannot stretch its
  whole grid row. The full text is on the detail page.
- Match strength and the top two reasons show as text for signed-in candidates, not as badges,
  because the DS allows no tags on a card. Skills show on the detail page only.
- Saving is browser-only (`brynz_saved_jobs` in localStorage) until a saved-jobs API exists.
- Locked cards are `inert` and blurred. Anonymous visitors still auto-load further pages, which
  moves the overlay down with the list. Open, not fixed.
- Account pages are `.wrap.page` (`.narrow` 640px for sign-in, sign-up and onboarding, `.mid`
  880px for profile and job detail): a `.page-head` with a serif `.d2`, then `.panel`s. Fields are
  native inputs and selects inside `.field`, buttons are `.btn`, skills are removable `.chip`s,
  onboarding shows a `.steps` bar, application status is a `.status` pill.
- Sign-in and sign-up are our own cards (`ClerkSignIn`, `ClerkSignUp`). Clerk runs headless
  underneath (`useSignIn`, `useSignUp`), so accounts and tokens are unchanged, but no Clerk
  screen, logo, "Secured by" line or dev-mode banner is shown. Visible copy must not name the
  vendor (guarded in `auth.test.tsx`).
- Sign-in steps: email and password, "Forgot password?" (emailed code, then a new password), a
  second factor when the account needs one (emailed code or authenticator app), a forced new
  password, and Google. Sign-up steps: name, email, password, 6-digit emailed code, then
  onboarding step 1, or Google. A visitor who is already signed in sees "Continue", not the form.
- Hand-off (`use-finish-auth.ts`): after any successful sign-in the candidate token is stored
  BEFORE navigating (protected pages read it on their first render), the candidate profile is
  started (`POST /api/v1/candidate/onboarding/start`), then the router moves on. A failure shows
  in the card and does not navigate.
- Google uses the classic `authenticateWithRedirect`, not `signIn.sso()` or `signUp.sso()`. The
  new methods reuse the current attempt and silently do nothing after any earlier try, even a
  failed password. The destination survives the round trip in sessionStorage
  (`brynz_auth_destination`). Google returns to `/sso-callback`, which first completes the
  provider callback and then, on `?done=1`, runs the hand-off.
- Sign-up has bot protection on in the Clerk dev instance. Its "Verify you are human" box draws
  into `<div id="clerk-captcha">` (Clerk needs that id, keep it) and the request waits until a
  person ticks it. A hint shows after 2.5s. Automation cannot pass it.
- `?redirect=` is only honoured for same-site paths (`safe-redirect.ts`). With no
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` the pages show the local demo form and `/sso-callback`
  sends visitors to `/login`.
- Not yet exercised with a real account (needs a person): ticking the bot check and finishing
  sign-up with the emailed code, Google consent through to the landing page, the second-factor
  and forced-new-password steps, and the forgot-password happy path. Run in a real browser on a
  production build: card rendering at 1512 and 390 wide, wrong-password error and retry, the
  forgot-password error path, the Google redirect (also after a failed password), and the bot
  check drawing inside the card.
- Phones: the design's breakpoints apply (header collapses to the menu button at 900px, grids
  go to 2 then 1 column, the hero headline shrinks to fit one line via `.fit`). The 2026-09-26
  phone audit numbers (40px taps, swipeable filter row) were for the v2 layout and need a fresh
  pass on v3.
- Motion: every animation is a `data-*` hook run by `app/_lib/motion.ts` (see "Motion" above). The
  `/jobs` search box types its hints via `data-type-ph`. All motion stops under reduced motion.
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
3. Pages render on the server, and search engines read that HTML. `MSWProvider` holds rendering
   back only when `NEXT_PUBLIC_API_MOCKING=enabled`. Until 2026-09-30 it held back always, so
   every page shipped an empty `<body>`. Server rendering has 2 rules:
   - Read `window` and `localStorage` only inside effects or handlers.
   - `useSearchParams` needs a `<Suspense>` boundary or a dynamic route. `/jobs` is dynamic for this. Without one, `next build` fails.
4. Company logos use a plain `<img>`: `next.config` has no `remotePatterns`, and `next/image`
   throws for unknown hosts.
5. Never run two web dev servers, they share `apps/web/.next` and corrupt the Turbopack cache.
6. To check sign-in in a browser, build with the key passed inline
   (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... pnpm --filter @brynzit/web build`), serve it on
   another port (`next start -p 3100`), and never write the key to a file. The build rewrites
   the tracked `apps/web/next-env.d.ts`, so `git restore` it before committing.

## Tests (`apps/web/src/__tests__`)

These read source files and assert strings. When a design value changes, change the test in the
same pass. What they guard: Brynz tokens, the components layer, one light palette, no class that
collides with a Tailwind utility, fonts and the shell, no `ui-classes` and no shadcn Button/Input
on any page, one display headline per page (`visual-polish`), the home doors and nav links
(`landing`), match text, openings, hybrid, filters and skills on the detail page
(`job-feed-canonical`), single toolbar mount, inert locked cards, search and category behaviour and
saved-jobs safety (`job-board`), and the account pages: page frame, dropzone states, chips, no
glass or font-light, copy says Brynz (`visual-polish-forms`). The sign-in and sign-up cards: no
vendor wording, the flow steps and the callback route (`auth`), and the hand-off order, run as a
behaviour test with mocks (`use-finish-auth`).

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
- 2026-09-25: The hosted Clerk modal named the vendor and the dev instance everywhere. Login and
  signup now use our own cards on the compact DS, backed by Clerk headless, and `ClerkProvider`
  points at `/login` and `/signup`.
- 2026-09-25: Real logos in. The nav mark is the Brynz logo file (was a drawn navy square) and the
  trust badge uses the official Y Combinator SVG (was an orange "Y" tile). Product is talent-only for
  now: no "For Companies" tab.
- 2026-09-26: Phone pass. The audit at 320 to 430 wide found no sideways scroll but many taps under
  40px, filter and category rows wrapping over several lines, clipped card meta and a dangling dot
  on the job page (fixes under Behaviour). The hero search now types its hints. The design system
  artifact is unchanged: laptop numbers stand, phones only get larger tap areas. The console
  (hire.) shows a "laptop only" screen below 1024px, see `apps/console/app/CLAUDE.md`.
- 2026-09-29: Backend added Lever and SmartRecruiters job sources. `/jobs/[id]` names them in "also
  posted on" links (`SOURCE_LABELS`). Without an entry the label falls back to title case, which
  would have shown "Smartrecruiters". The Remote filter was checked in a real browser against a
  local backend: 86 remote roles, both new sources included. SEO plan for the site:
  `self-prompts/seo-strategy.md`.
- 2026-09-30: Search engines saw an empty page on every route (gotcha 3). Now:
  - Pages render on the server, and `/jobs/[id]` fetches its job there.
  - Each job page has its own title, description, canonical URL and JobPosting structured data (`app/_lib/job-posting.ts`).
  - Missing, closed or hidden jobs return a real 404.
  - `sitemap.xml` lists every job in the public feed, and `robots.txt` blocks the signed-in pages.
  - The canonical host is `https://talent.trybrynz.com` (`app/_lib/site.ts`).
  - Checked against a production build, as Googlebot and in a real browser: content, metadata, 404s, sitemap, no hydration errors, filters and Save still working. Plan and next steps: `self-prompts/seo-strategy.md`.
- 2026-10-14: Brynz v3 adopted from the user's static design site (`brynz-site/`). Navy brand,
  Figtree + Newsreader, beige page, the design's own class system. The site now serves companies
  too (Startups, Enterprises, Frontier AI, IIT Talent, Contact), reversing the 2026-09-25
  talent-only call. Home became the audience hub, `/jobs` the talent page. Old CSS, `ui-classes.ts`,
  the hero search, `search-field`, `category-links`, `use-typed-hints`, `featured-jobs` and the JPEG
  logo were deleted, not overridden. Every account page moved off shadcn Button/Input onto Brynz
  classes. Dropped from the design: the navy palette picker and dark mode (one light palette).
  Company forms have no endpoint yet, they hand off to `BOOKING_URL`.
