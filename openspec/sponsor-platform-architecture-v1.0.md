# Sponsor Platform Architecture v1.0

**Date:** 2026-07-05  
**Status:** Frozen baseline for RC-12  
**Governs:** Sponsor Platform runtime, Sponsor Institutional Passport API, Evidence Core Adapter boundary  
**Baseline contracts:** RC-10.2 Sponsor Institutional Passport API Contract, KUX-008 Institutional Passport, Sponsor API v1

---

## 1. Purpose

Sponsor Platform v1.0 is the sponsor-facing architecture for reading institutional capability, evidence, provenance, history, and recommendations through a stable Sponsor Passport contract.

The platform exists to let authenticated sponsor organizations evaluate institutions in their working portfolio without exposing internal Evidence Core implementation details, Public Projection shapes, or continuity passport surfaces.

### Problem Solved

Sponsors need a stable, explainable, portfolio-scoped view of institutional capability. The platform solves this by separating:

| Concern | Owner |
|---|---|
| Presentation | Sponsor UI |
| Authentication and API envelope | Sponsor API |
| Product contract and lexicon | Sponsor Passport Contract |
| Runtime data-source boundary | Evidence Core Adapter through `PassportStore` |
| Source-of-truth claim/evidence state | Evidence Core |

### Actors

| Actor | Role |
|---|---|
| Sponsor user | Reads portfolio, passport detail, and claim provenance. |
| Sponsor organization | Owns portfolio scope and access boundary. |
| Institution/site | Subject of claims, capabilities, identity, and evidence. |
| Kadarn operator | Maintains platform runtime, evidence ingestion, and governance. |
| Evidence Core | Provides canonical claim/evidence/audit/provenance state. |

### Scope

In scope:

- Sponsor Passport read APIs under `/api/v1/sponsor/passports/*`.
- Portfolio-scoped institutional passport data.
- RC-10.2 DTO contract.
- Evidence Core Adapter and mapper layer.
- Mock mode as contract-preserving local/demo mode.
- RC-12 extension points for production readiness.

Out of scope:

- Public Projection.
- `continuity/passport`.
- Anonymous public passport reads.
- Sponsor UI redesign.
- New product intelligence features beyond production integration.
- Contract changes without versioning.

---

## 2. Architectural Principles

| Principle | Meaning |
|---|---|
| Contract-first | The RC-10.2 Sponsor Passport contract governs all runtime responses. |
| Adapter pattern | The API talks to `PassportStore`; implementation details stay behind the adapter. |
| Evidence Core as source of truth | Production claim/evidence/provenance state comes from Evidence Core. |
| Runtime decoupling | Routes do not own Evidence Core query, mapping, or scoring logic directly. |
| Presentation/contract/infrastructure separation | Sponsor UI, DTO contract, and data infrastructure evolve independently. |
| Forward compatibility through versioning | Contract changes require an explicit versioned contract or program phase. |
| Portfolio-scoped access | Sponsors read only institutions in their working portfolio. |
| Explainability by default | Claims expose provenance; deeper Evidence Tree detail is lazy-loaded. |
| No aggregate scoring | Confidence is per claim/capability enum-only, never institution ranking or score. |
| Conservative recommendations | Recommendations must be backed by existing claims/evidence state. |

---

## 3. Layered Architecture

### Canonical Diagram

```
Sponsor UI
        |
        v
Sponsor API
        |
        v
Sponsor Passport Contract
        |
        v
Evidence Core Adapter
        |
        v
Evidence Core
```

### Layer Responsibilities

| Layer | Responsibilities | Allowed Dependencies | Forbidden Dependencies |
|---|---|---|---|
| Sponsor UI | Render Sponsor Passport views; call Sponsor API only. | Sponsor API, RC-10.2 DTOs | Evidence Core, adapter internals, storage tables |
| Sponsor API | Auth, org membership, rate limit, route params, response envelope. | Sponsor Passport Contract, `PassportStore` | Direct storage reads for passport data, Public Projection |
| Sponsor Passport Contract | Stable wire DTOs, vocabulary, field constraints, API semantics. | KUX-008, RC-10.2 | Runtime data source logic |
| Evidence Core Adapter | Read Evidence Core data and map it into Sponsor Passport DTOs. | Evidence Core, adapter mappers | UI concerns, Public Projection, continuity passport |
| Evidence Core | Canonical claims, evidence, audit lifecycle, graph/provenance data. | Internal Evidence Core repositories and lifecycle services | Sponsor UI, Sponsor Contract assumptions |

---

## 4. Data Flow

### Portfolio Index

```
Sponsor request
   -> Sponsor API route
   -> Supabase auth user
   -> active sponsor organization membership
   -> rate limit
   -> PassportStore.getPortfolioIndex(sponsorOrgId)
   -> portfolio data source
   -> RC-10.2 response envelope
```

### Passport Detail

```
Sponsor request
   -> Sponsor API route
   -> Supabase auth user
   -> active sponsor organization membership
   -> route params: institutionId
   -> rate limit
   -> PassportStore.getInstitutionalPassport(sponsorOrgId, institutionId)
   -> portfolio membership check
   -> Evidence Core reads
   -> adapter mappers
   -> InstitutionalPassport DTO
   -> RC-10.2 response envelope
```

### Claim Provenance

```
Sponsor request
   -> Sponsor API route
   -> Supabase auth user
   -> active sponsor organization membership
   -> route params: institutionId, claimId
   -> rate limit
   -> PassportStore.getClaimProvenanceDetail(sponsorOrgId, institutionId, claimId)
   -> portfolio membership check
   -> Evidence Core graph/provenance reads
   -> PassportClaimProvenanceDetail DTO
   -> RC-10.2 response envelope
```

### Transformation Boundary

| Source | Adapter Mapping | Contract Output |
|---|---|---|
| Evidence Core claims/evidence | Claim evaluation and minimal provenance mapping | `PassportClaim[]` |
| Evidence Core graph data | Evidence/source document/contradiction mapping | `PassportClaimProvenanceDetail` |
| Organization registration | Identity fields | `PassportIdentity` |
| Claim taxonomy groups | Capability grouping | `PassportCapability[]` |
| Audit lifecycle events | Claim/evidence history mapping | `PassportHistoryEvent[]` |
| Claim/evidence state | Conservative recommendation rules | `PassportRecommendation[]` |

---

## 5. Components

| Component | Responsibility | Production Status |
|---|---|---|
| Sponsor API routes | `/api/v1/sponsor/passports/*` read surface. | Implemented |
| `PassportStore` | Contract boundary between API routes and runtime source. | Implemented |
| `MockPassportStore` | Contract-preserving local/demo mode. | Preserved |
| `EvidenceCorePassportStore` | Evidence Core-backed runtime store. | Implemented |
| Portfolio | Sponsor-scoped list and access check. | Temporary allowlist; RC-12.1 target |
| Claims | Evidence Core claims mapped to contract DTOs. | Implemented |
| Identity | Organization registration mapped to identity fields. | Implemented |
| Provenance | Lazy claim evidence tree detail. | Implemented |
| Capabilities | Claim taxonomy grouping and confidence rollup. | Implemented |
| History | Audit lifecycle events mapped to passport history. | Implemented |
| Recommendations | Conservative rules from claim/evidence state. | Implemented |
| Stability | Knowledge-state indicator. | Provisional `Under Review`; RC-12.2 target |

---

## 6. Dependency Rules

### Allowed Direction

```
UI
 |
 v
API
 |
 v
Contract
 |
 v
Adapter
 |
 v
Evidence Core
```

Dependencies must move downward through this chain. A lower layer must not depend on a higher layer.

### Explicitly Forbidden

| Forbidden Dependency | Reason |
|---|---|
| Sponsor UI -> Evidence Core | Bypasses contract and product law. |
| Sponsor UI -> Adapter internals | Couples presentation to runtime implementation. |
| Sponsor API -> storage tables for passport DTOs | Bypasses `PassportStore` and adapter boundary. |
| Sponsor Contract -> runtime implementation | Makes the contract depend on deployment details. |
| Evidence Core -> Sponsor Contract | Pollutes source-of-truth domain with presentation semantics. |
| Sponsor Passport -> Public Projection | Reuses anonymous/public compatibility shape in sponsor product. |
| Sponsor Passport -> `continuity/passport` | Crosses audience, identity, and lexicon boundaries. |
| Sponsor Passport -> `@kadarn/evidence-lineage` | RC-11 baseline reads Evidence Core directly. |

### Dependency Review Rule

Any new dependency crossing these rules requires one of:

1. an approved RFC,
2. an ADR,
3. a versioned RC-12.x program decision.

---

## 7. Versioning

### Frozen Baselines

| Baseline | Status | Meaning |
|---|---|---|
| RC-10.2 Sponsor Passport Contract | Frozen | Stable Sponsor Passport API DTO and lexicon. |
| KUX-008 Institutional Passport | Frozen | Product law for institutional passport behavior. |
| Sponsor API v1 | Frozen for RC-12 | API namespace remains `/api/v1/sponsor/passports/*`. |
| Sponsor Platform Architecture v1.0 | Frozen baseline | Dependency and boundary rules for RC-12. |

### Versioning Rules

- DTO field additions require contract review.
- Field removals or semantic changes require a new contract version.
- New public read surfaces must not reuse Sponsor Passport DTOs without explicit approval.
- New adapter data sources must continue to satisfy `PassportStore`.
- New RC-12 production implementations must not change RC-10.2 response semantics.

---

## 8. Runtime Boundaries

### Sponsor Platform Owns

- Sponsor-authenticated API surface.
- Portfolio-scoped access semantics.
- Sponsor Passport DTO mapping.
- Response envelope and route behavior.
- Sponsor-specific recommendation presentation.
- Contract compatibility and mock/evidence-core source selection.

### Evidence Core Owns

- Claims.
- Evidence nodes.
- Counter-evidence.
- Audit lifecycle events.
- Evidence graph/provenance data.
- Claim evaluation primitives.
- Domain invariants around evidence and claims.

### Future Engines Own

Future engines may be introduced after RC-12 if they remain outside the current contract boundary.

| Future Engine | Potential Responsibility | Boundary Requirement |
|---|---|---|
| Sponsor Intelligence | Portfolio analytics, alerts, longitudinal tracking. | Must consume Sponsor Platform outputs or approved APIs. |
| Institution Intelligence | Claim evolution, evidence coverage, institutional gaps. | Must not alter Sponsor Passport contract implicitly. |
| Evidence Intelligence | Evidence discovery, reconciliation, classification. | Must write through approved Evidence Core pathways. |

---

## 9. RC-12 Extension Points

RC-12 extends the architecture by replacing temporary implementations. It does not redefine the Sponsor Passport product surface.

| Extension Point | RC Target | Where It Fits | Contract Impact |
|---|---|---|---|
| Persistent Portfolio | RC-12.1 | Portfolio data source behind `PassportStore` | None expected |
| Stability Runtime | RC-12.2 | Adapter mapping for `stability` | No field change; replaces stub value |
| Evidence Core Production Integration | RC-12.3 | Evidence Core store and query layer | None expected |
| Cache | RC-12.4 | API/adapter read optimization | None expected |
| Pagination | RC-12.4 | Portfolio and future large collections | Contract review if response shape changes |
| Query Optimization | RC-12.4 | Evidence Core repository/query layer | None expected |
| Observability | RC-12.5 | API and adapter instrumentation | None expected |
| Rate Limiting | RC-12.5 | Sponsor API boundary | None expected |
| Logging and Alerts | RC-12.5 | Operations layer | None expected |
| Audit Hardening | RC-12.5 | API and Evidence Core lifecycle | None expected |

---

## 10. Architecture Freeze

This architecture is the official baseline for **Sponsor Platform v1.0**.

Future changes to contracts, layer dependencies, source-of-truth ownership, or architectural invariants must be introduced through an approved RFC, ADR, or versioned program phase such as RC-12.x or later.

RC-12 may replace temporary implementations with production implementations, but it must preserve:

- RC-10.2 Sponsor Passport contract semantics.
- Sponsor API v1 namespace.
- Sponsor UI contract expectations.
- Evidence Core as production source of truth.
- Adapter boundary between Sponsor Platform and Evidence Core.
- Public Projection and `continuity/passport` separation.

---

## Next Artifact

The next RC-12.0 artifact is **Sponsor Platform Invariants**.

That document should convert the architectural rules above into a concise invariant checklist that every RC-12 sprint must satisfy before closure.

---

*Sponsor Platform Architecture v1.0 freezes the Sponsor Platform baseline after RC-10 and RC-11. RC-12 is authorized to industrialize this baseline without expanding the product surface.*
