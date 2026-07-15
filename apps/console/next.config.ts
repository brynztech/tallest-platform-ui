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
}

export default nextConfig
