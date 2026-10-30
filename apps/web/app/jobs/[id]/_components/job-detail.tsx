'use client'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useCandidateAuth } from '../../../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../../../_lib/candidate-api'
import { ACTION_ROW, ApplySection } from './apply-section'
import { SaveJobButton } from '../../_components/save-job-button'
import { logoColor } from '../../_components/job-card'
import type { PublicJobItem, CandidateProfile } from '../../../_lib/candidate-types'
import { endAtSentence } from '../../../_lib/end-at-sentence'
import { recordApplyClick } from '../../../_lib/candidate-api'
import { JobDescription, JobMarkdown } from './job-description'

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

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  recruitee: 'Recruitee',
  lever: 'Lever',
  smartrecruiters: 'SmartRecruiters',
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

function BackLink() {
  return (
    <Link href="/jobs" className="inline-link inline-flex items-center gap-2 justify-self-start">
      <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
      Back to jobs
    </Link>
  )
}

/** `initialJob` is the server's anonymous fetch: it puts the job in the HTML
 *  and stays on screen while the client fetch adds this candidate's match. */
export function JobDetail({ id, initialJob }: { id: string; initialJob?: PublicJobItem }) {
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
    placeholderData: initialJob,
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

  if (isLoading) {
    return (
      <main className="wrap page mid">
        <div className="job skeleton" aria-hidden="true" />
      </main>
    )
  }

  if (error || !job) {
    return (
      <main className="wrap page mid">
        <BackLink />
        <p className="notice err">Couldn&apos;t load this job. It may have been removed.</p>
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

  // Backend-formatted and currency-qualified; never reformat the pay label here.
  const meta = [job.location, job.compensation_label].filter(Boolean).join(' · ')

  return (
    <main className="wrap page mid">
      <BackLink />

      <article className="grid gap-6">
        <header className="page-head">
          {job.company_name ? (
            <div className="modal-job">
              <div
                className="lg overflow-hidden"
                style={{ background: job.company_logo_url ? 'var(--surface)' : logoColor(job.company_name) }}
                aria-hidden="true"
              >
                {job.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- unknown external hosts, no next.config remotePatterns
                  <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  job.company_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <b>{job.company_name}</b>
                {meta && <p className="small">{meta}</p>}
              </div>
            </div>
          ) : (
            meta && <p className="small">{meta}</p>
          )}

          <h1 className="d2">{job.title}</h1>

          <div className="chips">
            {chips.map(chip => (
              <span key={String(chip)} className="chip">{chip}</span>
            ))}
            {/* Match badge — logged-in only (JOB-05) */}
            {isLoggedIn && job.match_strength === 'strong' && <span className="pill-ok">Strong match</span>}
            {isLoggedIn && job.match_strength === 'partial' && <span className="pill-n">Partial match</span>}
          </div>

          {skills.length > 0 && (
            <div className="chips">
              {skills.map(skill => (
                <span key={skill} className="chip on">{skill}</span>
              ))}
            </div>
          )}

          {isLoggedIn && job.match_reasons?.length > 0 && job.match_strength !== 'none' && (
            <ul className="small grid gap-1">
              {job.match_reasons.map(reason => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          )}
        </header>

        {/* A scraped posting lives on the employer's own ATS — we cannot submit an
            application on the candidate's behalf, so we send them there and say so
            plainly rather than collecting an application we cannot deliver. Our own
            client requisitions use the internal apply flow. */}
        <div>
          {job.job_kind === 'scraped' ? (
            applyHref ? (
              <div className="grid gap-4">
                <div className={ACTION_ROW}>
                  <a
                    className="btn btn-primary"
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordApplyClick(job.id)}
                  >
                    Apply on {job.company_name ?? 'company site'}
                    <ArrowUpRight className="size-4" strokeWidth={1.8} />
                  </a>
                  <SaveJobButton jobId={job.id} />
                </div>
                <p className="notice">
                  This role is posted on the employer&apos;s own careers site. You&apos;ll apply there
                  directly, so Brynz can&apos;t track this application in your dashboard.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className={ACTION_ROW}>
                  <SaveJobButton jobId={job.id} />
                </div>
                <p className="notice">This posting has no application link available.</p>
              </div>
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
        {(job.description || job.description_summary) && (
          <section className="panel">
            <h2 className="d3">Job description</h2>
            {job.description && job.description_format === 'markdown' ? (
              <JobMarkdown markdown={job.description} />
            ) : job.description ? (
              <JobDescription text={job.description} />
            ) : (
              <p>{endAtSentence(job.description_summary ?? '')}</p>
            )}
          </section>
        )}

        {/* Other boards carrying this same real job — secondary to the primary
            apply action above, just letting the candidate pick their preferred board. */}
        {(job.alternate_postings?.length ?? 0) > 0 && (
          <p className="small">
            Also posted on:{' '}
            {job.alternate_postings.map((alt, i) => {
              const href = safeHref(alt.url)
              return (
                <span key={alt.url}>
                  {i > 0 && ' · '}
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-link">
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
