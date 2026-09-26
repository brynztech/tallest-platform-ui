import { Laptop } from 'lucide-react'

/** Replaces the console below the lg breakpoint (1024px): it is built for laptops, not phones. */
export function DesktopOnlyNotice() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center lg:hidden">
      <div className="max-w-[340px] rounded-xl border border-border bg-card px-6 py-8 shadow-[0_1px_2px_rgba(22,18,12,0.04)]">
        <div className="mx-auto flex size-10 items-center justify-center rounded-[10px] bg-secondary">
          <Laptop className="size-5 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-[20px] leading-7 font-semibold text-foreground">Laptop only</h1>
        <p className="mt-2 text-[14px] leading-5 text-muted-foreground">
          This view is only available on laptop devices. Please open it on a laptop or desktop computer.
        </p>
      </div>
    </main>
  )
}
