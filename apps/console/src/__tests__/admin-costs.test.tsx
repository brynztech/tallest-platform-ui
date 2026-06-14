import { describe, it } from 'vitest'

describe('Admin — Costs Tab (ADM-01)', () => {
  it.todo('renders cost table rows from CostResponse')
  it.todo('period select triggers refetch with correct period param')
  it.todo('shows footer total row')
  it.todo('shows empty state when no cost data')
})

describe('Admin — Pipeline Tab (ADM-04)', () => {
  it.todo('renders lead_counts entries as StatusCountCards')
  it.todo('renders sequence_counts entries as StatusCountCards')
  it.todo('shows failure banner when failed_agent_events_24h > 0')
})
