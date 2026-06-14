import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function LockedJobsOverlay() {
  return (
    <div className="absolute inset-x-0 top-1/4 z-10 flex justify-center">
      <div className="rounded-xl border border-border bg-background p-6 shadow-lg text-center max-w-sm">
        <h3 className="text-xl font-normal text-foreground">See all matching roles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Brynzit to view all open roles and get AI-matched to opportunities.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link href="/signup">Join for free</Link>
        </Button>
      </div>
    </div>
  )
}
