'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@brynzit/ui/components/ui/button'
import { cn } from '@brynzit/ui/lib/utils'
import { useSavedJob } from '../../_lib/saved-jobs'
import type { PublicJobItem } from '../../_lib/candidate-types'

interface JobCardProps {
  job: PublicJobItem
  isLoggedIn: boolean
  isLocked?: boolean
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

export function JobCard({ job, isLoggedIn, isLocked }: JobCardProps) {
  const { saved, toggle } = useSavedJob(job.id)

  // The backend formats pay with its currency ("USD 160k–210k/yr",
  // "INR 18L–25L/yr"). The card must not reformat it: this used to hardcode "$",
  // which mislabelled every Indian salary — ₹20L would have read as $2M.
  const pay = job.compensation_label

  // Text, not a badge: the DS allows no tags on a card. The reasons are what
  // make the label read as evidence rather than marketing.
  const matchLabel =
    isLoggedIn && job.match_strength === 'strong'
      ? 'Strong match'
      : isLoggedIn && job.match_strength === 'partial'
        ? 'Partial match'
        : null
  const matchReasons = matchLabel ? (job.match_reasons?.slice(0, 2) ?? []) : []

  const meta = [
    EMPLOYMENT_LABELS[job.employment_type],
    job.remote_mode && REMOTE_LABELS[job.remote_mode],
    job.location,
    job.openings > 1 && `${job.openings} openings`,
    // `!= null` on purpose: a real 0 is worth showing, and mocks omit the field.
    job.applicants_count != null &&
      `${job.applicants_count} applicant${job.applicants_count === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      inert={isLocked}
      className={cn(
        'group relative flex h-full flex-col rounded-[20px] border border-border bg-card p-5',
        'transition-[background-color,box-shadow] duration-150 ease-out hover:bg-muted hover:shadow-raised',
        isLocked && 'pointer-events-none blur-[4px] select-none',
      )}
    >
      <Link
        href={`/jobs/${job.id}`}
        className="absolute inset-0 z-0 rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        aria-label={job.title}
      />

      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-muted text-[16px] leading-6 font-semibold text-foreground group-hover:bg-card">
          {job.company_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- unknown external hosts, no next.config remotePatterns
            <img src={job.company_logo_url} alt={job.company_name ?? ''} className="h-full w-full object-cover" />
          ) : (
            (job.company_name ?? job.title).charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Clamped so one long title cannot make its whole grid row taller; the full title is on the detail page. */}
          <p title={job.title} className="line-clamp-2 text-[16px] leading-[22px] font-semibold text-foreground">
            {job.title}
          </p>
          {pay && <p className="text-[14px] leading-5 text-muted-foreground">{pay}</p>}
          {matchLabel && (
            <p className="text-[14px] leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">{matchLabel}</span>
              {matchReasons.length > 0 && ` · ${matchReasons.join(' · ')}`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
          aria-pressed={saved}
          className="-m-2 shrink-0 rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-link"
        >
          <Heart className={cn('h-5 w-5 text-foreground', saved && 'fill-foreground')} strokeWidth={1.6} />
        </button>
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 pt-5">
        <p title={meta} className="min-w-0 truncate text-[14px] leading-8 text-muted-foreground">
          {meta}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-full border-foreground bg-card px-4 text-[14px] leading-5 font-medium shadow-none hover:bg-background"
          asChild
        >
          <Link href={`/jobs/${job.id}`}>Apply</Link>
        </Button>
      </div>
    </div>
  )
}
