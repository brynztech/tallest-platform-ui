# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-13
**Phase:** 1-Foundation
**Areas discussed:** Codegen connectivity, useAsyncJob hook interface, Tailwind v4 content scanning

---

## Codegen Connectivity

### Q1: Where does `pnpm generate:api` fetch the OpenAPI schema?

| Option | Description | Selected |
|--------|-------------|----------|
| Live local backend | Always fetches from http://localhost:8000/api/v1/openapi.json. Requires backend running. | |
| Static snapshot | Committed openapi.json snapshot. No backend needed. | |
| Both — local dev + snapshot for CI | Local dev hits live backend; CI uses committed snapshot. | ✓ |

**User's choice:** Both — local for dev, snapshot for CI

---

### Q2: Where does the snapshot file live?

| Option | Description | Selected |
|--------|-------------|----------|
| packages/api-client/openapi.json | Next to generated types. | ✓ |
| .planning/contracts/openapi-snapshot.json | Alongside candidate-facing contract proposals. | |
| scripts/openapi.json | Neutral root-level location. | |

**User's choice:** packages/api-client/openapi.json

---

### Q3: How does the script know snapshot vs live?

| Option | Description | Selected |
|--------|-------------|----------|
| OPENAPI_URL env var (defaults to snapshot) | Env-driven. CI uses default (snapshot). | |
| Two scripts: generate:api + generate:api:live | Explicit. generate:api = snapshot; generate:api:live = hits live + updates snapshot. | ✓ |
| Auto-detect (check if backend reachable, fallback) | Convenient but adds latency/complexity. | |

**User's choice:** Two scripts

---

### Q4: Should CI fail if snapshot is out of date?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — CI runs generate:api:live and diffs | Automated drift detection. Requires backend in CI. | |
| No — manual developer step | Simpler. TypeScript compilation acts as indirect safety net. | ✓ |
| Warn via tsc — type-check snapshot in CI | Indirect detection. | |

**User's choice:** No — manual developer step

---

## useAsyncJob Hook Interface

### Q1: Primary input shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Just the job ID string | useAsyncJob(jobId). Minimal. | |
| Job ID + endpoint template | useAsyncJob(jobId, endpoint). | |
| Options object | useAsyncJob({ jobId, endpoint, enabled }). Most flexible. | ✓ |

**User's choice:** Options object

---

### Q2: What states/shape does the hook return?

| Option | Description | Selected |
|--------|-------------|----------|
| 3 states: pending \| complete \| failed | Minimal, covers documented terminal states. | |
| 4 states: idle \| pending \| complete \| failed | Adds idle for when polling is disabled. | |
| Backend passthrough — return raw status strings | Thin hook, callers handle status vocabulary. | |

**User's choice:** Both normalized phase AND raw status — user provided the exact TypeScript interface:
```ts
type AsyncJobPhase = 'idle' | 'pending' | 'complete' | 'failed'
type AsyncJobResult<TData, TRawStatus extends string = string> = {
  phase: AsyncJobPhase
  rawStatus?: TRawStatus
  data?: TData
  error?: unknown
  isPolling: boolean
}
```

---

### Q3: How does the hook map raw backend status to normalized phase?

| Option | Description | Selected |
|--------|-------------|----------|
| Default built-in mapping, caller can override | Ships with queued/processing→pending, done/completed→complete, failed/error→failed. Caller overrides via statusMap. | ✓ |
| Caller always provides the mapping | No defaults. More verbose. | |
| Infer from response shape | Auto-detects status field. Fragile. | |

**User's choice:** Default built-in mapping with caller override via `statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>`

---

### Q4: Where does useAsyncJob live?

| Option | Description | Selected |
|--------|-------------|----------|
| packages/mocks | Wrong concern separation. | |
| packages/ui | Design system — mixing hooks is a layering concern. | |
| New packages/hooks package | Clean separation. Worth setup cost given reuse across all phases. | ✓ |
| Each app has its own copy | Hook diverges over time. Defeats write-once goal. | |

**User's choice:** New packages/hooks package

---

## Tailwind v4 Content Scanning

### Q1: How should apps pick up classes from packages/ui?

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit @source in each app's CSS | `@source '../../packages/ui/src/**/*.{ts,tsx}'` in globals.css. Most explicit. | ✓ |
| packages/ui pre-builds a stylesheet, apps @import | packages/ui compiles its own CSS. Heavier build setup. | |
| Shared Tailwind config package | Centralizes config. Adds another package. | |

**User's choice:** Explicit `@source` in each app's CSS entry point

---

### Q2: Who owns the @theme token declarations?

| Option | Description | Selected |
|--------|-------------|----------|
| packages/ui/src/styles/globals.css owns @theme | One source of truth. Both apps import and override only what differs. | ✓ |
| Each app defines its own @theme | Intentional divergence. Shared packages/ui only ships components. | |

**User's choice:** `packages/ui/src/styles/globals.css` owns `@import "tailwindcss"` + all shared `@theme` tokens. Apps import it and add overrides only.

**Notes:** User provided rationale: shared components need shared design tokens; both apps should feel like the same product even with different moods; prevents accidental token drift.

---

### Q3: Does the @source directive cover the app itself too?

| Option | Description | Selected |
|--------|-------------|----------|
| Only @source for packages/ui — Tailwind v4 auto-scans the app | Cleaner. One @source per external package. | ✓ |
| Both: @source for packages/ui AND the app's own src/ | More explicit. Avoids surprises if auto-detection changes. | |

**User's choice:** Only `@source` for packages/ui — Tailwind v4 handles the app itself.

---

## Claude's Discretion

- Package naming / npm scope — not discussed. Chose `@brynzit/*` to match brand name.
- Turborepo `turbo.json` task graph structure
- pnpm workspace catalog structure for version pinning
- Contract proposal file format for `.planning/contracts/` (YAML vs TypeScript interfaces)
- Error boundary placement in each app

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
