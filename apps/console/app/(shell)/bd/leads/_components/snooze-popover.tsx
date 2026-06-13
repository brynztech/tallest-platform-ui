'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@brynzit/ui/components/ui/popover'
import { Input } from '@brynzit/ui/components/ui/input'
import { Separator } from '@brynzit/ui/components/ui/separator'

function getPresetDate(preset: 'week' | 'month' | 'quarter'): string {
  const d = new Date()
  if (preset === 'week') d.setDate(d.getDate() + 7)
  else if (preset === 'month') d.setMonth(d.getMonth() + 1)
  else {
    const q = Math.floor(d.getMonth() / 3)
    d.setMonth((q + 1) * 3, 0)
  }
  return d.toISOString()
}

interface SnoozePopoverProps {
  leadId: string
  trigger: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSnooze: (leadId: string, dueAt: string) => void
}

export function SnoozePopover({ leadId, trigger, open, onOpenChange, onSnooze }: SnoozePopoverProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')

  function handlePreset(preset: 'week' | 'month' | 'quarter') {
    onSnooze(leadId, getPresetDate(preset))
    onOpenChange(false)
    setShowCustom(false)
  }

  function handleCustomConfirm() {
    if (!customDate) return
    onSnooze(leadId, new Date(customDate).toISOString())
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
          {(['week', 'month', 'quarter'] as const).map((preset) => (
            <button
              key={preset}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => handlePreset(preset)}
            >
              {preset === 'week' ? '1 week' : preset === 'month' ? '1 month' : 'End of quarter'}
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
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
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
