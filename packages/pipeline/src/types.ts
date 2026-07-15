/**
 * Configurable pipeline engine — types.
 *
 * This package is headless and domain-agnostic. It models ordered stages, the
 * transitions between them, and the events those transitions emit. It knows
 * nothing about recruiting; a recruiting requisition supplies its own stage
 * configuration. This is the reusable core called out in the design spec (D8).
 */

/**
 * The kind of a stage.
 *
 * - `internal_gate`: an internal (agency-owned) review step. Its presence is
 *   the mechanism for "mediated vs direct" (spec D3): a pipeline with an
 *   internal gate routes through internal approval; one without lets the
 *   submitter proceed directly.
 * - `client_stage`: a step in the client's own hiring process (Founder Screen,
 *   Take Home, etc.), configured per role.
 */
export type StageType = 'internal_gate' | 'client_stage'

/**
 * How movement between stages is constrained.
 *
 * - `forward_only`: may advance to any later stage (skipping allowed) but not
 *   move backwards.
 * - `flexible`: may move to any other stage (supports corrections / reopening).
 */
export type TransitionPolicy = 'forward_only' | 'flexible'

/** A stage as authored, before ordering is assigned. */
export interface StageDefinition {
  id: string
  label: string
  type: StageType
}

/** A stage with its resolved position in the pipeline. */
export interface Stage extends StageDefinition {
  /** Zero-based position in the pipeline. */
  order: number
}

/** A pipeline as authored (order derived from array position). */
export interface PipelineDefinition {
  id: string
  name: string
  stages: StageDefinition[]
  /** Defaults to `flexible` when omitted. */
  transitionPolicy?: TransitionPolicy
}

/** A validated, ordered pipeline. */
export interface Pipeline {
  id: string
  name: string
  stages: Stage[]
  transitionPolicy: TransitionPolicy
}

/**
 * An immutable record of a movement between stages. Consumers persist these to
 * drive dashboards and candidate memory (spec: "dashboards reflect real stage
 * events, not vanity counters").
 */
export interface StageEvent {
  id: string
  pipelineId: string
  /** `null` when the subject first enters the pipeline. */
  fromStageId: string | null
  toStageId: string
  /** The acting user id responsible for the movement. */
  actorId: string
  /** ISO-8601 timestamp. */
  at: string
  note?: string
}

/** Input describing a requested transition. */
export interface TransitionInput {
  /** `null` to enter the pipeline (initial placement). */
  fromStageId: string | null
  toStageId: string
  actorId: string
  /** Override the timestamp (defaults to now). */
  at?: string
  /** Override the generated event id (defaults to a random UUID). */
  id?: string
  note?: string
}

/** Result of attempting a transition. */
export type TransitionResult =
  | { ok: true; event: StageEvent }
  | { ok: false; error: string }
