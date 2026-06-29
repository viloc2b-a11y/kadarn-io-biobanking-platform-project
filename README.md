# Kadarn Platform

> **Biospecimen Network Operating System (BNOS)**  
> Multi-organization infrastructure for biospecimen and clinical data programs.

**Version:** `1.0.0-hardening.1` (v1.0 Hardening Program — Sprint 1)  
**Status:** Repository gate PASS — `npm run verify`  
**Previous release:** [v1.0.0-alpha.2](CHANGELOG.md)

---

## What Kadarn Is

Kadarn orchestrates discovery, exchange, processing, logistics, and governance across a distributed biobanking network. It is infrastructure — not a LIMS, CRO, or marketplace operator.

---

## Repository structure

```
kadarn-platform/
├── apps/
│   ├── web/          # Next.js UI (:3000)
│   └── api/          # Next.js API (:3001)
├── packages/         # 21 engine & platform packages
├── tests/            # Vitest suites (unit + integration)
├── database/         # SQL migrations (source of truth)
├── supabase/         # Local Supabase config + mirrored migrations
├── scripts/          # Seeds, pilots, secret scanner
└── docs/             # Architecture, engineering, pilots
```

---

## Quick start

**Prerequisites:** Node.js 22+, npm 10+, Git

```bash
# 1. Install (single root lockfile — no nested npm installs)
npm ci

# 2. Repository gate (must pass before any PR)
npm run verify

# 3. Environment (for local dev)
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
# Fill Supabase URL + keys from: supabase status

# 4. Run apps
npm run dev        # web → http://localhost:3000
npm run dev:api    # api  → http://localhost:3001
```

**Supabase local (for integration tests):**

```bash
supabase start          # from repo root
cp tests/test-config.example.txt tests/.env
npm run test:integration
```

See [Test Matrix](docs/engineering/TEST-MATRIX.md) for full command reference.

---

## Official commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Reproducible install |
| `npm run typecheck` | TypeScript — all apps + packages |
| `npm run build` | Production build (web + api) |
| `npm test` | Unit tests (offline gate) |
| `npm run test:integration` | API + security (needs Supabase) |
| `npm run check:secrets` | Scan tracked files for leaked secrets |
| `npm run verify` | **Full Sprint 1 gate** |

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `verify` on every push/PR to `main`.

---

## Key documents

| Document | Path |
|----------|------|
| Test matrix | `docs/engineering/TEST-MATRIX.md` |
| Sprint 1 report | `docs/engineering/SPRINT-1-ENGINEERING-REPORT.md` |
| Blueprint | `docs/architecture/kadarn-platform-blueprint.md` |
| Changelog | `CHANGELOG.md` |
| Contributing | `CONTRIBUTING.md` |

---

## License

Proprietary — Kadarn. All rights reserved.
