import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCandidateAuth } from '../_components/candidate-auth-context'

const SAVED_JOBS_KEY = 'brynz_saved_jobs'

export function readSavedJobs(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_JOBS_KEY) ?? '[]')
  } catch {
    return []
  }
}

// ponytail: browser-only saved jobs. Move to the API once a saved-jobs endpoint exists.
export function useSavedJob(jobId: string) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(readSavedJobs().includes(jobId))
  }, [jobId])

  const { isLoggedIn } = useCandidateAuth()
  const router = useRouter()
  const pathname = usePathname()

  const toggle = useCallback(() => {
    // Saving needs an account: send visitors to sign up, then back here.
    if (!isLoggedIn) {
      router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    const current = readSavedJobs()
    const next = current.includes(jobId) ? current.filter(id => id !== jobId) : [...current, jobId]
    window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next))
    setSaved(next.includes(jobId))
  }, [jobId, isLoggedIn, router, pathname])

  return { saved, toggle }
}
