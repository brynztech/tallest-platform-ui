import { describe, it } from 'vitest'

describe('Supply — Engagement Sequences (SUP-05)', () => {
  it.todo('approve without edits sends POST approve directly (no PATCH first)')
  it.todo('approve with edits sends PATCH steps then POST approve')
  it.todo('reject shows 5-second undo toast before POSTing reject')
  it.todo('undo cancels the reject POST')
  it.todo('sequence with status approved shows read-only step fields')
})
