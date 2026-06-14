# Phase 4: Console Supply + Admin - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 4-Console Supply + Admin
**Areas discussed:** Search interface layout, Candidate profile panel, Ingest paths structure, Admin screens layout

---

## Search Interface Layout

### Filter layout

| Option | Description | Selected |
|--------|-------------|----------|
| Left filter sidebar + results grid | Hard filters in left panel, semantic text at top, results fill right | ✓ |
| Top bar collapse + results below | Horizontal filter row above results | |
| Two-step: filter form → search → results | Explicit two-step with form and results separate | |

**User's choice:** Left filter sidebar + results grid

---

### Search trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit submit (Search button + Enter) | Prevents API hammering; filters editable without refetching | ✓ |
| Live on every filter change | Instant feedback, needs debounce | |

**User's choice:** Explicit submit  
**Notes:** Search triggers on Search button click OR Enter in semantic query field. Filters/query can be edited freely without refetching. Search button shows loading state. Active filters update after submit. Results remain stable while adjusting filters.

---

### Semantic ranking display

| Option | Description | Selected |
|--------|-------------|----------|
| Rank number badge only (#1, #2, #3) | Clean, position made explicit | |
| Match score percentage (e.g. 87% match) | Shows similarity score | |
| Rank badge + short match reason | Badge + "Matches Python, FastAPI, distributed systems" | ✓ |

**User's choice:** Rank badge + short match reason  
**Notes:** Do not show raw semantic percentage in v1. Order communicates ranking, badge makes it explicit, reason helps rep trust the result. Use score internally for ordering only.

---

### Result card fields

| Option | Description | Selected |
|--------|-------------|----------|
| Name, title, company, location, top 3 skills, availability badge | Decision-relevant fields like BD fat cards | |
| Name, title, skills, GitHub repos count, email verified | More signal-heavy, may be null | |
| Follow Phase 2 fat-card density (you decide) | 5–6 key signals with action buttons on hover | |
| Custom: rank badge + 6 fields + secondary badges | Specified exactly in discussion | ✓ |

**User's choice:** Rank badge, name, current title + company, location/remote pref, top 3 skills, availability/status badge, short match reason; secondary small badges for email verified (if true) and GitHub enriched (if present).  
**Notes:** GitHub/repos/email are secondary because they may be null for unenriched candidates.

---

## Candidate Profile Panel

### Panel structure

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable sections | One panel: summary header → experience → skills → GitHub → contact → resume | ✓ |
| Tabbed sections (Overview | Experience | Skills | GitHub | Resume) | Each section gets its own tab | |

**User's choice:** Scrollable sections  
**Notes:** Consistent with Phase 3 candidate slide-over. No tab-switching needed.

---

### Enrich trigger location

| Option | Description | Selected |
|--------|-------------|----------|
| Button in profile header, sections shimmer while enriching | Prominent header button, useAsyncJob polling | ✓ |
| Per-section enrich buttons | Each enrichable section has its own trigger | |
| Auto-enrich on panel open | Fires enrich POST automatically | |

**User's choice:** Single "Enrich" button in profile header  
**Notes:** Button appears when enrichment missing/stale. Shows "Enriching…" disabled state during polling. GitHub, email verification, and resume/profile signal sections show skeleton shimmer. On failure: "Enrichment failed — retry" inline in header.

---

### Where profile panel is opened from

| Option | Description | Selected |
|--------|-------------|----------|
| Both: search results AND shortlist rows | Shared CandidateProfileSheet component | ✓ |
| Search results only in Phase 4 | Shortlist slide-over stays minimal | |

**User's choice:** Shared CandidateProfileSheet from both contexts  
**Notes:** Props: `candidate_id`, `source: "search" | "shortlist"`, optional `requisition_id`. Fills in Phase 3's shortlist slide-over stub.

---

## Ingest Paths Structure

### Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single /supply/ingest with 3 mode tabs | LinkedIn | CSV | Resume | ✓ |
| Separate sidebar routes per path | /supply/ingest/linkedin, /csv, /resume | |
| Type selector radio + form below | Radio buttons at top, form below | |

**User's choice:** Single page with mode tabs (LinkedIn | CSV | Resume)

---

### Async status surfacing

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent jobs section below the form | Shared jobs section for all ingest types | ✓ |
| Per-submission toast only | Sonner toast, no persistent list | |
| Inline status in form | Form replaces itself with job status | |

**User's choice:** Persistent jobs section (same as BD imports page)

---

### LinkedIn ingest form

| Option | Description | Selected |
|--------|-------------|----------|
| Text area for LinkedIn search URL + optional filters | Search URL approach | |
| Structured filter form (skills, location, title, etc.) | Structured fields approach | |
| Follow API contract exactly | One linkedin_url input per API | ✓ |

**User's choice:** Single `linkedin_url` input + Submit button  
**Notes:** Backend uses Proxycurl to ingest one profile URL at a time. No search URL, skill filter, location, or limit in Phase 4. Do not add batch/search functionality.

---

## Admin Screens Layout

### Overall structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tabbed single /admin page | One page, 5 tabs | |
| Separate sidebar routes | /admin/costs, /admin/events, etc. | |
| Dashboard overview + drilldowns | Overview with summary widgets, drilldown tabs | ✓ |

**User's choice:** Dashboard overview + drilldown tabs all under /admin

---

### Overview widgets

| Option | Description | Selected |
|--------|-------------|----------|
| 4 summary cards (spend, quota, pipeline, events) | Each links to its tab | |
| Simple metric tiles only | Numbers, no history | |
| Match API response shapes | Design to API contract | |
| Custom: 4 specific cards as specified | Exact content per card | ✓ |

**User's choice:** 4 cards: Total spend (last 30d), Quota usage, Pipeline health, Recent agent events (last 5). Each links to its drilldown tab.

---

### Drilldown structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs on /admin (?tab= or hash) | One page, tabs | ✓ |
| Separate routes /admin/costs etc. | Each drilldown a separate page | |

**User's choice:** Tabs on /admin

---

### Prompt editor UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline editor: textarea + Save button + toast | Simple inline edit | |
| Modal editor | Dialog with textarea | |
| Split view: list left + editor right | Classic settings editor | ✓ |

**User's choice:** Split view in Prompts tab  
**Notes:** Left: prompt name list. Right: editor with dirty state indicator ("Unsaved changes"), Save (enabled only when dirty), Reset. PUT /api/v1/monitoring/prompts/{name} on save. Toast on success/error.

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
