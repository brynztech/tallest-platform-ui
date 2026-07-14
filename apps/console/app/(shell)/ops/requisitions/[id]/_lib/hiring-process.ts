import type { components } from '@brynzit/api-client'

export type HiringStageKind = 'internal_review' | 'client_screen' | 'technical' | 'final' | 'offer'

export type HiringStage = {
  id: string
  name: string
  kind: HiringStageKind
  order: number
}

export type HiringProcess = {
  stages: HiringStage[]
}

export const DEFAULT_HIRING_STAGES: HiringStage[] = [
  { id: 'recruiter-review', name: 'Recruiter Review', kind: 'internal_review', order: 1 },
  { id: 'client-screen', name: 'Client Screen', kind: 'client_screen', order: 2 },
  { id: 'technical-interview', name: 'Technical Interview', kind: 'technical', order: 3 },
  { id: 'offer', name: 'Offer', kind: 'offer', order: 4 },
]

type RequisitionResponse = components['schemas']['RequisitionResponse']

export function getHiringProcess(requisition: Pick<RequisitionResponse, 'intake_details'>): HiringProcess {
  const details = asRecord(requisition.intake_details)
  const hiringProcess = asRecord(details?.hiring_process)
  const stagesValue = hiringProcess?.stages
  if (!Array.isArray(stagesValue)) return { stages: DEFAULT_HIRING_STAGES }

  const stages = stagesValue
    .map((stage, index): HiringStage | null => {
      const record = asRecord(stage)
      if (!record) return null
      const name = typeof record.name === 'string' ? record.name.trim() : ''
      if (!name) return null
      const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : slugify(name)
      const kind = parseStageKind(record.kind)
      const order = Number.isFinite(record.order) ? Number(record.order) : index + 1
      return { id, name, kind, order }
    })
    .filter((stage): stage is HiringStage => Boolean(stage))
    .sort((a, b) => a.order - b.order)
    .map((stage, index) => ({ ...stage, order: index + 1 }))

  return { stages: stages.length > 0 ? stages : DEFAULT_HIRING_STAGES }
}

export function buildIntakeDetailsWithHiringProcess(
  intakeDetails: unknown,
  stages: Array<Pick<HiringStage, 'name' | 'kind'>>,
) {
  const existing = asRecord(intakeDetails) ?? {}
  const normalizedStages = normalizeEditableStages(stages)
  return {
    ...existing,
    hiring_process: {
      ...(asRecord(existing.hiring_process) ?? {}),
      stages: normalizedStages,
      updated_at: new Date().toISOString(),
    },
  }
}

export function normalizeEditableStages(stages: Array<Pick<HiringStage, 'name' | 'kind'>>) {
  const normalized = stages
    .map((stage) => ({
      name: stage.name.trim(),
      kind: stage.kind,
    }))
    .filter((stage) => stage.name.length > 0)

  if (normalized.length === 0) return DEFAULT_HIRING_STAGES

  return normalized.map((stage, index) => ({
    id: `${slugify(stage.name)}-${index + 1}`,
    name: stage.name,
    kind: parseStageKind(stage.kind),
    order: index + 1,
  }))
}

export function stageForSubmissionStatus(stages: HiringStage[], status: string) {
  if (status === 'rejected') return 'rejected'
  if (status === 'approved') return stages[1]?.id ?? stages[0]?.id ?? 'unassigned'
  return stages[0]?.id ?? 'unassigned'
}

export function isHiringStageKind(value: string): value is HiringStageKind {
  return ['internal_review', 'client_screen', 'technical', 'final', 'offer'].includes(value)
}

export function stageKindLabel(kind: HiringStageKind) {
  const labels: Record<HiringStageKind, string> = {
    internal_review: 'Internal Review',
    client_screen: 'Client Screen',
    technical: 'Technical',
    final: 'Final',
    offer: 'Offer',
  }
  return labels[kind]
}

function parseStageKind(value: unknown): HiringStageKind {
  return typeof value === 'string' && isHiringStageKind(value) ? value : 'client_screen'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
