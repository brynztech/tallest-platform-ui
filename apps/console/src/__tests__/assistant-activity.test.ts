import { describe, expect, it } from 'vitest'
import {
  activitySummary,
  buildTimeline,
  formatHistoryTimestamp,
  humanizeToolRun,
} from '../../app/(shell)/assistant/_lib/activity'
import type { AssistantEvent } from '../../app/(shell)/assistant/_lib/assistant-data'

let seq = 0
function ev(kind: AssistantEvent['kind'], payload: Record<string, unknown>): AssistantEvent {
  seq += 1
  return {
    id: `e${seq}`,
    turn_id: 't1',
    seq,
    kind,
    payload,
    created_at: '2026-08-31T00:00:00Z',
  }
}

describe('humanizeToolRun', () => {
  it('never leaks the tool name or raw JSON to the user', () => {
    const label = humanizeToolRun('get_my_assignments_summary', { counts: { open: 3 }, total: 3 })
    expect(label).toBe('Summed up your 3 roles')
    expect(label).not.toContain('get_my_assignments_summary')
    expect(label).not.toContain('{')
  })

  it('surfaces truncation rather than implying the list is complete', () => {
    expect(humanizeToolRun('list_my_requisitions', { requisitions: [1, 2], total: 9 })).toBe(
      'Checked your 9 roles — showing 2',
    )
    expect(humanizeToolRun('get_pipeline', { submissions: [1], total: 12 })).toBe(
      'Read the pipeline — 1 of 12 candidates',
    )
  })

  it('says nothing about truncation when nothing was truncated', () => {
    expect(humanizeToolRun('list_my_requisitions', { requisitions: [1, 2], total: 2 })).toBe(
      'Checked your 2 roles',
    )
  })

  it('singularises counts of one', () => {
    expect(humanizeToolRun('list_my_requisitions', { requisitions: [1], total: 1 })).toBe(
      'Checked your 1 role',
    )
  })

  it('relays a scoping error as its message, not as a lookup that succeeded', () => {
    const label = humanizeToolRun('get_pipeline', {
      error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this requisition.' },
    })
    expect(label).toBe('You are not assigned to this requisition.')
  })

  it('degrades to something sayable for an unknown tool', () => {
    expect(humanizeToolRun('some_future_tool', { total: 1 })).toBe('Looked something up')
  })
})

describe('buildTimeline', () => {
  it('folds an adjacent tool run into ONE activity item', () => {
    const timeline = buildTimeline([
      ev('user_message', { body: 'how am I doing?' }),
      ev('tool_call', { call_id: 'c1', name: 'list_my_requisitions' }),
      ev('tool_result', { call_id: 'c1', result: { requisitions: [1], total: 1 } }),
      ev('tool_call', { call_id: 'c2', name: 'get_pipeline' }),
      ev('tool_result', { call_id: 'c2', result: { submissions: [1, 2], total: 2 } }),
      ev('assistant_message', { body: 'You have 1 role.' }),
    ])

    expect(timeline.map((i) => i.kind)).toEqual(['user', 'activity', 'assistant'])
    const activity = timeline[1]
    if (activity.kind !== 'activity') throw new Error('expected an activity item')
    expect(activity.labels).toEqual([
      'Checked your 1 role',
      'Read the pipeline — 2 candidates',
    ])
  })

  it('pairs results to calls by call_id, not by position or tool name', () => {
    // Same tool twice, results arriving out of order — pairing by anything but
    // call_id would mislabel these.
    const timeline = buildTimeline([
      ev('tool_call', { call_id: 'a', name: 'get_pipeline' }),
      ev('tool_call', { call_id: 'b', name: 'get_pipeline' }),
      ev('tool_result', { call_id: 'b', result: { submissions: [], total: 7 } }),
      ev('tool_result', { call_id: 'a', result: { submissions: [], total: 3 } }),
    ])

    const activity = timeline[0]
    if (activity.kind !== 'activity') throw new Error('expected an activity item')
    expect(activity.labels).toEqual([
      'Read the pipeline — 0 of 3 candidates',
      'Read the pipeline — 0 of 7 candidates',
    ])
  })

  it('drops an orphan tool_call silently (§7) rather than showing a call that never ends', () => {
    const timeline = buildTimeline([
      ev('tool_call', { call_id: 'x', name: 'get_pipeline' }),
      ev('tool_result', { call_id: 'x', result: { submissions: [], total: 1 } }),
      ev('tool_call', { call_id: 'orphan', name: 'list_my_requisitions' }),
    ])

    const activity = timeline[0]
    if (activity.kind !== 'activity') throw new Error('expected an activity item')
    expect(activity.labels).toHaveLength(1)
  })

  it('emits no activity item at all when every call is an orphan', () => {
    const timeline = buildTimeline([ev('tool_call', { call_id: 'only', name: 'get_pipeline' })])
    expect(timeline).toEqual([])
  })

  it('keeps separate tool runs in separate blocks', () => {
    const timeline = buildTimeline([
      ev('tool_call', { call_id: 'r1', name: 'get_pipeline' }),
      ev('tool_result', { call_id: 'r1', result: { submissions: [], total: 1 } }),
      ev('assistant_message', { body: 'one moment' }),
      ev('tool_call', { call_id: 'r2', name: 'get_pipeline' }),
      ev('tool_result', { call_id: 'r2', result: { submissions: [], total: 2 } }),
      ev('assistant_message', { body: 'done' }),
    ])
    expect(timeline.map((i) => i.kind)).toEqual([
      'activity',
      'assistant',
      'activity',
      'assistant',
    ])
  })

  it('carries error events through', () => {
    const timeline = buildTimeline([ev('error', { message: 'Cancelled.' })])
    expect(timeline).toEqual([{ kind: 'error', id: expect.any(String), message: 'Cancelled.' }])
  })
})

describe('activitySummary', () => {
  it('shows the single label verbatim when there is only one', () => {
    expect(activitySummary(['Checked your 3 roles'])).toBe('Checked your 3 roles')
  })

  it('counts them when there are several', () => {
    expect(activitySummary(['a', 'b', 'c'])).toBe('3 lookups')
  })
})

describe('formatHistoryTimestamp', () => {
  const now = new Date('2026-08-31T15:00:00Z')

  it('shows a time for a chat from today, so today’s chats are distinguishable', () => {
    const label = formatHistoryTimestamp('2026-08-31T09:30:00Z', now)
    expect(label).toMatch(/\d/)
    expect(label).not.toMatch(/Aug/)
  })

  it('shows a weekday within the last week', () => {
    expect(formatHistoryTimestamp('2026-08-28T09:30:00Z', now)).toMatch(
      /Mon|Tue|Wed|Thu|Fri|Sat|Sun/,
    )
  })

  it('falls back to a date beyond a week', () => {
    expect(formatHistoryTimestamp('2026-07-04T09:30:00Z', now)).toMatch(/Jul/)
  })

  it('returns empty string for an unparseable timestamp rather than "Invalid Date"', () => {
    expect(formatHistoryTimestamp('not-a-date', now)).toBe('')
  })
})
