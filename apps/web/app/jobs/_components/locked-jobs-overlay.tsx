import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function LockedJobsOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-background via-background/95 to-background/10 pb-10 pt-40">
      <div className="max-w-[360px] rounded-[1.5rem] border border-primary/10 bg-card/90 p-6 text-center shadow-2xl shadow-foreground/[0.08] backdrop-blur-xl">
        <p className="text-lg font-medium tracking-[-0.025em] text-foreground">See all matching roles</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Join Brynzit to view open roles and get AI-matched to opportunities.
        </p>
        <Button asChild size="sm" className="mt-5 rounded-full px-5 shadow-md shadow-primary/15">
          <Link href="/signup">Join for free</Link>
        </Button>
      </div>
    </div>
  )
}
