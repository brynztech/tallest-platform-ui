'use client'
import Link from 'next/link'
import { useSavedJob } from '../../_lib/saved-jobs'
import type { PublicJobItem } from '../../_lib/candidate-types'

interface JobCardProps {
  job: PublicJobItem
  isLoggedIn: boolean
  isLocked?: boolean
  /** Stagger slot for the entrance animation. */
  index?: number
}

const EMPLOYMENT_LABELS: Record<PublicJobItem['employment_type'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}

const REMOTE_LABELS: Record<'onsite' | 'hybrid' | 'remote', string> = {
  onsite: 'Onsite',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

// Letter tiles get a steady colour per company, from the design's logo set.
const LOGO_COLORS = ['#141518', '#1E88D6', '#2E7D32', '#6A3FD1', '#C2410C', '#0F766E', '#1D4ED8', '#BE185D', '#0E7490', '#374151', '#7C2D12', '#4338CA']
export function logoColor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length]
}

function postedLabel(datePosted: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(datePosted).getTime()) / 86_400_000))
  if (Number.isNaN(days)) return 'Posted on company site'
  if (days === 0) return 'Posted today on company site'
  return `Posted ${days} ${days === 1 ? 'day' : 'days'} ago on company site`
}

const HEART = 'M12 20.3s-7.6-4.6-9.2-9.4C1.7 7.5 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.5 3 4.4 6.4-1.6 4.8-9.2 9.4-9.2 9.4z'

export function JobCard({ job, isLoggedIn, isLocked, index = 0 }: JobCardProps) {
  const { saved, toggle } = useSavedJob(job.id)
  const company = job.company_name ?? job.title

  // The backend formats pay with its currency ("USD 160k–210k/yr", "INR 18L–25L/yr").
  // Never reformat it: a hardcoded "$" once mislabelled every Indian salary.
  const pay = job.compensation_label

  const matchLabel =
    isLoggedIn && job.match_strength === 'strong'
      ? 'Strong match'
      : isLoggedIn && job.match_strength === 'partial'
        ? 'Partial match'
        : null
  const matchReasons = matchLabel ? (job.match_reasons?.slice(0, 2) ?? []) : []

  const where = [
    EMPLOYMENT_LABELS[job.employment_type],
    [job.remote_mode && REMOTE_LABELS[job.remote_mode], job.location].filter(Boolean).join(', '),
    job.openings > 1 && `${job.openings} openings`,
    // `!= null` on purpose: a real 0 is worth showing, and mocks omit the field.
    job.applicants_count != null && `${job.applicants_count} applicant${job.applicants_count === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      inert={isLocked}
      className={isLocked ? 'job locked' : 'job'}
      style={{ '--i': index % 9 } as React.CSSProperties}
    >
      <div className="job-top">
        <div className="lg" style={{ background: job.company_logo_url ? 'var(--surface)' : logoColor(company) }} aria-hidden="true">
          {job.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- unknown external hosts, no next.config remotePatterns
            <img src={job.company_logo_url} alt="" />
          ) : (
            company.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 title={job.title}>
            <Link className="job-link" href={`/jobs/${job.id}`}>
              {job.title}
            </Link>
          </h3>
          {job.company_name && <div className="job-co">{job.company_name}</div>}
          <span className="posted">{postedLabel(job.date_posted)}</span>
        </div>
        <button
          className="heart"
          type="button"
          onClick={toggle}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={HEART} strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div>
        {(pay || matchLabel) && (
          <p className="why">
            {matchLabel && <b>{matchLabel}</b>}
            {matchLabel && matchReasons.length > 0 && ` · ${matchReasons.join(' · ')}`}
            {matchLabel && pay && ' · '}
            {pay}
          </p>
        )}
      </div>
      <div className="job-foot">
        <div className="where" title={where}>{where}</div>
        <Link className="btn btn-ghost" href={`/jobs/${job.id}`}>
          Apply
        </Link>
      </div>
    </article>
  )
}
