import type { components } from '@brynzit/api-client'
import {
  definePipeline,
  hasInternalGate,
  type Pipeline,
  type StageType,
} from '@brynzit/pipeline'
import { getHiringProcess, type HiringStage, type HiringStageKind } from './hiring-process'

type RequisitionResponse = components['schemas']['RequisitionResponse']
type RequisitionForPipeline = Pick<RequisitionResponse, 'id' | 'title' | 'intake_details'>

/** An editable stage as used by the process editor (no resolved order yet). */
export type EditableStage = Pick<HiringStage, 'name' | 'kind'>

/** The default internal quality gate added when a role is set to "mediated". */
export const INTERNAL_GATE_STAGE: EditableStage = {
  name: 'BrynzIT Review',
  kind: 'internal_review',
}

/**
 * Map a UI hiring-stage kind to the generic engine's stage type. The internal
 * review kind is the agency-owned gate; every other kind is a client-facing
 * stage. This mapping is what lets the generic pipeline engine reason about
 * "mediated vs direct" without knowing recruiting specifics.
 */
export function hiringKindToStageType(kind: HiringStageKind): StageType {
  return kind === 'internal_review' ? 'internal_gate' : 'client_stage'
}

/** Human label for a generic stage type. */
export function stageTypeLabel(type: StageType): string {
  return type === 'internal_gate' ? 'Internal gate' : 'Client stage'
}

/**
 * Build a validated generic `Pipeline` from a requisition's hiring process.
 * Ordering and validation come from the engine (`definePipeline`), so the rest
 * of the console reasons about pipelines through one shared abstraction.
 */
export function getRequisitionPipeline(req: RequisitionForPipeline): Pipeline {
  const { stages } = getHiringProcess(req)
  return definePipeline({
    id: req.id,
    name: req.title?.trim() ? req.title : 'Requisition pipeline',
    transitionPolicy: 'forward_only',
    stages: stages.map((stage) => ({
      id: stage.id,
      label: stage.name,
      type: hiringKindToStageType(stage.kind),
    })),
  })
}

/**
 * Whether the role routes submissions through an internal quality gate before
 * the client sees a candidate (spec D3). Delegates to the engine.
 */
export function pipelineIsMediated(req: RequisitionForPipeline): boolean {
  return hasInternalGate(getRequisitionPipeline(req))
}

/**
 * Toggle the internal quality gate on a list of editable stages.
 *
 * - Enabled: guarantees the pipeline begins with an internal gate. Existing
 *   internal gates are preserved (moved to the front); if none exist, the
 *   default `BrynzIT Review` gate is prepended.
 * - Disabled: strips all internal gates, leaving a direct recruiter→client
 *   pipeline.
 *
 * Client stages keep their relative order in both cases.
 */
export function withMediationGate(stages: EditableStage[], enabled: boolean): EditableStage[] {
  const clientStages = stages
    .filter((stage) => stage.kind !== 'internal_review')
    .map((stage) => ({ name: stage.name, kind: stage.kind }))

  if (!enabled) return clientStages

  const existingGates = stages
    .filter((stage) => stage.kind === 'internal_review')
    .map((stage) => ({ name: stage.name, kind: stage.kind }))
  const gates = existingGates.length > 0 ? existingGates : [INTERNAL_GATE_STAGE]

  return [...gates, ...clientStages]
}
