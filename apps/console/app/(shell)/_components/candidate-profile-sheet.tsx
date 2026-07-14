'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@brynzit/ui/components/ui/sheet'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { toast } from 'sonner'
import { X, Sparkles, MapPin, Code2, Mail, CheckCircle, ExternalLink, Download, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CandidateRelationshipSection } from './candidate-relationship-section'

interface CandidateProfileSheetProps {
  candidateId: string | null
  submissionId?: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  source?: 'search' | 'shortlist'
  requisitionId?: string
}

// CR-04: Reject javascript: / data: URLs from API-supplied href values
function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url
  } catch {
    // relative paths — allow
    if (url.startsWith('/')) return url
  }
  return undefined
}

function availabilityBadgeClass(status: string | null | undefined) {
  if (status === 'available') {
    return 'border text-xs px-1.5 py-0.5 bg-[oklch(0.45_0.15_145_/_0.15)] text-[oklch(0.45_0.15_145)] border-[oklch(0.45_0.15_145_/_0.4)]'
  }
  if (status === 'open_to_offers') return ''
  return 'text-muted-foreground border-border'
}

function availabilityBadgeVariant(
  status: string | null | undefined,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'open_to_offers') return 'secondary'
  return 'outline'
}

function availabilityLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CandidateProfileSheet({
  candidateId,
  submissionId,
  isOpen,
  onOpenChange,
  source = 'search',
  requisitionId,
}: CandidateProfileSheetProps) {
  const queryClient = useQueryClient()

  // ---- Candidate query ----
  const { data, isLoading } = useQuery({
    queryKey: ['supply-candidate', candidateId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/candidates/{candidate_id}',
        { params: { path: { candidate_id: candidateId! } } },
      )
      if (error) throw error
      return data
    },
    enabled: !!candidateId && isOpen,
    staleTime: 30 * 1000,
  })

  // ---- Enrichment state (manual interval — CandidateProfileResponse has no .status field) ----
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichError, setEnrichError] = useState(false)

  useEffect(() => {
    if (!isEnriching || !candidateId) return
    setEnrichError(false)
    const interval = setInterval(async () => {
      // refetchQueries awaits the actual network response; invalidateQueries only
      // marks stale and triggers a background refetch — getQueryData after it returns
      // the old value, causing the success path to never fire (CR-01).
      await queryClient.refetchQueries({ queryKey: ['supply-candidate', candidateId] })
      const cached = queryClient.getQueryData(['supply-candidate', candidateId]) as
        | components['schemas']['CandidateProfileResponse']
        | undefined
      const tp = cached?.talent_pool
      if (tp?.email_verified !== null || tp?.github_public_repos !== null) {
        setIsEnriching(false)
        toast.success('Candidate enriched.')
      }
    }, 2000)
    const timeout = setTimeout(() => {
      setIsEnriching(false)
      setEnrichError(true)
    }, 30000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isEnriching, candidateId, queryClient])

  // Reset enrichment state when candidate changes
  useEffect(() => {
    setIsEnriching(false)
    setEnrichError(false)
  }, [candidateId])

  // ---- Enrich mutation ----
  const enrichMutation = useMutation({
    mutationFn: () =>
      apiClient.POST('/api/v1/supply/candidates/{candidate_id}/enrich', {
        params: { path: { candidate_id: candidateId! } },
      }),
    onSuccess: () => setIsEnriching(true),
    onError: () => setEnrichError(true),
  })

  // ---- Shortlist action mutation (source='shortlist' only) ----
  const [pendingTimeouts] = useState(() => new Map<string, ReturnType<typeof setTimeout>>())

  const actionMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId! } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
      queryClient.invalidateQueries({ queryKey: ['supply-shortlist'] })
    },
    onError: () => {
      toast.error('Failed to update — try again.')
    },
  })

  function handleShortlistAction(newStatus: 'approved' | 'hold' | 'passed') {
    if (!submissionId) return
    const candidate = data as components['schemas']['CandidateProfileResponse'] | undefined
    const name = candidate?.name ?? 'Candidate'
    const toastMsg =
      newStatus === 'approved'
        ? `${name} approved.`
        : newStatus === 'hold'
          ? `Marked ${name} as hold.`
          : `Passed on ${name}.`

    // Cancel any pending timeout for this submission
    const existing = pendingTimeouts.get(submissionId)
    if (existing) {
      clearTimeout(existing)
      pendingTimeouts.delete(submissionId)
    }

    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(submissionId)
      actionMutation.mutate({ status: newStatus })
    }, 5000)
    pendingTimeouts.set(submissionId, timeoutId)

    toast(toastMsg, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          const t = pendingTimeouts.get(submissionId)
          if (t) {
            clearTimeout(t)
            pendingTimeouts.delete(submissionId)
          }
          queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
          queryClient.invalidateQueries({ queryKey: ['supply-shortlist'] })
        },
      },
    })
  }

  const candidate = data as components['schemas']['CandidateProfileResponse'] | undefined
  const talentPool = candidate?.talent_pool
  const skills = talentPool?.skills ?? []
  const needsEnrichment =
    talentPool?.github_public_repos == null && talentPool?.email_verified == null

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[560px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <SheetDescription className="sr-only">Enriched candidate profile.</SheetDescription>
          {isLoading ? (
            <>
              <SheetTitle className="sr-only">Candidate detail</SheetTitle>
              <Skeleton className="h-6 w-48" />
            </>
          ) : (
            <div className="flex flex-1 min-w-0 flex-col">
              <SheetTitle className="text-xl font-semibold leading-tight">
                {candidate?.name ?? 'Unknown Candidate'}
              </SheetTitle>
              {(talentPool?.current_title || candidate?.current_title) && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {talentPool?.current_title ?? candidate?.current_title}
                  {candidate?.current_company ? ` at ${candidate.current_company}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Enrich button area */}
          {!isLoading && (
            <div className="flex items-center gap-2 shrink-0">
              {needsEnrichment && !isEnriching && !enrichError && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => enrichMutation.mutate()}
                  disabled={enrichMutation.isPending}
                >
                  <Sparkles className="mr-1 size-4" />
                  Enrich
                </Button>
              )}
              {isEnriching && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Enriching…
                </span>
              )}
              {enrichError && (
                <span className="text-xs text-destructive">
                  Enrichment failed —{' '}
                  <button className="underline" onClick={() => enrichMutation.mutate()}>
                    retry
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 size-8"
            onClick={() => onOpenChange(false)}
            aria-label="Close candidate panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Quick action bar — only when source='shortlist' and submissionId set */}
        {source === 'shortlist' && submissionId && (
          <div className="px-6 py-3 flex gap-2 border-b border-border">
            <Button
              variant="default"
              size="sm"
              disabled={actionMutation.isPending}
              onClick={() => handleShortlistAction('approved')}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actionMutation.isPending}
              onClick={() => handleShortlistAction('hold')}
            >
              Hold
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={actionMutation.isPending}
              onClick={() => handleShortlistAction('passed')}
            >
              Pass on Candidate
            </Button>
          </div>
        )}

        {/* Generate Engagement area — only when source='search' */}
        {source === 'search' && (
          <div className="px-6 py-3 border-b border-border">
            <Button variant="outline" size="sm">
              <Zap className="mr-1 size-4" />
              Generate Engagement
            </Button>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : candidate ? (
            <>
              {/* Summary section */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  SUMMARY
                </p>
                <div className="flex flex-col gap-1.5">
                  {talentPool?.location && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3" />
                      {talentPool.location}
                    </span>
                  )}
                  {talentPool?.availability_status && (
                    <div>
                      <Badge
                        variant={availabilityBadgeVariant(talentPool.availability_status)}
                        className={cn(availabilityBadgeClass(talentPool.availability_status))}
                      >
                        {availabilityLabel(talentPool.availability_status)}
                      </Badge>
                    </div>
                  )}
                  {talentPool?.total_years_experience != null && (
                    <span className="text-sm text-muted-foreground">
                      {talentPool.total_years_experience} yrs experience
                    </span>
                  )}
                </div>
              </div>

              {/* Skills section */}
              {(skills.length > 0 || isEnriching) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      SKILLS
                    </p>
                    {isEnriching ? (
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-5 w-16" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Experience section */}
              {(candidate.current_title || candidate.current_company || talentPool?.current_title) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      EXPERIENCE
                    </p>
                    <p className="text-sm">
                      {talentPool?.current_title ?? candidate.current_title}
                      {candidate.current_company ? ` at ${candidate.current_company}` : ''}
                    </p>
                    {talentPool?.seniority && (
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {talentPool.seniority}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* GitHub Signals section */}
              {(talentPool?.github_url || isEnriching) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      GITHUB SIGNALS
                    </p>
                    {isEnriching ? (
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 text-sm">
                        {talentPool?.github_public_repos != null && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Code2 className="size-3" />
                            Public repos: {talentPool.github_public_repos}
                          </span>
                        )}
                        {talentPool?.github_top_languages && talentPool.github_top_languages.length > 0 && (
                          <span className="text-muted-foreground text-xs">
                            Top languages: {talentPool.github_top_languages.join(', ')}
                          </span>
                        )}
                        {talentPool?.github_url && (
                          <a
                            href={safeHref(talentPool.github_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline text-xs"
                          >
                            <ExternalLink className="size-3" />
                            GitHub Profile
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Contact section */}
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  CONTACT
                </p>
                {isEnriching ? (
                  <Skeleton className="h-4 w-[200px]" />
                ) : (
                  <div className="flex flex-col gap-1.5 text-sm">
                    {candidate.email && (
                      <a
                        href={`mailto:${candidate.email}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="size-3" />
                        {candidate.email}
                      </a>
                    )}
                    {talentPool?.email_verified && (
                      <span className="flex items-center gap-1.5 text-xs text-[oklch(0.45_0.15_145)]">
                        <CheckCircle className="size-3" />
                        Email verified
                      </span>
                    )}
                    {candidate.linkedin_url && (
                      <a
                        href={safeHref(candidate.linkedin_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline text-xs"
                      >
                        <ExternalLink className="size-3" />
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Resume section */}
              {(talentPool?.resume_file_path || isEnriching) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      RESUME
                    </p>
                    {isEnriching ? (
                      <Skeleton className="h-4 w-[160px]" />
                    ) : (
                      talentPool?.resume_file_path && (
                        <a
                          href={safeHref(talentPool.resume_file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline text-xs"
                        >
                          <Download className="size-3" />
                          Download Resume
                        </a>
                      )
                    )}
                  </div>
                </>
              )}

              <CandidateRelationshipSection
                candidateId={candidateId}
                requisitionId={requisitionId}
              />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
