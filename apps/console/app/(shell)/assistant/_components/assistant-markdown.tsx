'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown for `assistant_message` bodies only (CONSOLE_ASSISTANT_PRINCIPLES.md
 * §7) — user messages and tool activity stay plain text.
 *
 * Two hard constraints from the spec, both load-bearing:
 *  - **No raw HTML.** react-markdown ignores embedded HTML unless `rehype-raw`
 *    is added; it deliberately is not. Model output is untrusted text.
 *  - **Console-relative links only** (§10 rule 9). `urlTransform` drops
 *    anything else, and a dropped href renders as plain text rather than a
 *    dead link — so a hallucinated or injected external URL is never clickable.
 *    This also neutralises GFM's autolink-literals, which would otherwise turn
 *    any bare URL the model typed into a live external link.
 *
 * GFM is enabled for tables: the system prompt asks for one when reporting the
 * same fields across several candidates, which is the shape most pipeline
 * questions have.
 */

function consoleRelativeOnly(url: string): string {
  // Leading "/" but not "//" (protocol-relative) and no scheme of any kind.
  return url.startsWith('/') && !url.startsWith('//') ? url : ''
}

export function AssistantMarkdown({ body }: { body: string }) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={consoleRelativeOnly}
        // Images would fetch an external URL from model-authored markup.
        disallowedElements={['img']}
        unwrapDisallowed
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through opacity-70">{children}</del>,

          // Real hierarchy, not three identical bold paragraphs — the prompt
          // asks for headings only when a reply covers separate topics, so when
          // one appears it should actually read as a section break.
          h1: ({ children }) => (
            <h3 className="mt-4 border-b border-border/60 pb-1 text-[0.95rem] font-semibold tracking-tight">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="mt-4 text-[0.9rem] font-semibold tracking-tight">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {children}
            </h6>
          ),

          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,

          // Wide tables scroll inside the bubble instead of stretching it.
          table: ({ children }) => (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
          tr: ({ children }) => <tr className="border-b border-border/50 last:border-0">{children}</tr>,
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">{children}</th>
          ),
          td: ({ children }) => <td className="px-2 py-1.5 align-top">{children}</td>,

          code: ({ children }) => (
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-black/5 p-2 text-xs">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border/70" />,
          a: ({ href, children }) =>
            href ? (
              <a href={href} className="font-medium text-primary underline underline-offset-2">
                {children}
              </a>
            ) : (
              <>{children}</>
            ),
        }}
      >
        {body}
      </Markdown>
    </div>
  )
}
