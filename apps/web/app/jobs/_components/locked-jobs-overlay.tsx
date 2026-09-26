import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function LockedJobsOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-4 pb-8 pt-32">
      <div className="max-w-[440px] rounded-[20px] border border-border bg-card p-6 text-center shadow-raised">
        <p className="text-[14px] leading-5 text-muted-foreground">Find out which jobs are worth your time</p>
        <p className="mt-1 text-[20px] leading-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[24px] sm:leading-[30px]">Unlock your AI-ranked shortlist</p>
        <p className="mt-2 text-[16px] leading-6 text-muted-foreground">
          Upload your resume and Brynz will reveal match strength, recruiter-ready profile signals,
          and the roles where you should move first.
        </p>
        <Button asChild className="mt-5 h-10 w-full rounded-full px-5 text-[14px] leading-5 font-medium text-primary-foreground sm:w-auto">
          <Link href="/signup?intent=resume_scan">Upload resume to reveal matches</Link>
        </Button>
      </div>
    </div>
  )
}
