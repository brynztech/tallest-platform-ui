# Console Admin (Job Sources) and RBAC

Status: implemented and deployed to `frontend-dev` · Last updated: 2026-07-30

Covers three pieces of work in the internal console (`apps/console`) that have
no other documentation yet: the Job Sources admin tab and its server-side
proxy, two production bugs found and fixed while building on top of the
existing admin shell, and route-level RBAC enforcement. See
`talent-platform`'s `docs/job-discovery-spec.md` for the backend side (the
canonical job schema, matching, ingestion) that the admin tab drives.

## 1. The admin proxy

`apps/console/app/api/job-board/[...path]/route.ts` — a Next.js route handler,
not a client-side fetch.

The backend's `job_board` admin endpoints require `X-Admin-Token`. Anything a
browser bundle can read is public, so the console cannot call those endpoints
directly from client components. The route handler runs server-side, reads
`ADMIN_API_TOKEN` from server-only env (no `NEXT_PUBLIC_` prefix, so Next.js
never inlines it into client JS), and forwards the request. The client
(`apps/console/app/(shell)/admin/_lib/job-board-api.ts`) only ever talks to the
same-origin `/api/job-board/*` path and holds no credential at all — verified
by grepping every built client bundle for the token string.

The proxy:

- rebuilds the forwarded path from matched route segments (`encodeURIComponent`
  per segment) rather than passing a raw path through, so a crafted request
  cannot escape the `/job-board` prefix
- restricts itself to `GET/POST/PUT/PATCH/DELETE` — anything else is refused
  rather than tunneled
- never caches (`cache: 'no-store'`) — admin reads must reflect the live crawl
- times out at 15s and returns a distinct `504` (timeout) vs `502` (can't
  connect), because an admin panel that spins forever with no error is worse
  than one that fails fast with a reason
- returns a `503` with an actionable message, and still deploys, when
  `ADMIN_API_TOKEN` isn't set — see `talent-platform`'s spec §13.1 for the
  backend half of getting this token onto an environment

## 2. Job Sources admin tab

`apps/console/app/(shell)/admin/_components/admin-job-sources-tab.tsx`, added
as an eighth tab alongside Overview/Costs/Events/Quotas/Pipeline/Prompts/Candidates.

Four panels:

- **Run search** — "Run job search now" starts a crawl (`POST
  /ingestion-runs`, 202 + a pollable run id), polls progress every 2s, and
  disables itself while a run is active. A 409 from the backend (a run already
  in flight) surfaces as an inline error rather than a silent failure, which is
  what makes double-clicking the button harmless.
- **Visibility rules** — the freshness/quality/country policy form, with a
  **live preview** of how many ingested jobs would be visible under the
  *draft* (not yet saved) rules before committing. This exists because
  `max_age_days=7` against a stale crawl can show candidates zero jobs, and the
  preview is what catches that before saving, not after.
- **Tracked companies** — list + add-company form, sourced from the backend's
  adapter registry so a disabled/unverified source (Recruitee) is listed but
  not selectable, with the reason shown.
- **Run history** — status, duration, per-company error counts for past runs.

## 3. Two production bugs found while building on the admin shell

Neither was introduced by the Job Sources work — both were pre-existing in
`admin-content.tsx` and `admin-events-tab.tsx` respectively — but both were
found and fixed in the course of it, since the new tab exercised the same
navigation shell.

### 3.1 Admin tabs stopped switching after a page refresh

**Symptom (reported):** load `/admin?tab=prompts`, refresh the page, then click
a different tab — neither the URL nor the visible panel changes.

**Cause:** `/admin` is a statically prerendered route (`○` in `next build`'s
output), and Next.js keys its client router cache by *pathname*. The tab
switcher called `router.push(`${pathname}?tab=${value}`)` — a query-string-only
change — which the router can treat as "already have this route" and elide
entirely, so `useSearchParams()` never updates. Because `<Tabs>` was controlled
by that value, nothing moved. It only reproduced after a hard load; a soft
navigation *into* `/admin` leaves a live component tree where the update does
propagate, which is why it looked intermittent rather than fully broken.

**Fix:** local `useState` is now the render source of truth (not
`useSearchParams()` directly), synced from the URL via an effect for
back/forward support, with the URL itself updated through
`window.history.pushState` — which Next merges into `usePathname`/
`useSearchParams` but which cannot be elided as a no-op the way `router.push`
was.

**Note for reproducing this class of bug:** it does **not** reproduce under
`next dev`, which renders every request dynamically. A production build is
required: `pnpm --filter @brynzit/console build && pnpm --filter @brynzit/console start -p 3101`.

Commit: `3e3c5f1`. Test: `apps/console/e2e/admin-tabs.spec.ts`.

### 3.2 Clicking the Events tab froze the entire browser tab

**Symptom:** not slow — frozen. Confirmed via Playwright at the CDP level:
`page.mouse.down()` on the tab itself never returned, and
`page.evaluate(() => Date.now())` could not complete for 8+ seconds straight.
Reproduced on both the live deployed console and a fresh local dev server
against the real backend.

**Cause**, confirmed against TanStack Table's own FAQ ("failing to give
`data`... a stable reference [causes] an infinite loop of re-renders"):
`admin-events-tab.tsx` fed `useReactTable` a `data` value built two different
ways, both reallocating a new array on every render:

```ts
const { data: events = [] } = useQuery(...)   // fresh [] every unresolved render
const displayedEvents = taskTypeFilter ? events.filter(...) : events   // fresh array every render, when filtering
```

`useReactTable` treats an unstable `data` reference as "the table changed" on
every render, schedules a re-render to recompute the row model, and loops.
Because that loop reschedules itself via microtasks, it starves the macrotask
queue — nothing that arrives as a macrotask (the in-flight fetch's own
response, CDP input events, even trivial script evaluation) ever gets a turn.
That mechanism is why the *whole tab* froze rather than the panel just
rendering slowly, and why it was, if anything, more reliable with **no**
backend reachable at all (the query then never resolves, so the `[]` fallback
never stops reallocating).

**Fix:** a module-level `EMPTY_EVENTS` array reused as the query fallback, and
the filtered array wrapped in `useMemo` keyed on its real inputs.

**How it was found:** bisected with a real dev server and a disposable stub
component — strip the panel down section by section (drop the table, drop the
filters, drop the query) until the freeze stops, then add pieces back one at a
time until it returns. The table itself, once isolated to a single trivial
column with real row data, was sufficient — nothing about the 9 real
columns, the Selects, or the Input mattered.

Commit: `b337da4`. Regression test:
`apps/console/e2e/admin-tabs.spec.ts` ("Events tab no longer freezes the
page" — asserts the page can still execute JS after the click, not just that a
`data-state` attribute flipped) plus static-assertion coverage in
`apps/console/src/__tests__/admin-events-tab.test.tsx`.

## 4. RBAC: route-level enforcement

The role/capability model (`@brynzit/identity` — `Role`, `Capability`,
`ROLE_CAPABILITIES`, `useCan()`) already existed and was already used to hide
sidebar links. What didn't exist: anything stopping the *destination page*
from rendering if you reached it another way. A recruiter could not see
"Admin Panel" in the nav, but `/admin` worked fine if they typed the URL
directly — capability checks were nav-only, everywhere.

### 4.1 What was added

| File | Role |
|---|---|
| `apps/console/app/(shell)/_components/require-capability.tsx` | Client component: calls `useCan()`, renders children or an "Access restricted" panel naming the missing capability with a link back to `/overview` |
| `apps/console/app/(shell)/_lib/route-capabilities.ts` | The single source of truth: `Record<route, Capability>` + `capabilityForRoute()` (longest-prefix match) |
| `admin/`, `bd/`, `ops/`, `supply/`, `bookmarks/` — one `layout.tsx` each | Wraps the whole subtree in `<RequireCapability>`. Zero changes to the pages themselves. |
| `sidebar-nav.tsx` (modified) | Now calls `capabilityForRoute()` for its own visibility checks instead of hardcoded `if (item.href === '/admin' ...)` conditionals |

The important design point is the last row: the sidebar and the route guards
read the *same* map. That is what makes this fixable-once — before, the
sidebar's hardcoded checks and the (nonexistent) route enforcement were two
independent things that could only be kept in sync by remembering to update
both. Now there is one thing to update.

A client-side gate, not a server redirect, because there is no session yet
(trusted-network console; "acting user" is chosen via the identity switcher in
the top-right and persisted to `localStorage`). When real auth ships, only
`useActingUser`'s source changes — every `<RequireCapability>` call site is
unaffected.

### 4.2 Route capability map (current)

| Route | Capability | Notes |
|---|---|---|
| `/admin` | `admin.view` | Hard block — no partial view for anyone else. |
| `/bd/*` | `internal_ops.view` | |
| `/ops/*` | `internal_ops.view` | Includes `/ops/quality-review` — see §4.3. |
| `/supply/*` | `internal_ops.view` | Includes `/supply/engagements`, which had **no nav link and no gate at all** before this — reachable by anyone via direct URL. |
| `/bookmarks` | `candidate.bookmark` | Every current role holds this capability, so it's a no-op today; kept for consistency and so a future role without it is enforced automatically. |
| everything else (submit, pipeline, overview, dashboard, calendar, messages, cross-list, matchmaker, my-roles, rewards, jobs, clients) | none | Available to every console role. |

### 4.3 One deliberate policy correction, not just an enforcement fix

`ops/quality-review/page.tsx` already had a real, working view-only mode for
anyone with `internal_ops.view`, with approve/reject actions separately gated
in-page behind `submission.approve_gate` (visible in its own UI copy: *"You can
view the internal review queue, but only a Quality Manager or Admin can
approve or reject submissions"*). The sidebar, however, hid the nav link
entirely unless the viewer held `submission.approve_gate` — stricter than what
the page itself actually supported, and almost certainly drift from when the
page was later enhanced to support the view-only tier.

Rather than replicate that stricter nav condition as the new route gate (which
would have made the page's own view-only code permanently unreachable), the
route was gated at the same `internal_ops.view` level as the rest of `/ops/*`,
and the sidebar's extra per-item override was removed in favor of the shared
map. Net effect: an `account_manager` (who has `internal_ops.view` but not
`submission.approve_gate`) can now reach Quality Review read-only — which is
what the page was clearly built to allow.

### 4.4 Verification

`apps/console/e2e/rbac.spec.ts` drives the *real* identity switcher (the same
dropdown a user clicks) and then navigates directly to a URL — simulating
"typed it in the address bar" — for each role:

- **Recruiter**: blocked from `/admin` and every Internal Ops route by direct
  URL; sidebar offers no links to any of them; every ordinary route still
  works.
- **Account Manager**: reaches Internal Ops routes including
  `/ops/quality-review` (read-only, per §4.3); still blocked from `/admin`.
- **Admin**: reaches everything, including `/admin` itself.
- The restricted panel names the missing capability and its "back to Overview"
  link actually navigates.

`apps/console/src/__tests__/route-capabilities.test.ts` covers the pure
mapping logic (`capabilityForRoute` prefix matching, no false positives on
`/opsomething`) and asserts, via real source-text checks, that every gated
route's `layout.tsx` actually calls `RequireCapability` with the documented
capability, and that the sidebar reads the shared map rather than a
reintroduced hardcoded copy — the actual drift-prevention mechanism, checked
mechanically rather than by convention.

## 5. Open tooling issue (unresolved, unrelated to the above)

**New `.tsx` test files containing JSX fail to transform under this app's
Vitest**, with:

```
Error: Failed to parse source for import analysis because the content
contains invalid JS syntax. If you use tsconfig.json, make sure to not set
jsx to preserve.
```

Reproduced with a **content-free 3-line file** (`export function X() { return
<div/> }`) placed in `apps/console/app/(shell)/_components/` — so it is not
about any project code, only about *creating a new `.tsx` file with JSX in
it*. An exact byte-for-byte copy of an *existing*, already-passing `.tsx` test
file, saved under a new filename, works fine — ruling out "new file" as the
trigger and pointing at something narrower not yet identified.

The likely direction: `apps/console/tsconfig.json` extends
`@brynzit/config/tsconfig/nextjs.json`, which sets `"jsx": "preserve"` —
correct and required for Next.js's own SWC pipeline, but the literal thing
Vite's error message says not to have active when *it* owns the JSX
transform. Something in this repo's Vite/Vitest setup (the terminal warnings
mention an oxc-based transform path alongside the classic esbuild one) appears
to read that tsconfig value for some files and not others, in a way not yet
narrowed down further. Clearing every cache (`node_modules/.vite` at both root
and app level, `.turbo`) did not change the result.

**Current workaround**, applied to the two files that needed it
(`route-capabilities.test.ts`, and this feature's coverage generally): write
render-behavior assertions as `.ts` files using `React.createElement` instead
of JSX, or move them into a Playwright spec against a real running app instead
of a Vitest component render. Both are legitimate, not just a workaround for
*this* feature's tests — but the underlying tooling bug will hit the next
person who writes a new component test with plain JSX, and is worth someone
dedicating real time to (ideally with the `next.js` + `vite` + `vitest`
version matrix in hand) rather than re-discovering by bisection each time.
