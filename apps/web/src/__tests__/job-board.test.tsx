import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('Job board page (JOB-01)', () => {
  const src = readFile('jobs/page.tsx')

  it('mounts the toolbar exactly once so typing does not remount it', () => {
    // It used to render in three branches (loading/error/results) at different tree
    // positions, so a new query remounted it and dropped the input's focus and text.
    expect(src.match(/<FilterBar/g)?.length).toBe(1)
  })

  it('seeds the search from ?q= so links like /jobs?q=Backend prefill it', () => {
    expect(src).toContain("searchParams.get('q')")
    expect(src).toContain('useState(initialQuery)')
  })

  it('uses useInfiniteQuery for cursor pagination', () => {
    expect(src).toContain('useInfiniteQuery')
  })

  it('queryKey includes debouncedSearch and filters', () => {
    expect(src).toContain('debouncedSearch')
    expect(src).toContain('filters')
  })

  it('text search debounced 350ms before triggering new query', () => {
    expect(src).toContain('350')
    expect(src).toContain('setTimeout')
  })

  it('VISIBLE_LIMIT is 4 (D-06)', () => {
    expect(src).toContain('VISIBLE_LIMIT = 4')
  })

  it('shows 6 skeleton cards when isLoading', () => {
    expect(src).toContain('job skeleton')
    expect(src).toContain('length: 6')
  })

  it('uses IntersectionObserver for load-more', () => {
    expect(src).toContain('IntersectionObserver')
  })

  it('renders LockedJobsOverlay when !isLoggedIn and jobs.length > VISIBLE_LIMIT', () => {
    expect(src).toContain('LockedJobsOverlay')
    expect(src).toContain('VISIBLE_LIMIT')
  })

  it('Load more button calls fetchNextPage', () => {
    expect(src).toContain('fetchNextPage')
  })

  it('Load more button hidden when !hasNextPage', () => {
    expect(src).toContain('hasNextPage')
  })

  it('fetches from /api/v1/public/jobs with native fetch', () => {
    expect(src).toContain('/api/v1/public/jobs')
    expect(src).toContain('fetch(')
  })
})

describe('Match badges (JOB-05)', () => {
  const src = readFile('jobs/_components/job-card.tsx')

  it('Strong match badge rendered only when isLoggedIn and match_strength===strong', () => {
    expect(src).toContain("match_strength === 'strong'")
    expect(src).toContain('isLoggedIn')
  })

  it('Partial match badge rendered only when isLoggedIn and match_strength===partial', () => {
    expect(src).toContain("match_strength === 'partial'")
  })

  it('no dangerouslySetInnerHTML (T-05-02 XSS prevention)', () => {
    expect(src).not.toContain('dangerouslySetInnerHTML')
  })
})

describe('Anonymous gating (JOB-06)', () => {
  const jobCardSrc = readFile('jobs/_components/job-card.tsx')
  const jobPageSrc = readFile('jobs/page.tsx')

  it('cards beyond index 4 get the blurred .locked state', () => {
    expect(jobCardSrc).toContain("'job locked'")
    expect(readFile('globals.css')).toContain('.job.locked { filter: blur(4px); pointer-events: none; user-select: none; }')
  })

  it('JobCard uses isLocked prop to apply blur conditionally', () => {
    expect(jobCardSrc).toContain('isLocked')
  })

  it('locked cards are inert so keyboard and screen readers cannot reach them', () => {
    expect(jobCardSrc).toContain('inert={isLocked}')
  })

  it('LockedJobsOverlay contains resume scan link to /signup', () => {
    const overlaySrc = readFile('jobs/_components/locked-jobs-overlay.tsx')
    expect(overlaySrc).toContain('Upload resume to reveal matches')
    expect(overlaySrc).toContain('href="/signup?intent=resume_scan"')
  })

  it('job board passes isLocked based on VISIBLE_LIMIT and !isLoggedIn', () => {
    expect(jobPageSrc).toContain('isLocked')
    expect(jobPageSrc).toContain('isLoggedIn')
  })

  it('job board invites candidates to create a profile', () => {
    expect(readFile('jobs/_components/talent-sections.tsx')).toContain('Create profile')
    expect(readFile('jobs/_components/talent-sections.tsx')).toContain('href="/signup"')
  })

  it('locked overlay uses resume-first value copy and preserves resume scan intent', () => {
    const overlaySrc = readFile('jobs/_components/locked-jobs-overlay.tsx')
    expect(overlaySrc).toContain('Find out which jobs are worth your time')
    expect(overlaySrc).toContain('Upload your resume')
    expect(overlaySrc).toContain('/signup?intent=resume_scan')
  })
})

describe('Search and FilterBar (D-07, D-08)', () => {
  const src = readFile('jobs/_components/filter-bar.tsx')
  const page = readFile('jobs/page.tsx')

  it('renders the search input with a typing placeholder', () => {
    expect(page).toContain('className="searchbar"')
    expect(page).toContain('data-type-ph')
  })

  it('category links search in place and toggle off when picked again', () => {
    expect(page).toContain('className="taglinks"')
    expect(page).toContain("searchNow(debouncedSearch === cat ? '' : cat)")
  })

  it('has Role type and Seniority dropdowns', () => {
    expect(src).toContain('role_type')
    expect(src).toContain('seniority')
  })

  it('filter changes call onFiltersChange immediately (D-08 — no debounce)', () => {
    expect(src).toContain('onFiltersChange({ ...filters, [key]: value })')
  })

  it('Clear filters resets search and filters immediately', () => {
    expect(src).toContain('Clear filters')
    expect(page).toContain('function clearAll()')
  })

  it('exports JobFilters type interface', () => {
    expect(src).toContain('export interface JobFilters')
  })
})

describe('LockedJobsOverlay component', () => {
  const src = readFile('jobs/_components/locked-jobs-overlay.tsx')

  it('shows resume reveal CTA', () => {
    expect(src).toContain('Upload resume to reveal matches')
  })

  it('links to /signup', () => {
    expect(src).toContain('/signup')
  })

  it('uses the overlay class that is absolutely positioned', () => {
    expect(src).toContain('locked-overlay')
  })
})

describe('Saved jobs (server side, per account)', () => {
  const store = readFile('_lib/saved-jobs.ts')

  it('lists and toggles through the candidate API, not browser storage', () => {
    expect(store).toContain('/api/v1/candidate/saved-jobs')
    expect(store).toContain("method: next ? 'PUT' : 'DELETE'")
    expect(store).not.toContain("localStorage.setItem")
  })

  it('keys the list by candidate id so another login never sees it', () => {
    expect(store).toContain("queryKey: ['saved-jobs', candidate?.id]")
  })

  it('the card heart and the detail Save button share one hook', () => {
    expect(readFile('jobs/_components/job-card.tsx')).toContain('useSavedJob')
    expect(readFile('jobs/_components/save-job-button.tsx')).toContain('useSavedJob')
  })
})
