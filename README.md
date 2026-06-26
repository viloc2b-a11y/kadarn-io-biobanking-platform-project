# Kadarn Platform

> **Biospecimen Network Operating System (BNOS)**
> Multi-organization infrastructure platform for biospecimen and clinical data programs.

**Status:** Sprint 1A ✅ — Trust & Security Foundation validated  
**Version:** [v0.1.0-foundation-validated](https://github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project/releases/tag/v0.1.0-foundation-validated)

---

## What Kadarn Is

Kadarn is the **operating system for biospecimen and clinical data programs**. It is a multi-tenant infrastructure platform that enables organizations to discover, negotiate, execute, and govern biospecimen programs across a distributed network.

- **Not** a CRO, broker, LIMS, CTMS, biobank, or marketplace
- **Is** infrastructure that orchestrates a network of sponsors, CROs, clinical sites, biobanks, labs, logistics providers, and IRBs
- **Security-first** — 86 integration tests with real JWTs validate identity, authorization, audit, and threat resistance

---

## Repository Structure

```
kadarn-platform/
├── database/migrations/     # SQL migrations (008-012)
├── tests/
│   ├── security/            # 7 test suites (86 tests)
│   └── setup/               # Test utilities
├── packages/
│   └── domain-events/       # Event contracts (17 event types)
├── docs/
│   ├── architecture/        # Blueprint, salvage review
│   ├── adr/                 # ADR-001 through ADR-004
│   └── positioning/         # Strategic positioning
├── apps/
│   ├── web/                 # Frontend (pending — Sprint 6)
│   └── api/                 # API (pending — Sprint 1B)
├── CONTRIBUTING.md          # Development rules
├── ARCHITECTURE.md          # Architecture overview
├── CHANGELOG.md             # Release notes
└── README.md                # This file
```

---

## Architecture Decisions

| # | Title | Status |
|---|-------|--------|
| 001 | Platform Core vs. Service Layer Separation | ✅ Approved |
| 002 | Multi-Tenant Architecture & Organization Model | ✅ Approved |
| 003 | Kadarn Processing Engine Philosophy | ✅ Approved |
| 004 | Platform Boundaries | ✅ Approved |

---

## Sprint Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 0 | Foundation (migrations, RLS, audit, seeds) | ✅ Committed |
| 1A | Trust & Security Foundation | ✅ **86/86 tests passing** |
| 1B | Core API | ⬜ Next |
| 2 | Platform Services | ⬜ |
| 3–11 | Engines (Discovery, Feasibility, Exchange, etc.) | ⬜ |

Full roadmap: see [Blueprint §19](docs/architecture/kadarn-platform-blueprint.md)

---

## Quick Start (for development)

```bash
# Prerequisites
- Docker Desktop
- Node.js 22+
- Supabase CLI

# 1. Start Supabase Local
cd ../Kadarn  # prototype repo with supabase config
supabase start

# 2. Apply migrations
cd ../kadarn-platform
for f in database/migrations/0*.sql; do
  docker exec -i supabase_db_<project> psql -U postgres -d postgres -f - < "$f"
done

# 3. Seed users via Auth API
cd tests
npm install
npm run seed:users

# 4. Run security tests
npm test
# Expected: 86/86 passing
```

---

## Key Documents

| Document | Location |
|----------|----------|
| Blueprint (canonical architecture) | `docs/architecture/kadarn-platform-blueprint.md` |
| Strategic positioning | `docs/positioning/README.md` |
| Platform boundaries | `docs/adr/adr-004-platform-boundaries.md` |
| Development rules | `CONTRIBUTING.md` |
| Architecture overview | `ARCHITECTURE.md` |
| Changelog | `CHANGELOG.md` |

---

## Prototype Archive

Previous work exists in `../Kadarn/` (tagged `archive/pre-kadarn-platform-prototype`).
This code is reference only — nothing from the prototype may be reused without salvage classification (see [Salvage Review](docs/architecture/salvage-review.md)).

---

## License

Proprietary — Kadarn. All rights reserved.
