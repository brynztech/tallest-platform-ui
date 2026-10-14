import { X } from 'lucide-react'

interface RemovableChipProps {
  label: string
  onRemove: () => void
  /** Names the × button for screen readers, e.g. "Remove TypeScript". */
  removeLabel: string
}

export function RemovableChip({ label, onRemove, removeLabel }: RemovableChipProps) {
  return (
    <span className="chip removable">
      {label}
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="chip-x">
        <X strokeWidth={1.8} aria-hidden="true" />
      </button>
    </span>
  )
}
