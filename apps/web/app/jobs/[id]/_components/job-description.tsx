import { parseMarkdown, type Inline } from '../../../_lib/markdown'

function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.kind === 'link' ? (
          <a key={i} className="inline-link" href={part.href} target="_blank" rel="noopener noreferrer">
            {part.text}
          </a>
        ) : part.kind === 'bold' ? (
          <strong key={i}>{part.text}</strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}

/** The cleaned posting (backend Markdown): sections, lists, bold and links. */
export function JobMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="job-desc job-md">
      {parseMarkdown(markdown).map((block, i) =>
        block.kind === 'heading' ? (
          <h3 key={i}>{block.text}</h3>
        ) : block.kind === 'list' ? (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>
                <InlineText parts={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <InlineText parts={line} />
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  )
}

/** Renders the backend's plain-text posting: blank lines split blocks, runs of lines
 *  starting with "• " become a list, other lines a paragraph ("What you will do"
 *  above its bullets stays its own line). Plain text only, never HTML (T-05-02). */
export function JobDescription({ text }: { text: string }) {
  const parts: Array<{ list: boolean; lines: string[] }> = []
  for (const block of text.split(/\n{2,}/)) {
    let current: { list: boolean; lines: string[] } | null = null
    for (const line of block.split('\n').filter(Boolean)) {
      const list = line.startsWith('• ')
      if (!current || current.list !== list) {
        current = { list, lines: [] }
        parts.push(current)
      }
      current.lines.push(list ? line.slice(2) : line)
    }
  }

  return (
    <div className="job-desc">
      {parts.map((part, i) =>
        part.list ? (
          <ul key={i}>
            {part.lines.map((line, j) => (
              <li key={j}>{line}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {part.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
