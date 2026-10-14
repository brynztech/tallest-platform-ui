import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="wrap page narrow">
      <div className="page-head">
        <h1 className="d2">
          Page not <em>found</em>
        </h1>
        <p className="lede">This page doesn&apos;t exist.</p>
      </div>
      <div>
        <Link href="/" className="btn btn-primary">
          Return to home
        </Link>
      </div>
    </main>
  )
}
