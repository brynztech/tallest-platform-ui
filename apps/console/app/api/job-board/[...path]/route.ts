/**
 * Server-side proxy for the backend's job-board admin API.
 *
 * Why a proxy rather than calling the backend directly from the browser: those
 * endpoints require `X-Admin-Token`, and anything the browser bundle can read is
 * public. Route handlers run on the server, so the token comes from server-only
 * env and never reaches the client. The console talks to same-origin
 * `/api/job-board/*` and holds no credential at all.
 *
 * The console has no per-user auth in v1 (trusted-network internal tool), so this
 * deliberately does not authenticate the caller — it inherits whatever network
 * boundary protects the console. That is the same posture as the rest of the
 * console, and the point where Okta would slot in later.
 */
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Server-only: no NEXT_PUBLIC_ prefix, so Next.js will not inline it into the
// client bundle.
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

/** Methods this proxy will forward. Anything else is refused rather than passed
 *  through, so the proxy cannot become a general-purpose backend tunnel. */
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/** Upstream timeout. Every endpoint behind this proxy is fast — the crawl itself
 *  is async and returns 202 immediately, and the heaviest read is a handful of
 *  COUNTs for the visibility preview. Without a bound, an unreachable-but-not-
 *  refusing backend leaves the admin panel spinning forever with no error; a
 *  504 at least tells the operator what is wrong. */
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
  // crafted path cannot escape the /job-board prefix.
  const suffix = path.map(encodeURIComponent).join('/')
  const query = request.nextUrl.search
  const target = `${BACKEND_URL}/api/v1/job-board/${suffix}${query}`

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
      // Admin reads must reflect the live crawl, so never serve a cached page.
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })

    const text = await response.text()
    // The Fetch spec forbids a body on a null-body status (204/205/304) — the
    // Response constructor throws if given one, even an empty string, which
    // previously surfaced as a bogus 502 on every DELETE (204 No Content).
    const NULL_BODY_STATUSES = new Set([204, 205, 304])
    return new NextResponse(NULL_BODY_STATUSES.has(response.status) ? null : text, {
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
          ? `The backend at ${BACKEND_URL} did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s.`
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

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(request, path)
}
