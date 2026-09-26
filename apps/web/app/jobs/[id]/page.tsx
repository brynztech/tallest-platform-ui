'use client'
import { use, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Button } from '@brynzit/ui/components/ui/button'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useCandidateAuth } from '../../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../../_lib/candidate-api'
import { ApplySection } from './_components/apply-section'
import { SaveJobButton } from '../_components/save-job-button'
import { ACTION_ROW, NOTICE, PRIMARY_BTN } from '../../_lib/ui-classes'
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

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  recruitee: 'Recruitee',
  apify_linkedin: 'LinkedIn',
  internal: 'Brynz',
  manual: 'Brynz',
  whatsapp: 'WhatsApp',
}

function sourceLabel(source: string): string {
  return (
    SOURCE_LABELS[source] ??
    source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  )
}

const PAGE = 'mx-auto max-w-[944px] px-4 pt-4 pb-20 sm:px-8 sm:pt-6'
const CHIP = 'inline-flex items-center rounded-full bg-muted px-3 py-1 text-[14px] leading-5 text-foreground'

function BackLink() {
  return (
    <Link
      href="/jobs"
      className="inline-flex h-10 items-center gap-2 text-[14px] leading-5 font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
      Back to jobs
    </Link>
  )
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
    link.href = `https://talent.trybrynz.com/jobs/${id}`
    link.setAttribute('data-canonical-job-id', id)
    document.head.appendChild(link)
    return () => {
      const existing = document.head.querySelector(`link[data-canonical-job-id="${id}"]`)
      if (existing) document.head.removeChild(existing)
    }
  }, [id])

  if (isLoading) {
    return (
      <main className={PAGE}>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-6 h-[420px] rounded-[20px]" />
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className={PAGE}>
        <BackLink />
        <p className="mt-6 text-[16px] leading-6 text-foreground">
          Couldn&apos;t load this job. It may have been removed.
        </p>
      </main>
    )
  }

  const skills = job.skills_display?.length ? job.skills_display : job.skills
  const chips = [
    EMPLOYMENT_LABELS[job.employment_type],
    job.seniority && job.seniority.charAt(0).toUpperCase() + job.seniority.slice(1),
    job.remote_mode && REMOTE_LABELS[job.remote_mode],
    job.openings > 1 && `${job.openings} openings`,
    // `!= null` on purpose: a real 0 is worth showing, and mocks omit the field.
    job.applicants_count != null &&
      `${job.applicants_count} applicant${job.applicants_count === 1 ? '' : 's'}`,
  ].filter(Boolean)
  const applyHref = safeHref(job.source_url)

  return (
    <main className={PAGE}>
      <BackLink />

      <article className="mt-3 rounded-[20px] border border-border bg-card p-5 sm:p-8">
        <h1 className="text-[26px] leading-[32px] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-[32px] sm:leading-[38px]">
          {job.title}
        </h1>

        {/* Company, place and pay stack on phones (no dangling dots), and run inline from sm. */}
        <div className="mt-3 flex flex-col gap-y-1 text-[16px] leading-6 text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
          {job.company_name && (
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[14px] leading-5 font-semibold text-foreground">
                {job.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- unknown external hosts, no next.config remotePatterns
                  <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  job.company_name.charAt(0).toUpperCase()
                )}
              </span>
              {job.company_name}
            </span>
          )}
          {job.location && (
            <>
              {job.company_name && <span aria-hidden="true" className="hidden sm:inline">·</span>}
              <span>{job.location}</span>
            </>
          )}
          {/* Backend-formatted and currency-qualified; never reformat it here. */}
          {job.compensation_label && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="text-foreground">{job.compensation_label}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map(chip => (
            <span key={String(chip)} className={CHIP}>{chip}</span>
          ))}
          {/* Match badge — logged-in only (JOB-05) */}
          {isLoggedIn && job.match_strength === 'strong' && (
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[14px] leading-5 text-primary-foreground">
              Strong match
            </span>
          )}
          {isLoggedIn && job.match_strength === 'partial' && <span className={CHIP}>Partial match</span>}
        </div>

        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-border-control bg-card px-3 py-1 text-[14px] leading-5 text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {isLoggedIn && job.match_reasons?.length > 0 && job.match_strength !== 'none' && (
          <ul className="mt-3 space-y-1 text-[14px] leading-5 text-muted-foreground">
            {job.match_reasons.map(reason => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        )}

        {/* A scraped posting lives on the employer's own ATS — we cannot submit an
            application on the candidate's behalf, so we send them there and say so
            plainly rather than collecting an application we cannot deliver. Our own
            client requisitions use the internal apply flow. */}
        <div className="mt-6">
          {job.job_kind === 'scraped' ? (
            applyHref ? (
              <>
                <div className={ACTION_ROW}>
                  <Button
                    asChild
                    className={PRIMARY_BTN}
                  >
                    <a href={applyHref} target="_blank" rel="noopener noreferrer">
                      Apply on {job.company_name ?? 'company site'}
                      <ArrowUpRight className="size-4" strokeWidth={1.8} />
                    </a>
                  </Button>
                  <SaveJobButton jobId={job.id} />
                </div>
                <p className={`mt-4 ${NOTICE}`}>
                  This role is posted on the employer&apos;s own careers site. You&apos;ll apply there
                  directly, so Brynz can&apos;t track this application in your dashboard.
                </p>
              </>
            ) : (
              <>
                <SaveJobButton jobId={job.id} />
                <p className={`mt-4 ${NOTICE}`}>This posting has no application link available.</p>
              </>
            )
          ) : (
            <ApplySection
              jobId={job.id}
              isLoggedIn={isLoggedIn}
              completenessScore={profile?.completeness_score ?? null}
            />
          )}
        </div>

        {/* T-05-02: JD rendered as plain text with whitespace-pre-wrap — no innerHTML usage */}
        {job.description_summary && (
          <>
            <hr className="mt-8 border-border" />
            <section className="mt-8">
              <h2 className="text-[16px] leading-6 font-semibold text-foreground">Job description</h2>
              <p className="mt-3 max-w-[68ch] whitespace-pre-wrap text-[16px] leading-[26px] text-foreground">
                {job.description_summary}
              </p>
            </section>
          </>
        )}

        {/* Other boards carrying this same real job — secondary to the primary
            apply action above, just letting the candidate pick their preferred board. */}
        {job.alternate_postings.length > 0 && (
          <p className="mt-8 text-[14px] leading-5 text-muted-foreground">
            Also posted on:{' '}
            {job.alternate_postings.map((alt, i) => {
              const href = safeHref(alt.url)
              return (
                <span key={alt.url}>
                  {i > 0 && ' · '}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {sourceLabel(alt.source)}
                    </a>
                  ) : (
                    sourceLabel(alt.source)
                  )}
                </span>
              )
            })}
          </p>
        )}
      </article>
    </main>
  )
}
