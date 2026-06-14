import { describe, it } from 'vitest'

describe('Job board (JOB-01)', () => {
  it.todo('renders job cards from useInfiniteQuery with MSW handler returning 6 jobs')
  it.todo('text search debounced 350ms before triggering new query')
  it.todo('role_type filter change triggers immediate query reset')
  it.todo('active filter pills appear when filters are set')
  it.todo('Clear all resets all filters and triggers query')
  it.todo('Load more fetches next page via fetchNextPage')
})

describe('Match badges (JOB-05)', () => {
  it.todo('Strong match badge rendered for logged-in candidate with match_strength=strong')
  it.todo('match badge NOT rendered for logged-out visitor')
})

describe('Anonymous gating (JOB-06)', () => {
  it.todo('first 4 cards fully visible when logged out')
  it.todo('cards beyond index 4 have blur-[4px] class when logged out')
  it.todo('LockedJobsOverlay rendered when logged out and jobs.length > 4')
  it.todo('all cards visible (no blur) when logged in')
})
