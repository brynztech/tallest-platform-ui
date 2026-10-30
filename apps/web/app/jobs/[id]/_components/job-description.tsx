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

/** A posting: the cleaned Markdown, or the original text (same reader: lists, paragraphs,
 *  links), so a job reads properly before it is cleaned too. */
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
