import Link from 'next/link'

// py-2.5 gives a phone-sized tap target (about 40px); from sm the links sit tight again.
const LINK_CLASS =
  'py-2.5 text-[14px] leading-5 font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link sm:py-0'

interface CategoryLinksProps {
  items: string[]
  /** Fill the search in place instead of navigating to /jobs?q=. */
  onSelect?: (label: string) => void
}

// On phones the links are one swipeable row that bleeds to the screen edges (the parent must be
// stretched to the page gutter); from sm they wrap and centre as before.
export function CategoryLinks({ items, onSelect }: CategoryLinksProps) {
  return (
    <div className="-mx-4 flex max-w-[760px] items-center gap-x-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-auto sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-1 sm:overflow-visible sm:px-0 sm:py-0 [&::-webkit-scrollbar]:hidden">
      {items.map((label, i) => (
        <span key={label} className="flex shrink-0 items-center sm:gap-3">
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
