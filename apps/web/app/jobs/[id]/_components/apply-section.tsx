'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { candidateJsonHeaders } from '../../../_lib/candidate-api'
import { SaveJobButton } from '../../_components/save-job-button'
import type { CandidateApplication } from '../../../_lib/candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
// Apply and Save: stacked and full width on phones, side by side from sm.
export const ACTION_ROW = 'flex flex-col gap-3 sm:flex-row sm:flex-wrap'

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
      <div className="grid gap-4">
        <div className={ACTION_ROW}>
          <Link className="btn btn-primary" href={`/signup?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}>
            Sign up to apply
          </Link>
          <SaveJobButton jobId={jobId} />
        </div>
        <p className="notice">Sign in to apply for this role.</p>
      </div>
    )
  }

  if (applied) {
    return (
      <div className={ACTION_ROW}>
        <button type="button" className="btn btn-ghost" disabled>
          Applied
        </button>
        <SaveJobButton jobId={jobId} />
      </div>
    )
  }

  if (score >= 70) {
    return (
      <div className="grid gap-4">
        <div className="field">
          <label htmlFor="apply-note">Add a note (optional)</label>
          <textarea
            id="apply-note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note to the recruiter…"
          />
          <p className="small text-right">{note.length} / 200</p>
        </div>
        <div className={ACTION_ROW}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || note.length > 200}
          >
            {applyMutation.isPending ? 'Submitting…' : 'Apply now'}
          </button>
          <SaveJobButton jobId={jobId} />
        </div>
      </div>
    )
  }

  // Incomplete profile state — completeness_score < 70
  return (
    <div className="grid gap-4">
      <p className="small">Your profile is {score}% complete. Reach 70% to apply in one click.</p>
      <Progress value={score} />
      <div className={ACTION_ROW}>
        <Link className="btn btn-ghost" href="/profile/edit">
          Complete your profile
        </Link>
        <SaveJobButton jobId={jobId} />
      </div>
    </div>
  )
}
