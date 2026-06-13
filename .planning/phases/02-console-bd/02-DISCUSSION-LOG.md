# Phase 2: Console BD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 2-Console BD
**Areas discussed:** Card layout + detail open, Reject + snooze interactions, BD nav structure, Pending-overlay + bulk UX

---

## Card Layout + Detail Open

### Fat Card Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Score + company + contact + angle | ICP score badge, company name, contact name/title, suggested angle, open roles count | |
| All fields visible | Everything on card including enrichment status, tasks badge, outreach status | |
| You decide | Claude chooses most practical layout | |
| (Free text) | User specified exact field list | ✓ |

**User's choice:** ICP score badge (strongly visible), company name + canonical domain, contact name/title, suggested angle (1-2 lines max), open roles count if available, small task/status badges only when they affect the action. Deeper fields (ICP breakdown, full enrichment, task history, outreach detail) go in the slide-over.

---

### Detail Panel Open Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-over overlay | Panel slides over queue from right, queue stays dimmed in background | ✓ |
| Push layout | Panel pushes queue narrower (40/60 split), both visible simultaneously | |
| New route / full page | Navigates to /bd/leads/[id], back button returns | |

**User's choice:** Slide-over overlay (recommended)
**Notes:** Establishes the CUX-01 pattern for all future phases.

---

### Detail Trigger + Action Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Click anywhere on card, actions in both | Card body opens detail; buttons on card AND inside panel | ✓ |
| Explicit expand button, actions on card only | Chevron opens detail; actions only on card | |
| Click card opens, actions in panel only | All actions inside panel | |

**User's choice:** Click anywhere on card, actions in both

---

## Reject + Snooze Interactions

### Reject UI

| Option | Description | Selected |
|--------|-------------|----------|
| Floating popover | Radix Popover above/below Reject button with 7 reasons | ✓ |
| Inline dropdown | Select replaces Reject button | |
| Mini modal | Centered dialog with reasons | |

**User's choice:** Floating popover (recommended)

---

### Snooze Presets

| Option | Description | Selected |
|--------|-------------|----------|
| 1 week / 1 month / end of quarter / custom date | Standard BD follow-up cadences | ✓ |
| 1 day / 1 week / 1 month / custom date | Adds same-day option | |
| You decide | Claude picks | |

**User's choice:** 1 week / 1 month / end of quarter / custom date (recommended)

---

### Undo Timing (CUX-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Leave queue immediately, undo re-adds | Optimistic remove + 5s toast, undo restores | ✓ |
| Stay visible with pending state | Card stays 5s with "Pending…" state then animates out | |

**User's choice:** Leave queue immediately, undo re-adds (recommended)

---

## BD Nav Structure

### Surface Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar nav items | Separate routes /bd/leads, /bd/outreach, /bd/pipeline, /bd/imports, /bd/replies | ✓ |
| Tabs within /bd | Single /bd route with horizontal tabs | |
| Nested subnav | Top-level BD + secondary horizontal subnav | |

**User's choice:** Sidebar nav items (recommended)

---

### Sidebar Scope for Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| BD fully wired + phase stubs for Ops/Supply/Admin | Establishes full nav shape, Phase 3 activates Ops | ✓ |
| BD only, no stubs | Simpler but sidebar changes shape across phases | |
| Full nav upfront | All sections now, even unimplemented | |

**User's choice:** BD section only, phase stubs for Ops/Supply/Admin (recommended)

---

## Pending-overlay + Bulk UX

### Processing State Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Dimmed + spinner overlay on each card | 50% opacity + spinner badge, cards animate out on settle | ✓ |
| Progress bar + cards stay normal | Thin progress bar above queue, normal cards | |
| You decide | Claude picks | |

**User's choice:** Dimmed + spinner overlay on each card (recommended)

---

### Post-bulk Refetch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Refetch from page 1, reset cursor | Always return to top of queue after bulk action | ✓ |
| Refetch at current cursor, splice results | Try to resume at same position | |
| No automatic refetch | Manual reload button | |

**User's choice:** Refetch from page 1, reset cursor (recommended)
**Notes:** Avoids cursor corruption when actioned leads shift positions in the cursor window — exactly the concern flagged in STATE.md.

---

## Claude's Discretion

None — user made all decisions directly.

## Deferred Ideas

None raised during discussion.
