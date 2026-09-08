# Console design system migration tracker

Per-screen checklist for bringing `apps/console` fully onto the Brynz DS
(`apps/console/app/CLAUDE.md`). This replaces the rough bullet-count estimate
that used to live in that file's §8 ("~40 files", "~12 files", "5 files") —
those had already drifted from reality (a fresh grep found 28/4/16, not
40/12/5) before this file existed, because nothing forced them to be kept in
sync. This file is the current source of truth for status; §8 now just
points here.

**Update this file in the same pass as the code**, same rule as the
Decisions log in `app/CLAUDE.md` — a status list nobody updates is worse than
no status list.

Legend: ✅ done · 🔶 partial (has a specific known leftover) · ⬜ not started

## Shell chrome

| Area | File(s) | Status |
|---|---|---|
| Layout, top nav, sidebar nav | `(shell)/layout.tsx`, `_components/top-nav.tsx`, `_components/sidebar-nav.tsx` | ✅ |
| Sign-in | `staff-sign-in-form` | ✅ |
| Overview / Dashboard | `_components/recruiter-dashboard.tsx` | ✅ |
| Notification bell | `_components/notification-bell.tsx` | ⬜ |

## Recruiting pipeline

| Area | File(s) | Status |
|---|---|---|
| Pipeline board (kanban) | `pipeline/*` | ✅ |

## My Roles

| Area | File(s) | Status |
|---|---|---|
| List screen | `my-roles/page.tsx` | ✅ (this session) |
| Detail / shortlist screen | `my-roles/[id]/page.tsx` | 🔶 — one leftover `text-primary` client-name link (line ~302), not part of what was rebuilt |
| Shortlist candidate card | `_components/candidate-shortlist-card.tsx` (shared with Ops requisition detail) | ✅ (this session) |
| Candidate profile — History tab | `_components/candidate-relationship-section.tsx` | ✅ |

## Ops — Requisitions

| Area | File(s) | Status |
|---|---|---|
| List screen | `ops/requisitions/page.tsx` | ✅ (this session) |
| New Requisition dialog — form step | `ops/requisitions/_components/create-requisition-wizard.tsx` | 🔶 — only the `form` step was restyled; `preview`/`assign`/`done` steps untouched (one leftover `text-primary` icon in the `done` step); this session also fixed the dialog's vertical-recenter-on-tab-switch bug (`top-[8vh] translate-y-0`) |
| Detail screen | `ops/requisitions/[id]/page.tsx` | ✅ (this session) — header/breadcrumb/stats rebuilt, Details/JD/Assigned-recruiters/Hiring-process/Matchmaker/Interviews/Placements all restyled; per-stage candidate counts and quick-facts (equity/location/experience) now real, not placeholders |
| Matchmaker panel | `ops/requisitions/[id]/_components/matchmaker-panel.tsx` | ✅ (this session) |
| Interviews section | `ops/requisitions/[id]/_components/interviews-section.tsx` | ✅ (this session) |
| Placement panel | `ops/requisitions/[id]/_components/placement-panel.tsx` | ✅ (this session) — banned glass effect (`backdrop-blur`) removed |
| Candidate detail panel | `ops/requisitions/[id]/_components/candidate-detail-panel.tsx` | **Deleted** (this session) — confirmed dead code, `CandidateProfileSheet` is the real one |

## Ops — Clients

| Area | File(s) | Status |
|---|---|---|
| List | `ops/clients/page.tsx` | ⬜ — has the banned glass effect |
| Detail — fields, requisitions tab | `ops/clients/[id]/_components/client-fields.tsx`, `client-requisitions.tsx` | ⬜ |

## Ops — Interviews / Quality Review

| Area | File(s) | Status |
|---|---|---|
| Interviews list | `ops/interviews/page.tsx` | ⬜ — has the banned glass effect too |
| Quality review (AI recommendation queue) | `ops/quality-review/page.tsx` | ⬜ |

## BD (business development) — untouched domain

| Area | File(s) | Status |
|---|---|---|
| Lead pipeline (kanban — separate board from the recruiting one above) | `bd/pipeline/_components/kanban-board.tsx`, `lead-detail-sheet.tsx` | ⬜ |
| Leads list | `bd/leads/page.tsx`, `_components/lead-card.tsx`, `lead-detail-panel.tsx`, `snooze-popover.tsx` | ⬜ — leads page + lead-card + lead-detail-panel also have the banned glass effect |
| Outreach | `bd/outreach/page.tsx` | ⬜ |
| Replies | `bd/replies/page.tsx` | ⬜ |
| Imports | `bd/imports/_components/import-dropzone.tsx` | ⬜ |

## Supply

| Area | File(s) | Status |
|---|---|---|
| Ingest | `supply/ingest/_components/ingest-job-card.tsx`, `csv-form.tsx`, `resume-form.tsx` | ⬜ |
| Engagements | `supply/engagements/_components/engagement-sequence-sheet.tsx` | ⬜ — banned glass effect |

## Assistant (AI chat widget)

| Area | File(s) | Status |
|---|---|---|
| Chat widget | `assistant/_components/assistant-chat.tsx`, `assistant-history.tsx`, `assistant-markdown.tsx`, `assistant-widget.tsx` | ⬜ |

## Admin (internal ops tabs — not `admin/users`)

| Area | File(s) | Status |
|---|---|---|
| Overview / events / quotas / prompts tabs | `admin/_components/admin-overview-tab.tsx`, `admin-events-tab.tsx`, `admin-quotas-tab.tsx`, `admin-prompts-tab.tsx` | ⬜ |
| Staff users page | `admin/users/page.tsx` | **Excluded by decision** — deliberately kept on legacy pre-DS styling, see `app/CLAUDE.md` §8. Not "left to do." |

## Standalone pages

| Area | File(s) | Status |
|---|---|---|
| Bookmarks | `bookmarks/page.tsx` | ⬜ |
| Calendar | `calendar/page.tsx` | ⬜ |
| Error / not-found | `app/error.tsx`, `app/not-found.tsx` | ⬜ |

---

## How to re-check a file's status

No automated check — the DS doc's own patterns to grep for:

```bash
# Off-brand blue-as-accent (should be near-black or a status hue)
grep -rn "text-primary\b" app --include="*.tsx" | grep -v "text-primary-foreground"
grep -rln "bg-primary/10" app --include="*.tsx"

# Banned glass effect
grep -rl "backdrop-blur\|bg-white/85" app --include="*.tsx"

# Old literal oklch() status colors — migrate to the hexes in app/CLAUDE.md §2
grep -rl "oklch(" app --include="*.tsx"
```
