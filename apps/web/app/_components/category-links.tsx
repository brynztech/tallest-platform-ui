import Link from 'next/link'

const LINK_CLASS =
  'text-[14px] leading-5 font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link'

interface CategoryLinksProps {
  items: string[]
  /** Fill the search in place instead of navigating to /jobs?q=. */
  onSelect?: (label: string) => void
}

export function CategoryLinks({ items, onSelect }: CategoryLinksProps) {
  return (
    <div className="flex max-w-[760px] flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-3">
      {items.map((label, i) => (
        <span key={label} className="flex items-center sm:gap-3">
          {i > 0 && <span className="hidden h-3.5 w-px bg-divider sm:block" aria-hidden="true" />}
          {onSelect ? (
            <button type="button" onClick={() => onSelect(label)} className={LINK_CLASS}>
              {label}
            </button>
          ) : (
            <Link href={`/jobs?q=${encodeURIComponent(label)}`} className={LINK_CLASS}>
              {label}
            </Link>
          )}
        </span>
      ))}
    </div>
  )
}
