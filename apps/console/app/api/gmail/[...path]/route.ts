/**
 * Server-side proxy for the backend's Gmail resume-ingest admin API.
 *
 * Same reasoning as the job-board proxy next door: `/supply/gmail/*` requires
 * `X-Admin-Token`, and anything the browser bundle can read is public. Route
 * handlers run on the server, so the token comes from server-only env and never
 * reaches the client. The console talks to same-origin `/api/gmail/*` and holds
 * no credential at all.
 *
 * Note the asymmetry with the rest of the console: most `/supply/*` endpoints
 * are ungated and called straight from the browser. The Gmail routes are not —
 * they configure what gets pulled out of a real mailbox — so they go through
 * here.
 */
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Server-only: no NEXT_PUBLIC_ prefix, so Next.js will not inline it into the
// client bundle.
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

/** Methods this proxy will forward. Anything else is refused rather than passed
 *  through, so the proxy cannot become a general-purpose backend tunnel. */
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH'])

/** Every endpoint behind this proxy is fast: the poll itself is queued to Celery
 *  and returns 202 immediately, and the heaviest read is 25 ledger rows. */
const UPSTREAM_TIMEOUT_MS = 15_000

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  if (!ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json({ detail: 'Method not allowed' }, { status: 405 })
  }

  if (!ADMIN_TOKEN) {
    // Fail loudly and specifically. Without this the backend returns a bare 503
    // and an operator has no idea which side is misconfigured.
    return NextResponse.json(
      {
        detail:
          'ADMIN_API_TOKEN is not set for the console server. Add it to the ' +
          "console's environment (it must match the backend's ADMIN_API_TOKEN).",
      },
      { status: 503 },
    )
  }

  // Rebuilt from the matched segments rather than passed through raw, so a
  // crafted path cannot escape the /supply/gmail prefix.
  const suffix = path.map(encodeURIComponent).join('/')
  const query = request.nextUrl.search
  const target = `${BACKEND_URL}/api/v1/supply/gmail/${suffix}${query}`

  const headers: Record<string, string> = { 'X-Admin-Token': ADMIN_TOKEN }
  const contentType = request.headers.get('content-type')
  if (contentType) headers['Content-Type'] = contentType

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      // Poll status must reflect the live run, so never serve a cached page.
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (error) {
    // Distinguish "took too long" from "could not connect": they need different
    // fixes, and a single generic message sends operators down the wrong path.
    const timedOut =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return NextResponse.json(
      {
        detail: timedOut
          ? `The backend at ${BACKEND_URL} did not respond within ${
              UPSTREAM_TIMEOUT_MS / 1000
            }s.`
          : `Could not reach the backend at ${BACKEND_URL}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
      },
      { status: timedOut ? 504 : 502 },
    )
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}
