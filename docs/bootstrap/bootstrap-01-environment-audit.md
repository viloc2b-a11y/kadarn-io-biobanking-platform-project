# Bootstrap 01 - Environment Audit

**Program:** Kadarn Bootstrap  
**Phase:** Phase 1  
**Mode:** Discovery only  
**Assumption:** Fresh Windows machine with only Git installed  
**Non-scope:** No code changes, no fixes, no architecture changes

## Executive Summary

Kadarn cannot run from a clean Windows machine with only Git installed. The repository is an npm workspaces monorepo that currently requires Node.js, npm, Docker Desktop, Supabase CLI/local Supabase, and per-app environment files before either the API or web app can start.

The intended current path is Supabase-first:

```text
Install prerequisites
  -> npm ci
  -> npx supabase start
  -> copy keys from supabase status into env files
  -> start API on 3001
  -> start Web on 3000
  -> optional seeds/tests
```

No Redis service is required by repository evidence. No standalone worker process or background-job service script exists. Background behavior is currently implemented as libraries, route side effects, queues, or in-process helpers rather than a separately booted worker.

The main bootstrap blockers are inconsistent Supabase ports across docs and env templates, stale README/prototype instructions, no Windows Day 0 guide, test env files not auto-loaded, no root production orchestrator, and no single canonical startup document.

## 1. Required Software

| Software | Required? | Evidence | Notes |
|---|---:|---|---|
| Git | Yes | User assumption and repository clone requirement | Only tool assumed preinstalled. |
| Node.js | Yes | `package.json`, `.github/workflows/ci.yml`, `.devcontainer/devcontainer.json`, `CONTRIBUTING.md` | Use Node 20+ as repository-aligned minimum. README references Node 22+, but CI/devcontainer use Node 20. |
| npm | Yes | npm workspaces in root `package.json` | Package manager is npm. No pnpm/yarn lockfile path is evidenced. |
| Docker Desktop | Yes for local DB | `supabase/config.toml`, `CONTRIBUTING.md`, `docker-compose.dev.yml` | Required for local Supabase. On Windows this usually means Docker Desktop with WSL2 backend. |
| Supabase CLI | Yes for local bootstrap | `npx supabase start`, `supabase/config.toml`, `openspec/phase-8-migration-parity.md` | Can be invoked via `npx supabase`; version is not pinned in package scripts. |
| PostgreSQL | Yes through Supabase | `supabase/config.toml` | Local Postgres runs inside Supabase. Config uses DB port `55432` and major version 17. |
| Redis | No evidence as required | `apps/api/src/lib/rate-limit.ts` uses in-memory limiter; no Redis service config found | Redis is not part of canonical bootstrap today. |
| Bash / Git Bash / WSL | Required for shell scripts | root `package.json`, `scripts/*.sh` | Needed for `arch:gate`, `check:secrets`, SBOM, pilot scripts. Not native PowerShell. |
| curl | Required for pilot scripts | `scripts/run-pilot-*.sh`, `scripts/create-test-users.sh` | Not needed for basic app boot. |
| jq | Required for some pilot/user scripts | `scripts/create-test-users.sh` | Not needed for basic app boot. |
| ripgrep (`rg`) | Required by architecture gate | `scripts/arch-gate.sh` | Not installed by repo. |
| Playwright browsers | Required for web E2E | `apps/web/package.json`, Playwright config | No canonical `playwright install` step found. |

### External Services

| Service | Required for local boot? | Evidence | Notes |
|---|---:|---|---|
| Supabase local | Yes | API routes use Supabase; `supabase/config.toml` | Provides DB, Auth, REST, Studio, SMTP, storage. |
| Hosted Supabase | Optional alternative | ops docs and env templates | Required for remote/staging/prod, not local bootstrap. |
| OpenAI / OpenRouter / Anthropic | No | optional env vars in `apps/api/src/lib/config.ts` | Discovery/AI providers may degrade or be unavailable. |
| PubMed / ClinicalTrials.gov / Crossref / OpenAlex / ORCID / ROR | No for boot | optional env vars in `config.ts`, connector packages | Needed only for live external evidence connector execution. |
| SMTP | No for boot | optional env vars; Supabase local SMTP enabled on `55424` | Local Inbucket exists via Supabase. |
| OPA server | No | policy engine uses local/shadow behavior | No standalone OPA bootstrap step found. |
| Observability vendor | No for boot | `infra/observability`, OpenSpec ops docs | Dashboards/alerts exist, but no local vendor dependency. |

## 2. Environment Variables

### Environment Files

| File | Purpose | Status |
|---|---|---|
| `apps/api/.env.example` | API local/staging/prod template | Best API template; currently includes Supabase local port `55421`. |
| `apps/web/.env.example` | Web local template | Needs port alignment with actual `supabase status`. |
| `apps/web/.env.test.example` | Playwright/E2E template | E2E only. |
| `tests/test-config.example.txt` | Integration test env reference | Not automatically loaded by Vitest. |
| root `.env.example` | Older/root Supabase template | Treat as stale unless reconciled. |
| `.env.local`, `tests/.env` | Real local secrets | Must not be committed. |

### API Required Variables

`apps/api/src/lib/config.ts` validates these at API startup through `apps/api/instrumentation.ts`.

| Variable | Required when | Purpose | Secret? |
|---|---|---|---:|
| `SUPABASE_URL` | all API runtimes | Supabase API URL | No |
| `SUPABASE_ANON_KEY` | all API runtimes | Supabase anon client key | Public-safe with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | all API runtimes | Service client key | Yes |
| `NEXT_PUBLIC_API_URL` | all API runtimes | Public API base URL | No |
| `NODE_ENV` | all API runtimes | Runtime mode | No |
| `SUPABASE_JWT_SECRET` | production | JWT signing secret | Yes |
| `SPONSOR_PASSPORT_DATA_SOURCE` | production | Sponsor Passport runtime source | No |
| `LEGACY_PASSPORT_ENABLED` | production | Phase 8 cutover selector | No |
| `KADARN_ALLOW_DOMAIN_EVENT_FALLBACK` | production | Emergency event fallback selector | No |
| `KADARN_ALLOW_IN_MEMORY_RATE_LIMIT` | production | Emergency in-memory rate-limit selector | No |

### Web Required Variables

The web app does not have an equivalent startup `assertConfig()`, but repository code expects:

| Variable | Purpose | Secret? |
|---|---|---:|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/middleware Supabase URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/middleware anon key | Public-safe with RLS |
| `NEXT_PUBLIC_API_URL` | API base URL for web calls | No |

`SUPABASE_SERVICE_ROLE_KEY` appears in `apps/web/.env.example`, but repository evidence does not show the web runtime needing the service role key. It should be treated as server-side only.

### Optional Provider Variables

| Variable | Purpose | Secret? |
|---|---|---:|
| `PUBMED_API_KEY` | NCBI/PubMed provider | Yes |
| `CLINICALTRIALS_API_KEY` | ClinicalTrials.gov provider | Yes |
| `CROSSREF_API_KEY` | Crossref provider | Yes |
| `OPENALEX_API_KEY` | OpenAlex provider/rate limits | Yes |
| `ORCID_API_KEY` | ORCID provider | Yes |
| `ROR_API_KEY` | ROR provider | Yes |
| `OPENAI_API_KEY` | LLM/discovery agents | Yes |
| `OPENROUTER_API_KEY` | LLM routing | Yes |
| `ANTHROPIC_API_KEY` | LLM provider | Yes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email/notification provider | `SMTP_PASS` is secret |

### Test and E2E Variables

| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | integration/security/API tests | Defaults vary across test helpers; must align with `supabase status`. |
| `SUPABASE_ANON_KEY` | tests | Required by `tests/setup/test-utils.ts`. |
| `SUPABASE_SERVICE_ROLE_KEY` | tests/seeds | Required by test utilities and seed scripts. |
| `API_URL` | some API tests | Not the same as `NEXT_PUBLIC_API_URL`. |
| `KADARN_E2E_AUTH` | Playwright/web E2E | Enables E2E auth bypass server-side. |
| `NEXT_PUBLIC_KADARN_E2E_AUTH` | Playwright/web E2E | Enables E2E mock session client-side. |
| `PLAYWRIGHT_PORT`, `PLAYWRIGHT_REUSE_SERVER`, `CI` | Playwright | Optional test controls. |

## 3. Startup Order

### Required Local Development Order

```text
Database
  -> Supabase local through Docker

Migrations
  -> Supabase CLI applies supabase/migrations

Seeds
  -> Optional; disabled by supabase/config.toml by default

API
  -> Next.js API on port 3001

Web
  -> Next.js web on port 3000

Workers
  -> None found as standalone process

Background jobs
  -> No separate startup command found
```

### Canonical Clean-Machine Sequence

```bash
git clone <repo-url>
cd kadarn-platform
npm ci
npx supabase start
npx supabase status
# copy URL, anon key, and service role key into env files
npm run dev:api
npm run dev
```

### Optional Test/Seed Sequence

```bash
# after Supabase is running and env vars are exported
npm run seed:users -w tests
npm run test -w tests
```

### Production Sequence Inferred From Scripts

There is no root production orchestrator. Production is per app:

```bash
npm ci
npx supabase db push
npm run build -w apps/api
npm run build -w apps/web
npm run start -w apps/api
npm run start -w apps/web
```

The production sequence above is inferred from scripts; the repo does not contain a complete deployment orchestrator, Dockerfile, Kubernetes manifest, PM2 config, or systemd unit.

## 4. Repository Scripts

### Root Scripts

| Script | Command | Category | Purpose |
|---|---|---|---|
| `dev` | `npm run dev -w apps/web` | Development | Start web only. |
| `dev:api` | `npm run dev -w apps/api` | Development | Start API only. |
| `build` | `npm run build -w apps/web` | Build | Builds web only; API build is separate. |
| `lint` | `npm run lint -w apps/web` | Testing / CI | Web lint. |
| `test` | `npm run test -w tests` | Testing | Default tests workspace suite. |
| `typecheck` | tsc for types, instrumentation, API | Build / CI | TypeScript gate. |
| `audit:deps` | `npm audit --audit-level=high` | Production / security | Dependency audit. |
| `test:instrumentation` | `npm run test -w @kadarn/instrumentation` | Testing | Instrumentation tests. |
| `sbom:generate` | `bash scripts/generate-sbom.sh` | Production / security | Generate SBOM. |
| `arch:gate` | `bash scripts/arch-gate.sh` | CI / governance | Architecture gate. |
| `check:secrets` | `bash scripts/check-secrets.sh` | Production / security | Secret scan. |

### App Scripts

| Workspace | Script | Command | Category |
|---|---|---|---|
| `apps/api` | `dev` | `next dev -p 3001 --webpack` | Development |
| `apps/api` | `build` | `next build --webpack` | Build / production |
| `apps/api` | `start` | `next start -p 3001` | Production |
| `apps/web` | `dev` | `next dev -p 3000` | Development |
| `apps/web` | `build` | `next build` | Build / production |
| `apps/web` | `start` | `next start -p 3000` | Production |
| `apps/web` | `type-check` | `tsc --noEmit` | Build / CI |
| `apps/web` | `lint` | `eslint .` | Testing / CI |
| `apps/web` | `test:e2e` | `playwright test` | Testing |
| `apps/web` | `test:e2e:ui` | `playwright test --ui` | Testing |
| `apps/web` | `test:a11y` | `playwright test e2e/a11y.spec.ts` | Testing |
| `apps/web` | `gate:web` | type-check + E2E + a11y | Testing / CI |

### Tests Workspace Scripts

| Script | Category | Purpose |
|---|---|---|
| `test` | Testing | Default Vitest subset. |
| `test:all` | Testing | Full Vitest suite. |
| `test:integration` | Testing | API + security tests. |
| `test:watch` | Development / testing | Watch mode. |
| `test:identity` | Testing | Identity security tests. |
| `test:authorization` | Testing | Authorization tests. |
| `test:audit` | Testing | Audit tests. |
| `test:threat` | Testing | Threat tests. |
| `test:security` | Testing | Security directory. |
| `test:phase8` | Testing | Phase 8 tests. |
| `test:gate-28jk` | Testing / CI | Phase 8 gate. |
| `staging:cutover-smoke` | Testing / staging | Phase 8 staging smoke. |
| `test:instrumentation` | Testing | Instrumentation tests. |
| `test:performance` | Testing | Performance tests. |
| `test:coverage` | Testing | Coverage report. |
| `seed:users` | Seed | Creates demo auth users. |

### Script Directory

| Script | Category | Purpose |
|---|---|---|
| `scripts/arch-gate.sh` | CI / governance | Architecture compliance. |
| `scripts/terminology-lint.sh` | CI / governance | Terminology checks. |
| `scripts/cross-doc-consistency.sh` | CI / governance | Documentation consistency. |
| `scripts/check-secrets.sh` | Production / security | Secret scanning. |
| `scripts/generate-sbom.sh` | Production / security | SBOM generation. |
| `scripts/run-all-pilots.sh` | Testing / validation | Runs pilot scripts. |
| `scripts/run-pilot-1.sh` to `scripts/run-pilot-5.sh` | Testing / validation | Pilot workflows. |
| `scripts/execution-report.sh` | Testing / reporting | Pilot scorecard. |
| `scripts/create-test-users.sh` | Seed | Creates pilot users through Auth admin API. |
| `scripts/seed-pilot-users.ts` | Seed | Idempotent pilot user bootstrap. |
| `scripts/seed-pilot.sql` | Seed | Pilot SQL seed. |
| `scripts/reliability/backup-validate.sh` | Production / ops | Backup validation. |
| `scripts/reliability/restore-test.sh` | Production / ops | Restore drill scaffold. |

### Migrations and Seeds

| Path | Category | Notes |
|---|---|---|
| `supabase/migrations/*.sql` | Migration | Authoritative local Supabase migration path. |
| `database/migrations/*.sql` | Reference migration mirror | Do not treat as the local apply path without parity decision. |
| `supabase/seed.sql` | Seed | Present, but `supabase/config.toml` has `[db.seed] enabled = false`. |
| migration seed files | Seed | Some seed SQL is embedded in migrations. |

### Workers and Background Jobs

No standalone worker startup script was found. Background concepts exist in packages and app libs, but no `worker`, `jobs`, `queue`, `scheduler`, or daemon script is exposed as a boot step.

## 5. Missing Bootstrap Documentation

1. No single canonical Day 0 bootstrap guide for a clean Windows machine.
2. No Windows install steps for Node.js, Docker Desktop, Supabase CLI, Bash/Git Bash/WSL, jq, curl, or ripgrep.
3. No documented `supabase status` to env-file wiring sequence.
4. No clear statement that `supabase/migrations/` is the apply path and `database/migrations/` is a reference/parity path.
5. No consolidated startup order showing DB -> migrations -> seeds -> API -> web -> workers/jobs.
6. No root production startup procedure.
7. No clear docs for `tests/.env`; `tests/test-config.example.txt` exists but is not a canonical markdown guide.
8. No explanation that `docker-compose.dev.yml` is only an idle Node dev container, not the full Kadarn stack.
9. No Playwright browser install step.
10. No statement that Redis is not part of the current bootstrap.
11. No worker/background job inventory.
12. No fresh-machine validation artifact; AF-4.0 fresh onboarding checkbox remains unproven.

## 6. Bootstrap Blockers

| Blocker | Severity | Impact |
|---|---|---|
| Only Git is insufficient. | Critical | Cannot run `npm ci`, Supabase, Docker, or apps. |
| Supabase port drift. | Critical | `supabase/config.toml` uses `55421/55432`, while several docs/tests/env examples use `54321/54322` or `54331`. |
| Stale README bootstrap path. | High | Points to prototype repo and manual `database/migrations/` flow instead of in-repo Supabase flow. |
| Env files require manual key copying. | High | Placeholders will fail API startup/auth unless values from `supabase status` are copied. |
| `tests/.env` is not auto-loaded. | High | Tests can fail even after creating the file unless variables are exported or loaded externally. |
| Dual migration trees. | High | Applying `database/migrations/` directly can diverge from `supabase/migrations/`. |
| `supabase/seed.sql` is not auto-run. | Medium | Seeds are expected by some validation flows but `[db.seed]` is disabled. |
| Bash-only scripts on Windows. | Medium | Security, SBOM, arch gate, and pilot scripts require Git Bash/WSL. |
| Root `build` skips API. | Medium | Production build from root does not build the full platform. |
| No standalone worker script. | Medium | Startup order cannot include worker process beyond "none found". |
| `docker-compose.dev.yml` is incomplete as a stack. | Medium | `docker compose up` does not start Supabase/API/web. |
| `eslint` and `tsx` script dependencies need verification. | Medium | Some scripts may rely on undeclared or transitive tools. |
| Playwright browser install missing. | Medium | E2E can fail on a clean machine after npm install. |
| Devcontainer swallows Supabase failure. | Low-Medium | `npx supabase start || true` can leave developer unaware DB did not start. |

## 7. Canonical Startup Sequence

This is the canonical startup sequence inferred from repository evidence. It is not yet fully documented elsewhere as one authoritative guide.

### A. Install Prerequisites

Install on the fresh Windows machine:

1. Git.
2. Node.js 20+ with npm.
3. Docker Desktop with WSL2 backend enabled.
4. Supabase CLI, or use `npx supabase`.
5. Git Bash or WSL for shell scripts.
6. Optional for validation: jq, curl, ripgrep, Playwright browsers.

### B. Clone and Install

```bash
git clone <repo-url>
cd kadarn-platform
npm ci
```

### C. Database and Migrations

```bash
npx supabase start
npx supabase status
```

Expected local ports from `supabase/config.toml`:

| Service | Port |
|---|---:|
| Supabase API | 55421 |
| Postgres DB | 55432 |
| Studio | 55423 |
| Local SMTP | 55424 |

Migrations are applied from `supabase/migrations/` by Supabase CLI. Do not use `database/migrations/` as the clean-machine apply path unless a separate parity decision is made.

### D. Environment Files

Create:

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Then replace placeholders with values from `npx supabase status`.

Minimum API local env:

```text
SUPABASE_URL=http://127.0.0.1:55421
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SPONSOR_PASSPORT_DATA_SOURCE=mock
NODE_ENV=development
```

Minimum web local env:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

### E. Seeds

By default, Supabase seed is disabled:

```text
[db.seed]
enabled = false
```

Optional user seed:

```bash
npm run seed:users -w tests
```

Pilot seeds require additional manual commands and should not be assumed part of the base bootstrap.

### F. Start API

Terminal 1:

```bash
npm run dev:api
```

API runs on:

```text
http://127.0.0.1:3001
```

Health endpoints:

```text
GET /api/health
GET /api/health/ready
```

### G. Start Web

Terminal 2:

```bash
npm run dev
```

Web runs on:

```text
http://127.0.0.1:3000
```

### H. Workers and Background Jobs

No standalone worker startup command exists. There is no current boot command after API/Web for workers. Background behavior is in-process or library-level.

### I. Optional Validation

```bash
npm run typecheck
npm exec --workspace tests vitest run api/config.test.ts api/rate-limit.test.ts
npm run test -w tests
```

Full integration tests require Supabase env keys exported into the shell. Creating `tests/.env` alone may not be sufficient because the current Vitest setup reads `process.env`.

## Discovery Verdict

Kadarn has enough repository structure to boot locally, but the process is not clean-machine ready. The required platform bootstrap exists as scattered evidence across `CONTRIBUTING.md`, OpenSpec, env examples, package scripts, Supabase config, and tests. The next bootstrap phase should not implement product code; it should first normalize documentation, ports, env wiring, and script expectations into one tested Day 0 guide.
