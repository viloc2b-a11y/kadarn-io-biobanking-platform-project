# Tasks: API Health Endpoint Fortification

**Change ID:** `api-health-endpoint`
**Status:** tasks
**Date:** 2026-07-18

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~145 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | N/A — single PR |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

---

## Affected Files

| # | File | Action | Est. Lines |
|---|------|--------|-------------|
| 1 | `apps/api/vitest.config.ts` | CREATE | +10 |
| 2 | `apps/api/src/app/api/health/route.ts` | MODIFY | +22/−3 |
| 3 | `apps/api/src/__tests__/health.test.ts` | CREATE | +110 |

**Total:** ~145 lines across 3 files.

---

## Implementation Tasks

### Task 1 — Create vitest configuration for apps/api

- [ ] Create `apps/api/vitest.config.ts` with the following content:
  - Import `defineConfig` from `vitest/config`.
  - Export a config with `test.include: ['src/**/*.test.ts']` and `test.environment: 'node'`.
  - Follow the minimal pattern established by `packages/instrumentation/vitest.config.ts` (no global setup, no coverage thresholds).
- [ ] Verify: run `npx vitest run` from `apps/api/` — it must exit 0 (zero tests discovered is acceptable at this stage).
- [ ] Verify: run `npx vitest run --passWithNoTests` from `apps/api/` — confirms vitest discovers the config and the include glob is valid.

**Estimated:** +10 lines. <!-- sdd-owner: implementation -->

---

### Task 2 — Implement robust version resolution + Docker comment in health route

- [ ] Open `apps/api/src/app/api/health/route.ts`.
- [ ] Add `import { readFileSync } from 'node:fs'` at the top of the file.
- [ ] Add a `readVersion()` helper function above the `VERSION` constant:
  - Use `readFileSync` with `new URL('../../../../package.json', import.meta.url)` to read `apps/api/package.json`.
  - Parse as JSON and return `.version`.
  - Wrap in `try/catch`; on any failure return `'0.0.0-unknown'`.
  - Include a comment noting the `KADARN_VERSION` override path.
- [ ] Replace `const VERSION = process.env.npm_package_version ?? '0.2.0'` with `const VERSION = process.env.KADARN_VERSION ?? readVersion()`.
- [ ] Add a code comment (5–8 lines) documenting the Docker `KADARN_VERSION` injection pattern:
  - Describe `ARG VERSION` + `ENV KADARN_VERSION=$VERSION` in Dockerfile.
  - Note that `package.json` read is the default when `KADARN_VERSION` is not set.
  - Mention this is future-proof for CI/CD pipelines.
- [ ] Verify: `grep -n "KADARN_VERSION\|ARG VERSION\|ENV KADARN_VERSION" apps/api/src/app/api/health/route.ts` returns the comment block.
- [ ] Verify: manually inspect that the old `npm_package_version` reference is removed.

**Estimated:** +22/−3 lines. <!-- sdd-owner: implementation -->

---

### Task 3 — Write liveness endpoint tests (3 scenarios)

- [ ] Create `apps/api/src/__tests__/health.test.ts`.
- [ ] Import `describe`, `it`, `expect` from `vitest`.
- [ ] Import the `GET` handler from `apps/api/src/app/api/health/route.ts`.
- [ ] **Scenario 1 — Liveness response shape**:
  - Construct a `new Request('http://localhost/api/health')`.
  - Call `await GET(request)`.
  - Assert `response.status` is `200`.
  - Parse JSON body and assert: `ok === true`, `data.status === 'ok'`, `data.app === 'kadarn-api'`, `data.version` is a non-empty string, `data.uptime_ms >= 0`, `data.environment` is a string, `data.timestamp` is a valid ISO-8601 string.
- [ ] **Scenario 2 — Liveness response includes memory metrics**:
  - Assert `data.memory` is an object with numeric `heap_used_mb`, `heap_total_mb`, `rss_mb`.
  - Assert `data.memory.heap_used_mb >= 0`.
- [ ] **Scenario 3 — Version source is not the old hardcoded fallback**:
  - The test verifies `data.version` is present and non-empty.
  - If `KADARN_VERSION` is not set in the test environment, the value comes from `apps/api/package.json` (`0.2.0` currently) — this is acceptable as long as the source is the new mechanism (filesystem read), not the old `npm_package_version ?? '0.2.0'` pattern. The test documents this baseline.
- [ ] Verify: `cd apps/api && npx vitest run` — all 3 liveness tests pass.

**Estimated:** +55 lines. <!-- sdd-owner: implementation -->

---

### Task 4 — Write readiness endpoint tests (3 scenarios)

- [ ] In the same file `apps/api/src/__tests__/health.test.ts`, add a second `describe` block for readiness.
- [ ] Import the `GET` handler from `apps/api/src/app/api/health/ready/route.ts`.
- [ ] Add `vi.mock('@supabase/supabase-js', ...)` at the top of the test file (vitest hoists `vi.mock` calls before module evaluation, ensuring the mock is in place before `bootstrapInstrumentation()` runs at import time):
  - Mock `createClient` to return a configurable mock object with `.from().select().limit(1)`.
  - Provide two mock implementations: one that resolves successfully (for the "ok" scenario) and one that throws (for the "fail" scenario).
- [ ] **Scenario 4 — Readiness returns ok when supabase is reachable**:
  - Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables.
  - Configure the mock `createClient` to return a client where `.from().select().limit(1)` resolves to `{ data: [{}], error: null }`.
  - Construct a `new Request('http://localhost/api/health/ready')`, call `await GET(request)`.
  - Assert `response.status === 200`.
  - Assert `data.ready === true`, `data.status === 'ok'`.
  - Assert `data.checks` contains a check with `name: 'supabase'` and `status: 'ok'`.
- [ ] **Scenario 5 — Readiness returns fail when supabase is unreachable**:
  - Configure the mock `createClient` to return a client where `.from().select().limit(1)` throws or returns `{ data: null, error: new Error('connection refused') }`.
  - Call `await GET(request)`.
  - Assert `response.status === 503`.
  - Assert `data.ready === false`, `data.status === 'fail'`.
  - Assert `data.checks` contains a `supabase` check with `status: 'fail'`.
- [ ] **Scenario 6 — Readiness checks array structure**:
  - With any mock configuration, call the handler.
  - Assert `data.checks` is an array.
  - Assert each check item has `name` (string) and `status` (one of `'ok' | 'degraded' | 'fail'`).
  - Optionally assert `durationMs` is a number when present.
- [ ] Verify: `cd apps/api && npx vitest run` — all 6 tests pass (3 liveness + 3 readiness).

**Estimated:** +55 lines. <!-- sdd-owner: implementation -->

---

## Verification & Bounded Review

- [ ] Run full test suite: `cd apps/api && npx vitest run` — exit code 0, all 6 tests pass.
- [ ] Run typecheck: `cd apps/api && npx tsc --noEmit` — no new type errors.
- [ ] Confirm no instrumentation package changes: `git diff packages/instrumentation/` is empty.
- [ ] Confirm no middleware changes: `git diff apps/api/src/middleware.ts` is empty.
- [ ] Confirm no `Dockerfile` was created: `git status` shows only the 3 expected files.
- [ ] Manual sanity: `KADARN_VERSION=ci-test npx next dev -p 3001` → `curl http://localhost:3001/api/health` returns `"version": "ci-test"`.

<!-- sdd-owner: parent -->

---

## Notes

- **`strict_tdd` is disabled** in `openspec/config.yaml` — tests and implementation coexist in this change; no RED→GREEN gate enforcement.
- **Mock strategy** (per spec FR-003.2): Only `@supabase/supabase-js` `createClient` is mocked. `HealthAggregator` runs for real — the supabase ping returns a controlled value via the mock. This provides high test fidelity without a live database.
- **`bootstrapInstrumentation()` idempotency**: The init call is guarded by a `bootstrapped` flag. Importing the route module a second time (in tests) is safe. `vi.mock` hoisting ensures the supabase mock is in place before the module-level side-effect executes.
- **`import.meta.url` relative path**: From `apps/api/src/app/api/health/route.ts`, the relative path to `apps/api/package.json` is `../../../../package.json` (4 levels up). This differs from the proposal's `../../../package.json` (only 3 levels) — the task specifies the correct 4-level path.
- **Test file location**: Per spec, all tests go into a single file at `apps/api/src/__tests__/health.test.ts` (not co-located `__tests__` directories under each route). The vitest `include` glob `src/**/*.test.ts` will discover this path.
