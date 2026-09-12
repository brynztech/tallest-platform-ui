'use client'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@brynzit/ui/components/ui/avatar'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Card } from '@brynzit/ui/components/ui/card'
import { cn } from '@brynzit/ui/lib/utils'
import { MapPin, Sparkles } from 'lucide-react'
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
  // The backend formats pay with its currency ("USD 160k–210k/yr",
  // "INR 18L–25L/yr"). The card must not reformat it: this used to hardcode "$",
  // which mislabelled every Indian salary — ₹20L would have read as $2M.
  const pay = job.compensation_label
  const skills = job.skills_display?.length ? job.skills_display : job.skills

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block"
      tabIndex={isLocked ? -1 : undefined}
      aria-hidden={isLocked}
    >
      <Card
        className={cn(
          'min-h-[178px] cursor-pointer rounded-[1.25rem] border-border/70 bg-card/85 p-5',
          'transition-[color,box-shadow,transform] duration-150 ease-out',
          'hover:-translate-y-px hover:bg-card hover:shadow-xl hover:shadow-foreground/[0.06]',
          'group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring',
          isLocked && 'blur-[4px] pointer-events-none select-none',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-medium tracking-[-0.025em] text-foreground">
                {job.title}
              </p>
              {job.openings > 1 && (
                <Badge variant="outline" className="shrink-0 whitespace-nowrap">
                  {job.openings} openings
                </Badge>
              )}
            </div>
            {job.company_name && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  {job.company_logo_url && (
                    <AvatarImage src={job.company_logo_url} alt={job.company_name} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {job.company_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {job.company_name}
              </p>
            )}
            {job.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {job.location}
              </p>
            )}
            {pay && <p className="text-sm font-medium text-foreground">{pay}</p>}
            {job.applicants_count !== null && (
              <p className="text-xs text-muted-foreground">
                {job.applicants_count} applicant{job.applicants_count === 1 ? '' : 's'}
              </p>
            )}

            {/* Explaining the match is what makes the badge trustworthy — a bare
                "Strong match" reads as marketing. */}
            {isLoggedIn &&
              job.match_reasons?.length > 0 &&
              job.match_strength !== 'none' && (
                <p className="flex items-start gap-1.5 pt-0.5 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">
                    {job.match_reasons.slice(0, 2).join(' · ')}
                  </span>
                </p>
              )}
          </div>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
            <Badge variant="secondary">{EMPLOYMENT_LABELS[job.employment_type]}</Badge>
            {job.remote_mode && (
              <Badge variant="secondary">{REMOTE_LABELS[job.remote_mode]}</Badge>
            )}
            {skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && <Badge variant="outline">+{skills.length - 3} more</Badge>}
            {isLoggedIn && job.match_strength === 'strong' && (
              <Badge variant="default">Strong match</Badge>
            )}
            {isLoggedIn && job.match_strength === 'partial' && (
              <Badge variant="secondary">Partial match</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
