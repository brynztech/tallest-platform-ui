'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import { Pencil } from 'lucide-react'

interface RequisitionFieldsProps {
  req: components['schemas']['RequisitionResponse']
}

const editReqSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  seniority: z.string().nullable().optional(),
  skills: z.string().nullable().optional(), // comma-separated → split to array before PATCH
  compensation_range: z.string().nullable().optional(),
  target_start_date: z.string().nullable().optional(),
})
type EditReqFormValues = z.infer<typeof editReqSchema>

export function RequisitionFields({ req }: RequisitionFieldsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<EditReqFormValues>({
    resolver: zodResolver(editReqSchema),
    defaultValues: {
      title: req.title,
      seniority: req.seniority ?? '',
      skills: ((req.skills as string[] | null) ?? []).join(', '),
      compensation_range: req.compensation_range ?? '',
      target_start_date: req.target_start_date ?? '',
    },
  })

  // NOTE: MSW-only — no live PATCH /api/v1/ops/requisitions/{req_id} endpoint (api.d.ts patch?: never)
  // Uses raw fetch so MSW can intercept the PATCH request in development
  const patchMutation = useMutation({
    mutationFn: async (values: EditReqFormValues) => {
      const skillsArray = values.skills
        ? values.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      const body: Partial<components['schemas']['CreateRequisitionRequest']> = {
        title: values.title,
        seniority: values.seniority || null,
        skills: skillsArray.length > 0 ? skillsArray : [],
        compensation_range: values.compensation_range || null,
        target_start_date: values.target_start_date || null,
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/ops/requisitions/${req.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`)
      return res.json() as Promise<components['schemas']['RequisitionResponse']>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-requisition', req.id] })
      toast('Requisition updated.')
      setIsEditOpen(false)
    },
    onError: () => {
      toast.error('Failed to update requisition.')
    },
  })

  const skills = (req.skills as string[] | null) ?? []
  const hasJdData =
    req.seniority ||
    (req.skills && (req.skills as string[]).length > 0) ||
    req.compensation_range

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Details</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
          <Pencil className="mr-1 size-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Seniority</p>
          <p className="text-sm">{req.seniority ?? '—'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Compensation Range</p>
          <p className="text-sm">{req.compensation_range ?? '—'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Target Start Date</p>
          <p className="text-sm">{req.target_start_date ?? '—'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Skills</p>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>

      {!hasJdData && (
        <p className="mt-4 text-xs italic text-muted-foreground">
          No JD parsed — fields were entered manually.
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Requisition</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => patchMutation.mutate(v))}
            className="flex flex-col gap-4"
          >
            <div>
              <Label htmlFor="edit_title">Title</Label>
              <Input id="edit_title" {...form.register('title')} className="mt-1" />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit_seniority">Seniority</Label>
              <Input
                id="edit_seniority"
                {...form.register('seniority')}
                placeholder="e.g. senior"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_skills">Skills (comma-separated)</Label>
              <Input
                id="edit_skills"
                {...form.register('skills')}
                placeholder="e.g. TypeScript, React, Node.js"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_comp">Compensation Range</Label>
              <Input
                id="edit_comp"
                {...form.register('compensation_range')}
                placeholder="e.g. $150k–$180k"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_start_date">Target Start Date</Label>
              <Input
                id="edit_start_date"
                type="date"
                {...form.register('target_start_date')}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={patchMutation.isPending}>
                {patchMutation.isPending ? 'Saving…' : 'Update Requisition'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
