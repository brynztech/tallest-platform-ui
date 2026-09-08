import type { ReactNode } from 'react'

/** One tile in the page-level summary row (Ops Requisitions, My Roles) — an
 * eyebrow label, a big value, and an optional smaller muted suffix ("of 7
 * total", "candidates", "roles"). `dotTone` prefixes the value with a
 * colored dot for counts that mean "needs attention," omit for a neutral
 * total. */
export function PipelineStatTile({
  label,
  value,
  suffix,
  dotTone,
}: {
  label: string
  value: ReactNode
  suffix?: string
  dotTone?: string
}) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        {dotTone && <span className="size-2 shrink-0 self-center rounded-full" style={{ backgroundColor: dotTone }} />}
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

export function PipelineStatTileRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-6 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
      {children}
    </div>
  )
}
