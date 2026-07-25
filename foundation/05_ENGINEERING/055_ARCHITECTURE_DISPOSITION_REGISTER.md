# Architecture Disposition Register — KADARN Phase 0.6

**Created:** 2026-07-24
**Authority:** KEMS-003 (Product Constitution), Audit 054
**Status:** Approved for remediation sprint

## Disposition Categories

| Category | Meaning |
|----------|---------|
| KEEP | Aligned and usable with minimal or no modification |
| ADAPT | Valuable implementation needing bounded changes for KFL compliance |
| CONSOLIDATE | Duplicated/fragmented implementations to merge |
| REPLACE | Responsibility needed but current impl not the foundation |
| QUARANTINE | Legacy code isolated from MVP core but preserved |
| POSTPONE | Potentially useful after MVP |
| RETIRE | Obsolete, disconnected, or harmful |

---

## Component Register

### Applications

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| API Server | apps/api | KEEP | apps/api | @kadarn/* | N/A | No | KEMS-003 §5 | ADR-011 | Build + tests |
| Web Application | apps/web | ADAPT | apps/web | @kadarn/* | Phase 5 | No | KEMS-003 §5 | ADR-034 | Build |

### Core Evidence Packages

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Evidence Core | packages/evidence-core | KEEP | packages/evidence-core | types, auth | N/A | No | KEMS-001 §2-6 | ADR-011 | E2E vertical slice |
| Types | packages/types | KEEP | packages/types | none | N/A | No | KEMS-003 §5 | — | Tests |
| Auth | packages/auth | KEEP | packages/auth | types | N/A | No | KEMS-003 §5 | ADR-002 | Build |
| Evidence Discovery | packages/evidence-discovery | ADAPT | packages/evidence-pipeline | types, ai-layer | Phase 2 | After consolidation | KEMS-002 | ADR-013 | Discovery tests |
| Institutional Knowledge | packages/institutional-knowledge | ADAPT | packages/evidence-pipeline | evidence-discovery | Phase 2 | After consolidation | KEMS-002 | ADR-013 | Pipeline tests |
| Document Intake | packages/document-intake | ADAPT | packages/evidence-pipeline | types | Phase 2 | After consolidation | KEMS-002 | ADR-014 | Connector tests |
| Evidence Lineage | packages/evidence-lineage | CONSOLIDATE | packages/evidence-core | evidence-core | Phase 2 | After consolidation | KEMS-004 | ADR-014 | Lineage tests |
| Evidence Validation | packages/evidence-validation | CONSOLIDATE | packages/evidence-core | types | Phase 2 | After consolidation | KEMS-001 §5 | — | Validation tests |

### Delivery & Passport Packages

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Delivery Domain | packages/delivery-domain | ADAPT | packages/passport-engine | types | Phase 3 | After consolidation | KEMS-007 | ADR-015 | Delivery tests |
| Published View | packages/published-view | ADAPT | packages/passport-engine | delivery-domain | Phase 3 | After consolidation | KEMS-007 | ADR-015 | View tests |
| Readiness Engine | packages/readiness-engine | ADAPT | packages/readiness-engine | types | Phase 3 | No | KEMS-003 §6 | ADR-010 | Readiness tests |
| Sponsor Intelligence | packages/sponsor-intelligence | POSTPONE | packages/sponsor-intelligence | types | Post-MVP | Post-MVP | KEMS-003 §7 | — | None |

### Engine Packages (Legacy KRM-RAO)

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Workflow Engine | packages/workflow-engine | ADAPT | packages/workflow-engine | domain-events | Phase 4 | No | KEMS-003 §5 | ADR-017 | Workflow tests |
| Policy Engine | packages/policy-engine | ADAPT | packages/policy-engine | types | Phase 4 | No | KEMS-003 §5 | ADR-010 | Policy tests |
| Trust Engine | packages/trust-engine | ADAPT | packages/evidence-core (decay) | types | Phase 4 | After consolidation | KEMS-001 §6 | ADR-011 | Trust tests |
| Provenance | packages/provenance | CONSOLIDATE | packages/provenance (unified) | types | Phase 2 | After consolidation | KEMS-004 | ADR-014 | Provenance tests |
| Provenance Graph | packages/provenance-graph | CONSOLIDATE | packages/provenance (unified) | types | Phase 2 | After consolidation | KEMS-004 | ADR-014 | Graph tests |
| Graph Query | packages/graph-query | CONSOLIDATE | packages/published-view | types | Phase 3 | After consolidation | — | ADR-016 | Query tests |
| Knowledge Engine | packages/knowledge-engine | CONSOLIDATE | packages/published-view | types | Phase 3 | After consolidation | KEMS-007 | ADR-015 | Knowledge tests |
| Matching Engine | packages/matching-engine | REPLACE | (no destination) | types | Phase 3 | Yes | None | ADR-018 | None |
| Fulfillment Engine | packages/fulfillment-engine | REPLACE | (no destination) | types | Phase 3 | Yes | None | ADR-019 | None |
| Financial Engine | packages/financial-engine | REPLACE | (no destination) | types | Phase 3 | Yes | None | ADR-020 | None |
| Intelligence Engine | packages/intelligence-engine | REPLACE | (no destination) | types | Phase 3 | Yes | None | ADR-021 | None |

### Infrastructure Packages

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Platform Services | packages/platform-services | KEEP | packages/platform-services | types | N/A | No | KEMS-003 §5 | — | Build |
| Instrumentation | packages/instrumentation | KEEP | packages/instrumentation | types | N/A | No | — | — | Typecheck |
| Domain Events | packages/domain-events | KEEP | packages/domain-events | types | N/A | No | KEMS-003 §5 | ADR-013 | Event tests |
| AI Layer | packages/ai-layer | KEEP | packages/ai-layer | types | N/A | No | — | — | Build |
| SDK | packages/sdk | KEEP | packages/sdk | types | N/A | No | KEMS-003 §5 | — | Build |
| CLI | packages/cli | KEEP | packages/cli | types | N/A | No | — | — | Build |
| KPE Generator | packages/kpe-generator | RETIRE | (archived) | types | Phase 3 | After archive | None | — | None |
| Telemetry | packages/telemetry | KEEP | packages/telemetry | types | N/A | No | — | — | Build |
| UI Library | packages/ui | RETIRE | packages/ui (rebuild) | none | Phase 5 | No | KEMS-003 §5 | — | None |

### Operational Twins

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Operational Twins | packages/operational-twins | CONSOLIDATE | packages/platform-services | types | Phase 4 | After consolidation | None | ADR-012 | Build |

### Database Migrations

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Canonical Migrations | database/migrations/ | KEEP | database/migrations/ | — | N/A | No | KEMS-005 | ADR-011 | db reset |
| Supabase Deploy Migrations | supabase/migrations/ | KEEP | supabase/migrations/ | database/migrations/ | N/A | After convergence | KEMS-005 | — | db reset |
| Phase 8 Grants | 056_phase8_public_read_grants.sql | QUARANTINE | supabase/migrations/ | — | Phase 3 | After consolidation | — | ADR-018 | db reset |
| Phase 8 RLS/Grants | 058_phase8_rls_and_evidence_grants.sql | QUARANTINE | supabase/migrations/ | — | Phase 3 | After consolidation | — | ADR-018 | db reset |
| Sponsor Portfolio | 059_sponsor_portfolio.sql | POSTPONE | supabase/migrations/ | — | Post-MVP | Post-MVP | — | — | db reset |

### Marketplace Domain (QUARANTINE)

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Exchange API routes | apps/api/src/app/api/exchange/* | QUARANTINE | (isolated under /api/v1/marketplace/) | api | Phase 3 | Post-MVP | None | ADR-018 | None |
| Marketplace API routes | apps/api/src/app/api/v1/marketplace/* | QUARANTINE | (isolated) | api | Phase 3 | Post-MVP | None | ADR-018 | None |
| Exchange deals API | apps/api/src/app/api/v1/exchange/* | QUARANTINE | (isolated) | api | Phase 3 | Post-MVP | None | ADR-019 | None |
| Marketplace UI | apps/web/src/app/(marketplace)/* | QUARANTINE | (isolated route group) | web | Phase 3 | Post-MVP | None | — | None |
| Matching Engine | packages/matching-engine | REPLACE | (removed at Phase 3) | types | Phase 3 | Yes | None | ADR-018 | None |
| Fulfillment Engine | packages/fulfillment-engine | REPLACE | (removed at Phase 3) | types | Phase 3 | Yes | None | ADR-019 | None |
| Financial Engine | packages/financial-engine | REPLACE | (removed at Phase 3) | types | Phase 3 | Yes | None | ADR-020 | None |

### Continuity Domain (LEGACY, MIGRATABLE)

| Component | Path | Disposition | Canonical Destination | Dependencies | Migration Timing | Deletion Eligible | Governing KFL | Related ADR | Validation |
|-----------|------|-------------|----------------------|--------------|-----------------|-------------------|---------------|-------------|------------|
| Continuity Claims API | apps/api/src/app/api/v1/continuity/claims/* | QUARANTINE | (map to evidence-core) | api | Phase 2 | After migration | KEMS-001 | ADR-011 | Continuity tests |
| Continuity Passport API | apps/api/src/app/api/v1/continuity/passport/* | QUARANTINE | (map to evidence-core) | api | Phase 2 | After migration | KEMS-001 | ADR-011 | Continuity tests |
| Continuity Claim Service | apps/api/src/lib/continuity-claim-service.ts | QUARANTINE | packages/evidence-core | api | Phase 2 | After migration | KEMS-001 | ADR-011 | Continuity tests |
| Legacy Adapter | packages/published-view/src/legacy-adapter.ts | QUARANTINE | packages/published-view | published-view | Phase 2 | After migration | KEMS-007 | — | Published-view tests |
| Continuity Migrations (042-044) | database/migrations/042-044 | KEEP | database/migrations/ | — | N/A | After data migration | — | — | db reset |
