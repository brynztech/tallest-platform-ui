'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Card } from '@brynzit/ui/components/ui/card'
import { Skeleton } from '@brynzit/ui/components/ui/skeleton'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import { candidateAuthHeaders } from '../_lib/candidate-api'
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
    <main className="mx-auto max-w-[920px] space-y-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Application tracker</p>
          <h1 className="text-3xl font-light tracking-[-0.04em] text-foreground">Your Brynzit pipeline</h1>
          <p className="max-w-[560px] text-sm leading-6 text-muted-foreground">
            Track roles you applied to and see where each one is in recruiter review.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/jobs">Browse more jobs</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[132px] rounded-[1.25rem]" />
          ))}
        </div>
      ) : error ? (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 p-6">
          <p className="text-sm text-destructive">Couldn&apos;t load applications. Please refresh and try again.</p>
        </Card>
      ) : (data?.items.length ?? 0) === 0 ? (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/85 p-8 text-center shadow-2xl shadow-foreground/[0.04]">
          <h2 className="text-xl font-light tracking-[-0.03em] text-foreground">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-[460px] text-sm leading-6 text-muted-foreground">
            Browse the job preview, upload your resume if you haven&apos;t already, and apply once
            your profile reaches the one-click threshold.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link href="/jobs">Find roles worth your time</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.items.map((application) => (
            <Card
              key={application.id}
              className="rounded-[1.25rem] border-border/70 bg-card/85 p-5 shadow-xl shadow-foreground/[0.04]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <Link
                    href={`/jobs/${application.job_id}`}
                    className="text-lg font-medium tracking-[-0.025em] text-foreground hover:underline"
                  >
                    {application.job_title ?? 'Open role'}
                  </Link>
                  {application.company_name && (
                    <p className="text-sm text-muted-foreground">{application.company_name}</p>
                  )}
                  {application.substep_label && (
                    <p className="text-sm text-muted-foreground">{application.substep_label}</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <Badge variant={application.status === 'rejected' ? 'secondary' : 'default'}>
                    {STATUS_LABELS[application.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
