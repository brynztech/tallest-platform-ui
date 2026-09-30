# SEO Strategy — Brynz candidate site (`apps/web`)

Last updated: 2026-09-29. Living doc. Add a dated line under "Decisions log" when a call is made.

## The asset we are sitting on

- Every job we ingest is a page we can own: `/jobs/[id]`.
- The backend tracks 162 employer boards. A fresh crawl on 2026-09-29 added 454 new US/India jobs in one weekday.
- Every job page links out to the employer's apply page on Greenhouse, Lever, Ashby or SmartRecruiters. That is thousands of outbound links, plus the company names and logos behind them.
- Job searches are a large share of Google traffic. Google shows jobs in its own box above the normal results, called **Google for Jobs**. Entry is free. A page qualifies when it carries **JobPosting structured data**: a small machine-readable block describing the job.
- Goal: turn each job, company and job-plus-city combination into a page Google can read, index and send candidates to.

## Status 2026-09-30: the crawler blocker is fixed

Pages render on the server again, and job pages carry their content, metadata and JobPosting data in
the first response. There is also a sitemap, robots.txt, and real 404s for missing jobs. Details are in
the "Order of work" table below. The audit below is kept as the record of what was wrong.

## What the audit found (2026-09-29)

**Blocker: crawlers get an empty page.**
- The server sends every route with an empty `<body>`: no nav, no heading, no jobs. Only the `<title>` is present. Checked with `curl` against `/` and `/jobs`.
- Cause: `app/_components/msw-provider.tsx:6,26` renders nothing until a browser effect runs. That happens even when API mocking is off, and the provider wraps the whole site (`app/layout.tsx`).
- `/jobs` and `/jobs/[id]` are client components (`'use client'`), and all job data is fetched in the browser.

**What exists but only runs in the browser:**
- The JobPosting block on `/jobs/[id]` is injected by a `useEffect` (`app/jobs/[id]/page.tsx:122-167`).
- The canonical tag (the "this is the official URL" hint) is also injected client-side, hardcoded to `talent.trybrynz.com` (`page.tsx:169-181`).

**Missing:**
- Per-page titles and descriptions. Every URL shares `Brynz — Find your next role` (`app/layout.tsx:10-13`).
- `sitemap.xml`, `robots.txt`, Open Graph share images, favicon.
- Company pages, and role, city or remote landing pages.
- A real 404 for a job that no longer exists. Today it is a "soft 404": the page says "not found" but returns status 200.
- Analytics and Google Search Console verification.

**Links today:**
- The apply link is `<a target="_blank" rel="noopener noreferrer">` (`page.tsx:293-305`). It has no source tag, so employers cannot see that Brynz sent the candidate.
- Company names are plain text, never links.
- Filters live only in React state and never reach the URL (`app/jobs/page.tsx:29-33`). "Remote jobs" has no address to share or rank.
- Pagination is a "Load more" button, so crawlers cannot reach page 2.
- Anonymous visitors see cards after the 4th blurred and `inert`. Fine for the list page, but detail pages must stay fully visible.

**Hosts:**
- nginx serves the site over plain http on any host name or bare IP, with no redirect (`infra/nginx/web.conf:7-28`).
- Older docs name `brynzit.com` as the canonical domain. Link authority splits across every host Google can reach.

## How we leverage the links

### 1. Job pages → Google for Jobs (highest return)

- Render `/jobs/[id]` on the server, including the JobPosting block, per-job `generateMetadata` (title `{Job} at {Company} · {City}`), and a server-side canonical.
- Complete the JobPosting block:
  - `validThrough`
  - `identifier`
  - `directApply: false`, because apply happens on the employer's site
  - `hiringOrganization` with `logo` and `sameAs` (the company site)
  - `jobLocation` as a structured address: city, region and country, not a plain string
  - `jobLocationType: TELECOMMUTE` plus `applicantLocationRequirements` for remote jobs
  - `baseSalary` when known
- Closed jobs: the backend already marks them `is_active=false`. Map that to HTTP 410 ("gone") with `notFound()`. Google penalizes job markup left on expired jobs.
- Push new and closed jobs to Google's **Indexing API**. It is officially allowed only for JobPosting pages, and it gets a new job indexed in hours instead of days. That matters at roughly 450 new jobs a day.

### 2. Outbound apply links → proof of value for BD

- Tag every apply link with where the candidate came from:
  - Lever reads `?lever-source=Brynz` and records "Brynz" as the candidate source inside the employer's own Lever reports.
  - Greenhouse needs a tracking link the employer creates in Greenhouse, so use `utm_source=brynz&utm_medium=job_board` there.
  - Check what SmartRecruiters and Ashby record before claiming it in a pitch.
- Why: employers then see Brynz in their own hiring data. The BD team can open with "we sent you N applicants last month" instead of a cold pitch.
- Keep outbound links `rel="nofollow"` (tells Google we don't vouch for the target) plus `noopener`. We are pointing at thousands of employer pages we don't control.

### 3. Company pages → rank for "{company} jobs" and "{company} careers India"

- `/companies/[slug]` for each of the 162 tracked companies: logo, short blurb, open roles, US/India split.
- Each job page links to its company page, and each company page links back to its jobs. This internal linking is what spreads ranking power across the site.
- Only publish a company page with at least 3 open jobs, to avoid thin pages.

### 4. Landing pages from real inventory → rank for "remote {role} jobs", "{role} jobs in Bengaluru"

- Clean URLs such as `/jobs/remote`, `/jobs/in/bengaluru` and `/jobs/software-engineer/remote`, generated from actual counts. Minimum 10 jobs per page, and each gets its own title and intro line.
- Move filters into the URL (`/jobs?remote_mode=remote&country=IN`) so every filtered view is shareable, and point its canonical at the matching clean landing page.
- The home page category links (`app/_components/category-links.tsx`) should point at these landing pages instead of `?q=` searches.

### 5. Crawl plumbing

- `app/sitemap.ts` as a sitemap index:
  - static pages
  - all active jobs (`lastmod` from `date_posted`), split into files of 50k
  - companies
  - landing pages
- Closed jobs drop out of the sitemap automatically.
- `app/robots.ts`: allow `/`, block `/dashboard`, `/profile`, `/onboarding`, `/login`, `/signup` and `/sso-callback`, and link the sitemap.
- Crawlable pagination: plain `<a href="?page=2">` links next to "Load more".
- One canonical host: 301-redirect http, bare IP and every other host to it. Set `metadataBase` in `app/layout.tsx`. Replace the hardcoded canonical host with an env var (`NEXT_PUBLIC_SITE_URL`).

### 6. Sharing surface

- A per-job `opengraph-image.tsx` card (title, company logo, location, salary) so links shared on LinkedIn and WhatsApp render as rich previews. People share jobs, and every share is a link back to us.

## Order of work

| # | Item | Effort | Why this order |
|---|---|---|---|
| P0 | ✅ 2026-09-30 Stop the empty-body render: gate the MSW provider behind the mocking env only, server-render `/jobs/[id]` | done | Nothing below counts until Google can read the page |
| P0 | ✅ 2026-09-30 Canonical domain `talent.trybrynz.com` and `metadataBase`. **Left: nginx still serves plain http on a bare IP or any other host name** (`infra/nginx/web.conf`) | redirects: 0.5 day | Links and authority pile up on the wrong host otherwise |
| P1 | ✅ 2026-09-30 JobPosting block completed, per-job metadata, real 404 for closed jobs (404, not 410: Next's `notFound()`) | done | Entry to Google for Jobs |
| P1 | ✅ 2026-09-30 `sitemap.ts`, `robots.ts`. **Left: Search Console, analytics** | 0.5 day | See what Google indexes |
| P1 | Source tags and `nofollow` on apply links | 0.5 day | BD proof, cheap |
| P2 | Company pages | 2 days | New ranking surface from data we already have |
| P2 | URL filters and landing pages (remote, city, role) | 2–3 days | Captures "remote X jobs" searches |
| P2 | Indexing API push for new/closed jobs | 1 day | Speed, once volume is steady |
| P3 | Per-job OG share cards | 0.5 day | Sharing |

## What to measure

- Search Console:
  - indexed job pages vs active jobs
  - Google for Jobs impressions and clicks (the "Job listing" and "Job details" search appearances)
  - rich-result errors
- Apply click-through per job page, split by source (Google for Jobs, organic, direct).
- For Lever employers: applicants recorded as "Brynz" in their reports. Useful as a BD talking point.

## Risks

- **Duplicate content.** The same description lives on the employer's ATS page. Our page has to add something: match strength, normalized salary, skills, company context, similar jobs. Otherwise Google may treat it as a thin copy.
- **Republishing descriptions.** ATS job-board APIs exist to embed a company's own postings. Showing the full text is standard for job aggregators, but it is a policy call. A summary plus link is the conservative option.
- **Blurring job content for anonymous visitors.** Google must see what users see. Never gate job detail pages, and never serve crawlers different content.

## Open decisions

- D2: Full job descriptions, or summary plus link? Job pages show only the backend's 500-character `description_summary`. The public job API has no full description field, so a longer page needs a backend contract change.
- D3: Which analytics tool (GA4, Plausible, PostHog)?

## Decisions log

- 2026-09-29 — Doc created from a code audit of `apps/web`. No decisions made yet.
- 2026-09-30 — D1 decided: `https://talent.trybrynz.com` is the canonical domain (`app/_lib/site.ts`).
- 2026-09-30 — Crawler fix shipped in code (P0/P1 rows above). The sitemap walks the public feed, which caps at 2,000 ranked jobs. It needs a backend endpoint listing every visible job id past that.
