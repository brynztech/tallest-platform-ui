import Link from 'next/link'

export function BrynzLogo() {
  return (
    <Link className="logo" href="/" aria-label="Brynz home">
      <svg viewBox="0 0 500 500" aria-hidden="true">
        <rect className="mark-bg" width="500" height="500" rx="110" />
        <g transform="rotate(6 250 250)">
          <path className="mark-fg" d="M165 78h258a10 10 0 0 1 10 10v246a10 10 0 0 1-10 10h-46a10 10 0 0 1-10-10V146H165a10 10 0 0 1-10-10V88a10 10 0 0 1 10-10z" />
          <path className="mark-fg" d="M77 156h46a10 10 0 0 1 10 10v188h192a10 10 0 0 1 10 10v48a10 10 0 0 1-10 10H77a10 10 0 0 1-10-10V166a10 10 0 0 1 10-10z" />
        </g>
      </svg>
      Brynz
    </Link>
  )
}
