// packages/api-client/src/smoke-test.ts
// Compile-time assertions verifying Pydantic v2 anyOf+null fields are typed as T | null.
// Run: pnpm --filter @brynzit/api-client typecheck
// These assertions fail at compile time if openapi-typescript misses nullable fields.
// Fill in after running pnpm generate:api (Plan 02).
export {}
