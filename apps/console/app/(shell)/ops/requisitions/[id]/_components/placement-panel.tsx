'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@brynzit/ui/components/ui/sheet'
import { Input } from '@brynzit/ui/components/ui/input'
import { Button } from '@brynzit/ui/components/ui/button'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
import { Textarea } from '@brynzit/ui/components/ui/textarea'
import { Separator } from '@brynzit/ui/components/ui/separator'
import { Label } from '@brynzit/ui/components/ui/label'

// Pitfall 4: billing_status is a free-form string (NOT an enum in api.d.ts)
const placementSchema = z.object({
  requisition_id: z.string().uuid(),
  candidate_id: z.string().uuid().nullable().optional(),
  fee_usd: z.number().positive().nullable().optional(),
  billing_status: z.string().min(1, 'Billing status is required'),
  retention_flag_90d: z.boolean(),
  notes: z.string().nullable().optional(),
  confirmed_at: z.string().nullable().optional(),
})
type PlacementFormValues = z.infer<typeof placementSchema>

interface PlacementPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reqId: string
  clientId: string
  approvedCandidateId: string | null
  candidateName?: string
}

export function PlacementPanel({
  isOpen,
  onOpenChange,
  reqId,
  clientId,
  approvedCandidateId,
  candidateName,
}: PlacementPanelProps) {
  const queryClient = useQueryClient()

  const form = useForm<PlacementFormValues>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      requisition_id: reqId,
      candidate_id: approvedCandidateId ?? null,
      billing_status: 'pending',
      retention_flag_90d: false,
    },
  })

  const submitMutation = useMutation({
    mutationFn: (body: components['schemas']['CreatePlacementRequest']) =>
      apiClient.POST('/api/v1/ops/placements', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-placements', reqId] })
      const name = candidateName ?? 'Candidate'
      toast(`Placement logged for ${name}.`)
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to log placement — try again.')
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    const body: components['schemas']['CreatePlacementRequest'] = {
      requisition_id: values.requisition_id,
      candidate_id: values.candidate_id ?? null,
      fee_usd: values.fee_usd ?? null,
      billing_status: values.billing_status,
      retention_flag_90d: values.retention_flag_90d,
      notes: values.notes ?? null,
      // Coerce empty string to null — backend expects ISO datetime or null
      confirmed_at: values.confirmed_at || null,
    }
    submitMutation.mutate(body)
  })

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-0"
      >
        <SheetDescription className="sr-only">
          Log placement billing, retention, and confirmation details for an approved candidate.
        </SheetDescription>
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <SheetTitle className="text-xl font-semibold">Log Placement</SheetTitle>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6 py-4">
          {/* Pre-filled read-only fields */}
          <div>
            <Label>Candidate</Label>
            <Input
              value={candidateName ?? approvedCandidateId ?? '—'}
              readOnly
              className="mt-1 bg-muted/50"
            />
          </div>
          <div>
            <Label>Requisition ID</Label>
            <Input value={reqId} readOnly className="mt-1 bg-muted/50" />
          </div>
          <div>
            <Label>Client ID</Label>
            <Input value={clientId} readOnly className="mt-1 bg-muted/50" />
          </div>

          <Separator />

          {/* Editable fields */}
          <div>
            <Label htmlFor="fee_usd">Placement fee (USD)</Label>
            <Input
              id="fee_usd"
              type="number"
              placeholder="e.g. 25000"
              className="mt-1"
              {...form.register('fee_usd', {
                setValueAs: (v) => (v === '' ? null : parseFloat(v as string)),
              })}
            />
          </div>

          <div>
            <Label htmlFor="billing_status">Billing Status *</Label>
            <Input
              id="billing_status"
              placeholder="e.g. pending, invoiced, paid"
              className="mt-1"
              {...form.register('billing_status')}
            />
            <p className="mt-1 text-xs text-muted-foreground">Common values: pending, invoiced, paid</p>
            {form.formState.errors.billing_status && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.billing_status.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="retention_flag_90d"
              render={({ field }) => (
                <Checkbox
                  id="retention_flag_90d"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="retention_flag_90d">Flag for 90-day retention check</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes"
              className="mt-1 min-h-[80px]"
              {...form.register('notes')}
            />
          </div>

          <Separator />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Logging…' : 'Log Placement'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
