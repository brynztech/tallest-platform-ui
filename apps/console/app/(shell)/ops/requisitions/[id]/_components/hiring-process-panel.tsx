'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Badge } from '@brynzit/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@brynzit/ui/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@brynzit/ui/components/ui/select'
import {
  buildIntakeDetailsWithHiringProcess,
  getHiringProcess,
  isHiringStageKind,
  stageKindLabel,
  type HiringStage,
  type HiringStageKind,
} from '../_lib/hiring-process'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

type RequisitionResponse = components['schemas']['RequisitionResponse']

type EditableStage = Pick<HiringStage, 'name' | 'kind'>

const stageKinds: HiringStageKind[] = [
  'internal_review',
  'client_screen',
  'technical',
  'final',
  'offer',
]

export function HiringProcessPanel({ req }: { req: RequisitionResponse }) {
  const queryClient = useQueryClient()
  const hiringProcess = useMemo(() => getHiringProcess(req), [req])
  const [isOpen, setIsOpen] = useState(false)
  const [stages, setStages] = useState<EditableStage[]>(() =>
    hiringProcess.stages.map(({ name, kind }) => ({ name, kind })),
  )

  useEffect(() => {
    if (!isOpen) {
      setStages(hiringProcess.stages.map(({ name, kind }) => ({ name, kind })))
    }
  }, [isOpen, hiringProcess])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const intakeDetails = buildIntakeDetailsWithHiringProcess(req.intake_details, stages)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/ops/requisitions/${req.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: req.title,
            seniority: req.seniority,
            skills: Array.isArray(req.skills) ? req.skills : [],
            compensation_range: req.compensation_range,
            target_start_date: req.target_start_date,
            intake_details: intakeDetails,
          }),
        },
      )
      if (!response.ok) throw new Error(`PATCH failed: ${response.status}`)
      return response.json() as Promise<RequisitionResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-requisition', req.id] })
      queryClient.invalidateQueries({ queryKey: ['recruiter'] })
      toast('Hiring process updated.')
      setIsOpen(false)
    },
    onError: () => {
      toast.error('Failed to update hiring process.')
    },
  })

  function updateStage(index: number, updates: Partial<EditableStage>) {
    setStages((current) =>
      current.map((stage, currentIndex) =>
        currentIndex === index ? { ...stage, ...updates } : stage,
      ),
    )
  }

  function moveStage(index: number, direction: -1 | 1) {
    setStages((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeStage(index: number) {
    setStages((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Hiring Process</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ops owns this per-requisition process. It controls how the recruiter pipeline is
            rendered for this role.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          Edit Process
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {hiringProcess.stages.map((stage) => (
          <div key={stage.id} className="rounded-lg border bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{stage.order}. {stage.name}</span>
              <Badge variant="secondary" className="text-[11px]">
                {stageKindLabel(stage.kind)}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Hiring Process</DialogTitle>
            <DialogDescription>
              Set the exact rounds for this client and role. Use one stage for a simple process or
              add as many stages as the client requires.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {stages.map((stage, index) => (
              <div key={`${stage.name}-${index}`} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto] md:items-center">
                <Input
                  value={stage.name}
                  onChange={(event) => updateStage(index, { name: event.target.value })}
                  placeholder="Stage name"
                />
                <Select
                  value={stage.kind}
                  onValueChange={(value) =>
                    updateStage(index, {
                      kind: isHiringStageKind(value) ? value : 'client_screen',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageKinds.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {stageKindLabel(kind)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                    aria-label="Move stage up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, 1)}
                    aria-label="Move stage down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={stages.length <= 1}
                    onClick={() => removeStage(index)}
                    aria-label="Remove stage"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStages((current) => [...current, { name: '', kind: 'client_screen' }])}
            >
              <Plus className="size-4" />
              Add Stage
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Process'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
