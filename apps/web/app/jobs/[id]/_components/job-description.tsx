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
