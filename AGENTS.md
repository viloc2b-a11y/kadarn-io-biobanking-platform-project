# Kadarn Platform — Coding Standards

## Architecture

- Follow the KRM-RAO architecture: 9 engines, 5 twins, 4 graphs
- Monorepo with `packages/` for libraries, `apps/` for applications
- All new features must have ADR documentation before implementation
- Strict separation: domain logic in packages, API in apps

## TypeScript / Node.js

- TypeScript strict mode required
- Use Zod for runtime validation
- Prefer functional patterns over classes
- No `any` — use `unknown` and narrow with Zod
- Async/await over raw promises

## Testing

- Write tests BEFORE implementation (RED → GREEN → REFACTOR)
- 80%+ coverage for new code
- Test commands: `pnpm test`, `pnpm test:coverage`
- Unit tests for domain logic, integration tests for API

## Database

- All migrations through Supabase CLI
- RLS policies required on every table
- Use JWT claims for auth, not SQL-level user checks
- Migration naming: `YYYYMMDD_description.sql`

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- No direct pushes to main — PRs with review required
- Keep PRs under 400 lines
