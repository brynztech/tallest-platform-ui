import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function LockedJobsOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-background via-background/95 to-background/10 pb-10 pt-40">
      <div className="max-w-[420px] rounded-[1.5rem] border border-primary/10 bg-card/90 p-6 text-center shadow-2xl shadow-foreground/[0.08] backdrop-blur-xl">
        <p className="text-sm font-medium text-primary">Find out which jobs are worth your time</p>
        <p className="mt-2 text-xl font-light tracking-[-0.035em] text-foreground">Unlock your AI-ranked shortlist</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume and Brynzit will reveal match strength, recruiter-ready profile signals,
          and the roles where you should move first.
        </p>
        <Button asChild size="sm" className="mt-5 rounded-full px-5 shadow-md shadow-primary/15">
          <Link href="/signup?intent=resume_scan">Upload resume to reveal matches</Link>
        </Button>
      </div>
    </div>
  )
}
