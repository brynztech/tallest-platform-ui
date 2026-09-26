'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Button } from '@brynzit/ui/components/ui/button'
import { JobCard } from './_components/job-card'
import { FilterBar, EMPTY_FILTERS, type JobFilters } from './_components/filter-bar'
import { LockedJobsOverlay } from './_components/locked-jobs-overlay'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { PublicJobItem, PublicJobsResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const VISIBLE_LIMIT = 4

/** True when the candidate has narrowed the feed themselves, as opposed to
 *  simply having nothing available. The empty state must tell those apart:
 *  otherwise a mis-set admin visibility rule looks like a bug to the candidate. */
function hasAnyFilter(filters: JobFilters, search: string): boolean {
  if (search.trim()) return true
  return Object.entries(filters).some(([key, value]) => {
    const empty = EMPTY_FILTERS[key as keyof JobFilters]
    return value !== empty
  })
}

export default function JobsPage() {
  const { isLoggedIn, token } = useCandidateAuth()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [searchText, setSearchText] = useState(initialQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 350ms debounce for text search (D-08)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 350)
    return () => clearTimeout(timer)
  }, [searchText])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['public-jobs', debouncedSearch, filters, isLoggedIn],
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

  // IntersectionObserver for load-more (mirrors BD leads page pattern)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <main className="mx-auto max-w-[1184px] px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
      <h1 className="sr-only">Find roles worth your time</h1>

      {!isLoggedIn && (
        <section className="mb-6 flex flex-col gap-4 rounded-[20px] border border-border bg-card p-5 sm:mb-8 sm:gap-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[640px]">
            <p className="text-[14px] leading-5 text-muted-foreground">Reveal your best-fit roles</p>
            <h2 className="mt-1 text-[20px] leading-[26px] font-semibold tracking-[-0.02em] text-balance text-foreground sm:text-[24px] sm:leading-[30px]">
              Upload your resume. Let the AI scan show which jobs are actually worth applying to.
            </h2>
            {/* The pitch's second sentence is dropped on phones: the heading already carries it. */}
            <p className="mt-2 hidden text-[16px] leading-6 text-muted-foreground sm:block">
              Browse the preview, then create a free profile to run your resume through the Brynz
              parser, unlock match strength, and skip roles that waste your time.
            </p>
          </div>
          <Button asChild className="h-10 shrink-0 rounded-full px-5 text-[14px] leading-5 font-medium text-primary-foreground max-md:w-full">
            <a href="/signup?intent=resume_scan">Upload Resume</a>
          </Button>
        </section>
      )}

      <FilterBar
        onSearchChange={setSearchText}
        onSearchSubmit={searchNow}
        onFiltersChange={setFilters}
        isPersonalized={isPersonalized}
        initialSearch={initialQuery}
      />

      {total > 0 && (
        <p className="mt-6 text-[14px] leading-5 text-muted-foreground sm:mt-8" aria-live="polite">
          {total.toLocaleString()}
          {firstPage?.truncated ? '+' : ''} {total === 1 ? 'role' : 'roles'}
          {isFiltered ? ' match your filters' : ' open now'}
          {isPersonalized && ' · Ranked for you'}
        </p>
      )}

      <div className={total > 0 ? 'mt-3' : 'mt-8'}>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[136px] rounded-[20px]" />
            ))}
          </div>
        ) : error ? (
          <p className="py-12 text-center text-[14px] leading-5 text-destructive">
            Couldn&apos;t load jobs. Check your connection or refresh.
          </p>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            {isFiltered ? (
              <>
                <p className="text-[16px] leading-6 font-semibold text-foreground">No roles match your filters</p>
                <p className="mt-1 text-[14px] leading-5 text-muted-foreground">
                  Try widening your filters or clearing your search to see more opportunities.
                </p>
              </>
            ) : (
              <>
                {/* Distinct from the filtered case on purpose: an empty unfiltered
                    feed means nothing is currently published, not that the
                    candidate searched badly. */}
                <p className="text-[16px] leading-6 font-semibold text-foreground">No roles are open right now</p>
                <p className="mt-1 text-[14px] leading-5 text-muted-foreground">
                  New roles are added continuously. Check back shortly, or create a profile to be
                  notified when something fits.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job, idx) => {
                const isLocked = !isLoggedIn && idx >= VISIBLE_LIMIT
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    isLoggedIn={isLoggedIn}
                    isLocked={isLocked}
                  />
                )
              })}
            </div>
            {!isLoggedIn && jobs.length > VISIBLE_LIMIT && <LockedJobsOverlay />}
          </div>
        )}
      </div>

      <div ref={loadMoreRef} className="h-4" />
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-10 rounded-full border-border-control bg-card px-5 text-[14px] leading-5 font-medium shadow-none hover:bg-background"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more jobs'}
          </Button>
        </div>
      )}
    </main>
  )
}
