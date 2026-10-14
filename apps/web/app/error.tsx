'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <h1 className="d2">
          Something went <em>wrong</em>
        </h1>
        <p className="lede">Reload the page — if the problem continues, the team has been notified.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Return to home
        </Link>
      </div>
    </main>
  )
}
