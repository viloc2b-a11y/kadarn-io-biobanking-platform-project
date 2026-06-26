# Salvage Review: Prototype → kadarn-platform

> Source: `Kadarn/` (tag: `archive/pre-kadarn-platform-prototype`)
> Target: `kadarn-platform/` (clean repo)
> Date: 2026-06-25

---

## Classification Guide

| Category | Action | Criteria |
|----------|--------|----------|
| ✅ **Reuse directly** | Copy verbatim | Generic, domain-neutral, no Vilo OS contamination |
| 🔧 **Adapt manually** | Rewrite with new patterns | Useful concept but wrong architecture (RLS, multi-tenant) |
| 📖 **Reference only** | Don't copy | Good for learning, not for production |
| ❌ **Discard** | Ignore | Tied to Vilo OS or prototype-specific assumptions |

---

## By Area

### Domain Model & Database

| Asset | Verdict | Rationale |
|-------|---------|-----------|
| `organizations` table | 🔧 Adapt | Concept correct, but needs capability model, not type enum |
| `biobanks` table | ❌ Discard | Vilo-specific. Kadarn uses organizations + capabilities |
| `collections` table | 🔧 Adapt | Domain concept is valid, but needs multi-tenant columns + program context |
| `supply_items` table | 🔧 Adapt | Good concept (7 types). Needs organization_id, program_id, audit columns |
| `donors` table | 🔧 Adapt | Valid domain. Needs tenant isolation + program scoping |
| `samples` table | 🔧 Adapt | Valid domain. Needs full universal biospecimen model |
| `supply_item_type` enum | ✅ Reuse | 7 types are correct (existing, prospective, lab, clinical, data, storage, equipment) |
| `sample_type` enum | ✅ Reuse | BBMRI-compatible values |
| `duo_permission` enum | ✅ Reuse | DUO standard values |
| `kadarn_chain_telemetry` | 🔧 Adapt | Valid pattern, needs multi-tenant columns |
| `kadarn_exchange_deals` | 🔧 Adapt | Valid pattern, needs program context |

### RLS & Auth

| Asset | Verdict | Rationale |
|-------|---------|-----------|
| `current_vilo_role()` function | ❌ Discard | Vilo-specific naming. Kadarn needs `current_kadarn_role()` |
| `current_vilo_organization_id()` | ❌ Discard | Same. Rename to `current_organization_id()` |
| `user_profiles` table | 🔧 Adapt | Needs multi-tenant + identity provider abstraction |
| JWT claim injection pattern | ✅ Reuse | Signup trigger → profile → app_metadata pattern is valid |
| RLS policy patterns | ✅ Reuse | `USING (auth.jwt() ->> 'claim')` pattern is correct |

### APIs

| Asset | Verdict | Rationale |
|-------|---------|-----------|
| `/api/locator/search` | 🔧 Adapt | Valid concept, needs to work with supply_items + programs |
| `/api/locator/supply` | 🔧 Adapt | Same. Good filter design. |
| `/api/negotiator/requests` | 🔧 Adapt | Valid concept, needs multi-tenant program context |
| `/api/exchange/webhook` | 🔧 Adapt | State machine concept is valid |
| `/api/chain/telemetry` | 🔧 Adapt | Valid, needs multi-tenant |

### Frontend

| Asset | Verdict | Rationale |
|-------|---------|-----------|
| Dashboard sidebar layout | 🔧 Adapt | Good UI pattern, needs multi-tenant org selector |
| DirectorySearch component | 🔧 Adapt | Valid filter/search UI pattern |
| NegotiatorRequestModal | 🔧 Adapt | Valid flow, needs supply_item support |
| KadarnConnectDashboard | 🔧 Adapt | Good metrics layout |
| Login page | 🔧 Adapt | Needs organization-aware login |
| Shadcn UI setup | ✅ Reuse | Framework-agnostic, reusable directly |
| Tailwind CSS config | ✅ Reuse | Framework-agnostic |
| `@supabase/ssr` client pattern | ✅ Reuse | Standard, reusable |

### Architecture Docs

| Asset | Verdict | Rationale |
|-------|---------|-----------|
| `architecture-v2.md` | 📖 Reference | Vision and positioning are valid. Domain model is prototype-specific |
| `domain-scout-bbmri-eric.md` | ✅ Reuse | BBMRI/MIABIS research is independent of implementation |
| `blueprint-gap-analysis.md` | 📖 Reference | Useful for learning, not for new architecture |
| `adr-001-platform-core-vs-service-layer.md` | ✅ Reuse | Principle is framework-agnostic. Copy to new repo |
| `schema-design.md` | 📖 Reference | Prototype-specific |

---

## Migration Plan

### Phase 1: Copy directly (no modification needed)

```
docs/adr/adr-001-platform-core-vs-service-layer.md
docs/architecture/domain-scout-bbmri-eric.md
selected enum values (sample_type, duo_permission, supply_item_type)
Shadcn UI components
Tailwind config pattern
```

### Phase 2: Adapt (rewrite for new architecture)

```
organization model (add capabilities, multi-tenant columns)
supply_items (add program_id, audit columns)
user_profiles (add identity provider abstraction)
RLS policies (rename functions, add program scope)
API routes (add multi-tenant context)
Frontend (add org selector, program scope)
```

### Phase 3: Discard

```
biobanks table (replaced by organizations + capabilities)
current_vilo_role() / current_vilo_organization_id() (rename)
All Vilo-specific migration files
```

---

## First Sprint (Sprint 0) — Foundation

1. Copy ADR-001, domain-scout, selected enums
2. Create `organizations` + `organization_capabilities` tables
3. Create `user_profiles` + `identity_providers` tables
4. Create `audit_events` table
5. Create `programs` + `program_participants` tables
6. Apply RLS to all tables from Sprint 0
7. Seed capability types
8. Smoke test: multi-tenant isolation
