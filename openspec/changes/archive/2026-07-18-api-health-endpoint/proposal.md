# Proposal: Fortify & Test Health Endpoint

**Change ID:** `api-health-endpoint`
**Status:** proposal
**Date:** 2026-07-18

---

## 1. Intent

Harden the existing `GET /api/health` and `GET /api/health/ready` endpoints so that version detection is reliable across all runtime environments and the endpoints are protected by automated tests. Today, version reporting depends on an unreliable `npm_package_version` environment variable and a hardcoded fallback, and `apps/api` has zero tests for these (or any) route handlers.

The change is purely defensive: no new behavior, no new endpoints, no observability integration beyond what already ships with `@kadarn/instrumentation`.

---

## 2. Scope

### 2.1 In scope

| # | Item | Rationale |
|---|------|-----------|
| 1 | **Robust version reading** — read `apps/api/package.json` at module load via `fs.readFileSync` + `JSON.parse` instead of `process.env.npm_package_version` with hardcoded fallback `'0.2.0'` | `npm_package_version` is only set when the process is launched via `npm run …`. Running the built output with plain `node`, in Docker without an npm shim, or from test runners leaves the env var unset, silently returning the static fallback. |
| 2 | **Create `apps/api/vitest.config.ts`** — a minimal vitest configuration that mirrors the pattern used in `packages/instrumentation` (Node environment, `include: ['src/**/*.test.ts']`) | `apps/api` is the only production runtime that currently lacks both a vitest config and any test files. |
| 3 | **Add tests for `GET /api/health`** — verify response shape, `status: 'ok'`, presence of `version`/`uptime_ms`/`memory`/`checks` fields, and HTTP 200 | Prevents regressions when the liveness response shape changes accidentally. |
| 4 | **Add tests for `GET /api/health/ready`** — verify `ready: true` when all checks pass, HTTP 200 for ok/degraded, HTTP 503 for fail, and the `checks` array structure | Prevents regressions when readiness logic changes. Readiness tests must handle the side-effect of `bootstrapInstrumentation()` at module load (the init call is idempotent). |
| 5 | **Future-proof Docker version injection** — document in a code comment how to inject `VERSION` at Docker build time (e.g. `ARG VERSION` + `ENV KADARN_VERSION=$VERSION`) so the package.json approach works as the default but can be overridden in CI pipelines | There is no production Dockerfile today, but when one is created the version story should already be clear. |

### 2.2 Out of scope (non-goals)

- No new endpoints or route changes
- No changes to `HealthAggregator` internals or the `@kadarn/instrumentation` package
- No monitoring/alerting integration — Langfuse tracing arrives in a later sprint
- No Dockerfile creation — just the comment/pattern for future use
- No changes to middleware or rate limiting — health paths are already excluded
- No DB ping addition to the liveness endpoint (`/api/health` stays lightweight)

---

## 3. Affected Areas

### 3.1 Files to modify

| File | Action | Est. Δ |
|------|--------|--------|
| `apps/api/src/app/api/health/route.ts` | Replace `process.env.npm_package_version ?? '0.2.0'` with `readFileSync`-based version reading from `../../package.json` | +7/−2 |
| `apps/api/vitest.config.ts` | **Create** — Node environment, `include` glob for test files | +10 |
| `apps/api/src/app/api/health/__tests__/health.test.ts` | **Create** — liveness endpoint tests | +45 |
| `apps/api/src/app/api/health/ready/__tests__/ready.test.ts` | **Create** — readiness endpoint tests | +50 |

### 3.2 Files to review (no changes)

| File | Why |
|------|-----|
| `apps/api/src/app/api/health/ready/route.ts` | Readiness handler — tests will exercise it; no code change needed |
| `apps/api/src/lib/instrumentation-bootstrap.ts` | Bootstrap is idempotent; tests must handle the module-level side-effect |
| `apps/api/src/middleware.ts` | Already excludes `/api/health` and `/api/health/*` from rate limiting |
| `packages/instrumentation/src/health.ts` | HealthAggregator — no changes; tests import it |
| `packages/instrumentation/src/init.ts` | initInstrumentation — no changes; tests trigger it indirectly |

### 3.3 Systems and teams affected

- **API developers** — new test files live alongside route handlers; the test pattern is straightforward and matches the existing instrumentation test style
- **CI pipeline** — `apps/api` gains a `test` script entry (or is covered by the root `npm test` when vitest discovers `apps/api/**/*.test.ts`)
- **DevOps / platform** — when a production Dockerfile is introduced, the version injection comment serves as documentation

---

## 4. Approach

### 4.1 Version resolution

Current (`apps/api/src/app/api/health/route.ts`, line 11):
```typescript
const VERSION = process.env.npm_package_version ?? '0.2.0'
```

Proposed:
```typescript
import { readFileSync } from 'node:fs'

function readVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')
    )
    return pkg.version
  } catch {
    return '0.0.0-unknown'
  }
}

const VERSION = process.env.KADARN_VERSION ?? readVersion()
```

Key decisions:
- **`KADARN_VERSION` override** — allows Docker/CI to inject the exact version at build time without touching code. Falls back to the filesystem read.
- **Graceful degradation** — if `package.json` is unreadable for any reason, returns `'0.0.0-unknown'` (clearly identifiable as a misconfiguration — better than a silently wrong hardcoded version).
- **Module-level execution** — version is read once at startup, same as today. No runtime I/O on every health request.

### 4.2 Vitest configuration

Follow the existing `packages/instrumentation/vitest.config.ts` pattern:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

This is intentionally minimal — no global setup, no timeout overrides, no coverage thresholds. Those can be added when the test suite grows.

### 4.3 Test strategy

#### Liveness test (`health.test.ts`)

Directly calls the `GET` export (it receives a `Request` and returns `Response`). The liveness endpoint does NOT depend on `HealthAggregator` — it uses `createLivenessReport()` which is pure — so no mocking of DB is needed.

Assertions:
- Response has HTTP 200
- JSON body contains `{ ok: true, data: { app, status, version, environment, uptime_ms, memory, checks, timestamp } }`
- `data.status` is `'ok'`
- `data.version` is a non-empty string (not the old hardcoded fallback)
- `data.uptime_ms` is a non-negative number
- `data.memory` has `heap_used_mb`, `heap_total_mb`, `rss_mb`

#### Readiness test (`ready.test.ts`)

Calls the `GET` export directly. The readiness endpoint calls `getHealthAggregator().run()` which executes all registered checks (config + supabase). 

Challenge: `bootstrapInstrumentation()` is called at module load (idempotent, but it registers the supabase ping). The test needs to handle two cases:
1. **Without Supabase** (CI, local without env): the supabase check will fail → overall status `'fail'` → HTTP 503 → `ready: false`
2. **With Supabase** (integration): the supabase check passes → HTTP 200 → `ready: true`

Strategy: test the response structure in isolation. Use `vi.mock()` to mock `@/lib/instrumentation-bootstrap` and control the registered health checks. Or, accept that the baseline test validates the "no Supabase" case (which is the CI default) and asserts that the response structure is correct even when `ready: false`.

Preferred approach: mock `getHealthAggregator` to return controlled reports, testing both ok and fail paths without requiring DB connectivity.

Assertions:
- Response JSON follows the success envelope: `{ ok: true, data: { ready, status, checks, timestamp } }`
- When aggregator returns `ok` → HTTP 200, `ready: true`
- When aggregator returns `fail` → HTTP 503, `ready: false`
- `checks` is an array of `{ name, status, message?, durationMs? }`

---

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `readFileSync` fails in edge runtime (e.g., if Next.js moves health route to edge) | Low — health routes are Node.js runtime | The `try/catch` fallback to `'0.0.0-unknown'` prevents crashes; the `KADARN_VERSION` env override provides an alternative path |
| `import.meta.url` resolution breaks after build | Low — Next.js preserves file-relative resolution for `readFileSync` when used with `new URL(…, import.meta.url)` | The `try/catch` fallback handles this; if `package.json` is not co-located in the build output, the env override remains the primary path |
| `bootstrapInstrumentation()` side-effect in tests pollutes state | Medium — module-level initialization runs once and is idempotent, but test isolation may be subtle | Mock `getHealthAggregator` in readiness tests; rely on idempotent `bootstrapped` flag for liveness tests |
| Vitest config conflicts with existing root-level test config | Low — per-package vitest configs are the established pattern (`packages/instrumentation`, `tests/`) | Follow the same pattern; no conflict expected |
| Hardcoded version fallback removal breaks existing monitoring dashboards expecting `'0.2.0'` | Low — any dashboard consuming the health version field currently sees `'0.2.0'` from either the env var or the fallback; the package.json read returns `'0.2.0'` for the current version anyway | The package.json version is `'0.2.0'` — identical to the current fallback |

---

## 6. Rollback Plan

If the version-reading change causes issues in any environment:

1. Revert the `route.ts` change — the old `process.env.npm_package_version ?? '0.2.0'` pattern is a single-line replacement
2. Tests remain valuable regardless — they can stay even if the version reading is reverted
3. The `KADARN_VERSION` env var pattern is additive — removing it just means the filesystem fallback is the only path, which is still an improvement over the current state

Revert is a single commit touching one file.

---

## 7. Success Criteria

- [ ] `GET /api/health` returns the version from `apps/api/package.json` (currently `"0.2.0"`) without relying on `npm_package_version`
- [ ] Setting `KADARN_VERSION=ci-test` overrides the version in the health response
- [ ] `apps/api` has `vitest.config.ts` and both test files pass with `npx vitest run`
- [ ] Liveness test validates the full response shape of `GET /api/health`
- [ ] Readiness test validates both the ok and fail paths of `GET /api/health/ready`
- [ ] No changes to `@kadarn/instrumentation` are required
- [ ] Existing CI, middleware, and health route behavior is unchanged (except the version source)

---

## 8. Proposal Question Round

The following questions surfaced during exploration. Answers will refine scope and implementation details before execution begins.

### Q1 — Version override priority
Should `KADARN_VERSION` always win over the filesystem read, or should the filesystem be the primary source with `KADARN_VERSION` as a debug/local override? The current proposal makes `KADARN_VERSION` the primary source, falling back to `package.json`. This is the safer production pattern (CI injects the exact tag). Is this acceptable, or should `package.json` always be the canonical source?

### Q2 — Readiness test mocking depth
The readiness endpoint calls `getHealthAggregator().run()`. The proposal suggests mocking `getHealthAggregator` for unit tests. An alternative is to mock only the supabase ping at the `initInstrumentation` level and let the real `HealthAggregator` run. Which level of mocking is preferred? Deeper mocking gives faster, more isolated tests. Shallower mocking gives higher fidelity at the cost of more setup.

### Q3 — Test file location convention
The proposal places tests in `apps/api/src/app/api/health/__tests__/` (co-located with the route). The existing project pattern varies: `packages/instrumentation/tests/` uses a top-level `tests/` directory, while some projects prefer `__tests__` directories next to source. Which convention should `apps/api` follow?

### Q4 — Docker version injection: placeholder or implementation?
The proposal scopes Docker to a code comment documenting the `KADARN_VERSION` injection pattern. Should this be expanded to include an actual `Dockerfile` for `apps/api` in this change, or is the comment sufficient for now (to be implemented when the production Docker setup is created in a later sprint)?

### Q5 — CI integration
Should `apps/api` tests run as part of the root `npm test` script, or should they be a separate CI step? Currently, the root `package.json` may or may not discover `apps/api` tests; the vitest config makes them independently runnable (`cd apps/api && npx vitest run`). Does the project prefer a monorepo-wide test discovery or explicit per-package test commands?
