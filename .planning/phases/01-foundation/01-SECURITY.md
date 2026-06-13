---
phase: 1
slug: foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-13
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| MSW init → production | MSW must never intercept in production; `NEXT_PUBLIC_API_MOCKING` env var controls activation | Dev-only mock responses |
| packages/api-client → backend | Generated types trust the backend schema; drift is caught at compile-time only (accepted per D-05) | OpenAPI schema snapshot |
| packages/mocks → app code | MSW handlers are the only approved import location; apps must never define handlers inline | Mock response data |
| Browser → MSW service worker | Worker intercepts all matching fetch calls; production guard is the env var | Fetch request/response pairs |
| Walking skeleton page → backend | Page uses apiClient which hits localhost:8000 or MSW depending on env | BD rejection reasons enum |
| smoke-domains.test.ts → live backend | Integration tests call the real backend with no mocking — must only run in dev | Live API responses |
| apps/console → internet | Console is trusted-network only; no auth in v1 | Internal ops data |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Tampering | MSWProvider (both apps) | mitigate | `NEXT_PUBLIC_API_MOCKING !== 'enabled'` guard in all 4 MSW init locations; sets ready=true immediately in production so no blank flash; try/catch prevents silent hang on SW failure | **CLOSED** |
| T-01-02 | Information Disclosure | packages/api-client/openapi.json committed | accept | Private repo; live `/openapi.json` and `/docs` disabled in FastAPI production config (backend responsibility) | **CLOSED** |
| T-01-03 | Elevation of Privilege | apps/console network exposure | accept | Trusted-network v1; operators configure reverse proxy IP allowlist or VPN | **CLOSED** |
| T-01-04 | Information Disclosure | Candidate PII via MSW handlers | accept | Phase 1 handlers return mock data only — no real PII; real candidate file access must use backend-issued signed URLs (future constraint) | **CLOSED** |
| T-02-01 | Information Disclosure | openapi.json schema in repo | accept | Private repo; same rationale as T-01-02 | **CLOSED** |
| T-02-02 | Tampering | generate:api:live modifies committed snapshot | accept | Developer-invoked only; no CI auto-run; TypeScript compiler catches schema drift at consume time | **CLOSED** |
| T-02-03 | Information Disclosure | Contract YAML files contain proposed API shapes | accept | Files live in .planning/ (not shipped); describe proposed not implemented endpoints; no sensitive data | **CLOSED** |
| T-02-04 | Denial of Service | smoke-test.ts invalid type assertions | mitigate | Compile-time assertions only (`type _testN = X extends Y ? true : never`); 5 assertions verified via `tsc --noEmit`; TypeScript fails loudly on regression — no runtime overhead | **CLOSED** |
| T-03-01 | Tampering | MSWProvider in both apps | mitigate | Guard in all 4 files: `msw-provider.tsx` (web + console), `instrumentation.ts` (web + console); guard is `!== 'enabled'` early-return so production path is zero-overhead | **CLOSED** |
| T-03-02 | Elevation of Privilege | apps/console accessible from internet | accept | Development only in Phase 1; operators responsible for network-level access control | **CLOSED** |
| T-03-03 | Information Disclosure | Geist font from next/font/google | accept | Next.js proxies via Vercel CDN (not direct fonts.googleapis.com); air-gap deployment would need self-hosting — acceptable for v1 | **CLOSED** |
| T-03-04 | Denial of Service | console app/page.tsx unconditional redirect | accept | Redirect to /bd/leads is correct for Phase 1 skeleton; Phase 2 adds real routes | **CLOSED** |
| T-04-01 | Tampering | MSW rejection-reasons handler in bd.ts | mitigate | Handler only active when `NEXT_PUBLIC_API_MOCKING=enabled`; production requests route to real backend; guard documented in handler comment | **CLOSED** |
| T-04-02 | Information Disclosure | Walking skeleton page exposes mock vs live source | accept | Informational text only; Phase 1 verification page replaced by real BD queue in Phase 2 | **CLOSED** |
| T-04-03 | Tampering | shadcn CLI modifying globals.css brand tokens | mitigate | `packages/ui/src/styles/globals.css` verified: `--primary: oklch(0.546 0.215 261.3)` (Brynzit blue) preserved; shadcn did not reset brand color | **CLOSED** |
| T-04-04 | Elevation of Privilege | console accessible at localhost:3001 | accept | Development only; trusted-network assumption | **CLOSED** |
| T-04-05 | Information Disclosure | smoke-domains.test.ts calls live backend without auth | accept | Backend is trusted-network only in v1; tests are read-only; tests must not run in CI unless backend is accessible | **CLOSED** |

*Status: open · closed*
*Disposition: mitigate (implementation verified) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-01-02, T-02-01 | OpenAPI schema committed to private repo; FastAPI production docs disabled at deployment | Phase 1 plan | 2026-06-13 |
| AR-01-02 | T-01-03, T-03-02, T-04-04 | Console is trusted-network only in v1; no auth by design (CONTEXT.md D-02); Okta integration is a future phase | Phase 1 plan | 2026-06-13 |
| AR-01-03 | T-01-04 | Phase 1 mock data only; real PII access paths will use signed URLs (constraint documented for future phases) | Phase 1 plan | 2026-06-13 |
| AR-01-04 | T-02-02 | generate:api:live is developer-invoked only; TypeScript compiler provides the catch at consume time | Phase 1 plan | 2026-06-13 |
| AR-01-05 | T-02-03 | Contract YAMLs are planning artifacts in .planning/ (not deployed); no sensitive data | Phase 1 plan | 2026-06-13 |
| AR-01-06 | T-03-03 | Geist proxied via Vercel CDN; air-gap self-hosting deferred to production hardening | Phase 1 plan | 2026-06-13 |
| AR-01-07 | T-03-04, T-04-02 | Skeleton redirect and mock-source label are Phase 1 verification scaffolding; replaced in Phase 2 | Phase 1 plan | 2026-06-13 |
| AR-01-08 | T-04-05 | Smoke tests read-only against trusted-network backend; CI gate documented in smoke-domains.test.ts | Phase 1 plan | 2026-06-13 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-13 | 17 | 17 | 0 | gsd-secure-phase (orchestrator — mitigations verified in code) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-13
