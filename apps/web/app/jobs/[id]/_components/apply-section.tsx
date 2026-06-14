'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { Label } from '@brynzit/ui/components/ui/label'
import { Separator } from '@brynzit/ui/components/ui/separator'
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
        headers: { 'Content-Type': 'application/json' },
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
      <div className="pt-4">
        <Separator className="mb-4" />
        <Button asChild className="w-full" size="lg">
          <Link href={`/signup?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}>
            Sign up to apply
          </Link>
        </Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to apply for this role.
        </p>
      </div>
    )
  }

  if (applied) {
    return (
      <div className="pt-4">
        <Separator className="mb-4" />
        <Button disabled className="w-full" size="lg" variant="outline">
          Applied
        </Button>
      </div>
    )
  }

  if (score >= 70) {
    return (
      <div className="pt-4 space-y-3">
        <Separator className="mb-4" />
        <div>
          <Label htmlFor="apply-note">Add a note (optional)</Label>
          <Textarea
            id="apply-note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note to the recruiter…"
          />
          <p className="mt-1 text-right text-sm text-muted-foreground">{note.length} / 200</p>
        </div>
        <Button
          onClick={() => applyMutation.mutate()}
          className="w-full"
          size="lg"
          disabled={applyMutation.isPending || note.length > 200}
        >
          {applyMutation.isPending ? 'Submitting…' : 'Apply now'}
        </Button>
      </div>
    )
  }

  // Incomplete profile state — completeness_score < 70
  return (
    <div className="pt-4 space-y-3">
      <Separator className="mb-4" />
      <p className="text-sm text-muted-foreground">
        Your profile is {score}% complete. Reach 70% to apply in one click.
      </p>
      <Progress value={score} className="h-2 [&>div]:bg-primary" />
      <Button asChild variant="outline" className="w-full" size="lg">
        <Link href="/profile/edit">Complete your profile</Link>
      </Button>
    </div>
  )
}
