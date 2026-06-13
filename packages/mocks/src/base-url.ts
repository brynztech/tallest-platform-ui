// API base URL for MSW handler URL matching.
// Must match the baseUrl configured in packages/api-client/src/client.ts.
// NEXT_PUBLIC_API_URL is inlined at Next.js build time for browser bundles
// (packages/mocks is in transpilePackages for both apps).
// Falls back to http://localhost:8000 for local development.
export const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:8000'
