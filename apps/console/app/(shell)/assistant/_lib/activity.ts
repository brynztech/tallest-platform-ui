/**
 * Projects the raw event log into what the UI renders
 * (CONSOLE_ASSISTANT_PRINCIPLES.md §7, "Project before rendering").
 *
 * Two rules from the spec drive everything here:
 *  - Adjacent tool_call/tool_result runs fold into ONE activity block with
 *    humanized one-line labels — never raw JSON.
 *  - tool_result pairs to tool_call by `call_id`, never by tool name; orphans
 *    (a call whose result never arrived, e.g. a crash mid-round) are dropped
 *    silently rather than rendered as a dangling "checking…" that never ends.
 *
 * Pure functions, no React — so they are unit-testable as `.ts` despite this
 * app's new-`.tsx`-under-Vitest transform bug (apps/console/CLAUDE.md #3).
 */
import type { AssistantEvent } from './assistant-data'

export type TimelineItem =
  | { kind: 'user'; id: string; body: string }
  | { kind: 'assistant'; id: string; body: string }
  | { kind: 'error'; id: string; message: string }
  | { kind: 'activity'; id: string; labels: string[] }

type ToolResult = {
  error?: { message?: string }
  total?: number
  requisitions?: unknown[]
  submissions?: unknown[]
  title?: string
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** Reads as a sentence a recruiter would say, not as an API call. */
export function humanizeToolRun(name: string, result: unknown): string {
  const r = (result ?? {}) as ToolResult

  if (r.error) {
    return r.error.message ?? "Couldn't complete that lookup."
  }

  switch (name) {
    case 'list_my_requisitions': {
      const total = r.total ?? 0
      const shown = r.requisitions?.length ?? 0
      // Truncation is never silent (§10 rule 4) — it shows here as well as in
      // the reply, so the fold and the prose can't disagree about the count.
      return shown < total
        ? `Checked your ${plural(total, 'role')} — showing ${shown}`
        : `Checked your ${plural(total, 'role')}`
    }
    case 'get_requisition':
      return r.title ? `Looked up “${r.title}”` : 'Looked up a role'
    case 'get_pipeline': {
      const total = r.total ?? 0
      const shown = r.submissions?.length ?? 0
      return shown < total
        ? `Read the pipeline — ${shown} of ${plural(total, 'candidate')}`
        : `Read the pipeline — ${plural(total, 'candidate')}`
    }
    case 'get_my_assignments_summary':
      return `Summed up your ${plural(r.total ?? 0, 'role')}`
    default:
      return 'Looked something up'
  }
}

/** One-line summary for the collapsed `<details>`. */
export function activitySummary(labels: string[]): string {
  return labels.length === 1 ? labels[0] : `${labels.length} lookups`
}

/**
 * Timestamp for a history row: a time for today, a weekday within the last
 * week, a date beyond that — the granularity that actually helps someone
 * recognise which chat they want. `now` is injectable so this is testable.
 */
export function formatHistoryTimestamp(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const sameDay = then.toDateString() === now.toDateString()
  if (sameDay) {
    return then.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  const daysAgo = (now.getTime() - then.getTime()) / 86_400_000
  if (daysAgo < 7 && daysAgo >= 0) {
    return then.toLocaleDateString(undefined, { weekday: 'short' })
  }
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function buildTimeline(events: AssistantEvent[]): TimelineItem[] {
  const items: TimelineItem[] = []
  let i = 0

  while (i < events.length) {
    const event = events[i]

    if (event.kind === 'user_message') {
      items.push({ kind: 'user', id: event.id, body: String(event.payload.body ?? '') })
      i += 1
      continue
    }
    if (event.kind === 'assistant_message') {
      items.push({ kind: 'assistant', id: event.id, body: String(event.payload.body ?? '') })
      i += 1
      continue
    }
    if (event.kind === 'error') {
      items.push({
        kind: 'error',
        id: event.id,
        message: String(event.payload.message ?? 'Something went wrong.'),
      })
      i += 1
      continue
    }

    // A maximal run of adjacent tool traffic collapses into one block.
    const start = i
    const calls: { callId: string; name: string }[] = []
    const resultsByCallId = new Map<string, unknown>()
    while (i < events.length && (events[i].kind === 'tool_call' || events[i].kind === 'tool_result')) {
      const current = events[i]
      const callId = String(current.payload.call_id ?? '')
      if (current.kind === 'tool_call') {
        calls.push({ callId, name: String(current.payload.name ?? '') })
      } else {
        resultsByCallId.set(callId, current.payload.result)
      }
      i += 1
    }

    const labels = calls
      .filter((call) => resultsByCallId.has(call.callId))
      .map((call) => humanizeToolRun(call.name, resultsByCallId.get(call.callId)))

    if (labels.length > 0) {
      items.push({ kind: 'activity', id: events[start].id, labels })
    }
  }

  return items
}
