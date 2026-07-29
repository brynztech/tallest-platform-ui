import type { Capability } from '@brynzit/identity'

/**
 * Single source of truth for which capability a route requires.
 *
 * Both the sidebar (which capability hides a NAV LINK) and each route's
 * `layout.tsx` (which capability blocks the PAGE ITSELF) read from this map,
 * specifically so they cannot drift apart the way they had before this file
 * existed: a recruiter's "Admin Panel" link was hidden, but `/admin` rendered
 * fine for them if they typed the URL directly — the two were never actually
 * connected to a single decision.
 *
 * Every recruiter-portal route NOT listed here (submit, pipeline, overview,
 * dashboard, calendar, messages, cross-list, matchmaker, my-roles, rewards,
 * jobs, clients) is available to every console role — there is no gate to
 * apply. Only routes that are conditionally hidden in the sidebar belong here.
 */
export const ROUTE_CAPABILITIES: Record<string, Capability> = {
  '/admin': 'admin.view',
  '/bookmarks': 'candidate.bookmark',
  // The whole Internal Ops nav section is hidden without this, so every route
  // under it is gated at least this strictly. This includes
  // /ops/quality-review deliberately: that page renders a real, working
  // view-only mode for anyone who reaches it without submission.approve_gate
  // (see its own "You can view ... but only a Quality Manager or Admin can
  // approve" banner) and gates the approve/reject actions in-page. Requiring
  // approve_gate just to ENTER the page would make that existing code
  // unreachable and contradict a UX the page was clearly built to support —
  // so the route boundary matches the page's real behavior (view vs. approve
  // are two different gates), not a coarser, likely-drifted nav condition.
  '/bd': 'internal_ops.view',
  '/ops': 'internal_ops.view',
  '/supply': 'internal_ops.view',
}

/**
 * The capability required to see a route, or null if it needs none.
 *
 * Longest-prefix match, for when a future route needs something stricter than
 * its section's blanket gate (e.g. /admin already wins over no /admin/* entry
 * existing at all; a hypothetical /ops/finance would win over the plain /ops
 * entry if it needed its own, stricter capability).
 */
export function capabilityForRoute(pathname: string): Capability | null {
  let best: { prefix: string; capability: Capability } | null = null
  for (const [prefix, capability] of Object.entries(ROUTE_CAPABILITIES)) {
    const matches = pathname === prefix || pathname.startsWith(`${prefix}/`)
    if (matches && (best === null || prefix.length > best.prefix.length)) {
      best = { prefix, capability }
    }
  }
  return best?.capability ?? null
}
