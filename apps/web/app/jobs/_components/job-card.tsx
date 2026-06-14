'use client'
import Link from 'next/link'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Card } from '@brynzit/ui/components/ui/card'
import { cn } from '@brynzit/ui/lib/utils'
import { MapPin } from 'lucide-react'
import type { PublicJobItem } from '../../_lib/candidate-types'

interface JobCardProps {
  job: PublicJobItem
  isLoggedIn: boolean
  isLocked?: boolean
}

function formatComp(min: number | null, max: number | null): string | null {
  if (!min) return null
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
  return max && max !== min ? `${fmt(min)}–${fmt(max)}` : fmt(min)
}

const EMPLOYMENT_LABELS: Record<PublicJobItem['employment_type'], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
}

export function JobCard({ job, isLoggedIn, isLocked }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="block" aria-hidden={isLocked}>
      <Card
        className={cn(
          'cursor-pointer p-4 transition-colors hover:bg-muted',
          isLocked && 'blur-[4px] pointer-events-none select-none',
        )}
      >
        <div className="space-y-2">
          <p className="text-base text-foreground">{job.title}</p>
          {job.company_name && (
            <p className="text-sm text-muted-foreground">{job.company_name}</p>
          )}
          {job.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {job.location}
            </p>
          )}
          {formatComp(job.compensation_min, job.compensation_max) && (
            <p className="text-sm text-muted-foreground">
              {formatComp(job.compensation_min, job.compensation_max)}
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary">{EMPLOYMENT_LABELS[job.employment_type]}</Badge>
            {job.skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="outline">+{job.skills.length - 3} more</Badge>
            )}
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
