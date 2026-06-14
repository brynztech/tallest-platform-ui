# Phase 5: Public Site - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 5-Public Site
**Areas discussed:** Landing page aesthetic, Onboarding flow steps, Job board search behavior, Auth + nav structure

---

## Landing Page Aesthetic

| Option | Description | Selected |
|--------|-------------|----------|
| Light only | No dark toggle — editorial white, dark text. Candidates expect light sites. | ✓ |
| Dark-mode first | Matches the console. Risk: contrario.ai itself is light — may feel like a tool. | |
| System preference | Respects OS. More overhead — need both palettes tested. | |

**User's choice:** Light only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Above-the-fold headline + CTA only | Single headline, 1-2 lines subtext, one CTA. Contrario.ai / linear.app style. | ✓ |
| Hero + features grid below the fold | Headline at top, 3 feature callouts below. Breaks the sparse editorial feel. | |
| Full marketing page | Hero + social proof + how-it-works + footer. Heavy for Phase 5 scope. | |

**User's choice:** Above-the-fold headline + CTA only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Large + light weight | 120px+ headline at font-weight 300–400, wide tracking. Contrario.ai / Vercel style. | ✓ |
| Large + bold / black weight | 700–900 weight. Notion/Figma marketing feel. | |
| Medium size, multi-line editorial | 60–80px with 2-3 lines that tell a story. | |

**User's choice:** Large + light weight

---

| Option | Description | Selected |
|--------|-------------|----------|
| Contrario.ai only | Editorial white, large light type, minimal CTA, sparse negative space. | ✓ |
| Linear.app | Dark gradient hero on light page, crisp badge/label components. | |
| Workatastartup.com | More utilitarian candidate-facing design. | |
| Other | Custom direction. | |

**User's choice:** Contrario.ai only

---

## Onboarding Flow Steps

| Option | Description | Selected |
|--------|-------------|----------|
| Resume upload is step 1 | Async parse prefills subsequent steps. Reduces friction. Same pattern as supply ingest. | ✓ |
| Resume optional, at the end | Candidate fills manually first, then offered resume upload. Slower. | |
| Resume upload on signup page | Before onboarding, immediately after account creation. Could feel abrupt. | |

**User's choice:** Resume upload is step 1

**Notes:** User also provided important product design context in free-form response: job board is open to visitors, show 3-5 limited/blurred results, gate deeper access behind signup. Public job search is the acquisition funnel — not just the landing page CTA. After signup, resume upload starts onboarding, which improves matching quality.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 3 steps: Resume → Confirm profile → Preferences | Completable in under 3 minutes. | ✓ |
| 2 steps: Resume → Review all | Fewer clicks, heavier step 2. | |
| 4 steps: Resume → Personal → Experience/Skills → Preferences | More granular progress. | |

**User's choice:** 3 steps: Resume → Confirm profile → Preferences

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed score ≥ 70 | Completeness meter shows progress toward 70. Simple, easy to communicate. | ✓ |
| Required fields checklist | Specific fields must be non-null. More transparent. | |
| Backend-driven | Trust the completeness_score field as-is. | |

**User's choice:** Fixed score ≥ 70 gates 1-click apply

---

## Job Board Search Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Debounced server-side query | ~350ms debounce on text, immediate on filter change. All active params sent together. | ✓ |
| Client-side filter on preloaded results | Load all jobs once, filter in memory. Doesn't scale or match cursor API. | |
| Explicit submit (Search button) | Contradicts 'instant-update' requirement. | |

**User's choice:** Debounced server-side query (~350ms)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal filter bar above results | Inline filter chips above cards, removable pills below. Cleaner for public site. | ✓ |
| Left sidebar (console-style) | More real estate but feels like a console tool. | |
| Expandable filter panel | 'Filter' button reveals panel. Mobile-friendly but hides filters. | |

**User's choice:** Horizontal filter bar above results

---

| Option | Description | Selected |
|--------|-------------|----------|
| Title + company + location + comp range + top 3 skills + match badge | Enough signal. Match badge for logged-in only. No description summary on card. | ✓ |
| Title + company + 1-line description summary + match badge | More editorial, less dense. | |
| Full card with all fields | Dense, aggregator-style. | |

**User's choice:** Title + company + location + comp range + top 3 skills + match badge

---

## Auth + Nav Structure

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Simple for mock-first. Easy to swap persistence layer when real auth ships. | ✓ |
| httpOnly cookie (via Next.js middleware) | Closer to production security. Complex for MSW/mock-first setup. | |
| In-memory only (sessionStorage) | No persistence across page reloads. Bad UX. | |

**User's choice:** localStorage (mock-first, interface designed for easy swap)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal top nav with auth state | Logo + Jobs + auth buttons (logged-out) or avatar + Dashboard (logged-in). | ✓ |
| Full nav with all sections | Logo + Jobs + How it works + About + auth. Marketing-site feel. | |
| No persistent nav | Page-specific headers. Breaks navigability. | |

**User's choice:** Minimal top nav — sparse, contrario.ai-style

---

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to signup, then back to job | /signup?redirect=/jobs/[id] → after onboarding → return to job. Standard pattern. | ✓ |
| Inline signup prompt / modal | Modal opens with signup form. Never leaves job page. More complex state. | |
| Show apply form regardless, block on submit | Creates false progress. | |

**User's choice:** Redirect to signup with redirect param, return after onboarding

---

## Claude's Discretion

None — user made explicit choices for all decisions.

## Deferred Ideas

None — discussion stayed within phase scope.
