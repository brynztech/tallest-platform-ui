'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@brynzit/ui/components/ui/button'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { cn } from '@brynzit/ui/lib/utils'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../_lib/candidate-api'
import { PANEL, PRIMARY_BTN, SECONDARY_BTN } from '../_lib/ui-classes'
import type { CandidateApplication, CandidateApplicationsResponse } from '../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const STATUS_LABELS: Record<CandidateApplication['status'], string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Closed',
}

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn } = useCandidateAuth()

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login?redirect=/dashboard')
  }, [isLoggedIn, router])

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/candidate/applications`, {
        headers: candidateAuthHeaders(),
      })
      if (!response.ok) throw new Error(`Applications fetch failed: ${response.status}`)
      return response.json() as Promise<CandidateApplicationsResponse>
    },
    enabled: isLoggedIn,
  })

  if (!isLoggedIn) return null

  return (
    <main className="mx-auto max-w-[944px] px-4 pt-8 pb-20 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[14px] leading-5 text-muted-foreground">Application tracker</p>
          <h1 className="text-[26px] leading-[32px] font-semibold tracking-[-0.03em] text-foreground sm:text-[32px] sm:leading-[38px]">
            Your Brynz pipeline
          </h1>
          <p className="max-w-[560px] text-[16px] leading-6 text-muted-foreground">
            Track roles you applied to and see where each one is in recruiter review.
          </p>
        </div>
        <Button variant="outline" asChild className={SECONDARY_BTN}>
          <Link href="/jobs">Browse more jobs</Link>
        </Button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[88px] rounded-[20px]" />
            ))}
          </div>
        ) : error ? (
          <div className={PANEL}>
            <p className="text-[14px] leading-5 text-destructive">Couldn&apos;t load applications. Please refresh and try again.</p>
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <div className={`${PANEL} text-center`}>
            <h2 className="text-[16px] leading-6 font-semibold text-foreground">No applications yet</h2>
            <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-5 text-muted-foreground">
              Browse the job preview, upload your resume if you haven&apos;t already, and apply once
              your profile reaches the one-click threshold.
            </p>
            <Button asChild className={`mt-5 ${PRIMARY_BTN}`}>
              <Link href="/jobs">Find roles worth your time</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((application) => (
              <div
                key={application.id}
                className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <Link
                    href={`/jobs/${application.job_id}`}
                    className="text-[16px] leading-6 font-semibold text-foreground hover:underline"
                  >
                    {application.job_title ?? 'Open role'}
                  </Link>
                  {application.company_name && (
                    <p className="text-[14px] leading-5 text-muted-foreground">{application.company_name}</p>
                  )}
                  {application.substep_label && (
                    <p className="text-[14px] leading-5 text-muted-foreground">{application.substep_label}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-[14px] leading-5',
                      application.status === 'rejected'
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {STATUS_LABELS[application.status]}
                  </span>
                  <p className="text-[14px] leading-5 text-muted-foreground">
                    Applied {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
