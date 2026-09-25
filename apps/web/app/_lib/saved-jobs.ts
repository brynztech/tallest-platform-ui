import { useCallback, useEffect, useState } from 'react'

const SAVED_JOBS_KEY = 'brynz_saved_jobs'

function readSavedJobs(): string[] {
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

  const toggle = useCallback(() => {
    const current = readSavedJobs()
    const next = current.includes(jobId) ? current.filter(id => id !== jobId) : [...current, jobId]
    window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next))
    setSaved(next.includes(jobId))
  }, [jobId])

  return { saved, toggle }
}
