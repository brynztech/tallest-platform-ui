'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Label } from '@brynzit/ui/components/ui/label'
import { candidateJsonHeaders } from '../../../_lib/candidate-api'
import { NOTICE, PRIMARY_BTN as PRIMARY, SECONDARY_BTN as SECONDARY, TEXTAREA } from '../../../_lib/ui-classes'
import { SaveJobButton } from '../../_components/save-job-button'
import type { CandidateApplication } from '../../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'


interface ApplySectionProps {
  jobId: string
  isLoggedIn: boolean
  completenessScore: number | null
}

export function ApplySection({ jobId, isLoggedIn, completenessScore }: ApplySectionProps) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [applied, setApplied] = useState(false)
  const score = completenessScore ?? 0

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/candidate/applications`, {
        method: 'POST',
        headers: candidateJsonHeaders(),
        body: JSON.stringify({ job_id: jobId, ...(note.trim() ? { note: note.trim() } : {}) }),
      })
      if (!res.ok) throw new Error(`Apply failed: ${res.status}`)
      return res.json() as Promise<CandidateApplication>
    },
    onSuccess: () => {
      toast.success('Application submitted.')
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] })
      setApplied(true)
    },
    onError: () => toast.error("Couldn't submit application. Please try again."),
  })

  if (!isLoggedIn) {
    return (
      <div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className={PRIMARY}>
            <Link href={`/signup?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}>Sign up to apply</Link>
          </Button>
          <SaveJobButton jobId={jobId} />
        </div>
        <p className={`mt-4 ${NOTICE}`}>Sign in to apply for this role.</p>
      </div>
    )
  }

  if (applied) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button disabled variant="outline" className={SECONDARY}>
          Applied
        </Button>
        <SaveJobButton jobId={jobId} />
      </div>
    )
  }

  if (score >= 70) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="apply-note" className="text-[14px] leading-5 font-medium text-foreground">
            Add a note (optional)
          </Label>
          <Textarea
            id="apply-note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note to the recruiter…"
            className={`mt-2 ${TEXTAREA}`}
          />
          <p className="mt-1 text-right text-[14px] leading-5 text-muted-foreground">{note.length} / 200</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => applyMutation.mutate()}
            className={PRIMARY}
            disabled={applyMutation.isPending || note.length > 200}
          >
            {applyMutation.isPending ? 'Submitting…' : 'Apply now'}
          </Button>
          <SaveJobButton jobId={jobId} />
        </div>
      </div>
    )
  }

  // Incomplete profile state — completeness_score < 70
  return (
    <div className="space-y-4">
      <p className="text-[14px] leading-5 text-muted-foreground">
        Your profile is {score}% complete. Reach 70% to apply in one click.
      </p>
      <Progress value={score} className="h-2 [&>div]:bg-primary" />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className={SECONDARY}>
          <Link href="/profile/edit">Complete your profile</Link>
        </Button>
        <SaveJobButton jobId={jobId} />
      </div>
    </div>
  )
}
