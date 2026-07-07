# Day 0 Startup Guide

**Program:** Kadarn Bootstrap  
**Phase:** Phase 2  
**Audience:** New developer on a fresh Windows machine  
**Assumption:** Git is installed; nothing else is guaranteed  
**Scope:** Start Kadarn locally from a clean machine. No product code or architecture changes.

## Success Criteria

Day 0 is successful when:

- Web opens at `http://127.0.0.1:3000`
- API responds at `http://127.0.0.1:3001/api/health`
- API readiness responds at `http://127.0.0.1:3001/api/health/ready`

## 1. Windows Prerequisites

Install these before cloning or running Kadarn:

| Tool | Required? | Notes |
|---|---:|---|
| Git | Yes | Required to clone the repository. |
| Node.js 20+ | Yes | Use Node 20+ to match CI/devcontainer evidence. npm is included with Node. |
| npm | Yes | Kadarn uses npm workspaces. |
| Docker Desktop with WSL2 | Yes | Required by local Supabase. Start Docker Desktop before `npx supabase start`. |
| Supabase CLI through `npx` | Yes | No global install is required for Day 0; use `npx supabase ...`. |
| Git Bash or WSL | Yes | Use this guide in Git Bash or WSL. Several repository scripts are Bash-based. |
| jq | Optional | Needed for some pilot/user scripts, not for base startup. |
| curl | Optional | Useful for validation and pilot scripts. PowerShell can use `Invoke-WebRequest` instead. |
| ripgrep (`rg`) | Optional | Needed for architecture gate scripts. |
| Playwright browsers | Optional | Needed only for web E2E tests. Install later if running Playwright. |

Check local versions:

```bash
git --version
node --version
npm --version
docker --version
```

Docker Desktop must be running before Supabase starts.

## 2. Clone and Install

Run from Git Bash or WSL:

```bash
git clone <repo-url>
cd kadarn-platform
npm ci
```

`npm ci` installs root, app, package, and test workspace dependencies.

## 3. Start Supabase

Start the local database/auth stack:

```bash
npx supabase start
npx supabase status
```

Use the values printed by `npx supabase status` in the environment files below.

Expected configured ports:

| Service | URL / Port |
|---|---|
| Supabase API | `http://127.0.0.1:55421` |
| Postgres | `127.0.0.1:55432` |
| Supabase Studio | `http://127.0.0.1:55423` |
| Local SMTP / Inbucket | `http://127.0.0.1:55424` |

Supabase CLI applies migrations from `supabase/migrations/`. Do not apply `database/migrations/` manually during Day 0 startup.

## 4. Environment File Setup

Create the local env files:

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Then edit both `.env.local` files and replace placeholders with values from `npx supabase status`.

### `apps/api/.env.local`

Minimum Day 0 API config:

```text
SUPABASE_URL=http://127.0.0.1:55421
SUPABASE_ANON_KEY=<anon key from npx supabase status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from npx supabase status>
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from npx supabase status>

SPONSOR_PASSPORT_DATA_SOURCE=mock
NODE_ENV=development
```

Optional local values:

```text
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres
SUPABASE_PROJECT_ID=kadarn-platform
```

Do not commit `.env.local`.

### `apps/web/.env.local`

Minimum Day 0 web config:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from npx supabase status>
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` in browser-exposed client code.

## 5. Start the API

Open Terminal 1:

```bash
npm run dev:api
```

Expected API URL:

```text
http://127.0.0.1:3001
```

Validate:

```bash
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/health/ready
```

If you do not have `curl`, open these URLs in the browser:

- `http://127.0.0.1:3001/api/health`
- `http://127.0.0.1:3001/api/health/ready`

## 6. Start the Web App

Open Terminal 2:

```bash
npm run dev
```

Expected web URL:

```text
http://127.0.0.1:3000
```

Open:

```text
http://127.0.0.1:3000
```

## 7. Validation Checklist

Use this checklist after API and web are running.

| Check | Expected result |
|---|---|
| API health | `http://127.0.0.1:3001/api/health` responds. |
| API ready | `http://127.0.0.1:3001/api/health/ready` responds after Supabase is reachable. |
| Web loads | `http://127.0.0.1:3000` opens in the browser. |
| Login page loads | `http://127.0.0.1:3000/login` opens. |
| Workspace route loads | `http://127.0.0.1:3000/workspace` loads or redirects according to auth state. |
| Sponsor passport route loads if demo data exists | `http://127.0.0.1:3000/sponsor/passports` loads or redirects according to auth/data state. |

Optional seed for local auth users:

```bash
npm run seed:users -w tests
```

This requires Supabase Auth to be running and env keys to be available to the process.

## 8. Known Limitations

- There is no standalone worker startup command.
- Background jobs are not started as a separate Day 0 process.
- Supabase seeds are not automatic because `[db.seed]` is disabled in `supabase/config.toml`.
- Delivery workspace uses mock data in the current repository.
- Sponsor workspace has placeholder pages outside the implemented passport surfaces.
- Some tests require Supabase env vars exported into the shell; creating `tests/.env` alone may not be enough.
- `docker-compose.dev.yml` is not a full platform stack. It starts an idle Node container, not Supabase/API/web.
- Full Playwright E2E requires browser binaries that are not installed by the Day 0 base sequence.

## 9. Troubleshooting

### Docker Is Not Running

Symptom:

```text
npx supabase start
```

fails with Docker connection errors.

Fix:

1. Start Docker Desktop.
2. Wait until Docker reports it is running.
3. Run `docker ps`.
4. Retry `npx supabase start`.

### Supabase Port Conflict

Expected ports:

- API: `55421`
- Postgres: `55432`
- Studio: `55423`
- SMTP: `55424`

Symptom: Supabase reports a port is already allocated.

Fix:

1. Stop the conflicting process or old Supabase stack.
2. Run `npx supabase stop`.
3. Retry `npx supabase start`.
4. Confirm with `npx supabase status`.

### Missing Environment Variables

Symptom: API startup fails during config validation or Supabase requests fail.

Fix:

1. Run `npx supabase status`.
2. Copy the local API URL, anon key, and service role key.
3. Update `apps/api/.env.local`.
4. Update `apps/web/.env.local`.
5. Restart `npm run dev:api` and `npm run dev`.

### API Config Failure

Symptom: API logs a fatal missing env var message.

Fix:

1. Confirm `apps/api/.env.local` exists.
2. Confirm these values are present:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_API_URL`
3. Confirm local values use `55421`, not `54321`.
4. Restart the API process.

### Auth or Session Issue

Symptom: login/workspace routes redirect unexpectedly or cannot resolve session.

Fix:

1. Confirm Supabase Auth is running with `npx supabase status`.
2. Confirm web env uses:
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
3. Restart the web dev server after editing env files.
4. If using seeded users, rerun `npm run seed:users -w tests`.

### Playwright Missing Browsers

Symptom: `npm run test:e2e -w apps/web` fails because browser binaries are missing.

Fix:

```bash
npx playwright install
```

Then rerun the E2E command.

## 10. Final Success Criteria

A new developer has completed Day 0 when:

1. Supabase is running on the configured ports.
2. `apps/api/.env.local` and `apps/web/.env.local` use values from `npx supabase status`.
3. API health responds at:

```text
http://127.0.0.1:3001/api/health
```

4. Web opens at:

```text
http://127.0.0.1:3000
```

5. The developer understands current limitations: no standalone worker, seeds are manual, some surfaces are mock/placeholder-backed, and full tests need exported Supabase env vars.
