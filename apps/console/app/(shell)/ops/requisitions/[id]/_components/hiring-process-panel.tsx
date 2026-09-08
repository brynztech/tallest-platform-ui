'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from '@brynzit/api-client'
import { toast } from 'sonner'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { cn } from '@/lib/utils'
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
  countSubmissionsByStage,
  getHiringProcess,
  isHiringStageKind,
  stageKindLabel,
  type HiringStage,
  type HiringStageKind,
} from '../_lib/hiring-process'
import {
  getRequisitionPipeline,
  hiringKindToStageType,
  stageTypeLabel,
  withMediationGate,
} from '../_lib/requisition-pipeline'
import { hasInternalGate } from '@brynzit/pipeline'
import { useCan } from '@brynzit/identity'
import { Checkbox } from '@brynzit/ui/components/ui/checkbox'
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

export function HiringProcessPanel({
  req,
  submissions = [],
}: {
  req: RequisitionResponse
  /** For per-stage candidate counts — pass the requisition's shortlist submissions. */
  submissions?: Array<Pick<components['schemas']['SubmissionResponse'], 'status' | 'current_stage_id'>>
}) {
  const queryClient = useQueryClient()
  const can = useCan()
  const canConfigure = can('pipeline.configure')
  const hiringProcess = useMemo(() => getHiringProcess(req), [req])
  const pipeline = useMemo(() => getRequisitionPipeline(req), [req])
  const mediated = hasInternalGate(pipeline)
  const stageCounts = useMemo(
    () => countSubmissionsByStage(hiringProcess.stages, submissions),
    [hiringProcess.stages, submissions],
  )
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
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Hiring process</h2>
            <span
              className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-[3px] text-[11px] font-medium text-muted-foreground"
              title={
                mediated
                  ? 'Submissions route through internal quality review before the client sees them.'
                  : 'Recruiter submits directly to the client — no internal review step.'
              }
            >
              {mediated ? 'Mediated' : 'Direct'}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Ops owns this process. It defines the columns a recruiter sees in the pipeline for
            this role.
          </p>
        </div>
        {canConfigure && (
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            Edit process
          </Button>
        )}
      </div>

      <div className="flex flex-col">
        {hiringProcess.stages.map((stage) => {
          const stageType = hiringKindToStageType(stage.kind)
          const count = stageCounts[stage.id] ?? 0
          return (
            <div
              key={stage.id}
              className="flex items-center gap-3 border-t border-[#ECEAE4] py-3 first:border-t-0"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-medium text-muted-foreground">
                {stage.order}
              </span>
              <span className="text-sm font-medium">{stage.name}</span>
              <span className="rounded-full border border-border bg-secondary px-2 py-[3px] text-[11px] font-medium text-muted-foreground">
                {stageKindLabel(stage.kind)}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-[3px] text-[11px] font-medium',
                  stageType === 'internal_gate'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground',
                )}
              >
                {stageTypeLabel(stageType)}
              </span>
              <div className="flex-1" />
              <span className="text-[13px] text-muted-foreground">
                {count === 0 ? 'No candidates' : `${count} candidate${count === 1 ? '' : 's'}`}
              </span>
            </div>
          )
        })}
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

          <label className="mb-1 flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={stages.some((stage) => stage.kind === 'internal_review')}
              onCheckedChange={(checked) =>
                setStages((current) => withMediationGate(current, checked === true))
              }
              aria-label="Route through internal quality review"
            />
            <span className="flex flex-col">
              <span className="font-medium">Route through internal quality review</span>
              <span className="text-muted-foreground text-xs">
                When on, submissions need internal (BrynzIT) approval before the client sees them.
                When off, the recruiter submits directly.
              </span>
            </span>
          </label>

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
