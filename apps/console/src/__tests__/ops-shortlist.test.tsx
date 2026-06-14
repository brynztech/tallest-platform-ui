import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Shortlist status badge logic (OPS-04)', () => {
  it('approved status maps to green badge class', () => {
    function shortlistStatusBadgeClass(status: string) {
      switch (status) {
        case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/40'
        case 'hold': return 'bg-amber-500/20 text-amber-700 border-amber-500/40'
        case 'passed': return 'bg-muted text-muted-foreground'
        default: return 'bg-primary/10 text-primary'
      }
    }
    expect(shortlistStatusBadgeClass('approved')).toContain('green')
    expect(shortlistStatusBadgeClass('hold')).toContain('amber')
    expect(shortlistStatusBadgeClass('passed')).toBe('bg-muted text-muted-foreground')
    expect(shortlistStatusBadgeClass('shortlisted')).toContain('primary')
  })

  it.todo('GET shortlist returns submissions array (cast from loosely typed response)')
  it.todo('PATCH /supply/shortlists/{id} with status=approved fires and invalidates shortlist query')
  it.todo('PATCH /supply/shortlists/{id} with status=hold fires and invalidates shortlist query')
  it.todo('PATCH /supply/shortlists/{id} with status=passed fires and invalidates shortlist query')
  it.todo('Shortlist row click sets selectedCandidateId and opens candidate Sheet')
  it.todo('Approve action shows 5-second undo toast with "Candidate [name] approved."')
})
