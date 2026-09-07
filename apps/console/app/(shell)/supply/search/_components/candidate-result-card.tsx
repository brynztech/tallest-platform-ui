'use client'

import type { components } from '@brynzit/api-client'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'
import { availabilityToneClass, humanizeStatus } from '@/(shell)/_lib/status-tone'

type CandidateSearchResult = components['schemas']['CandidateSearchResult']

interface CandidateResultCardProps {
  candidate: CandidateSearchResult & { match_reason?: string }
  rank: number
  isFocused: boolean
  onOpenDetail: (id: string) => void
}

function availabilityLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return humanizeStatus(status).replace(/\b\w/g, (c) => c.toUpperCase())
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
        'relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card px-4 py-3',
        'shadow-[0_1px_2px_rgba(22,18,12,0.04)] transition-colors duration-150 focus:outline-none',
        'hover:bg-[#F2F6FB]',
        isFocused && 'bg-[#F2F6FB]',
      )}
    >
      {/* Selection is the design system's 3px azure bar, not a ring (app/CLAUDE.md §3.2) */}
      {isFocused && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#1550CC]" />}

      {/* Row 1: rank + name + verified + availability */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          #{rank + 1}
        </span>
        <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
          {candidate.name}
        </span>
        {candidate.email_verified && (
          <span className="inline-flex shrink-0 items-center gap-[5px] rounded-full border border-[#D3E2D7] bg-[#EFF4EF] px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap text-[#317A4F]">
            <span className="size-[5px] rounded-full bg-current" />
            verified
          </span>
        )}
        {candidate.availability_status && (
          <span
            className={cn(
              'ml-auto inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap',
              availabilityToneClass(candidate.availability_status),
            )}
          >
            <span className="size-[5px] rounded-full bg-current" />
            {availabilityLabel(candidate.availability_status)}
          </span>
        )}
      </div>

      {/* Row 2: title at company */}
      {(candidate.current_title || candidate.current_company) && (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {candidate.current_title}
          {candidate.current_company ? ` at ${candidate.current_company}` : ''}
        </p>
      )}

      {/* Row 3: location + skills */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {candidate.location && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {candidate.location}
          </span>
        )}
        {topSkills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            {skill}
          </span>
        ))}
        {extraSkillsCount > 0 && (
          <span className="text-xs text-muted-foreground">+{extraSkillsCount} more</span>
        )}
      </div>

      {candidate.match_reason && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{candidate.match_reason}</p>
      )}
    </div>
  )
}
