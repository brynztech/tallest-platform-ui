// Parses the Markdown our description cleaner produces (backend
// job_board/services/description_cleaning.py): "## " headings, "- " lists,
// paragraphs, **bold** and [label](https://...) links. Anything else stays plain
// text. Returns data, never HTML, so a posting cannot inject markup (T-05-02).

export type Inline = { kind: 'text' | 'bold'; text: string } | { kind: 'link'; text: string; href: string }
export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: Inline[][] }
  | { kind: 'paragraph'; lines: Inline[][] }

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    if (m[1]) out.push({ kind: 'bold', text: m[1] })
    else if (m[2]) out.push({ kind: 'link', text: m[2], href: m[3] })
    else out.push({ kind: 'link', text: m[4].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), href: m[4] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = []
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    const prev = blocks[blocks.length - 1]
    if (!line) {
      blocks.push({ kind: 'paragraph', lines: [] }) // a blank line ends the paragraph
      continue
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    const item = /^[-*•]\s+(.*)$/.exec(line)
    if (heading) blocks.push({ kind: 'heading', text: heading[1].replace(/\*\*/g, '') })
    else if (item) {
      if (prev?.kind === 'list') prev.items.push(parseInline(item[1]))
      else blocks.push({ kind: 'list', items: [parseInline(item[1])] })
    } else if (prev?.kind === 'paragraph') prev.lines.push(parseInline(line))
    else blocks.push({ kind: 'paragraph', lines: [parseInline(line)] })
  }
  return blocks.filter(b => b.kind !== 'paragraph' || b.lines.length > 0)
}
