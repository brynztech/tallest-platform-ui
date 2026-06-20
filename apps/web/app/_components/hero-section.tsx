'use client'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function HeroSection() {
  return (
    <div className="relative flex w-full max-w-[1120px] flex-col items-center pt-24 text-center md:pt-28">
      <div className="pointer-events-none absolute top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <p className="relative mb-5 rounded-full border border-border/70 bg-card/70 px-4 py-1 text-xs text-muted-foreground shadow-sm">
        Private talent matching for serious candidates
      </p>
      <h1 className="relative max-w-[1060px] text-balance text-[clamp(4.25rem,10vw,6.75rem)] font-light leading-[0.96] tracking-[-0.055em] text-foreground md:text-[120px]">
        The talent platform built for you.
      </h1>
      <p className="relative mt-7 max-w-[520px] text-base leading-7 text-muted-foreground">
        Brynzit matches engineers and designers to the roles they actually want.
      </p>
      <Button asChild size="lg" className="relative mt-8 rounded-full px-7 shadow-lg shadow-primary/15 transition-transform duration-150 ease-out hover:-translate-y-0.5">
        <Link href="/signup">Join the talent pool</Link>
      </Button>
    </div>
  )
}
