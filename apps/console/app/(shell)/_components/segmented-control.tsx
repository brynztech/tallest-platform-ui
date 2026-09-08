'use client'

import { cn } from '@/lib/utils'

/**
 * The bordered-pill segmented control used across the console (pipeline's
 * Active/Rejected toggle, the shortlist card's screening-outcome row, the
 * shortlist All/Unscreened/Interested filter) — extracted here since this is
 * now its third hand-rolled call site. Existing ones aren't migrated to it
 * (out of scope for this pass), new ones should use this instead of
 * hand-rolling the button group again.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex w-fit gap-0.5 rounded-[10px] border border-border bg-card p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
            value === option.value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
