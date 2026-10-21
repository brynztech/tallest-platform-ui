'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { JobCard } from './_components/job-card'
import { FilterBar, EMPTY_FILTERS, type JobFilters } from './_components/filter-bar'
import { LockedJobsOverlay } from './_components/locked-jobs-overlay'
import { TalentSections } from './_components/talent-sections'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { PublicJobItem, PublicJobsResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const VISIBLE_LIMIT = 4
const CATEGORIES = ['AI Engineer', 'Backend', 'Forward Deployed', 'Product Engineer', 'Frontend', 'DevOps & AI']
const SEARCH_HINTS = [
  "Let's Brynz your next role.",
  'e.g. AI Engineer, Remote, 3+ years',
  'e.g. Founding backend engineer, Bengaluru',
  'e.g. Product Engineer, YC startup',
]

/** True when the candidate has narrowed the feed themselves, as opposed to
 *  simply having nothing available. The empty state must tell those apart:
 *  otherwise a mis-set admin visibility rule looks like a bug to the candidate. */
function hasAnyFilter(filters: JobFilters, search: string): boolean {
  if (search.trim()) return true
  return Object.entries(filters).some(([key, value]) => value !== EMPTY_FILTERS[key as keyof JobFilters])
}

export default function JobsPage() {
  const { isLoggedIn, token } = useCandidateAuth()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [searchText, setSearchText] = useState(initialQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS)
  // Signed-in candidates choose between their ranked list and everything, newest first.
  const [view, setView] = useState<'for-you' | 'all'>('for-you')
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 350ms debounce for text search (D-08)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 350)
    return () => clearTimeout(timer)
  }, [searchText])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['public-jobs', debouncedSearch, filters, isLoggedIn, view],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam as string)
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (filters.role_type) params.set('employment_type', filters.role_type)
      if (filters.seniority) params.set('seniority', filters.seniority)
      if (filters.location) params.set('location', filters.location)
      if (filters.skills) params.set('skills', filters.skills)
      if (filters.country) params.set('country', filters.country)
      if (filters.remote_mode) params.set('remote_mode', filters.remote_mode)
      else if (filters.remote) params.set('remote', 'true')
      if (filters.posted_within_days) params.set('posted_within_days', filters.posted_within_days)
      if (filters.has_compensation) params.set('has_compensation', 'true')
      if (filters.match_only) params.set('match_only', 'true')
      if (isLoggedIn && view === 'all') params.set('sort', 'recent')

      // Sending the session token personalizes the feed: the same endpoint
      // serves anonymous visitors (recency order, no match badges) and signed-in
      // candidates (ranked against their profile, with match reasons).
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/api/v1/public/jobs?${params}`, { headers })
      if (!res.ok) throw new Error(`Jobs fetch failed: ${res.status}`)
      return res.json() as Promise<PublicJobsResponse>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })

  const jobs: PublicJobItem[] = data?.pages.flatMap(page => page.items) ?? []
  const firstPage = data?.pages[0]
  const total = firstPage?.total ?? 0
  const isPersonalized = firstPage?.personalized ?? false
  const isFiltered = hasAnyFilter(filters, debouncedSearch)

  function searchNow(text: string) {
    setSearchText(text)
    setDebouncedSearch(text)
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS)
    searchNow('')
  }

  // IntersectionObserver for load-more (mirrors BD leads page pattern)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && isLoggedIn && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isLoggedIn, hasNextPage, isFetchingNextPage, fetchNextPage])

  const searchBlock = (
    <>
      <form
          className="searchbar"
          role="search"
          onSubmit={e => {
            e.preventDefault()
            searchNow(searchText)
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          <label htmlFor="q" className="sr">
            Search roles
          </label>
          <input
            id="q"
            type="search"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={SEARCH_HINTS[0]}
            data-type-ph={SEARCH_HINTS.join('|')}
            enterKeyHint="search"
            autoComplete="off"
          />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <div className="taglinks" aria-label="Browse by role">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              aria-pressed={debouncedSearch === cat}
              onClick={() => searchNow(debouncedSearch === cat ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
    </>
  )

  return (
    <main>
      {isLoggedIn ? (
        <section className="wrap search-hero app-hero">
          <h1 className="d2">
            Your <em>jobs</em>
          </h1>
          <div className="tabs" role="tablist" aria-label="Job list">
            <button
              className="tab"
              type="button"
              role="tab"
              aria-selected={view === 'for-you'}
              onClick={() => setView('for-you')}
            >
              For you
            </button>
            <button
              className="tab"
              type="button"
              role="tab"
              aria-selected={view === 'all'}
              onClick={() => setView('all')}
            >
              All jobs
            </button>
          </div>
          {searchBlock}
        </section>
      ) : (
        <section className="wrap search-hero">
          <Link className="trust rise" href="/signup">
            Trusted by founders from <span className="yc" aria-hidden="true">Y</span>
            <b>Combinator</b>
          </Link>
          <h1 className="d1 rise r1">
            Find the right jobs.
            <br />
            Straight from the <em>company</em>.
          </h1>
          <p className="lede rise r2" style={{ maxWidth: '34em' }}>
            Brynz AI agents find jobs that match your profile, the day they go live.
          </p>
          {searchBlock}
        </section>
      )}

      <section className="wrap section-tight" id="results" style={{ scrollMarginTop: 90 }}>
        <div className="toolbar">
          <div className="count" aria-live="polite">
            {total > 0 && (
              <>
                <b>
                  {total.toLocaleString()}
                  {firstPage?.truncated ? '+' : ''}
                </b>{' '}
                {total === 1 ? 'role' : 'roles'}
                {isFiltered ? ' match your search' : ' open now'}
                {isLoggedIn && (view === 'all' ? ', newest first' : isPersonalized ? ', ranked for you' : '')}
              </>
            )}
          </div>
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            isPersonalized={isPersonalized}
            canClear={isFiltered}
            onClear={clearAll}
          />
        </div>

        {isLoading ? (
          <div className="jobs">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="job skeleton" aria-hidden="true" />
            ))}
          </div>
        ) : error ? (
          <div className="jobs">
            <div className="empty">
              <h3 className="d3">Couldn&apos;t load jobs.</h3>
              <p>Check your connection or refresh the page.</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs">
            {isFiltered ? (
              <div className="empty">
                <h3 className="d3">No roles match your filters.</h3>
                <p>Try a broader search, or clear your filters to see more roles.</p>
                <button className="btn btn-ghost btn-sm" type="button" onClick={clearAll}>
                  Clear filters
                </button>
              </div>
            ) : (
              // Distinct from the filtered case on purpose: an empty unfiltered feed
              // means nothing is currently published, not that the candidate searched badly.
              <div className="empty">
                <h3 className="d3">No roles are open right now.</h3>
                <p>New roles land every day. Create a profile and we will match you as they do.</p>
                <Link className="btn btn-primary btn-sm" href="/signup">
                  Create profile
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="jobs-wrap">
            <div className="jobs">
              {jobs.map((job, idx) => (
                <JobCard key={job.id} job={job} index={idx} isLoggedIn={isLoggedIn} isLocked={!isLoggedIn && idx >= VISIBLE_LIMIT} />
              ))}
            </div>
            {!isLoggedIn && jobs.length > VISIBLE_LIMIT && <LockedJobsOverlay />}
          </div>
        )}

        <div ref={loadMoreRef} style={{ height: 16 }} />
        {/* Anonymous visitors see one page of previews; more needs an account. */}
        {isLoggedIn && hasNextPage && (
          <div className="more">
            <button className="btn btn-ghost" type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading…' : 'Show more roles'}
            </button>
          </div>
        )}
      </section>

      {/* Marketing sections are for visitors; a signed-in candidate has already joined. */}
      {!isLoggedIn && <TalentSections />}
    </main>
  )
}
