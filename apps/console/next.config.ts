import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@brynzit/ui',
    '@brynzit/api-client',
    '@brynzit/mocks',
    '@brynzit/hooks',
    '@brynzit/identity',
    '@brynzit/pipeline',
    '@brynzit/recruiting',
  ],
  // Proxies browser calls to /api/v1/* through this Next.js server instead of
  // straight to the backend host. The staff session cookie is SameSite=Lax
  // (platform/staff_auth.py) — fine when frontend/backend share a site (e.g.
  // localhost:*), but a hard requirement once they're on separate hosts (the
  // deployed dev/prod EC2 pair): a cross-site fetch would never carry the
  // cookie, so every authenticated route would look signed-out. Routing
  // through this same-origin proxy makes it same-site again, no TLS needed.
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8000'
    return [{ source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` }]
  },
}

export default nextConfig
