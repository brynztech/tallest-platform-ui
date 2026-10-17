'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../_lib/candidate-api'
import type { CandidateApplication, CandidateApplicationsResponse, PublicJobItem } from '../_lib/candidate-types'
import { readSavedJobs } from '../_lib/saved-jobs'
import { JobCard } from '../jobs/_components/job-card'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const STATUS_LABELS: Record<CandidateApplication['status'], string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Closed',
}

// `.status[data-s]` tone: 0 neutral, 1 amber, 2 blue, 3 green.
const STATUS_TONE: Record<CandidateApplication['status'], number> = {
  applied: 0,
  reviewing: 1,
  shortlisted: 2,
  interview: 2,
  offer: 3,
  rejected: 0,
}

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn } = useCandidateAuth()

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login?redirect=/dashboard')
  }, [isLoggedIn, router])

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/candidate/applications`, {
        headers: candidateAuthHeaders(),
      })
      if (!response.ok) throw new Error(`Applications fetch failed: ${response.status}`)
      return response.json() as Promise<CandidateApplicationsResponse>
    },
    enabled: isLoggedIn,
  })

  // Saved jobs live in this browser only (saved-jobs.ts), so read the ids here and
  // fetch each job. A job that closed since it was saved simply drops out.
  const [savedIds, setSavedIds] = useState<string[]>([])
  useEffect(() => setSavedIds(readSavedJobs()), [])
  const saved = useQuery({
    queryKey: ['saved-jobs', savedIds],
    queryFn: async () => {
      const jobs = await Promise.all(
        savedIds.map(async id => {
          const res = await fetch(`${API_BASE}/api/v1/public/jobs/${id}`, { headers: candidateAuthHeaders() })
          return res.ok ? ((await res.json()) as PublicJobItem) : null
        }),
      )
      return jobs.filter((job): job is PublicJobItem => job !== null)
    },
    enabled: isLoggedIn && savedIds.length > 0,
  })

  if (!isLoggedIn) return null

  return (
    <main className="wrap page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-head">
          <p className="stepn">Application tracker</p>
          <h1 className="d2">
            Your Brynz <em>pipeline</em>
          </h1>
          <p className="lede">Track roles you applied to and see where each one is in recruiter review.</p>
        </div>
        <Link className="btn btn-ghost" href="/jobs">
          Browse more jobs
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="job skeleton" style={{ minHeight: 88 }} aria-hidden="true" />
          ))}
        </div>
      ) : error ? (
        <p className="notice err">Couldn&apos;t load applications. Please refresh and try again.</p>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="empty">
          <h2 className="d3">No applications yet</h2>
          <p>
            Browse the job preview, upload your resume if you haven&apos;t already, and apply once
            your profile reaches the one-click threshold.
          </p>
          <Link className="btn btn-primary" href="/jobs">
            Find roles worth your time
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {data?.items.map((application) => (
            <div key={application.id} className="panel sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <Link href={`/jobs/${application.job_id}`} className="h4 job-link">
                  {application.job_title ?? 'Open role'}
                </Link>
                {application.company_name && <p className="small">{application.company_name}</p>}
                {application.substep_label && <p className="small">{application.substep_label}</p>}
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                <span className="status" data-s={STATUS_TONE[application.status]}>
                  {STATUS_LABELS[application.status]}
                </span>
                <p className="small">Applied {new Date(application.applied_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="grid gap-4" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="d3">
          Saved jobs
        </h2>
        {savedIds.length === 0 ? (
          <p className="small">Tap the heart on any job to keep it here for later.</p>
        ) : saved.isLoading ? (
          <div className="jobs">
            <div className="job skeleton" aria-hidden="true" />
          </div>
        ) : (saved.data?.length ?? 0) === 0 ? (
          <p className="small">The jobs you saved are no longer open.</p>
        ) : (
          <div className="jobs">
            {saved.data?.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} isLoggedIn />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
