'use client'
import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Button } from '@brynzit/ui/components/ui/button'
import { JobCard } from './_components/job-card'
import { FilterBar, type JobFilters } from './_components/filter-bar'
import { LockedJobsOverlay } from './_components/locked-jobs-overlay'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import type { PublicJobItem, PublicJobsResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const VISIBLE_LIMIT = 4

export default function JobsPage() {
  const { isLoggedIn } = useCandidateAuth()
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<JobFilters>({
    role_type: '',
    seniority: '',
    location: '',
    skills: '',
    remote: false,
  })
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 350ms debounce for text search (D-08)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 350)
    return () => clearTimeout(timer)
  }, [searchText])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['public-jobs', debouncedSearch, filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam as string)
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (filters.role_type) params.set('role_type', filters.role_type)
      if (filters.seniority) params.set('seniority', filters.seniority)
      if (filters.location) params.set('location', filters.location)
      if (filters.skills) params.set('skills', filters.skills)
      if (filters.remote) params.set('remote', 'true')
      const res = await fetch(`${API_BASE}/api/v1/public/jobs?${params}`)
      if (!res.ok) throw new Error(`Jobs fetch failed: ${res.status}`)
      return res.json() as Promise<PublicJobsResponse>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  })

  const jobs: PublicJobItem[] = data?.pages.flatMap(page => page.items) ?? []

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1180px] space-y-6 px-6 py-8">
        <FilterBar onSearchChange={setSearchText} onFiltersChange={setFilters} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <FilterBar onSearchChange={setSearchText} onFiltersChange={setFilters} />
        <p className="mt-6 text-sm text-destructive">
          Couldn&apos;t load jobs. Check your connection or refresh.
        </p>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-[1180px] space-y-6 px-6 py-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Public preview</p>
        <h1 className="text-3xl font-light tracking-[-0.04em] text-foreground">Find roles worth your time</h1>
        <p className="max-w-[560px] text-sm leading-6 text-muted-foreground">
          Search live opportunities now. Upload your resume when you are ready and Brynzit will
          rank the roles where you have the strongest signal.
        </p>
      </div>

      {!isLoggedIn && (
        <section className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-card/85 p-6 shadow-2xl shadow-foreground/[0.05] backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[640px] space-y-2">
              <p className="text-sm font-medium text-primary">Reveal your best-fit roles</p>
              <h2 className="text-2xl font-light tracking-[-0.035em] text-foreground">
                Upload your resume. Let the AI scan show which jobs are actually worth applying to.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Browse the preview, then create a free profile to run your resume through Brynzit&apos;s
                parser, unlock match strength, and skip roles that waste your time.
              </p>
            </div>
            <Button asChild className="shrink-0 rounded-full px-6 shadow-md shadow-primary/15">
              <a href="/signup?intent=resume_scan">Upload resume to rank matches</a>
            </Button>
          </div>
        </section>
      )}

      <FilterBar onSearchChange={setSearchText} onFiltersChange={setFilters} />

      {jobs.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-base text-foreground">No roles match your filters</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or search terms to see more opportunities.
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[1.5rem]">
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

      <div ref={loadMoreRef} className="h-4" />
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more jobs'}
          </Button>
        </div>
      )}
    </main>
  )
}
