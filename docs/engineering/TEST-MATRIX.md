# Kadarn Test Matrix

**Program:** v1.0 Hardening — Sprint 1–8  
**Gate command:** `npm run verify` (typecheck + build + unit tests + secret scan)

---

## Official commands (must all pass)

| Command | Scope | Infrastructure | Expected |
|---------|--------|----------------|----------|
| `npm ci` | Install | None | Clean install from root lockfile |
| `npm run typecheck` | All workspaces with `typecheck` script (apps + packages) | None | 0 TS errors |
| `npm run build` | `apps/web` + `apps/api` | Supabase env fallbacks in `next.config` | Production build OK |
| `npm test` | Unit / package / offline integration tests | None (Supabase optional) | 517+ passed, SIT-01 skipped offline |
| `npm run check:secrets` | Git-tracked files | Git | Exit 0 |
| `npm run verify` | Full Sprint 1 gate | None | All of the above |

---

## Extended commands (not in CI gate)

| Command | Scope | Prerequisites |
|---------|--------|---------------|
| `npm run test:integration` | API + security suites | Supabase local, `.env` keys, API on `:3001` |
| `npm run test:all` | Entire vitest tree | Same as integration |
| `npm run dev` | Web UI `:3000` | `apps/web/.env.local` |
| `npm run dev:api` | API `:3001` | `apps/api/.env.local` |

---

## Unit test suites (`npm test`)

Runs 36 vitest files covering:

- `policy/` — policy engine + OPA shadow mode
- `provenance/` — PROV mapping + append-only logic
- `events/` — domain event catalog
- `financial/`, `fulfillment/`, `graph/`, `intelligence/`, `knowledge/`, `matching/`
- `trust/`, `twins/`, `workflow/`
- `integration/` — cross-engine, pilot-flow (in-memory), GDPR, performance benchmarks
- `hardening/` — Sprint 2–8 gates (API, database, events, provenance, orchestration, observability, workflow runtime)
- `compliance/` — pgTAP SQL (requires Postgres + pgTAP; not in offline gate)

**Skipped offline:** `integration/sit-01-supabase-gate.test.ts` (38 tests) — requires `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`.

---

## Integration test suites (`npm run test:integration`)

| Suite | File count | Requires |
|-------|------------|----------|
| `api/` | 12 | Running API, Supabase auth |
| `security/` | 7 | Supabase local, seeded users |

Copy `tests/test-config.example.txt` → `tests/.env` and run `supabase start` before integration tests.

---

## CI workflow

`.github/workflows/ci.yml` runs on `push` / `pull_request` to `main`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build` (with CI Supabase placeholder env)
4. `npm test`
5. `npm run check:secrets`

Integration tests are **not** in CI until Sprint 2+ (Supabase service container).

---

## Workspace typecheck coverage

Every app and package exposes `typecheck` except `tests/` (validated by vitest, not `tsc`).

```bash
npm run typecheck --workspaces --if-present
```

---

## Build environment variables

| Variable | Required for build | Default (local/CI) |
|----------|-------------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Supabase local demo anon key |
| `SUPABASE_URL` | API runtime | Set in `.env.local` for dev |
| `SUPABASE_ANON_KEY` | API runtime | Set in `.env.local` for dev |

Build-time fallbacks are defined in `apps/web/next.config.ts` only for compilation; override in production.
