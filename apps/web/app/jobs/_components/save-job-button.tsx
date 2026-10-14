'use client'
import { useSavedJob } from '../../_lib/saved-jobs'

export function SaveJobButton({ jobId }: { jobId: string }) {
  const { saved, toggle } = useSavedJob(jobId)

  return (
    <button type="button" className="btn btn-ghost" onClick={toggle} aria-pressed={saved}>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
