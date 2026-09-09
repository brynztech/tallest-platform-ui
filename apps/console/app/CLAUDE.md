# Brynz Console UI — Design System Contract

**Read this before writing any UI in `apps/console/app/**`.** It is the
accumulated answer to "why doesn't this look right", written down so the same
corrections don't have to be given twice.

Scope: `apps/console` only. `apps/console/CLAUDE.md` (app facts, RBAC, testing)
and the repo root `CLAUDE.md` still apply on top of this.

**Keep this file current.** Every time a UI correction is made — a spacing
call, a "don't show that", a color rule — add it to the Decisions log at the
bottom in the same pass as the code change. That is the whole point of the
file.

---

## 1. Source of truth

The Brynz Design System (cream/warm product language, reconstructed from the
real product) is the authority. The values that matter are transcribed below so
this file stands alone; the original lives at
`~/Downloads/Brynz Design System/` (`tokens/*.css` for values,
`components/**/*.jsx` for reference implementations, `guidelines/*.html` for
specimens, `templates/*.dc.html` for full-screen references).

Where they disagree, **a reference `.dc.html` screen the user hands over wins
over everything else** — it is what they actually want.

### Hard boundaries

- **Tokens are defined in exactly one place: `apps/console/app/globals.css`.**
  Nowhere else.
- **Never edit `packages/ui/`** — shared with `apps/web`. Style its components
  from the call site via `className` (tailwind-merge resolves conflicts, so a
  call-site class beats the component's default).
- **Never touch `apps/web/`.**

---

## 2. Palette

Warm cream, not grey. Every value below is already mapped onto a token in
`globals.css` unless marked "literal".

| Role | Hex | Token |
|---|---|---|
| Page background | `#FCFAF7` | `--color-background` |
| Card / raised surface | `#FEFEFC` | `--color-card`, `--color-popover` |
| Sunken tray / hover fill | `#F8F7F3` | `--color-muted` |
| Warm-grey fill (nav active, chips, counts) | `#F2F0EA` | `--color-secondary` |
| Text | `#16120C` | `--color-foreground` |
| Muted text | `#6B6965` | `--color-muted-foreground`, `--color-secondary-foreground` |
| Body copy on a tinted fill (skill chips, callout body) | `#3A3B3B` | literal `text-[#3A3B3B]` |
| Placeholder / eyebrow text | `#908E8B` | literal `text-[#908E8B]` |
| **Structural hairline** (header, sidebar, dividers, kanban tray) | `#ECEAE4` | literal `border-[#ECEAE4]` |
| **Component border** (cards, inputs, pills) | `#E4E3DF` | `--color-border` |
| Primary / CTA fill | `#0C0B09` | `--color-primary` |
| Focus ring | `#8BB0E6` | `--color-ring` |
| Azure (AI / selection only) | `#1550CC` | literal |

Two hairline weights is deliberate: **`#ECEAE4` for chrome that divides,
`#E4E3DF` for edges that contain.** Getting these backwards makes the UI feel
heavy.

### Status hues — color means state, never decoration

| State | Text | Fill | Border |
|---|---|---|---|
| Success / approved | `#317A4F` | `#EFF4EF` | `#D3E2D7` |
| Error / rejected | `#BA4642` | `#FAF0EE` | `#F0D9D6` |
| Warning / hold | `#905300` | `#F4E8DA` | `#E8CEAE` |
| Info / paused | `#386CA0` | `#EFF3F4` | `#D4DFE9` |
| Neutral | `#6B6965` | `#F2F0EA` | `#E4E3DF` |

Do not invent a sixth hue for a meaning one of these already covers.

---

## 3. Non-negotiable rules

1. **Near-black `#0C0B09` is the CTA, and only the CTA.** One per card, one per
   screen region. It is not a "make this look important" fill.
2. **Azure is reserved** for AI, selection, and focus rings. **Active nav is a
   warm-grey fill (`bg-secondary`), never azure or primary-tinted.**
3. **No gradients** except two sanctioned washes:
   - page: `.brynz-page-wash` (cream → `#E9F0FA`, defined in `globals.css`)
   - kanban column tray: `linear-gradient(180deg,#F6F3F4 0%,#E9F0FA 100%)`
4. **Shadows are near-invisible** — `0 1px 2px rgba(22,18,12,.04)`. The border
   does the work. Never a colored or tinted shadow. Tailwind's `shadow-sm` is
   already too heavy for a card; override it.
5. **No transparency, no backdrop-blur, no glass.** If you see `bg-white/85` or
   `backdrop-blur`, it predates this system.
6. **Radii:** 999px pills · 12px cards/panels (`rounded-xl`) · 10px trays and
   icon tiles (`rounded-[10px]`) · 8px buttons/inputs/nav pills (`rounded-lg`)
   · 16px modals (`rounded-2xl`).
7. **Type scale:** 20/600 page title · 16/600 section + column title · 15/600
   card title · 14/400 body · 13/400 helper · 12/400 meta · 11/500 uppercase
   eyebrow at `tracking-[0.09em]`. Three weights only: 400/500/600.
8. **Motion:** 130ms hover, 180ms selection, `cubic-bezier(.2,0,.2,1)`. No
   bounce, no spring, no scale-on-press.

---

## 4. Component conventions

Use the shared `@brynzit/ui` components — they read the tokens above.

| Need | Use | Notes |
|---|---|---|
| Card surface | `<Card>` | Add `gap-0 py-0` when supplying your own internal padding |
| Primary action | `<Button>` (default) | Near-black. One per card. |
| Secondary action | `<Button variant="outline">` | Bordered, card fill |
| Tertiary / in-card action | `<Button variant="ghost">` | e.g. Remove, Review Shortlist |
| Icon-only action | `<Button variant="ghost" size="icon-sm">` | Borderless at rest, tinted on hover |
| Count / neutral chip | `<Badge variant="secondary">` | Muted text on warm grey |
| Status | hand-rolled pill + `statusToneClass()` | see below |
| Candidate profile | `<CandidateProfileSheet>` | The **only** candidate view. Open it from every screen; never build a second one. |

**`Popover`, `Dialog`, and `Select` must stay the real components** — they carry
portals, focus trap, escape-to-close, outside-click, keyboard nav. Style them
via `className` only; never hand-roll a replacement.

### Status pills

Tone mapping lives in `app/(shell)/_lib/status-tone.ts`, keyed to the
real backend vocabulary (`approved`, `rejected`, `hold`, `removed`,
`shortlisted`, `interested`, `not_interested`, `snoozed`). Reuse it; extend it
rather than writing a second mapping.

```tsx
<span className={cn(
  'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px]',
  'text-[11px] leading-none font-medium whitespace-nowrap',
  statusToneClass(status),
)}>
  <span className="size-[5px] rounded-full bg-current" />
  {status}
</span>
```

A 5–6px `bg-current` dot is the product's status glyph. **Status pills never
contain an icon.**

Match scores use `matchScoreToneClass()` (green ≥75, amber ≥50, red below) —
the same thresholds as `my-roles/[id]/_lib/status.ts`. Always bind the real
value; render `not scored` when null.

### Standard card anatomy

Settled on for the pipeline board; reuse it for any entity card.

```tsx
<Card className="gap-0 overflow-hidden py-0 shadow-[0_1px_2px_rgba(22,18,12,0.04)]">
  <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
    <div className="flex items-start justify-between gap-2">   {/* name + status pill */}
    <p className="text-[13px] text-muted-foreground">…</p>      {/* full-width, NOT nested in the row above */}
    <div className="flex flex-wrap items-center gap-x-1.5 …">   {/* 12px meta */}
  </div>
  <div className="… border-t border-dashed border-border px-4 pt-3 pb-4">
    {/* primary action full-width, then a ghost action row */}
  </div>
</Card>
```

The dashed divider above the action footer is the one dashed rule in the system.

---

## 5. Information rules

The corrections that keep recurring. **Less is the house style.**

1. **Never repeat context the page already establishes.** If the board is
   scoped to one requisition by a picker, the role and client are identical on
   every card — cut them. Same for a column's own name.
2. **Column/section headers are title + count.** No description line under a
   stage name; `stageKindLabel(kind)` under a stage title is almost always a
   restatement of the title.
3. **No dead controls.** Don't add a checkbox or filter icon because the design
   reference shows one — if nothing in this app is wired to it, leave it out.
4. **Empty states are one bare line** — "No candidates" — at 16px in
   `#908E8B`. No illustration, no CTA, no restating the column name.
5. **Helper text earns its place or goes.** One muted line under a page title
   is the maximum.

### Narrow columns (232px kanban)

Available card content width is ~178px. Consequences:
- Names **wrap**, they don't truncate — never hide a person's name.
- Button labels **truncate** (`min-w-0` + inner `<span className="truncate">`).
- A CTA label like "Advance to {stage}" needs `text-[11px] gap-1 px-2` to fit.
- Keep a value and its dot in one inline-flex so they never split across lines.

---

## 6. Tailwind v4 gotchas

1. **A bare `border` class has no color.** v4's preflight sets
   `border-color: inherit`, which bottoms out at `currentColor` — so
   `Card`, `DialogContent`, `PopoverContent`, `SelectContent`, and `Button`'s
   outline variant (all of which use a bare `border` in `packages/ui`) render a
   **near-black** border. `globals.css` restores the v3 behaviour:
   ```css
   @layer base { * { border-color: var(--color-border); } }
   ```
   Don't remove that block. If a border ever looks black, this is why.
2. **`--radius` is vestigial.** No `--radius-*` scale is wired into the theme,
   so `rounded-md/lg/xl` use Tailwind's built-in 6/8/12px. For DS radii that
   aren't on that scale (10px trays) use an arbitrary value.
3. **`cn()` is clsx + tailwind-merge**, so a call-site class reliably overrides
   a `packages/ui` default. That's the sanctioned way to fix a shared component
   without editing it.
4. Light theme only. `app/layout.tsx` forces it; never add `dark:` variants.

---

## 7. Verifying UI without a login

The `(shell)` routes need a staff session. To check layout without one, render
the real markup against the app's real compiled CSS:

```bash
curl -s http://localhost:3000/<any-route> \
  | grep -oE '/_next/static/chunks/%5Broot-of-the-server%5D__[a-zA-Z0-9_.]+\.css'
# download that chunk next to a static .html harness, paste in the component's
# markup at its true width, screenshot with Playwright
```

Always include a stress case (longest realistic name, longest stage label) —
overflow bugs only show up there.

---

## 8. Migration status

`globals.css` tokens are app-wide, so **every** console screen already renders
on the Brynz palette — but only some have had their classes reworked for it.

Per-screen status (what's done, what's left, known partials) lives in
**`docs/console-design-system-migration.md`** — update it in the same pass as
the code, same rule as the Decisions log below. Don't re-estimate counts here;
that's exactly what went stale before this file existed.

Migrate opportunistically: when you touch one of these screens, bring it onto
the system rather than matching its legacy look.

---

## 9. Decisions log

### 2026-09-09 — Ops Interviews list: DS pass + resolved candidate/requisition names
Dropped the banned `backdrop-blur` sticky header and the `text-primary` link.
Bigger issue than styling: rows rendered a raw candidate UUID and a bare
"View Requisition →" link with no title — `InterviewResponse` carries only
ids, no names. Resolved client-side rather than touching the backend: one
`GET /api/v1/ops/requisitions` call builds an id→title map, and a `useQueries`
fan-out over `GET /api/v1/supply/candidates/{id}` (already a real endpoint,
just under-batched — fine at this list's size) resolves candidate names. Row
layout and the `InterviewStatusBadge` tone logic now match the sibling
implementation already living in
`ops/requisitions/[id]/_components/interviews-section.tsx`, not reinvented.

### 2026-09-09 — Client creator tracking + agreed fee (real backend feature, not a restyle)
Resolved the D1 from the previous entry — not by building the "Ops owner"
select or "Replacement window" from the reference, but by clarifying what was
actually needed: only account_manager/admin can create a client
(`client.manage`), so record *who did*, not an editable, freely-reassignable
"owner." Replacement window: skipped, not asked for once the audit-field need
was named.

- **Backend** (`talent-platform` repo): migration `f3a91c7d2b4e` adds
  `ops_clients.created_by` (FK → `staff_users.id`, `ON DELETE SET NULL`) and
  `agreed_fee_pct` (`NUMERIC(5,2)`, optional). `OpsClient.creator` is a
  `lazy="joined"` relationship + a `created_by_username` property, so
  `ClientResponse` carries the username with **one query, no N+1** — every
  existing `select(OpsClient)` call in `ops/services/clients.py` picked up the
  join automatically. The two write paths (`create_client`, `patch_client`)
  explicitly re-select with `joinedload(OpsClient.creator)` after commit
  instead of touching the just-committed in-memory object or relying on
  `session.refresh()` — async SQLAlchemy raises `MissingGreenlet` on a lazy
  relationship load outside an awaited query, so the re-select isn't
  optional. `created_by` is on `CreateClientRequest` but deliberately **not**
  on `PatchClientRequest` — it's an audit field, not an editable assignment.
  Tests: `tests/ops/test_clients.py::test_client_created_by_and_agreed_fee`
  covers create/get/patch/list all resolving the username correctly.
- **Frontend**: `client.manage` (already defined in `@brynzit/identity`,
  mapped to account_manager + admin, but never actually wired to a `useCan()`
  check anywhere) now gates the "New client" button and the detail page's
  "Edit" button — this was a real, pre-existing gap: any authenticated role
  could create/edit clients before this pass. `created_by` is stamped from
  `useActingUser().id` on create, never user-selectable. "Agreed fee (% of
  CTC)" is an optional number input on both the create and edit dialogs.
- **Regenerated `@brynzit/api-client` types twice** — once after the model/
  schema change, again after adding `created_by_username`. Whenever a backend
  schema field changes, `bash packages/api-client/scripts/generate-live.sh`
  (backend must be running) before touching the frontend, or the two drift
  and TS won't catch it until someone runs `tsc`.
- Rippled into `packages/mocks/src/handlers/ops.ts` (4 client-shaped mock
  responses) and one test fixture in `recruiter-portal.test.tsx` — both
  needed the 3 new required fields to keep satisfying `ClientResponse`.

### 2026-09-09 — Ops Clients rebuilt again, to a user-supplied reference (supersedes the earlier fresh-base)
The Clients screens were fresh-based onto the DS pattern earlier this session
(see below), then handed a real Figma-style reference asking for a richer
version — this entry documents the second pass, which replaced that one.

- **Every stat is computed client-side from data that already exists** — no
  new backend endpoint. List: per-client rollups (open reqs, shortlist,
  submitted) are summed by grouping `fetchRequisitionsForClients()` (already
  used by the dashboard) against the bulk `pipeline-stats` map (already used
  by the Requisitions list) — the same two data sources, just joined a
  different way for a third screen. Detail: same bulk stats map, plus
  `fetchOpsInterviews('all')` filtered to the client's requisition ids and
  `status === 'scheduled'` for "in interview" (matching the dashboard's own
  definition of that term).
- **Per-requisition "owner {recruiter}"** reuses
  `fetchRequisitionAssignees()` (the same call `AssignedRecruitersCard`
  makes) — one small query per requisition via `useQueries`, fine at the
  handful of requisitions one client has. First assignee only; there's no
  concept of a single "primary" recruiter beyond that today.
- **Real bug caught in verification**: the detail page's "N open
  requisitions" stat used `status === 'open'` while every per-row status pill
  uses `isLiveRequisitionStatus()` (`open` OR `matching_complete`) — a
  `matching_complete` requisition showed an "Open" pill on its row while not
  counting toward the header total. Fixed by using the same helper in both
  places; this class of bug (two places computing "is this open" differently)
  is exactly why `requisition-status.ts`'s helpers exist — always route
  through them, never re-check `.status === 'open'` inline.
- **D1, not resolved**: three fields in the reference — Ops owner, Agreed
  fee, Replacement window — aren't in the `Client` model
  (`ops/models/client.py`: id, name, primary_contact_name,
  primary_contact_email, status, created_at only). That's a migration +
  model + schema + service change, not a restyle — left out rather than
  faked, pending a decision on whether to build the backend support.

### 2026-09-09 — "JD missing" pill: Warning hue → Neutral hue
Same hex fill (`#F4E8DA`) as the JD panel's icon tile all along, but the
amber-brown text/border (`#905300`/`#E8CEAE`, the Warning status hue) read as
"brown," not "cream," once actual text sat on it. Missing a JD isn't an
urgent/attention state, so it wasn't the right hue to begin with — switched to
the plain Neutral treatment (`border-border bg-secondary text-muted-foreground`),
the same one the `Mediated`/`Direct` and stage-kind pills already use, rather
than inventing a bespoke in-between color.

### 2026-09-09 — Ops Clients rebuilt; Dashboard's stat tiles de-duplicated; per-row flags footer cut
- **Ops Clients (list + detail) on the DS.** List: dropped the banned glass
  toolbar, fresh-based rows to the same card pattern as Ops Requisitions.
  Detail: was a one-off fixed two-pane split (`h-[calc(100vh-3.5rem)]`, 420px
  rail + notes); rebuilt to the same breadcrumb → header → stacked-cards shape
  as every other detail screen (My Roles, Ops Requisitions) — no reason for
  this screen alone to carry its own layout primitive. `text-primary` links
  (mailto, Create Requisition, View all) replaced with the DS treatment.
- **Dashboard's stat tiles were a second, hand-rolled component.**
  `recruiter-dashboard.tsx` had its own local `MetricCard` — icon tile +
  label + big number + a full sentence of description — doing the same job as
  `PipelineStatTile`/`PipelineStatTileRow` (already used on Ops Requisitions'
  list). Deleted `MetricCard`, switched the dashboard to the shared component.
  Check `pipeline-stat-tile.tsx` before building a new stat-tile anywhere —
  this was the second time it got reinvented.
- **Per-row green/red-flags + "JD generated"/"No JD yet" footer strip on the
  Ops Requisitions list is gone.** JD status is already a badge on the row
  (`JD missing`); repeating it in the footer was exactly the §5.1 violation
  ("never repeat context the page already establishes"). Flag counts weren't
  used anywhere else either — cut outright rather than kept half-visible.

### 2026-09-09 — Sidebar had the same transparent-background wash bleed
Same bug as `<main>` below, same fix, second spot: `SidebarNav`'s root `<nav>`
also had no background of its own, so `.brynz-page-wash`'s blue tail bled
through the sidebar's lower half too. Added `bg-background`. Check any other
direct child of the shell's `flex min-h-0 flex-1` row before assuming this is
fully closed out — `<main>` and the sidebar were the two that existed; a new
sibling added later needs the same treatment.

### 2026-09-09 — `<main>` needed its own opaque background
The shell's `.brynz-page-wash` (cream → `#E9F0FA` blue, top to bottom) lives
on the outer `h-dvh` shell container in `(shell)/layout.tsx`, but `<main>` —
the element that actually scrolls each route's content — had no background of
its own. Since the wash is pinned to the viewport and `main` scrolls
independently over it, any gap between cards that landed in the lower portion
of the viewport showed the blue tail bleeding through, on every content
screen, at whatever scroll position (not just below all content). Content-
dense screens with a card gap near the bottom of the viewport (Ops Requisition
detail was the one that surfaced it) showed it most.
- **Fix: `bg-background` on `<main>`** — one line, shell-wide. Every route
  now sits on flat cream; the wash is only visible where `.brynz-page-wash`
  is applied directly (sign-in, and any true empty space below a short page's
  content, which was the original intent).
- Confirmed sign-in's wash is unaffected (it's its own
  `brynz-page-wash` div outside the shell, untouched).

### 2026-09-09 — Shared React Query cache key, two incompatible shapes: crash
**Two components querying the same key must return the same shape** — React
Query caches by key regardless of which component asked, so whichever query
resolves last silently overwrites the other's cache entry. `page.tsx` and
`ShortlistTable` both used `['supply-shortlist', reqId]` for the raw
`submissions` array; `CandidateProfileSheet` used the *exact same key* for the
full `{ submissions }` response object. Opening the sheet (click a candidate
name) fired its query, which won the race and replaced the array in the
shared cache with the wrapper object — `shortlistEntries.filter is not a
function`, page-crashing error boundary.
- Fixed at the source of the collision: gave `CandidateProfileSheet`'s query
  its own key (`['supply-shortlist', requisitionId, 'full']`) instead of
  reshaping every array-consumer to match it — fewer call sites touched, and
  the two things really are different data (array vs. wrapper), not a
  convention drift to reconcile.
  Still covered by the existing `['supply-shortlist']` /
  `['supply-shortlist', reqId]` invalidations elsewhere (prefix match).
- This sheet is used from `my-roles`, `supply/search`, `pipeline`, and
  `cross-list` too — none of those screens happened to have another
  `['supply-shortlist', reqId]`-array consumer mounted at the same time, which
  is why this stayed latent until the Ops requisition detail rebuild made it
  reachable.

### 2026-09-08 — Ops Requisition detail: no candidate-matching controls at all
Follow-up correction on the same screen, same session: matching a candidate to
a role is the recruiter's job, not the AM/admin's. Ops requisition detail
(`ops/requisitions/[id]`) is admin/AM-only — recruiters never land on this
route, they use `my-roles`.

- Removed "Re-run Candidate Match" from the header (and its mutation/imports)
  — was letting an admin trigger matching directly.
- Removed the **AI Matchmaker** panel entirely, deleted
  `matchmaker-panel.tsx` (zero remaining importers) rather than leaving it
  disabled/hidden — same "delete confirmed-dead code" discipline as
  `candidate-detail-panel.tsx` above.
- `my-roles/[id]` (the recruiter's own screen) keeps its own "Run Match"
  button — untouched, out of scope, that's the recruiter's screen.
- The Shortlist section (`ShortlistTable`, unaffected) is still how an
  admin/AM reviews and approves/removes what the recruiter already submitted
  — that's "viewing the recruiter's submissions," not running the match
  themselves.

### 2026-09-08 — Ops Requisition detail screen rebuilt from a Figma reference
Reference: user-supplied screenshots of the target layout (breadcrumb → header
+ stats → Details → Job description → Assigned recruiters → Hiring process →
AI matchmaker → Shortlist → Interviews/Placements two-column footer).

- **Nothing here is new data — it was already recorded, just not displayed.**
  `intake_details.quick_facts` (written by `jd_generator.py::_matching_intake`)
  already carried `equity`/`location`/`work_type`/`experience`; the Details
  card just never read it. Added `intakeQuickFacts()` next to the existing
  `intakeGreenFlags`/`intakeRedFlags` in `_lib/requisition-intake.ts` — same
  pattern, don't start a second one.
- **Per-stage candidate counts on the Hiring Process panel are real**, not
  decorative — `countSubmissionsByStage()` (`_lib/hiring-process.ts`) buckets
  `approved` submissions by `current_stage_id`, same two fields the `/pipeline`
  kanban's `groupSubmissionsByPipelineStage` already uses. Written as a small
  local function instead of importing that one — it lives in a different
  route's `_lib` and takes a different submission type; duplicating five lines
  beat a cross-route type-compat cast.
- **Header stats (shortlist/submitted/awaiting/flags) are computed client-side
  from the page's own `shortlistEntries`**, not a second fetch — the detail
  page already holds the full submission list; the bulk
  `pipeline-stats` endpoint (see `docs/requisitions-pipeline-stats.md`) is for
  the *list* screens that don't otherwise fetch each requisition's
  submissions.
- **`AssignedRecruitersCard` now shows "N roles" per recruiter**
  (`fetchAssignedRequisitionIds(userId).length`) — reused, not built new. It's
  shared with My Roles detail, so that screen picked up the same count for
  free.
- **`CandidateShortlistCard`'s rationale text now always renders** above the
  judgment bar, not only when there's no full `evidence` — the reference shows
  it every time. Shared with My Roles' shortlist card; that screen doesn't
  pass `fallbackNote` today, so it's a no-op there, not a regression.
- **Skipped, flagged for a product call rather than guessed at:**
  - AI Matchmaker's "Add to shortlist" / "Dismiss" buttons in the reference —
    every candidate the panel lists is already a real `Submission` (same
    endpoint as the shortlist table below), so "add to shortlist" has no
    target to act on today, and the component's own comment documents a
    deliberate decision ("the AI never advances a candidate on its own").
    Restyled the panel, kept it read-only (click → view profile). Building
    real add/dismiss needs a decision on what "not yet shortlisted" means
    first.
  - Interview log form's "Stage" dropdown — `CreateInterviewRequest` has no
    `stage` field server-side. Didn't fake it client-side (§5.3, no dead
    controls).
  - "Match last run 2d ago" — no last-match-run timestamp exists anywhere
    (`matching.py` writes no such field). Left off rather than approximating
    from `updated_at`, which changes on unrelated edits too.
- Deleted `candidate-detail-panel.tsx` (confirmed dead code, see tracker).
- `F1`: `AssignedRecruitersCard`'s username lookup falls back to the raw UUID
  for at least one real recruiter — `listAssignableRecruiters` doesn't include
  them. Pre-existing, unrelated to this pass; not fixed.

### 2026-09-08 — Dialog with variable-height tabs: anchor top, don't center
- **A `Dialog` whose content height changes (tab switch, step change) must not
  use the default vertical centering** — `packages/ui`'s `DialogContent` is
  `top-[50%] ... translate-y-[-50%]`, so a height change recenters the box and
  the top edge visibly moves.
- Fixed the New Requisition wizard the sanctioned way (§6.3): call-site
  className override, `top-[8vh] translate-y-0`, `packages/ui` untouched.
  Reach for this on any other multi-step/multi-tab dialog that grows or
  shrinks (create-requisition-wizard's `form`/`preview`/`assign`/`done` steps
  already share this `DialogContent`, so they're covered).
- Also fixed the same pass: `hasGeneratedJd()` (`_lib/requisition-intake.ts`)
  required `intake_details.generated_jd` to be a `string` — the backend
  (`ops/services/jd_generator.py::_matching_intake`) has only ever stored it
  as an object. Every requisition with a real generated JD was showing "JD
  missing". Now a plain truthy check.

### 2026-09-08 — Per-screen migration tracker replaces the §8 estimate
- `docs/console-design-system-migration.md` is now the source of truth for
  which screens are on the DS and which aren't. §8 used to carry its own
  rough counts ("~40 files", "~12 files", "5 files") — a fresh grep found
  28/4/16, already drifted, because nothing forced them to stay in sync with
  reality. A checklist that's updated in the same pass as the code (same
  discipline as this log) doesn't have that problem.
- Ops Requisitions list, My Roles list, the shared shortlist candidate card,
  and the New Requisition dialog's form step landed on the DS this pass —
  see the tracker for exactly what's still partial vs. untouched.

### 2026-09-07 — `SheetContent` renders its own X: pass `showCloseButton={false}`
- **A `Sheet` with a hand-rolled close button in its header gets two stacked
  X's.** `packages/ui`'s `SheetContent` renders a Radix `SheetClose` at
  `top-4 right-4` by default — exactly where a custom one goes.
- It already takes **`showCloseButton={false}`**, so this needs no
  `packages/ui` edit. Pass it whenever the header owns the close control.
  Same shape as the `cn()` rule in §6.3: reach for the component's own escape
  hatch before anything cleverer.
- Fixed in `candidate-profile-sheet`, `ops/.../candidate-detail-panel`, and
  `supply/engagements/.../engagement-sequence-sheet`. Left alone:
  `placement-panel` (its close is a full-width text button at the bottom, so
  the corner X is the only one) and the two BD sheets (no custom close).

### 2026-09-07 — Candidate panel: icon rail, and one panel for every screen
Reference: `Candidate Detail.dc.html` (the wide variant, with the rail).

- **Panel width is `w-[56vw] min-w-[680px] max-w-[94vw]`**, not a fixed 640px.
  A little over half the viewport: it scales with the monitor, the `min-w`
  keeps it usable on a laptop, and the `max-w` always leaves the screen behind
  it visible so you know what you came from.
- **The panel now has a vertical icon rail** — Profile · Application · Resume ·
  History — instead of one long scroll. Sections a recruiter reaches for
  separately should not make them scroll past each other.
- **What lives where**, decided by which question it answers:
  - `Profile` — who they are: summary meta, skills, experience.
  - `Application` — why they're here *for this role*: sourcing fit + status
    pill, then skill evidence (`MatchEvidenceSections`).
  - `Resume` — the file.
  - `History` — `CandidateRelationshipSection` (guard, facts, submissions,
    timeline).
- **The header, action bar and contact band stay fixed above the rail.** You
  need the name, the fit score and the email address whichever section is open,
  so they are not switchable. Contact went back to the reference's bordered
  band with the rose mail `IconTile` (yesterday's entry had made it a plain
  section — that was the *drawer* variant, and the rail changes the layout).
- **Rail selection is azure** (`bg-[#F0F6FF]` tile, `border-[#C0DBFE]`,
  `text-[#1550CC]`) with the label going ink + semibold; unselected items are
  a bare muted icon with no tile. Consistent with §3.2 — azure means selection.
- **Experience now renders real work history.** `match_rationale.career`
  (parsed by `parseMatchEvidence`) carries roles with durations and
  company-store stats; the panel lists them with the monogram tile and falls
  back to the single current role when there is no submission. To stop the same
  roles appearing twice, `MatchEvidenceSections` gained `hideCareer` and the
  Application section passes it.
- Section content resets to `Profile` whenever `candidateId` changes — a stale
  tab from the previous candidate is a confusing way to open a panel.
- Added the candidate record status (`sourced`, …) as a second header pill. It
  is a different axis from availability, so it is a separate pill, not merged.
- Empty sections are one bare line at 16px `#908E8B` (§5.4): "Open this
  candidate from a role to see their application." / "No resume on file."
- Still not built, still no data: the Switch stat, the credits line, and an
  editable Notes block (the relationship endpoint is read-only — there is no
  write route for `recruiter_notes`).

### 2026-09-07 — One candidate panel, reachable from the pipeline board
- **`CandidateProfileSheet` is the console's only candidate profile view.** It
  was already shared by supply search, my-roles, ops requisitions, matchmaker
  and cross-list; the pipeline board was the one screen without it. Clicking a
  candidate's name on a board card now opens the same panel. Do not build a
  second profile view — extend this one.
- The board's two cards (`PipelineCandidateCard`, and the read-only
  `CandidatePipelineCard` in `pipeline/page.tsx`) had a byte-identical identity
  block. It is now **`PipelineCardHead`**, which also owns the name button.
  Only the action footer differs between the two cards.
- **One sheet instance per screen, state at the page.** The board holds
  `openProfile: PipelineSubmission | null` and renders one
  `<CandidateProfileSheet>`; cards get an `onOpenProfile` callback. A sheet per
  card would mean one Radix portal per row.
- `source` gained a **`pipeline`** value. It only picks the action bar:
  `search` → Generate engagement, `shortlist` → approve/hold/pass,
  `pipeline` → neither, because the board card already carries
  advance/notes/remove and two controls for one action is worse than none.
  Bookmark and Enrich show everywhere.

### 2026-09-07 — Candidate panel resectioned to `Candidate Profile.dc.html`
Reference: `~/Downloads/Pipeline screen redesign/` (`Candidate Profile.dc.html`
is the 520px drawer, `Candidate Detail.dc.html` the wide two-column variant).
The drawer is what this sheet is, so it wins.

- **Section order is now Summary → Skills → Skill evidence → Experience →
  Contact → Resume → Relationship.** Contact used to sit first, as a bordered
  card with a rose mail `IconTile` (the wide-variant treatment) — the drawer
  reference has no such card and puts contact *below* the profile substance,
  which is the right read: you look at fit before you look at how to reach them.
- **A section is an eyebrow plus its content, separated by 24px and nothing
  else.** No card, no divider, no icon tile per section. The panel had drifted
  into a card-inside-a-panel look; that reads as nesting where there is none.
- **Summary meta bar** (11px eyebrow + one 13px icon/label row): location ·
  N yrs experience · `Sourced via {source}`. It exists so the header subline can
  shrink back to one role line — `title at company · location · N yrs` was
  wrapping to two lines at 640px.
- **Skill chips gained a border** (`border-border bg-secondary text-[#3A3B3B]`,
  13px, `px-2.5 py-1.5`). Borderless 12px chips read as a wall of grey at 34
  skills. Matched chips keep the azure treatment.
- **Experience is a structured row**, not a bare line: 40px company monogram
  tile (`rounded-[10px]`, bordered, `bg-secondary`) + title 15/600 + company
  14/400 `#3A3B3B` + seniority 12/400 muted, closed by an `#ECEAE4` hairline.
  The backend stores only the *current* role, so it is always one row.
- Seniority appears in Experience **only** — it was in the summary bar too, and
  "Senior" twice in one screen is exactly §5.1.
- **GitHub folded into Contact.** A GitHub URL is a profile link like LinkedIn;
  it does not need a section. Repo count and top languages became a muted
  trailing meta on that row.
- Resume filename and its "(file not stored)" qualifier are now two lines —
  inline, the qualifier wrapped mid-parenthetical.
- Deliberately not adopted from the reference: the credits line ("costs 1
  credit / 8 remain") and the Switch stat — no such data exists (see the
  2026-09-06 entry).

### 2026-09-06 — Candidate profile panel + supply search list
- Panel rebuilt: avatar + name + availability pill, one `title at company ·
  location · N yrs` summary line, fit score stat, action bar, then sectioned
  body (contact card with a rose mail `IconTile`, skills, evidence, experience,
  GitHub, resume, relationship).
- **Fit score and skill evidence are shortlist-only, by data.** They live on the
  *submission* (`match_score` / `match_rationale`), not the candidate;
  `/supply/candidates/search` returns no score at all. The panel self-fetches
  `GET /supply/shortlists/{requisition_id}` when it has a `requisitionId` +
  `submissionId` and renders those sections only then — never a placeholder
  number on a hiring screen.
- Matched skills highlight azure (`#1E4ED8` on `#F0F6FF`) — azure means
  "matched by the system", consistent with §3.2. Unmatched stay warm grey.
- Search rows: rank chip + name + `verified` + availability, title, location +
  3 skills + "+N more". **Selection is the 3px azure left bar**, not a ring.
- Dropped the GitHub repo count from the list row — it's one tap away in the
  panel and the row is denser without it.
- Not built, no data: switch likelihood, the credits line, candidate-level
  notes (only per-submission notes exist), and the Application/Resume tab rail
  (2 of its 4 tabs would hold a single line each — see §5.3).
- `Generate engagement` was already a no-op button before this pass; left as-is
  rather than silently wiring `/engagement/generate`.

### 2026-09-06 — Status tones promoted to a shared module
- `pipeline/_lib/status-tone.ts` → **`(shell)/_lib/status-tone.ts`**, now the
  one place status colour is decided console-wide. Added `availabilityToneClass`
  (available/open_to_offers/not_looking) and `humanizeStatus`, and `INFO_TONE`
  for `in_process`. Extend this file; do not start a second mapping.

### 2026-09-06 — Sidebar section labels
- **Every sidebar group gets an uppercase eyebrow** (`SidebarSectionLabel`),
  not just some: Candidate Stages · My Work · Internal Ops. A group sitting
  between two dividers with no label reads as orphaned.
  (The first group is the exception — it leads with the Submit Candidate CTA.)
- Eyebrow spec: 11px/500, `tracking-[0.09em]`, uppercase, `#908E8B` — one step
  lighter than muted body text.
- Known deviation, not yet fixed: the DS voice is sentence case everywhere
  ("My roles"), while this app's nav labels are Title Case ("My Roles"). The
  labels come from `_lib/recruiter-portal.ts`; changing them is a copy change,
  so it needs an explicit call.

### 2026-09-06 — Top-right cluster (bell · user chip · sign-out)
- **Only the user chip carries a border.** Bell and sign-out are borderless
  ghost icon buttons (`variant="ghost" size="icon-sm"`, 32px, muted icon,
  tinted fill on hover). Boxing every icon makes the bar read as a toolbar.
- User chip: 999px pill, `border-border`, no fill, `py-1 pr-2.5 pl-1`, 8px gap,
  28px avatar (`#E5E3DC` tint, 11px initial), name 13/500 ink over role 11/400
  muted. Two-line identity stack, not a single line.
- Dropped legacy `bg-white` + `shadow-sm shadow-slate-200/60` from all three —
  white isn't the card cream, and a slate-tinted shadow is banned (§3.4).
- `SignOutButton` is shared with `app/admin/users/page.tsx`, so that bar picks
  up the ghost treatment too — intended.

### 2026-09-06 — Pipeline board brought onto the Brynz DS
- Cards: role + client removed (fixed by the requisition picker, identical on
  every card → noise). Card now shows name + status, candidate's own title,
  match score.
- Column headers reduced to title + count; the `stageKindLabel` sub-line was
  restating the title ("Client Screen / Client Screen").
- Card subtitle moved out of the name/pill flex row — nested, it was squeezed
  to ~90px and wrapped four times.
- Advance CTA is full-width primary with a trailing chevron; sized to fit 232px
  and truncating past that.
- "Remove" trigger is **ghost, not red** — danger red is reserved for the
  actual destructive confirm inside the dialog.
- Notes trigger is a ghost icon button (borderless at rest), adjacent to
  Remove, not pushed to the far edge.
- Status pills recolored by real backend status via `status-tone.ts`.
- Active/Rejected became a segmented control (bordered pill, selected inverts
  to near-black).
- Skipped deliberately: the DS `KanbanColumn`'s checkbox and filter icon —
  nothing in this app is wired to them.

### 2026-09-06 — Token layer
- Full cream palette mapped in `globals.css`; `--color-secondary-foreground`
  set to muted `#6B6965` (was near-black, which made count badges shout).
- Added the `* { border-color: var(--color-border) }` base rule (see §6.1).
- Page wash extracted to `.brynz-page-wash` and shared by the shell and
  sign-in screen.
- Dropped the invented "B" logo tile from the top nav — the product has no
  mark; the name is set in Geist Semibold instead.
