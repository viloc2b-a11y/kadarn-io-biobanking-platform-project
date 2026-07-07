# PDF-1.3 — Stable API Catalog

**Sprint:** PDF-1.3  
**Gate:** API Contract Freeze  
**Status:** Draft for approval  
**Sign-off role:** Engineering

**Source of truth:** `apps/api/openapi-v1.yaml`, `@kadarn/sdk`, `packages/published-view/src/integration-guard.ts`

---

## Classification legend

| Class | Contract | Consumers | Change policy |
|-------|----------|-----------|---------------|
| **Official (Stable)** | OpenAPI + SDK | External integrators, sponsors, sites | No breaking changes without ADR + version bump |
| **Internal** | Code + PDD only | Kadarn Web apps (Workspace, Marketplace, KOC) | May change between RC releases |
| **Experimental** | Undocumented | Dev / pilot only | No stability guarantee |
| **Deprecated** | Deprecation header | Migrate to v1 | Removal after GA + notice period |

---

## Official APIs (Kadarn 1.0 stable contract)

These routes are in OpenAPI v1, covered by the unified response envelope, and intended for external consumption.

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/health` | Liveness | None |
| GET | `/api/health/ready` | Readiness (deps) | None |
| GET | `/api/metrics` | Prometheus metrics | Ops network |
| GET | `/api/v1/institution/public/{slug}` | Public institution profile | None (public) |
| GET | `/api/v1/continuity/passport/{slug}` | Public Evidence Passport | None (anonymous read) |
| GET | `/api/v1/discovery/dashboard` | Discovery workbench dashboard | Session-scoped |
| GET | `/api/v1/discovery/report` | Institution recognition report | Session-scoped |
| GET | `/api/docs` | OpenAPI / Swagger UI | None (dev/staging) |

**Published View boundary (ADR-030):** The four `/api/v1/*` product routes above read exclusively through `@kadarn/published-view`. They must not read `continuity_experience_claims` or raw Evidence Core tables directly in product paths.

**SDK coverage:** `@kadarn/sdk` — `health()`, `passport()`, `institutionPublic()`, `discoveryDashboard()`, `discoveryReport()`.

---

## Internal APIs (authenticated product surfaces)

Not in OpenAPI v1. Supported for Kadarn Web UX; **not** guaranteed for third-party integrators in 1.0.

### Workspace (Site Director)

| Prefix | Examples |
|--------|----------|
| `/api/v1/workspace/*` | overview, profile, consent, documents, programs, collections, inventory, logistics, processing, regulatory, requests, active-org |

### Continuity (authenticated claim lifecycle)

| Prefix | Examples |
|--------|----------|
| `/api/v1/continuity/claims/*` | submit, verify, reject, promote, evidence |
| `/api/v1/continuity/passport/{slug}/*` | opportunities, timeline (authenticated extensions) |
| `/api/v1/continuity/opportunities/*` | match |

### Discovery (internal pipeline)

| Prefix | Examples |
|--------|----------|
| `/api/v1/discovery/*` | curation, pipeline-status, provenance, session (non-public dashboard/report variants) |

### Marketplace (Sponsor)

| Prefix | Examples |
|--------|----------|
| `/api/v1/marketplace/*` | search, organizations, capabilities, services, specimens, requests, feasibility |
| `/api/v1/sponsor/search` | Sponsor search alias |

### Evidence Core (governed writes)

| Prefix | Examples |
|--------|----------|
| `/api/v1/evidence-core/*` | evidence, responses, counter-evidence, process-state |
| `/api/v1/evidence-lineage/*` | claims provenance |

### KOC (Operations — role-gated)

| Prefix | Examples |
|--------|----------|
| `/api/v1/koc/*` | analytics, events, knowledge, logistics, policy, twins, workflow, ecosystem |

### Operations

| Prefix | Examples |
|--------|----------|
| `/api/v1/operations/*` | phase8-cutover, capacity, sla, exceptions, provenance, kpe |

### Auth & org

| Prefix | Examples |
|--------|----------|
| `/api/me`, `/api/organizations/*`, `/api/programs/*` | Identity, org capabilities, invites |

### RC internal (not GA external)

| Path | Status |
|------|--------|
| `/api/v1/institution/profile` | **Deferred 28K** — VIEW_PENDING; authenticated only |
| `/api/v1/published-views/{claimId}/evidence-pack` | **Stub** — not prod GA |

**Route count:** ~122 route handlers under `apps/api`; ~7 official stable; remainder internal.

---

## Experimental APIs

No stability guarantee. May be removed or reshaped without notice.

| Domain | Routes | Notes |
|--------|--------|-------|
| Exchange Engine | `/api/v1/exchange/deals/*`, `/api/v1/programs/[id]/exchange` | Deal workflow stub |
| Financial Engine | `/api/v1/financial/settlements` | Not product GA |
| Logistics Engine | Processing aliquots, workspace logistics | Partial implementation |
| Intelligence / Feed | `/api/v1/feed`, `/api/v1/search` | KOC analytics inputs |
| Specimens / Programs | `/api/v1/specimens`, program milestones | Legacy engine overlap |
| KPE generate | `/api/v1/operations/kpe/generate` | Ops tooling |

---

## Deprecated APIs

| Path | Replacement | Header |
|------|-------------|--------|
| `/api/*` (non-v1 legacy) | `/api/v1/*` | `Deprecation: true` |
| Direct `continuity_experience_claims` reads in product routes | Published View service | Blocked by integration guard |
| Trust Engine terminology / endpoints | Removed per ADR-010 | **Retired** |

---

## Compatibility policy

### Response envelope (all v1 routes)

```json
{
  "ok": true,
  "data": { },
  "request_id": "…",
  "correlation_id": "…",
  "generated_at": "ISO-8601"
}
```

Errors use `KadarnErrorCode` from `@kadarn/types/errors`.

### Versioning

- URL prefix: `/api/v1/*`
- Header: `X-Kadarn-Api-Version: v1` (middleware)
- Breaking changes require ADR + minor/major bump documented in release notes

### Phase 8 Compatibility Layer

During cutover, legacy adapter may serve equivalent shapes. External contract **shape** must remain stable; internal read path migrates to Published View without consumer-visible breaking changes.

### Post-PDF freeze rule

New routes are **Internal** by default until added to `openapi-v1.yaml` + SDK + PDF-1.3 amendment.

---

## Gate: API Contract Freeze

- [x] Official stable routes listed (7 product + health/metrics/docs)
- [x] Internal vs experimental separated
- [x] Deprecated paths identified
- [x] Compatibility policy stated
- [x] SDK parity verified against OpenAPI
- [ ] **Engineering sign-off**

**Upon approval:** only Official APIs receive breaking-change protection through GA.
