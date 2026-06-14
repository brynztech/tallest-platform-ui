'use client'

import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { cn } from '@/lib/utils'
import { MapPin, CheckCircle, Github } from 'lucide-react'

type CandidateSearchResult = components['schemas']['CandidateSearchResult']

interface CandidateResultCardProps {
  candidate: CandidateSearchResult & { match_reason?: string }
  rank: number
  isFocused: boolean
  onOpenDetail: (id: string) => void
}

function availabilityBadgeClass(status: string | null | undefined) {
  if (status === 'available') {
    return 'border text-xs px-1.5 py-0.5 bg-[oklch(0.45_0.15_145_/_0.15)] text-[oklch(0.45_0.15_145)] border-[oklch(0.45_0.15_145_/_0.4)]'
  }
  if (status === 'open_to_offers') {
    return ''
  }
  return 'text-muted-foreground border-border'
}

function availabilityBadgeVariant(
  status: string | null | undefined,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'open_to_offers') return 'secondary'
  if (status === 'available') return 'outline'
  return 'outline'
}

function availabilityLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CandidateResultCard({
  candidate,
  rank,
  isFocused,
  onOpenDetail,
}: CandidateResultCardProps) {
  const topSkills = (candidate.skills ?? []).slice(0, 3)
  const extraSkillsCount = (candidate.skills?.length ?? 0) - 3

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onOpenDetail(candidate.candidate_id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDetail(candidate.candidate_id)
      }}
      className={cn(
        'relative cursor-pointer rounded-xl border bg-card px-4 py-3 transition-all focus:outline-none',
        isFocused && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      {/* Row 1: rank badge + name + availability badge */}
      <div className="flex items-start gap-3">
        {rank <= 2 ? (
          <Badge className="shrink-0 text-xs font-semibold px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
            #{rank + 1}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">#{rank + 1}</span>
        )}
        <span className="text-sm font-semibold flex-1 truncate">{candidate.name}</span>
        <Badge
          variant={availabilityBadgeVariant(candidate.availability_status)}
          className={cn('ml-auto shrink-0', availabilityBadgeClass(candidate.availability_status))}
        >
          {availabilityLabel(candidate.availability_status)}
        </Badge>
      </div>

      {/* Row 2: title + company */}
      {(candidate.current_title || candidate.current_company) && (
        <div className="flex gap-1 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">
            {candidate.current_title}
            {candidate.current_company ? ` at ${candidate.current_company}` : ''}
          </span>
        </div>
      )}

      {/* Row 3: location + skills */}
      <div className="flex items-start gap-4 mt-2">
        {candidate.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <MapPin className="size-3" />
            {candidate.location}
          </span>
        )}
        <div className="flex flex-wrap gap-1">
          {topSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {extraSkillsCount > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              +{extraSkillsCount} more
            </Badge>
          )}
        </div>
      </div>

      {/* Row 4: match reason */}
      {candidate.match_reason && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{candidate.match_reason}</p>
      )}

      {/* Row 5: secondary badges */}
      {(candidate.email_verified || candidate.github_public_repos != null) && (
        <div className="flex gap-2 mt-2">
          {candidate.email_verified && (
            <span className="flex items-center gap-1 text-xs text-[oklch(0.45_0.15_145)]">
              <CheckCircle className="size-3" />
              Verified
            </span>
          )}
          {candidate.github_public_repos != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Github className="size-3" />
              {candidate.github_public_repos} repos
            </span>
          )}
        </div>
      )}
    </div>
  )
}
