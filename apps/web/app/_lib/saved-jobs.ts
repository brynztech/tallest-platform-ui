'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCandidateAuth } from '../_components/candidate-auth-context'
import { candidateAuthHeaders } from './candidate-api'
import type { PublicJobItem } from './candidate-types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** The signed-in candidate's saved jobs, from the server (newest first). The query key
 *  carries the candidate id, so switching accounts never shows the previous account's list. */
export function useSavedJobs() {
  const { isLoggedIn, candidate } = useCandidateAuth()

  useEffect(() => {
    // Saved jobs used to live in one browser key shared by every login. They belonged to
    // nobody in particular, so they are dropped rather than copied to an account.
    try {
      localStorage.removeItem('brynz_saved_jobs')
    } catch {}
  }, [])

  return useQuery({
    queryKey: ['saved-jobs', candidate?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/candidate/saved-jobs`, { headers: candidateAuthHeaders() })
      if (!res.ok) throw new Error(`Saved jobs fetch failed: ${res.status}`)
      return ((await res.json()) as { items: PublicJobItem[] }).items
    },
    enabled: isLoggedIn,
  })
}

export function useSavedJob(jobId: string) {
  const { isLoggedIn, candidate } = useCandidateAuth()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { data } = useSavedJobs()
  // Shows the new state at once; cleared when the request settles and the list refetches.
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const saved = optimistic ?? data?.some(job => job.id === jobId) ?? false

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await fetch(`${API_BASE}/api/v1/candidate/saved-jobs/${jobId}`, {
        method: next ? 'PUT' : 'DELETE',
        headers: candidateAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Saving failed: ${res.status}`)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['saved-jobs', candidate?.id] })
      setOptimistic(null)
    },
  })

  function toggle() {
    // Saving needs an account: send visitors to sign up, then back here.
    if (!isLoggedIn) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    setOptimistic(!saved)
    mutation.mutate(!saved)
  }

  return { saved, toggle }
}
