/**
 * Opening suggestions shown on an empty chat.
 *
 * Deliberately only things the four read-only tools can actually answer, or
 * that the system prompt's vocabulary covers. A starter that leads to "I can't
 * do that" is worse than no starter — it advertises a capability the assistant
 * does not have, and this assistant is read-only by contract.
 */
export type Starter = {
  /**
   * Card label. Must fit ONE line in the docked panel — see the fixed-width
   * label rule in DESIGN_SYSTEM.md; the budget there is ~18 characters at
   * `text-sm`, and a test enforces it. Say it short here.
   */
  title: string
  /** The exact text sent as the message — the title is only a label, so this
   *  stays as long and explicit as the question needs to be. */
  prompt: string
}

/** The one-line budget from DESIGN_SYSTEM.md, asserted in tests. */
export const STARTER_TITLE_MAX = 18

export const STARTERS: readonly Starter[] = [
  {
    title: 'How am I doing?',
    prompt: 'How are my roles going? Give me a status summary.',
  },
  {
    title: 'List my roles',
    prompt: 'List my roles with their client and status.',
  },
  {
    title: 'Show me a pipeline',
    prompt: 'Show me the candidate pipeline for one of my roles.',
  },
  {
    title: 'CTC vs ECTC?',
    prompt: 'What do CTC and ECTC mean, and where do they show up?',
  },
] as const

/**
 * Which starters a surface shows.
 *
 * The docked panel is ~400px wide: four stacked cards become a wall that
 * pushes the composer down and makes the empty state feel like a menu. Two
 * side by side is enough of a hint at what the assistant can answer. The
 * expanded view has the room for all four.
 */
export function startersFor(expanded: boolean): readonly Starter[] {
  return expanded ? STARTERS : STARTERS.slice(0, 2)
}
