# RC-11 Completion Report - Sponsor Passport Evidence Core Adapter

**Date:** 2026-07-05  
**Status:** Accepted - frozen baseline for RC-12  
**Baseline:** RC-10.2 Sponsor Institutional Passport API Contract  
**Program stage:** Sponsor Platform build-out complete; production integration begins in RC-12

---

## Executive Summary

RC-11 completed the Sponsor Passport Evidence Core Adapter. The Sponsor Passport API now reads portfolio-scoped institutional passport data through a stable `PassportStore` boundary and maps Evidence Core data into the RC-10.2 wire contract for claims, provenance, identity, capabilities, history, and recommendations.

RC-11 is now frozen. Future work should not expand the RC-10/RC-11 runtime surface. RC-12 will industrialize this platform by replacing temporary implementations with production-grade persistence, stability, performance, and hardening.

---

## Program Objective

RC-11 existed to move Sponsor Passport from a mock runtime toward an Evidence Core-backed runtime while preserving the approved sponsor-facing contract.

| Objective | Result |
|---|---|
| Preserve RC-10.2 API contract | PASS |
| Preserve Sponsor UI expectations | PASS |
| Introduce store boundary between routes and data sources | PASS |
| Wire Evidence Core reads without `@kadarn/evidence-lineage` | PASS |
| Preserve mock mode | PASS |
| Keep Public Projection and `continuity/passport` untouched | PASS |

---

## Scope

### In Scope

- Sponsor Passport API runtime backing.
- `PassportStore` abstraction.
- Evidence Core adapter reads and DTO mapping.
- Portfolio-scoped reads.
- Claim, provenance, identity, capability, history, and recommendation sections.
- Mock mode preservation.
- API build and TypeScript integrity recovery through RC-10.7a/RC-10.7b.

### Out of Scope

- Sponsor UI redesign.
- Public Projection.
- `continuity/passport`.
- `@kadarn/evidence-lineage` as a Sponsor Passport dependency.
- KUX/KEMS/ADR changes.
- Database migrations for durable portfolio membership.
- Production observability, caching, pagination, and hardening.

---

## Sprints Executed

| Sprint | Outcome | Notes |
|---|---|---|
| RC-11.1 | Store boundary | Routes depend on `PassportStore`, not mock data or Evidence Core directly. |
| RC-11.2 | Organization-scoped Evidence Core reads | Added repository support for institution-scoped claims and evidence. |
| RC-11.3 | Claims runtime | Mapped Evidence Core claims and evaluated confidence into `PassportClaim[]`. |
| RC-11.4 | Provenance runtime | Added claim provenance sub-resource through Evidence Core graph data. |
| RC-11.5 | Portfolio allowlist runtime | Added sponsor portfolio scoping through temporary allowlist configuration. |
| RC-11.6 | Identity and capabilities runtime | Mapped organization registration and grouped claims into capabilities. |
| RC-11.7 | History runtime | Mapped claim/evidence lifecycle audit events into history. |
| RC-11.8 | Recommendations runtime | Added conservative adapter-level recommendations from claims/evidence state. |
| RC-10.7a | Build recovery | Restored `apps/api` production build. |
| RC-10.7b | TypeScript build integrity | Removed `ignoreBuildErrors`; TypeScript validation is active and passing. |

---

## Relevant Commits

| Commit | Sprint | Summary |
|---|---|---|
| `22c9f854` | RC-11.2 | Add organization-scoped claim and evidence reads. |
| `ae21e588` | RC-11.3 | Add Sponsor Passport claims runtime via Evidence Core. |
| `5df765cb` | RC-11.4 | Add Sponsor Passport provenance runtime via Evidence Core. |
| `a584ec99` | RC-11.5 | Add Sponsor Passport portfolio runtime via allowlist. |
| `d758d919` | RC-11.6 | Add Sponsor Passport identity and capabilities runtime. |
| `547e0796` | RC-11.7 | Add Sponsor Passport history runtime from audit events. |
| `cab47b8b` | RC-11.8 | Add Sponsor Passport recommendations runtime from claim rules. |
| `b6ddce12` | RC-10.7a | Restore `apps/api` production build. |
| `7b42ab61` | RC-10.7b | Restore TypeScript build integrity. |

---

## Capabilities Implemented

| Capability | Status | Source |
|---|---|---|
| Portfolio index | Implemented | Temporary sponsor allowlist. |
| Passport detail | Implemented | Evidence Core-backed store. |
| Claims | Implemented | Evidence Core claims and evidence evaluation. |
| Claim provenance | Implemented | Evidence Core graph data. |
| Identity | Implemented | Organization registration with allowlist fallback. |
| Capabilities | Implemented | Grouped claim taxonomy and confidence. |
| History | Implemented | Evidence Core lifecycle audit events. |
| Recommendations | Implemented | Conservative adapter rules from claim/evidence state. |
| Mock mode | Preserved | `SPONSOR_PASSPORT_DATA_SOURCE=mock`. |
| Evidence Core mode | Implemented | `SPONSOR_PASSPORT_DATA_SOURCE=evidence-core`. |

---

## Final Architecture

```
Sponsor UI
   |
   v
Sponsor API
   |
   v
Sponsor Passport Contract (RC-10.2)
   |
   v
PassportStore
   |
   +-- MockPassportStore
   |
   +-- EvidenceCorePassportStore
          |
          v
      Adapter Mappers and Queries
          |
          v
      Evidence Core
```

### Runtime Boundary

| Layer | Responsibility |
|---|---|
| Sponsor UI | Consumes Sponsor Passport API contract only. |
| Sponsor API routes | Auth, rate limit, envelope, route parameter handling. |
| RC-10.2 contract | Stable DTO and lexicon boundary. |
| `PassportStore` | Runtime data-source abstraction. |
| Mock store | Contract-preserving local mode. |
| Evidence Core store | Production-facing read adapter. |
| Adapter mappers | Translate Evidence Core state into Sponsor Passport DTOs. |
| Evidence Core | Claims, evidence, audit lifecycle, graph/provenance data. |

---

## Data Flow

```
GET /api/v1/sponsor/passports
   -> require sponsor org membership
   -> PassportStore.getPortfolioIndex(sponsorOrgId)
   -> PortfolioIndexResponse

GET /api/v1/sponsor/passports/:institutionId
   -> require sponsor org membership
   -> PassportStore.getInstitutionalPassport(sponsorOrgId, institutionId)
   -> Evidence Core read
   -> adapter mapping
   -> InstitutionalPassport

GET /api/v1/sponsor/passports/:institutionId/claims/:claimId/provenance
   -> require sponsor org membership
   -> PassportStore.getClaimProvenanceDetail(sponsorOrgId, institutionId, claimId)
   -> Evidence Core graph read
   -> PassportClaimProvenanceDetail
```

---

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Keep RC-10.2 as the stable contract | Prevents runtime changes from leaking into Sponsor UI or product law. |
| Route through `PassportStore` | Keeps API routes independent of mock and Evidence Core implementation details. |
| Preserve mock mode | Allows local/demo behavior and contract parity during production migration. |
| Exclude Public Projection | Sponsor Passport is a sponsor-authenticated product surface, not public continuity passport. |
| Exclude `@kadarn/evidence-lineage` | Sponsor Passport runtime reads Evidence Core directly for this phase. |
| Use adapter mappers | Keeps Evidence Core domain logic outside Sponsor Passport DTO mapping. |
| Keep recommendations conservative | No AI-generated or unsupported actions; only claim/evidence-backed rules. |
| Treat portfolio allowlist as temporary | Enables RC-11 closure while deferring persistence to RC-12.1. |
| Keep stability as provisional | `Under Review` remains a stub until RC-12.2 Stability Runtime. |

---

## Gates Reached

| Gate | Result |
|---|---|
| `apps/api` production build | PASS |
| `apps/api` TypeScript validation | PASS |
| Sponsor Passport test suite | PASS - 49/49 |
| Evidence Core test suite | PASS - 216/216 |
| Sponsor Contract Freeze | PASS - RC-10.2 preserved |
| KUX Freeze | PASS - no KUX edits in RC-11 closure |
| Architecture Freeze | PASS - Public Projection and continuity boundaries preserved |
| Mock mode parity | PASS |
| Evidence-lineage untouched by Sponsor Passport runtime | PASS |

---

## Invariants Confirmed

| Invariant | Status |
|---|---|
| Sponsor UI never consumes Evidence Core directly. | Preserved |
| Sponsor API routes call `PassportStore`, not Evidence Core directly. | Preserved |
| RC-10.2 remains the stable wire contract. | Preserved |
| KUX-008 remains frozen. | Preserved |
| Adapter mappers translate data; they do not own Evidence Core domain policy. | Preserved |
| Public Projection is not reused by Sponsor Passport. | Preserved |
| `continuity/passport` is not reused by Sponsor Passport. | Preserved |
| Confidence remains enum-only, never numeric. | Preserved |
| Sponsor recommendations are evidence-backed and conservative. | Preserved |
| Contract changes require explicit versioning. | Preserved |

---

## Explicit Pending Items Inherited by RC-12

| Pending Item | Target | Reason |
|---|---|---|
| Replace portfolio allowlist with persistent portfolio model | RC-12.1 | Allowlist/JSON is temporary and not production-grade. |
| Implement Stability Runtime | RC-12.2 | `stability: 'Under Review'` is still provisional. |
| Remove remaining temporary mocks/stubs/adapters from production path | RC-12.3 | Evidence Core should be the production source of record. |
| Add production performance controls | RC-12.4 | Cache, pagination, indexes, lazy loading, and query optimization remain future work. |
| Add production hardening | RC-12.5 | Metrics, tracing, observability, rate limits, logging, alerts, errors, and audit posture need productionization. |
| Prepare pilot documentation | Parallel doc workstream | Claim taxonomy, governance, verification, validation, and business docs are required for real pilots. |

---

## RC-12 Entry Criteria

RC-12 can begin because the following gates are met:

| Entry Gate | Status |
|---|---|
| RC-10 closed | PASS |
| RC-11 closed | PASS |
| API build green | PASS |
| TypeScript green | PASS |
| Sponsor Passport tests green | PASS |
| Evidence Core tests green | PASS |
| Contract baseline identified | PASS - RC-10.2 |
| Temporary implementations explicitly listed | PASS |

---

## Freeze Declaration

RC-11 is frozen as the Sponsor Passport Evidence Core Adapter baseline. Future changes should be classified under RC-12 unless they are critical fixes to preserve the RC-11 baseline.

RC-12 work must not change the Sponsor Passport API contract or Sponsor UI semantics unless a new versioned contract is explicitly approved.

---

## Next Step

Open **RC-12.0 - Sponsor Platform Freeze** with the remaining consolidation artifacts:

1. Sponsor Platform Architecture v1.0.
2. Sponsor Platform Invariants.
3. RC-12 Roadmap.

After RC-12.0 is accepted, begin **RC-12.1 - Persistent Portfolio** as the first production integration sprint.

---

*This report closes RC-11 as the Sponsor Passport Evidence Core Adapter baseline. RC-12 is the production integration phase, not a new feature expansion phase.*
