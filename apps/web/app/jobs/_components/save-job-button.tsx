'use client'
import { Button } from '@brynzit/ui/components/ui/button'
import { useSavedJob } from '../../_lib/saved-jobs'
import { SECONDARY_BTN } from '../../_lib/ui-classes'

export function SaveJobButton({ jobId }: { jobId: string }) {
  const { saved, toggle } = useSavedJob(jobId)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      aria-pressed={saved}
      className={SECONDARY_BTN}
    >
      {saved ? 'Saved' : 'Save'}
    </Button>
  )
}
