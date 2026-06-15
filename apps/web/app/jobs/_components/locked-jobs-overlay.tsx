import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function LockedJobsOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-background via-background/90 to-transparent pb-8 pt-32">
      <div className="max-w-sm px-4 text-center">
        <p className="text-base font-normal text-foreground">See all matching roles</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Join Brynzit to view open roles and get AI-matched to opportunities.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/signup">Join for free</Link>
        </Button>
      </div>
    </div>
  )
}
