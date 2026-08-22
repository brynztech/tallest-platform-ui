'use client'

/**
 * Paper-faithful preview of a generated JD.
 *
 * This renders the *document*, not console chrome: the palette, Arial face,
 * section order and 3x3 quick-facts grid mirror
 * `../talent-platform/ops/services/jd_docx.py` so what an account manager sees
 * here is what the downloaded .docx contains. Everything around it (dialog,
 * buttons, toasts) uses the console's own tokens.
 *
 * The .docx additionally carries the Brynz logo mark in its header; the web
 * preview shows the wordmark alone.
 */

import { paragraphs, quickFactRows, titleSubtitle, type JobDescription } from '../_lib/jd'

// Lifted verbatim from jd_docx.py — keep the two in step.
const DOC = {
  navy: '#1B2A4A',
  muted: '#7A8499',
  body: '#333333',
  titleSub: '#A8BBDC',
  accent: '#2D5BE3',
  hairline: '#D8DDE6',
  green: '#166534',
  red: '#991B1B',
} as const

const PAPER_FONT = 'Arial, Helvetica, sans-serif'

export function JdPreview({ jd }: { jd: JobDescription }) {
  const company = jd.title_block.company || 'the Company'
  return (
    <article
      className="mx-auto w-full max-w-[820px] bg-white px-8 py-7 text-[13px] leading-[1.55]"
      style={{ fontFamily: PAPER_FONT, color: DOC.body }}
      aria-label={`Job description for ${jd.title_block.role_title}`}
    >
      {/* Brand header */}
      <header className="pb-2">
        <div className="text-[16px] font-bold" style={{ color: DOC.navy }}>
          {jd.footer.recruiter_name}
        </div>
        <div className="text-[9px]" style={{ color: DOC.muted }}>
          {jd.footer.recruiter_title}
        </div>
      </header>
      <hr className="mb-3 border-0 border-t" style={{ borderColor: DOC.hairline }} />

      {/* Title band */}
      <div className="px-5 py-4" style={{ backgroundColor: DOC.navy }}>
        <h1 className="text-[28px] font-bold leading-tight text-white">
          {jd.title_block.role_title}
        </h1>
        <p className="mt-1 text-[10px]" style={{ color: DOC.titleSub }}>
          {titleSubtitle(jd.title_block)}
        </p>
      </div>

      {/* Quick facts — fixed 3x3, every cell filled */}
      <div className="mt-4 grid grid-cols-3">
        {quickFactRows(jd.quick_facts).flatMap((row, rowIndex) =>
          row.map((fact) => (
            <div key={`${rowIndex}-${fact.label}`} className="px-2 py-2">
              <div className="text-[9px] tracking-wide" style={{ color: DOC.muted }}>
                {fact.label}
              </div>
              <div className="text-[14px] font-bold" style={{ color: DOC.navy }}>
                {fact.value}
              </div>
            </div>
          )),
        )}
      </div>

      <Section title={`About ${company}`}>
        {paragraphs(jd.about_company).map((text, index) => (
          <p key={index} className="mb-1.5">
            {text}
          </p>
        ))}
      </Section>

      <Section title="About the Role">
        {paragraphs(jd.about_role).map((text, index) => (
          <p key={index} className="mb-1.5">
            {text}
          </p>
        ))}
      </Section>

      <Section title="What You'll Own">
        <Bullets items={jd.what_youll_own} />
      </Section>

      <Section title="Requirements">
        <SubHeading>Must-Have</SubHeading>
        <Bullets items={jd.requirements.must_have} />
        <SubHeading>Nice-to-Have</SubHeading>
        <Bullets items={jd.requirements.nice_to_have} />
      </Section>

      <Section title="Green Flags">
        <Bullets items={jd.green_flags} color={DOC.green} />
      </Section>

      <Section title="Red Flags">
        <Bullets items={jd.red_flags} color={DOC.red} />
      </Section>

      <Section title="Benefits & Perks">
        <Bullets items={jd.benefits} />
      </Section>

      <Section title="Interview Process">
        <ol className="space-y-1">
          {jd.interview_process.map((stage, index) => (
            <li key={`${index}-${stage}`} className="flex items-center gap-2">
              <span
                className="flex size-5 shrink-0 items-center justify-center text-[11px] font-bold text-white"
                style={{ backgroundColor: DOC.navy }}
              >
                {index + 1}
              </span>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Follow-us bar */}
      <div
        className="mt-6 px-3 py-2 text-[11px] font-bold text-white"
        style={{ backgroundColor: DOC.navy }}
      >
        ■&nbsp;&nbsp;Follow {jd.footer.recruiter_name} on LinkedIn for more roles like this
      </div>

      {/* Footer */}
      <footer
        className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-0 border-t pt-2 text-[11px]"
        style={{ borderColor: DOC.hairline }}
      >
        <span className="font-bold" style={{ color: DOC.navy }}>
          Placed by {[jd.footer.recruiter_name, jd.footer.recruiter_title].filter(Boolean).join(' · ')}
        </span>
        <span style={{ color: DOC.accent }}>
          {[jd.footer.email, jd.footer.website].filter(Boolean).join('   ')}
        </span>
      </footer>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2
        className="mb-2 border-0 border-l-[3px] pl-2 text-[14px] font-bold"
        style={{ borderColor: DOC.accent, color: DOC.navy }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-3 text-[12px] font-bold" style={{ color: DOC.navy }}>
      {children}
    </h3>
  )
}

function Bullets({ items, color }: { items: string[]; color?: string }) {
  if (items.length === 0) return null
  return (
    <ul className="list-disc space-y-1 pl-5" style={color ? { color } : undefined}>
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  )
}
