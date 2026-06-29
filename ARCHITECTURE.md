# Kadarn Architecture

> **Kadarn is the operating system for biospecimen and clinical data programs.**

---

This document describes the high-level architecture of Kadarn. For full details, see the [Kadarn Platform Blueprint](docs/architecture/kadarn-platform-blueprint.md).

---

## Guiding Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **Blueprint** | `docs/architecture/kadarn-platform-blueprint.md` | Canonical architecture — 22 sections covering all engines, principles, roadmap |
| **ADR-001** | `docs/adr/adr-001-platform-core-vs-service-layer.md` | Platform Core vs Service Layer separation |
| **ADR-002** | `docs/adr/adr-002-multi-tenant-architecture.md` | Multi-tenant RLS model and organization-capability design |
| **ADR-003** | `docs/adr/adr-003-processing-engine-philosophy.md` | Processing Engine scope — bounded LIMS integration |
| **ADR-004** | `docs/adr/adr-004-platform-boundaries.md` | Explicit platform boundaries — what Kadarn does and doesn't do |
| **Positioning** | `docs/positioning/README.md` | Strategic positioning and competitive landscape |

---

## Architecture Overview

```
CHANNELS
  Web App (Next.js)  |  API (REST/GraphQL)  |  Webhooks

SERVICE LAYER
  Discovery  |  Feasibility  |  Program  |  Exchange
  Regulatory  |  Processing  |  Logistics  |  Payments
  Analytics  |  AI

CORE LAYER
  Organizations  |  Capabilities  |  Programs  |  Memberships
  Audit  |  Identity  |  Notifications  |  Documents

PERSISTENCE LAYER
  PostgreSQL 17  |  Supabase Auth  |  Row-Level Security
```

---

## Key Design Decisions

### Multi-Tenancy (ADR-002)

All data lives in a shared PostgreSQL database. Row-Level Security enforces isolation at the database level. Every sensitive row has `organization_id` and `visibility_scope`.

### Organization-Capability Model (ADR-002)

Organizations have capabilities (many-to-many), not rigid type enums. A hospital can also be a biobank, CRO, and lab simultaneously.

### Program-Centric Architecture

The **Program** is the central object. Everything else (organizations, samples, requests, analytics) exists in service of programs.

### Platform Boundaries (ADR-004)

Kadarn does **not** replace LIMS, CTMS, EDC, EHR, ERP, or courier software. It integrates with them via API connectors.

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
│   ├── adr/                 # Architecture Decision Records (1-4)
│   └── positioning/         # Strategic positioning
├── apps/
│   ├── web/                 # Frontend (pending)
│   └── api/                 # API (pending)
├── CONTRIBUTING.md          # Development rules
├── CHANGELOG.md             # Release notes
└── README.md                # Project overview
```

---

## Roadmap

| Sprint | Focus | Version | Status |
|--------|-------|---------|--------|
| 0 | Foundation | v0.1.x | ✅ Committed |
| 1A | Trust & Security Foundation | v0.1.0 | ✅ 86/86 tests |
| 1B | Core API | v0.1.x | ✅ 99/99 tests |
| 2 | Platform Services | v0.2.x | ⬜ Next |
| 3 | Discovery Engine | v0.3.x | ⬜ |
| 4 | Feasibility Engine | v0.4.x | ⬜ |
| 5 | Program Engine | v0.5.x | ⬜ |
| 6 | Exchange Engine | v0.6.x | ⬜ |
| 7 | Processing Engine | v0.7.x | ⬜ |
| 8 | Logistics Engine | v0.8.x | ⬜ |
| 9 | Regulatory Engine | ⬜ |
| 10 | Analytics | v0.9.x | ⬜ |
| 11 | AI Layer | v1.0.0 | ⬜ |

Full details in Blueprint §19 (Sprint Roadmap).

---

## Stack

| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL 17 |
| Auth | Supabase Auth (OIDC-ready) |
| Tests | vitest + @supabase/supabase-js |
| Future: API | Next.js 16 (App Router) |
| Future: Frontend | Tailwind CSS v4 + Shadcn UI |
