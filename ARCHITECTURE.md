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

| Sprint | Focus | Status |
|--------|-------|--------|
| 0 | Foundation | ✅ Committed |
| 1A | Trust & Security Foundation | ✅ Passes (v0.1.0) |
| 1B | Core API | ⬜ Next |
| 2 | Platform Services | ⬜ |
| 3 | Discovery Engine | ⬜ |
| 4 | Feasibility Engine | ⬜ |
| 5 | Program Engine | ⬜ |
| 6 | Exchange Engine | ⬜ |
| 7 | Fulfillment / Chain | ⬜ |
| 8 | Regulatory | ⬜ |
| 9 | Processing Marketplace | ⬜ |
| 10 | Analytics | ⬜ |
| 11 | AI Layer | ⬜ |

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
