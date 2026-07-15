'use client'

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
import { X } from 'lucide-react'

interface CandidateDetailPanelProps {
  candidateId: string | null
  submissionId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: () => void
}

export function CandidateDetailPanel({
  candidateId,
  submissionId,
  isOpen,
  onOpenChange,
  onApprove,
}: CandidateDetailPanelProps) {
  const queryClient = useQueryClient()

  // Lazy fetch: only fires when sheet is open and candidateId is set (T-03-16 mitigation)
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

  // CRITICAL: Shortlist actions use SUPPLY domain PATCH — NOT ops endpoint
  // submission_id must be the actual shortlist submission UUID, not the candidate UUID
  const actionMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiClient.PATCH('/api/v1/supply/shortlists/{submission_id}', {
        params: { path: { submission_id: submissionId! } },
        body: { status } satisfies components['schemas']['PatchSubmissionRequest'],
      }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({
        queryKey: ['supply-shortlist'],
      })
      queryClient.invalidateQueries({ queryKey: ['ops-shortlist'] })
      if (status === 'approved' && onApprove) onApprove()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to update — try again.')
    },
  })

  const candidate = data as components['schemas']['supply__schemas__candidates__CandidateProfileResponse'] | undefined
  const talentPool = candidate?.talent_pool
  const skills = talentPool?.skills ?? []
  const fitScore = talentPool?.total_years_experience

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[560px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <SheetDescription className="sr-only">
            Enriched candidate profile.
          </SheetDescription>
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
              {talentPool?.current_title && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {talentPool.current_title}
                </p>
              )}
            </div>
          )}
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

        {/* Quick action bar */}
        {candidateId && (
          <div className="flex items-center gap-2 border-b border-border px-6 py-3">
            <Button
              size="sm"
              variant="default"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ status: 'approved' })}
            >
              Approve Candidate
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ status: 'hold' })}
            >
              Hold Candidate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={actionMutation.isPending}
              onClick={() => actionMutation.mutate({ status: 'passed' })}
            >
              Pass on Candidate
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
              {/* Fit score / experience */}
              {fitScore != null && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    Total Years Experience
                  </p>
                  <p className="text-xl font-semibold text-primary">
                    {fitScore} yrs
                  </p>
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Contact & meta */}
              <Separator />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Profile</h3>
                <div className="flex flex-col gap-1 text-sm">
                  {candidate.email && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">Email</span>
                      <a
                        href={`mailto:${candidate.email}`}
                        className="text-primary hover:underline"
                      >
                        {candidate.email}
                      </a>
                    </div>
                  )}
                  {candidate.current_company && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">Company</span>
                      <span>{candidate.current_company}</span>
                    </div>
                  )}
                  {talentPool?.location && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">Location</span>
                      <span>{talentPool.location}</span>
                    </div>
                  )}
                  {talentPool?.seniority && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">Seniority</span>
                      <span className="capitalize">{talentPool.seniority}</span>
                    </div>
                  )}
                  {talentPool?.availability_status && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">
                        Availability
                      </span>
                      <span className="capitalize">
                        {talentPool.availability_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {candidate.linkedin_url && (
                    <div className="flex gap-2">
                      <span className="w-28 text-muted-foreground">LinkedIn</span>
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub */}
              {(talentPool?.github_url || talentPool?.github_public_repos != null) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">GitHub</h3>
                    <div className="flex flex-col gap-1 text-sm">
                      {talentPool.github_url && (
                        <div className="flex gap-2">
                          <span className="w-28 text-muted-foreground">Profile</span>
                          <a
                            href={talentPool.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View GitHub
                          </a>
                        </div>
                      )}
                      {talentPool.github_public_repos != null && (
                        <div className="flex gap-2">
                          <span className="w-28 text-muted-foreground">
                            Public repos
                          </span>
                          <span>{talentPool.github_public_repos}</span>
                        </div>
                      )}
                      {talentPool.github_top_languages &&
                        talentPool.github_top_languages.length > 0 && (
                          <div className="flex gap-2">
                            <span className="w-28 text-muted-foreground">
                              Top languages
                            </span>
                            <span>
                              {talentPool.github_top_languages.join(', ')}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
