'use client'

import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Copy } from 'lucide-react'
import { copyText } from '../_lib/clipboard'

/** Resdex criteria are not searched automatically — copy them into Naukri. */
export function ResdexCriteria({ criteria }: { criteria: string }) {
  const text = criteria.trim()
  if (!text) return null

  async function onCopy() {
    const copied = await copyText(text)
    if (copied) toast('Resdex criteria copied.')
    else toast.error('Could not copy — select the text instead.')
  }

  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Naukri Resdex search criteria
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="mr-1 size-3.5" />
          Copy
        </Button>
      </div>
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  )
}
