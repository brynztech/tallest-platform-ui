import { X } from 'lucide-react'

interface RemovableChipProps {
  label: string
  onRemove: () => void
  /** Names the × button for screen readers, e.g. "Remove TypeScript". */
  removeLabel: string
}

export function RemovableChip({ label, onRemove, removeLabel }: RemovableChipProps) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted pr-1.5 pl-3.5 text-[14px] leading-5 text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-link"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </span>
  )
}
