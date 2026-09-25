'use client'
import { useQuery } from '@tanstack/react-query'
import { JobCard } from '../jobs/_components/job-card'
import { useCandidateAuth } from './candidate-auth-context'
import type { PublicJobsResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const FEATURED_COUNT = 3
// ponytail: single-page best-effort logo preference. As of 2026-09, only
// ~2% of jobs have a company_logo_url and they cluster past index 250 in
// recency order, so this will usually still fall back to letter tiles.
// Reaching a logo'd job reliably needs either a backend "featured" flag/sort
// or a multi-page client crawl — not worth the extra round-trips for a
// 3-card teaser. Revisit if logo enrichment moves earlier in the pipeline.
const FEATURED_POOL_SIZE = 50

export function FeaturedJobs() {
  const { isLoggedIn, token } = useCandidateAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-jobs', isLoggedIn],
    queryFn: async () => {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/v1/public/jobs?limit=${FEATURED_POOL_SIZE}`, { headers })
      if (!res.ok) throw new Error(`Jobs fetch failed: ${res.status}`)
      return res.json() as Promise<PublicJobsResponse>
    },
  })

  if (isLoading || error || !data?.items.length) return null

  const withLogo = data.items.filter(job => job.company_logo_url)
  const withoutLogo = data.items.filter(job => !job.company_logo_url)
  const featured = [...withLogo, ...withoutLogo].slice(0, FEATURED_COUNT)

  return (
    <div className="mt-12 grid w-full max-w-[1120px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {featured.map(job => (
        <JobCard key={job.id} job={job} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  )
}
