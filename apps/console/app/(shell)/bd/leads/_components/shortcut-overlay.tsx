'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'

const SHORTCUTS = [
  { action: 'Navigate up / down', key: 'J / K' },
  { action: 'Approve lead', key: 'A' },
  { action: 'Reject lead', key: 'R' },
  { action: 'Snooze lead', key: 'S' },
  { action: 'Open detail panel', key: 'Enter' },
  { action: 'Close panel / dismiss', key: 'Esc' },
  { action: 'Bulk select card', key: 'Space' },
  { action: 'Show shortcuts', key: '?' },
] as const

interface ShortcutOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutOverlay({ open, onOpenChange }: ShortcutOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-8 gap-y-2">
          {SHORTCUTS.map(({ action, key }) => (
            <React.Fragment key={action}>
              <span className="text-sm text-muted-foreground">{action}</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold font-mono text-foreground">
                {key}
              </kbd>
            </React.Fragment>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
