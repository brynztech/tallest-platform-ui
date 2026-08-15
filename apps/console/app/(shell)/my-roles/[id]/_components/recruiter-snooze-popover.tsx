'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Input } from '@brynzit/ui/components/ui/input'
import { Separator } from '@brynzit/ui/components/ui/separator'
import {
  getSnoozePresetDate,
  isFutureSnoozeDate,
  snoozePresetLabel,
  SNOOZE_PRESET_MONTHS,
} from '../_lib/snooze-presets'

/**
 * Modeled directly on `bd/leads/_components/snooze-popover.tsx` (same
 * preset-button + custom-date-fallback shape), swapped to 3/6/9-month
 * presets per the recruiter shortlist contract instead of week/month/quarter.
 */
interface RecruiterSnoozePopoverProps {
  trigger: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSnooze: (snoozedUntil: string) => void
}

export function RecruiterSnoozePopover({
  trigger,
  open,
  onOpenChange,
  onSnooze,
}: RecruiterSnoozePopoverProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')

  function handlePreset(months: (typeof SNOOZE_PRESET_MONTHS)[number]) {
    onSnooze(getSnoozePresetDate(months))
    onOpenChange(false)
    setShowCustom(false)
  }

  function handleCustomConfirm() {
    if (!isFutureSnoozeDate(customDate)) return
    onSnooze(new Date(customDate).toISOString())
    onOpenChange(false)
    setShowCustom(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setShowCustom(false)
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={4} className="w-56 p-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Snooze until…
        </div>
        <Separator />
        <div className="mt-1 flex flex-col gap-0.5">
          {SNOOZE_PRESET_MONTHS.map((months) => (
            <button
              key={months}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handlePreset(months)}
            >
              {snoozePresetLabel(months)}
            </button>
          ))}
          <button
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setShowCustom(true)}
          >
            Custom date…
          </button>
          {showCustom && (
            <div className="mt-2 flex gap-2 px-2">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 text-sm h-8"
                aria-label="Custom snooze date"
              />
              <button
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={!isFutureSnoozeDate(customDate)}
                onClick={handleCustomConfirm}
              >
                Set
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
