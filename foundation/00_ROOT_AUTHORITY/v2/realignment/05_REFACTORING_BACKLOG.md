# KADARN v2 — Refactoring Backlog (Prioritized)

**Document:** BL-001  
**Date:** 2026-07-25  
**Authority:** Master Realignment Plan v2.0  

---

## Priority Scheme

| Priority | Meaning | Must satisfy |
|----------|---------|-------------|
| P0 | Blocks any v2 work | Gate A prerequisite |
| P1 | Required for first vertical slice | Gate C/D prerequisite |
| P2 | Required for second vertical slice | Gate E prerequisite |
| P3 | Required for third vertical slice | Gate F/G prerequisite |
| P4 | Post-slice hardening | Gate H/I prerequisite |

---

## P0 — Foundation Prerequisites (Sprint 0)

### BL-001: Architecture Freeze + Governance

**Description:** Lock the repository against non-core features. All new work must align with v2 model.

**Files:**
- `foundation/05_ENGINEERING/R6_PACKAGE_CREATION_FREEZE.md` — update to include v2 alignment
- `AGENTS.md` — add v2 constitution reference

**Acceptance:** No PR merged that introduces v1-only features.

**Effort:** 1 day

### BL-002: Deprecate Continuity Engine

**Description:** Mark continuity engine as deprecated. No new code, no new features. Legacy reads only.

**Files:**
- `apps/api/src/app/api/v1/continuity/*` — add deprecation headers
- `packages/types/src/index.ts` — mark LegacyClaimStatus as @deprecated
- `docs/adr/adr-026-trust-surface-decommission.md` — reference

**Risk:** None (continuity is already legacy since KAD-004).

**Effort:** 1 day

### BL-003: Schema Inventory + Documentation

**Description:** For each existing table, document: v2 mapping, required changes, impact.

**Files:**
- `foundation/00_ROOT_AUTHORITY/v2/realignment/01_ARCHITECTURE_ALIGNMENT_AUDIT.md` (this document)
- ADR for adoption decisions

**Acceptance:** Every existing table has a documented v2 disposition.

**Effort:** 1 day

---

## P1 — Source Intelligence (Sprint 1)

### BL-101: EvidenceSource Registry

**Description:** Create `evidence_sources` + `evidence_producers` tables, types, repositories, API.

**Migration:** 073
**Tables:** `evidence_sources`, `evidence_producers`
**Types:** `EvidenceSource`, `EvidenceProducer` in `@kadarn/types`
**API:** `POST /api/v1/sources`, `GET /api/v1/sources`
**Tests:** CRUD + RLS

**Effort:** 2 days

### BL-102: SourceRecord Acquisition

**Description:** Create `source_records` table with content hash, idempotency key, schema version.

**Migration:** 074
**Tables:** `source_records`
**API:** `POST /api/v1/source-records`
**Tests:** Idempotency, content hash dedup

**Effort:** 2 days

### BL-103: ExtractionRun Framework

**Description:** Create `extraction_runs` + `acquisition_runs` tables.

**Migration:** 075
**Tables:** `acquisition_runs`, `extraction_runs`
**API:** `POST /api/v1/source-records/{id}/extract`, `GET /api/v1/extraction-runs/{id}`
**Tests:** Parser versioning, re-extract idempotency

**Effort:** 3 days

---

## P1 — Provenance (Sprint 2)

### BL-201: Observations Table

**Description:** Create `observations` table for pre-normalization extracted values.

**Migration:** 076
**Tables:** `observations`
**Types:** `Observation` in `@kadarn/types`

**Effort:** 2 days

### BL-202: Evidence→Source Linking

**Description:** Add `source_id`, `source_record_id`, `epistemic_type` to `evidence_nodes`.

**Migration:** 077
**Impact:** `evidence_nodes` table — nullable columns, backward compatible
**API:** Update evidence routes to accept new fields
**Tests:** Verify existing evidence reads unchanged

**Effort:** 2 days

### BL-203: ProvenanceRecord Alignment

**Description:** Align `provenance_records` schema to v2. Create provenance_records table if not exists.

**Migration:** 078
**Impact:** Consolidate `packages/provenance/` and `packages/provenance-graph/` into evidence context.
**Effort:** 2 days

---

## P1 — Claims v2 (Sprint 3)

### BL-301: ClaimVersion Table ⚠️

**Description:** Create `claim_versions` table with temporal fields, epistemic_type. Backfill existing claims.

**Migration:** 079
**Tables:** `claim_versions`
**Impact:** **CRITICAL** — existing claims must get initial versions
**Backfill:** For each row in `claims`, insert into `claim_versions` with version=1
**Trigger:** On INSERT/UPDATE to claims, auto-create/update versions

**Effort:** 3 days

### BL-302: ClaimEvidenceLink Table

**Description:** Create `claim_evidence_links` with supports/contradicts/qualifies roles.

**Migration:** 080
**Tables:** `claim_evidence_links`
**Impact:** Migrate existing `evidence_nodes.claim_id` → implicit supports link
**Types:** `ClaimEvidenceLink` with role enum in `@kadarn/types`

**Effort:** 2 days

### BL-303: ClaimConflict Table

**Description:** Create `claim_conflicts` table for detection and resolution.

**Migration:** 081
**Tables:** `claim_conflicts`
**Types:** `ClaimConflict` in `@kadarn/types`
**API:** Future — detection is automated, resolution is human

**Effort:** 1 day

---

## P2 — Capability Intelligence (Sprint 4)

### BL-401: CapabilityState Table

**Description:** Create `capability_states` with valid_from/until, availability, quantity, conditions.

**Migration:** 082
**Tables:** `capability_states`
**Backfill:** Each existing capability gets one initial state

**Effort:** 2 days

### BL-402: CapabilityClaimLink Table

**Description:** Create `capability_claim_links` for multi-claim composition.

**Migration:** 083
**Tables:** `capability_claim_links`
**Backfill:** Migrate `capabilities.primary_claim_id` → initial link

**Effort:** 1 day

---

## P2 — Vertical Slice 1: Continuing Review (Sprint 5)

### BL-501: Continuing Review Pipeline

**Description:** End-to-end pipeline: Upload CR → SourceRecord → ExtractionRun → Observations → Evidence → ClaimVersion → CapabilityState → Passport.

**Files:** New extraction module for CR PDFs, pipeline orchestration, golden case tests
**Tests:** Golden case with real CR document from Vilo

**Effort:** 8 days

---

## P2 — Vertical Slice 2: PI Identity (Sprint 6)

### BL-601: Identity Resolution Framework

**Description:** Create `identity_candidates` table, matching rules for NPI/Name/ORCID resolution.

**Tables:** `identity_candidates`
**Services:** `IdentityResolutionService` — generate candidates, score matches, flag ambiguity
**API:** `GET /api/v1/identity/resolve?name=&location=&specialty=`

**Sources:** NPPES/NPI, ClinicalTrials.gov, PubMed, ORCID

**Effort:** 5 days

---

## P3 — Protocol Intelligence (Sprint 7)

### BL-701: Protocol Model

**Description:** Create `protocols`, `protocol_versions` tables.

**Migration:** 084
**Tables:** `protocols`, `protocol_versions`
**Types:** `Protocol`, `ProtocolVersion` in `@kadarn/types`
**API:** `POST /api/v1/protocols` + versions

**Effort:** 3 days

### BL-702: Requirement Model

**Description:** Create `requirements`, `requirement_rules` tables.

**Migration:** 085
**Tables:** `requirements`, `requirement_rules`
**Types:** `Requirement`, `RequirementRule` in `@kadarn/types`
**Effort:** 3 days

---

## P3 — Assessment Engine (Sprint 8)

### BL-801: Assessment Service

**Description:** Create `assessments`, `assessment_results`, `gaps`, `mitigations` tables + matching service.

**Migration:** 086, 087
**Tables:** `assessments`, `assessment_results`, `gaps`, `mitigations`
**Services:** `AssessmentService`, `RequirementMatchingService`
**API:** `POST /api/v1/assessments`, `GET /api/v1/assessments/{id}/explain`
**Tests:** Golden cases for protocol matching

**Effort:** 8 days (largest single backlog item)

---

## P3 — Vertical Slice 3: Vilo Assessment (Sprint 9)

### BL-901: Vilo Protocol Assessment

**Description:** Run real protocol against Vilo's institutional knowledge snapshot. Produce gaps + mitigations.

**Requires:** BL-701 (Protocol), BL-801 (Assessment), BL-401 (Capability), BL-301 (Claim)
**Tests:** Full end-to-end: SourceRecord → Claim → Capability → Protocol → Assessment → Gaps

**Effort:** 5 days

---

## P4 — Publication v2 (Sprint 10)

### BL-1001: KnowledgeSnapshot

**Description:** Create `knowledge_snapshots` table, snapshot service.

**Migration:** 088
**Services:** `PublicationService`
**API:** `POST /api/v1/snapshots` (auto-generated on publish)

**Effort:** 3 days

### BL-1002: Package Refactoring

**Description:** Rename `published_knowledge` → `packages`. Add snapshot_id, assessment_id.

**Migration:** 089
**Impact:** VIEW for backward compat, new table for v2
**Effort:** 2 days

---

## P4 — Governance & Hardening (Sprint 11)

### BL-1101: Audit Event Table

**Description:** Create `audit_events` table with structured event schema.

**Migration:** 090
**Integration:** Connect to share grants, passport publications, assessment completions
**Effort:** 3 days

### BL-1102: Confidence Explainability

**Description:** Expand confidence computation to 8 v2 dimensions. Create `/explain` endpoint.

**API:** `GET /api/v1/claims/{id}/explain`
**Effort:** 3 days

### BL-1103: Performance + Observability

**Description:** Query performance tuning, observability dashboard, external pilot runbook.

**Effort:** 5 days

---

## Backlog Summary

| Sprint | Items | P0 | P1 | P2 | P3 | P4 | Total Days |
|--------|-------|----|----|----|----|----|-----------|
| Sprint 0 | BL-001→003 | 3 | — | — | — | — | 3 |
| Sprint 1 | BL-101→103 | — | 3 | — | — | — | 7 |
| Sprint 2 | BL-201→203 | — | 3 | — | — | — | 6 |
| Sprint 3 | BL-301→303 (⚠️) | — | 3 | — | — | — | 6 |
| Sprint 4 | BL-401→402 | — | — | 2 | — | — | 3 |
| Sprint 5 | BL-501 | — | — | 1 | — | — | 8 |
| Sprint 6 | BL-601 | — | — | 1 | — | — | 5 |
| Sprint 7 | BL-701→702 | — | — | — | 2 | — | 6 |
| Sprint 8 | BL-801 | — | — | — | 1 | — | 8 |
| Sprint 9 | BL-901 | — | — | — | 1 | — | 5 |
| Sprint 10 | BL-1001→1002 | — | — | — | — | 2 | 5 |
| Sprint 11 | BL-1101→1103 | — | — | — | — | 3 | 11 |

**Total backlog items:** 25  
**Total estimated effort:** ~73 sprint days
