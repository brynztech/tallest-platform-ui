'use client'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export function HeroSection() {
  return (
    <div className="flex max-w-[900px] flex-col items-center text-center" style={{ paddingTop: '120px' }}>
      <h1
        className="text-[120px] font-light leading-[1.05] tracking-[0.04em] text-foreground"
      >
        The talent platform built for you.
      </h1>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">
        Brynzit matches engineers and designers to the roles they actually want.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/signup">Join the talent pool</Link>
      </Button>
    </div>
  )
}
