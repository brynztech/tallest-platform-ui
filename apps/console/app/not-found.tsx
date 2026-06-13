import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-muted-foreground text-sm">
        This page doesn&apos;t exist.{' '}
        <Link href="/" className="text-primary underline underline-offset-4">
          Return to console.
        </Link>
      </p>
    </div>
  )
}
