/**
 * Bridges this app's `HiringStage`/`HiringStageKind` (a requisition's
 * configured hiring process) into `@brynzit/pipeline`'s generic, headless
 * pipeline engine, for the `/pipeline` kanban page's "Advance to {next
 * stage}" button — labeling/enablement only. The backend's
 * `POST .../advance-stage` endpoint is authoritative for the actual
 * transition (see docs/recruiter-shortlist-categorization.md §8); a stale
 * frontend computation here just means a button briefly shows the wrong
 * label before a 409, which is an accepted tradeoff, not a bug to chase.
 *
 * The stage-kind mapping (`internal_review` -> `internal_gate`, everything
 * else -> `client_stage`) already exists in
 * `ops/requisitions/[id]/_lib/requisition-pipeline.ts` as
 * `hiringKindToStageType`, added for the hiring-process editor's mediation
 * toggle. Re-exported here under the name this feature asked for rather than
 * re-implementing the same two-branch mapping a second time.
 */
import {
  allowedTransitions,
  type Pipeline,
  type PipelineDefinition,
  type Stage,
  type StageType,
} from '@brynzit/pipeline'
import { hiringKindToStageType } from '../../ops/requisitions/[id]/_lib/requisition-pipeline'
import type { HiringStage, HiringStageKind } from '../../ops/requisitions/[id]/_lib/hiring-process'

export const hiringStageKindToPipelineStageType: (kind: HiringStageKind) => StageType =
  hiringKindToStageType

/**
 * Build an (unvalidated) pipeline definition from a requisition's already-
 * fetched, already-ordered hiring stages. Callers run this through
 * `definePipeline()` to get a validated `Pipeline` — kept as a separate step
 * so this function itself stays a pure, easily-tested mapping.
 */
export function toPipelineDefinition(
  requisitionId: string,
  stages: HiringStage[],
): PipelineDefinition {
  return {
    id: requisitionId,
    name: requisitionId,
    transitionPolicy: 'forward_only',
    stages: stages.map((stage) => ({
      id: stage.id,
      label: stage.name,
      type: hiringStageKindToPipelineStageType(stage.kind),
    })),
  }
}

/**
 * The stage a submission would move to on its next `advance-stage` call —
 * for the button label/disabled-state only.
 *
 * Pass the submission's raw `current_stage_id` (not defaulted to the first
 * configured stage): the backend treats `null` as "not yet entered the
 * pipeline" and advances it *to* the first stage, not past it — same
 * `null -> allowedTransitions` entry semantics `@brynzit/pipeline`'s engine
 * already models for a `forward_only` pipeline (`allowedTransitions(p,
 * null)` returns `[firstStage(p)]`), which is why this uses
 * `allowedTransitions` rather than `stageAfter`/`getStage`: `stageAfter`
 * has no way to express "not yet in the pipeline" since it requires a
 * concrete current stage id.
 *
 * Returns `null` when there's nowhere left to advance to — either already at
 * the final stage, or a stale `current_stage_id` no longer configured on
 * this requisition (the backend's two distinct 409s for those cases collapse
 * to one "can't advance" state here, which is fine for a disabled button).
 */
export function nextPipelineStage(pipeline: Pipeline, currentStageId: string | null): Stage | null {
  return allowedTransitions(pipeline, currentStageId)[0] ?? null
}
