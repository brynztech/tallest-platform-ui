import type {
  Pipeline,
  PipelineDefinition,
  Stage,
  StageEvent,
  TransitionInput,
  TransitionResult,
} from './types'

/**
 * Validate and normalize a pipeline definition into an ordered `Pipeline`.
 *
 * Throws on invalid input (empty stage list or duplicate stage ids) — a
 * misconfigured pipeline is a programming/config error, not a runtime state to
 * handle gracefully.
 */
export function definePipeline(definition: PipelineDefinition): Pipeline {
  const { id, name, stages, transitionPolicy = 'flexible' } = definition

  if (stages.length === 0) {
    throw new Error(`Pipeline "${id}" must have at least one stage`)
  }

  const seen = new Set<string>()
  for (const stage of stages) {
    if (seen.has(stage.id)) {
      throw new Error(`Pipeline "${id}" has duplicate stage id "${stage.id}"`)
    }
    seen.add(stage.id)
  }

  return {
    id,
    name,
    transitionPolicy,
    stages: stages.map((stage, index) => ({ ...stage, order: index })),
  }
}

/** Look up a stage by id, or `undefined` if it does not belong to the pipeline. */
export function getStage(pipeline: Pipeline, stageId: string): Stage | undefined {
  return pipeline.stages.find((stage) => stage.id === stageId)
}

/** The first stage (entry point) of the pipeline. */
export function firstStage(pipeline: Pipeline): Stage {
  return pipeline.stages[0]
}

/** The last stage of the pipeline. */
export function lastStage(pipeline: Pipeline): Stage {
  return pipeline.stages[pipeline.stages.length - 1]
}

/** The stage immediately after the given stage, or `null` at the end. */
export function stageAfter(pipeline: Pipeline, stageId: string): Stage | null {
  const stage = getStage(pipeline, stageId)
  if (!stage) return null
  return pipeline.stages[stage.order + 1] ?? null
}

/** The stage immediately before the given stage, or `null` at the start. */
export function stageBefore(pipeline: Pipeline, stageId: string): Stage | null {
  const stage = getStage(pipeline, stageId)
  if (!stage || stage.order === 0) return null
  return pipeline.stages[stage.order - 1] ?? null
}

/**
 * Whether the pipeline includes an internal gate. This distinguishes a
 * "mediated" pipeline (agency approves before the client sees a candidate)
 * from a "direct" one (spec D3).
 */
export function hasInternalGate(pipeline: Pipeline): boolean {
  return pipeline.stages.some((stage) => stage.type === 'internal_gate')
}

/**
 * The stages a subject may move to from its current position, honoring the
 * transition policy.
 *
 * - From `null` (not yet in the pipeline): may enter at the first stage under
 *   `forward_only`, or at any stage under `flexible`.
 * - `forward_only`: any stage strictly after the current one.
 * - `flexible`: any stage other than the current one.
 */
export function allowedTransitions(pipeline: Pipeline, fromStageId: string | null): Stage[] {
  if (fromStageId === null) {
    return pipeline.transitionPolicy === 'forward_only'
      ? [firstStage(pipeline)]
      : [...pipeline.stages]
  }

  const from = getStage(pipeline, fromStageId)
  if (!from) return []

  if (pipeline.transitionPolicy === 'forward_only') {
    return pipeline.stages.filter((stage) => stage.order > from.order)
  }
  return pipeline.stages.filter((stage) => stage.id !== from.id)
}

/** Whether a transition from one stage to another is permitted. */
export function canTransition(
  pipeline: Pipeline,
  fromStageId: string | null,
  toStageId: string,
): boolean {
  return allowedTransitions(pipeline, fromStageId).some((stage) => stage.id === toStageId)
}

/**
 * Attempt a transition. On success returns an immutable `StageEvent` the caller
 * should persist; on failure returns a descriptive error. Pure — it mutates
 * nothing and performs no I/O.
 */
export function transition(pipeline: Pipeline, input: TransitionInput): TransitionResult {
  const { fromStageId, toStageId, actorId, at, id, note } = input

  if (fromStageId !== null && !getStage(pipeline, fromStageId)) {
    return { ok: false, error: `Unknown source stage "${fromStageId}"` }
  }
  if (!getStage(pipeline, toStageId)) {
    return { ok: false, error: `Unknown target stage "${toStageId}"` }
  }
  if (!canTransition(pipeline, fromStageId, toStageId)) {
    return {
      ok: false,
      error: `Transition from "${fromStageId ?? '(entry)'}" to "${toStageId}" is not allowed under the "${pipeline.transitionPolicy}" policy`,
    }
  }

  const event: StageEvent = {
    id: id ?? crypto.randomUUID(),
    pipelineId: pipeline.id,
    fromStageId,
    toStageId,
    actorId,
    at: at ?? new Date().toISOString(),
    ...(note !== undefined ? { note } : {}),
  }
  return { ok: true, event }
}
