# Contributing to Kadarn

> **Kadarn is the operating system for biospecimen and clinical data programs.**

---

## Code of Conduct

This project follows a **no-asshole policy**. Be professional, be direct, be respectful.

---

## Development Workflow

### 1. Every sprint must end with:

- Architecture review
- Security review  
- All tests passing
- Acceptance criteria met
- Tag created

### 2. Branch strategy

- `main` — protected. Only merged via PR with review.
- Feature branches: `sprint-<number>-<descriptive-name>`
- Bug fixes: `fix-<short-description>`

### 3. Commit discipline

- One commit per logical change
- Commit messages must explain **what** and **why**
- Reference ADRs and Blueprint sections when relevant
- Use conventional commits (feat:, fix:, docs:, chore:, etc.)

### 4. PR requirements

Before merging to `main`:

- [ ] All tests pass (`npm test` in `tests/`)
- [ ] No security regressions (threat + authorization suites pass)
- [ ] Architecture review (does this violate an ADR?)
- [ ] Changelog updated
- [ ] Tag updated if needed

---

## Architecture Rules

1. **ADR First** — Any significant architectural decision must be documented as an ADR before implementation. See `docs/adr/`.

2. **Blueprint Authority** — The Blueprint (`docs/architecture/kadarn-platform-blueprint.md`) is the authoritative architecture document. Every engine and feature defined there takes precedence over implementation convenience.

3. **Platform Boundaries** — ADR-004 defines what Kadarn does and does not do. New features must be reviewed against these boundaries.

4. **Security Gates** — The security test suites (identity, authorization, audit, threat, compliance) must pass before any sprint is considered complete.

---

## Code Standards

### Migrations

- Every migration must be **idempotent** (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- Every migration must include **RLS enable + policies** for new tables
- Every migration must include **updated_at triggers**
- No migration may reference a table from a later migration
- Seed data goes in a separate migration

### Tests

- Security tests run against Supabase Local with real JWTs
- No test should depend on another test's side effects
- Tests that verify security must use `tryInsert`/`tryUpdate`/`tryDelete` helpers (which detect RLS-blocked operations)
- Structural smoke tests go in `database/migrations/` (SQL)
- Functional security tests go in `tests/security/` (TypeScript + vitest)

---

## Getting Started (AF-4.0)

```bash
# Prerequisites: Docker Desktop, Node.js 20+, Supabase CLI

cd kadarn-platform
npm ci
npx supabase start                    # local DB (in-repo supabase/)
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
npm run dev:api                         # API :3001
npm run dev                             # Web :3000
npm run seed:users -w tests             # test users
npm run test:instrumentation            # AF-4.0 instrumentation gate
npm run test -w tests                   # full test suite
```

See [openspec/af-4.0-dev-platform.md](openspec/af-4.0-dev-platform.md) for CLI and Dev Container options.

---

## Stability Levels

| Level | Meaning |
|-------|---------|
| **Experimental** | May change without notice. No backward compatibility. |
| **Stable** | Safe for cross-sprint development. Deprecation notice required for breaking changes. |
| **Public** | Safe for external integrations. Migration guide required for breaking changes. |

See Blueprint §22 (Stability Policy) for full details.
