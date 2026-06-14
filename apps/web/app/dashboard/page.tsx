'use client'
import Link from 'next/link'
import { Button } from '@brynzit/ui/components/ui/button'

export default function DashboardPage() {
  return (
    <main className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center gap-4 px-8">
      <h1 className="text-2xl font-normal text-foreground">Your dashboard is coming soon.</h1>
      <p className="text-base text-muted-foreground">
        Track your applications and see your matches here once Phase 6 ships.
      </p>
      <Button variant="outline" asChild>
        <Link href="/jobs">Browse jobs</Link>
      </Button>
    </main>
  )
}
