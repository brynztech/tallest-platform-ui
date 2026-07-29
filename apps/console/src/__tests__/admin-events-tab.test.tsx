/**
 * Regression guard for a real production freeze.
 *
 * Symptom: clicking the "Events" tab locked up the entire browser tab —
 * confirmed via CDP-level mouse dispatch (mouse.down() itself never returned)
 * and direct JS execution probing (page.evaluate(() => Date.now()) could not
 * complete for 8+ seconds straight, on both the live deployed console and a
 * fresh local dev server against the real backend).
 *
 * Root cause, per TanStack Table's own FAQ ("failing to give data ... a stable
 * reference [causes] an infinite loop of re-renders"): this component computed
 * the value it passed to useReactTable's `data` two different ways, both of
 * which allocated a NEW array on every render:
 *   - `const { data: events = [] } = useQuery(...)` — the `[]` default-parameter
 *     literal is re-created every render while the query is unresolved/errored.
 *   - `displayedEvents = taskTypeFilter ? events.filter(...) : events` — a fresh
 *     `.filter()` result every render whenever a task-type filter is active.
 *
 * useReactTable sees a "changed" data source on every render, schedules another
 * re-render to recompute the row model, and loops — and because that loop
 * reschedules itself via microtasks, it starves the macrotask queue, so nothing
 * that arrives as a macrotask (the in-flight fetch's own response, CDP input
 * events, even trivial evaluate() calls) ever gets a turn. That is the
 * mechanism behind "the whole tab is frozen," not just "this component renders
 * slowly."
 *
 * These are static source assertions, not a runtime repro (a real repro needs a
 * live backend and a real browser — see apps/console/e2e/admin-tabs.spec.ts,
 * which exercises this by actually clicking through all 8 tabs against a real
 * server). What this file guards is that the STABLE-REFERENCE FIX itself is not
 * silently reverted by someone reintroducing `= []` or an unmemoized filter.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const SRC = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../app/(shell)/admin/_components/admin-events-tab.tsx',
  ),
  'utf-8',
)

describe('AdminEventsTab — stable data references into useReactTable', () => {
  it('does not fall back to a fresh [] literal on the query result', () => {
    // The exact regression: `data: events = []` allocates a new empty array
    // every render the query is unresolved, which is indistinguishable from a
    // "changed" data source to useReactTable.
    expect(SRC).not.toMatch(/data:\s*events\s*=\s*\[\]/)
    // The fix: one module-level array, reused rather than reallocated.
    expect(SRC).toMatch(/const EMPTY_EVENTS[^=]*=\s*\[\]/)
    expect(SRC).toContain('data: events = EMPTY_EVENTS')
  })

  it('memoizes the client-side task-type filter result', () => {
    // Unmemoized, `.filter()` returns a new array every render whenever a
    // filter is active — same failure mode as the [] default, but only
    // reachable once a candidate actually types into the filter box, which is
    // why the crash was reproducible even via the tab's DEFAULT (unfiltered)
    // state and not just a "someone typed a filter" edge case.
    expect(SRC).toMatch(/useMemo\(\s*\(\)\s*=>\s*[\s\S]*taskTypeFilter/)
  })

  it('the memo dependency array is exactly [events, taskTypeFilter]', () => {
    // Too narrow (missing a real input) silently serves stale filtered
    // results; too broad defeats the memoization this fix depends on.
    expect(SRC).toMatch(/\[events,\s*taskTypeFilter\]/)
  })

  it('useMemo is actually imported', () => {
    expect(SRC).toMatch(/import\s*\{[^}]*\buseMemo\b[^}]*\}\s*from\s*'react'/)
  })

  it('useReactTable still receives the memoized value, not raw events', () => {
    // Guards against someone "fixing the lint warning" by inlining data:
    // events directly into useReactTable and dropping displayedEvents.
    expect(SRC).toMatch(/data:\s*displayedEvents/)
  })
})
