import { describe, it, expect } from 'vitest'
import { parseMarkdown, parseInline } from '../../app/_lib/markdown'

describe('description Markdown', () => {
  it('reads headings, lists and paragraphs', () => {
    const blocks = parseMarkdown('## The role\nYou will build.\nAnd ship.\n\n## What you need\n- React\n- **5+ years** of TypeScript')
    expect(blocks.map(b => b.kind)).toEqual(['heading', 'paragraph', 'heading', 'list'])
    expect(blocks[1]).toEqual({ kind: 'paragraph', lines: [[{ kind: 'text', text: 'You will build.' }], [{ kind: 'text', text: 'And ship.' }]] })
    expect(blocks[3]).toMatchObject({ kind: 'list', items: [[{ text: 'React' }], [{ kind: 'bold', text: '5+ years' }, { kind: 'text', text: ' of TypeScript' }]] })
  })

  it('turns links and bare web addresses into links, never other schemes', () => {
    expect(parseInline('See [Website](https://circlestore.in/) or https://www.linkedin.com/company/x/')).toEqual([
      { kind: 'text', text: 'See ' },
      { kind: 'link', text: 'Website', href: 'https://circlestore.in/' },
      { kind: 'text', text: ' or ' },
      { kind: 'link', text: 'linkedin.com/company/x', href: 'https://www.linkedin.com/company/x/' },
    ])
    expect(parseInline('[x](javascript:alert(1))')).toEqual([{ kind: 'text', text: '[x](javascript:alert(1))' }])
  })

  it('keeps HTML as plain text', () => {
    expect(parseMarkdown('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'paragraph', lines: [[{ kind: 'text', text: '<img src=x onerror=alert(1)>' }]] },
    ])
  })

  it('reads an uncleaned posting: indented dash bullets with blank lines between them are one list', () => {
    const blocks = parseMarkdown('In this role, you will:\n\n - Drive engagements.\n\n - Assess readiness.\n\nAbout you')
    expect(blocks.map(b => b.kind)).toEqual(['paragraph', 'list', 'paragraph'])
    expect(blocks[1]).toMatchObject({ kind: 'list', items: [[{ text: 'Drive engagements.' }], [{ text: 'Assess readiness.' }]] })
  })
})
