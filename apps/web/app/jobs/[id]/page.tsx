'use client'
import { use, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../../_lib/candidate-api'
import { ApplySection } from './_components/apply-section'
import type { PublicJobItem, CandidateProfile } from '../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// T-05-04: reject javascript: and data: protocols for any external URLs
function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {
    if (url.startsWith('/')) return url
  }
  return undefined
}

// schema.org employmentType vocabulary.
const EMPLOYMENT_TYPE_MAP: Record<PublicJobItem['employment_type'], string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  temporary: 'TEMPORARY',
}

const EMPLOYMENT_LABELS: Record<PublicJobItem['employment_type'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}

const REMOTE_LABELS: Record<'onsite' | 'hybrid' | 'remote', string> = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

const PERIOD_UNIT: Record<'year' | 'month' | 'hour', string> = {
  year: 'YEAR',
  month: 'MONTH',
  hour: 'HOUR',
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isLoggedIn, token } = useCandidateAuth()

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['public-job', id, isLoggedIn],
    queryFn: async () => {
      // Sending the token yields this candidate's match strength and reasons for
      // the role; without it the endpoint still serves the job, unpersonalized.
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/v1/public/jobs/${id}`, { headers })
      if (!res.ok) throw new Error(`Job fetch failed: ${res.status}`)
      return res.json() as Promise<PublicJobItem>
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })

  // Fetch candidate profile only when logged in (for completeness_score gate)
  const { data: profile } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/candidate/profile`, {
        headers: candidateAuthHeaders(),
      })
      if (!res.ok) throw new Error('Profile fetch failed')
      return res.json() as Promise<CandidateProfile>
    },
    enabled: isLoggedIn,
  })

  // JOB-03: Inject JobPosting JSON-LD structured data via useEffect (client-side)
  // Avoids server-side MSW complexity; removes on unmount to prevent duplicate scripts.
  // Per T-05-05: if Google Rich Results Test fails, migrate to RSC with generateMetadata().
  useEffect(() => {
    if (!job) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-job-id', job.id)
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description_summary ?? job.title,
      datePosted: job.date_posted,
      employmentType: EMPLOYMENT_TYPE_MAP[job.employment_type],
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company_name ?? 'Brynzit Client',
      },
      jobLocation: {
        '@type': 'Place',
        address: job.location ?? 'Remote',
      },
    }
    // Only emit baseSalary when the currency and period are actually known.
    // This previously hardcoded USD/YEAR, which would publish an INR salary to
    // Google as dollars — a ~85x misstatement in indexed structured data.
    if (job.compensation_min && job.compensation_currency && job.compensation_period) {
      jsonLd.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: job.compensation_currency,
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.compensation_min,
          maxValue: job.compensation_max ?? job.compensation_min,
          unitText: PERIOD_UNIT[job.compensation_period],
        },
      }
    }
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)
    return () => {
      const existing = document.head.querySelector(`script[data-job-id="${job.id}"]`)
      if (existing) document.head.removeChild(existing)
    }
  }, [job])

  // D-10: Inject canonical URL per requirement
  useEffect(() => {
    if (!id) return
    const link = document.createElement('link')
    link.rel = 'canonical'
    link.href = `https://brynzit.com/jobs/${id}`
    link.setAttribute('data-canonical-job-id', id)
    document.head.appendChild(link)
    return () => {
      const existing = document.head.querySelector(`link[data-canonical-job-id="${id}"]`)
      if (existing) document.head.removeChild(existing)
    }
  }, [id])

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[720px] px-6 py-12 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-[200px] w-full" />
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="mx-auto max-w-[720px] px-6 py-12">
        <p className="text-sm text-destructive">Couldn&apos;t load this job. It may have been removed.</p>
        <Link href="/jobs" className="mt-4 block text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to jobs
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[860px] px-6 py-12">
      <div>
        <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to jobs
        </Link>
      </div>

      <article className="mt-6 rounded-[1.75rem] border border-border/70 bg-card/85 p-7 shadow-2xl shadow-foreground/[0.05] backdrop-blur">
      <div className="space-y-4">
        <h1 className="text-4xl font-light leading-tight tracking-[-0.045em] text-foreground">{job.title}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {job.company_name && <span>{job.company_name}</span>}
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          )}
          {/* Backend-formatted and currency-qualified; never reformat it here. */}
          {job.compensation_label && (
            <span className="text-foreground">{job.compensation_label}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">{EMPLOYMENT_LABELS[job.employment_type]}</Badge>
          {job.seniority && (
            <Badge variant="secondary">
              {job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1)}
            </Badge>
          )}
          {job.remote_mode && (
            <Badge variant="secondary">{REMOTE_LABELS[job.remote_mode]}</Badge>
          )}
          {job.openings > 1 && <Badge variant="outline">{job.openings} openings</Badge>}
          {/* Match badge — logged-in only (JOB-05) */}
          {isLoggedIn && job.match_strength === 'strong' && (
            <Badge variant="default">Strong match</Badge>
          )}
          {isLoggedIn && job.match_strength === 'partial' && (
            <Badge variant="secondary">Partial match</Badge>
          )}
        </div>

        {(job.skills_display?.length ? job.skills_display : job.skills).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(job.skills_display?.length ? job.skills_display : job.skills).map(skill => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
          </div>
        )}

        {isLoggedIn && job.match_reasons?.length > 0 && job.match_strength !== 'none' && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {job.match_reasons.map(reason => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* T-05-02: JD rendered as plain text with whitespace-pre-wrap — no innerHTML usage */}
      {job.description_summary && (
        <div>
          <h2 className="mb-3 text-base font-normal text-foreground">Job description</h2>
          <p className="whitespace-pre-wrap text-base leading-[1.6] text-foreground">
            {job.description_summary}
          </p>
        </div>
      )}

      {/* A scraped posting lives on the employer's own ATS — we cannot submit an
          application on the candidate's behalf, so we send them there and say so
          plainly rather than collecting an application we cannot deliver. Our own
          client requisitions use the internal apply flow. */}
      {job.job_kind === 'scraped' ? (
        <div className="space-y-3 pt-2">
          {safeHref(job.source_url) ? (
            <>
              <a
                href={safeHref(job.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md shadow-primary/15 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Apply on {job.company_name ?? 'company site'}
              </a>
              <p className="text-sm text-muted-foreground">
                This role is posted on the employer&apos;s own careers site. You will apply there
                directly, so Brynzit cannot track this application in your dashboard.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This posting has no application link available.
            </p>
          )}
        </div>
      ) : (
        <ApplySection
          jobId={job.id}
          isLoggedIn={isLoggedIn}
          completenessScore={profile?.completeness_score ?? null}
        />
      )}
      </article>
    </main>
  )
}
