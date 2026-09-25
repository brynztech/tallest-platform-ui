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

  it('seeds the search from ?q= handed off by the hero', () => {
    expect(src).toContain("searchParams.get('q')")
    expect(src).toContain('initialSearch')
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
    expect(src).toContain('Skeleton')
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

  it('cards beyond index 4 have blur-[4px] class via cn() conditional', () => {
    expect(jobCardSrc).toContain('blur-[4px]')
    expect(jobCardSrc).toContain('pointer-events-none')
    expect(jobCardSrc).toContain('select-none')
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

  it('job board invites anonymous candidates to upload a resume for AI-ranked matches', () => {
    expect(jobPageSrc).toContain('Upload your resume')
    expect(jobPageSrc).toContain('Reveal your best-fit roles')
    expect(jobPageSrc).toContain('/signup?intent=resume_scan')
  })

  it('locked overlay uses resume-first value copy and preserves resume scan intent', () => {
    const overlaySrc = readFile('jobs/_components/locked-jobs-overlay.tsx')
    expect(overlaySrc).toContain('Find out which jobs are worth your time')
    expect(overlaySrc).toContain('Upload your resume')
    expect(overlaySrc).toContain('/signup?intent=resume_scan')
  })
})

describe('FilterBar (D-07, D-08)', () => {
  const src = readFile('jobs/_components/filter-bar.tsx')

  it('renders the search field with a placeholder', () => {
    expect(src).toContain('SearchField')
    expect(src).toContain('placeholder')
    expect(readFile('_components/search-field.tsx')).toContain('<input')
  })

  it('fills the search in place when a category link is picked', () => {
    expect(src).toContain('CategoryLinks')
    expect(src).toContain('onSelect={selectCategory}')
  })

  it('has Role type and Seniority Select dropdowns', () => {
    expect(src).toContain('role_type')
    expect(src).toContain('seniority')
  })

  it('has Remote toggle button', () => {
    expect(src).toContain('remote')
  })

  it('filter dropdown changes call onFiltersChange immediately (D-08 — no debounce)', () => {
    // Immediate = onFiltersChange called directly inside handleFilterChange
    expect(src).toContain('onFiltersChange(next)')
  })

  it('active filter pills render below filter bar', () => {
    expect(src).toContain('hasActiveFilters')
  })

  it('Clear all resets all filters immediately', () => {
    expect(src).toContain('clearAll')
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

  it('has absolute positioning for overlay effect', () => {
    expect(src).toContain('absolute')
  })
})

describe('Saved jobs (browser-only until an API exists)', () => {
  const store = readFile('_lib/saved-jobs.ts')

  it('guards the stored JSON.parse against corrupt localStorage', () => {
    const parse = store.indexOf('JSON.parse(')
    expect(parse).toBeGreaterThan(-1)
    const tryIndex = store.lastIndexOf('try {', parse)
    expect(tryIndex).toBeGreaterThan(-1)
    expect(store.indexOf('catch', tryIndex)).toBeGreaterThan(parse)
  })

  it('the card heart and the detail Save button share one hook and one key', () => {
    expect(store).toContain("'brynz_saved_jobs'")
    expect(readFile('jobs/_components/job-card.tsx')).toContain('useSavedJob')
    expect(readFile('jobs/_components/save-job-button.tsx')).toContain('useSavedJob')
  })
})
