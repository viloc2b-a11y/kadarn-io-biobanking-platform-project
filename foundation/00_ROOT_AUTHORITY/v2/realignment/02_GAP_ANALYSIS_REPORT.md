# KADARN Gap Analysis Report v2.0

**Document:** GAP-001  
**Date:** 2026-07-25  
**Authority:** Architecture Constitution v2.0, Implementation Blueprint v2.0  
**Status:** Complete  

---

## 1. Gap Overview

This report compares the KADARN repository (as of KAD-012) against the v2 canonical model defined in the Architecture Constitution. Gaps are classified as:

- **CRITICAL:** Blocks the v2 knowledge pipeline
- **MAJOR:** Required for a bounded context to function
- **MINOR:** Nice-to-have or optimization

---

## 2. Evidence Source Intelligence Gap

### CRITICAL: EvidenceSource Model

**Required:** `evidence_sources` table with: id, name, source_type, authority_level (T1–T4), producer_id, freshness_policy_json, status, created_at.

**Current state:** No source modeling exists. `evidence_nodes` has a `source_url` column but no structured source identity.

**Impact:** Cannot answer "What authority does this source have?" — blocks Explainable Confidence dimension #1 (Source Authority).

**File evidence:**
- Supabase: `\d evidence_nodes` — missing `source_id`, `source_record_id`
- `apps/api/src/lib/continuity-claim-service.ts` — hardcoded source logic
- `docs/positioning/05_DISCOVERY_READINESS_SPECIFICATION.md` — conceptual only

### CRITICAL: SourceRecord Model

**Required:** `source_records` table with: id, source_id, external_id, acquired_at, effective_at, content_hash, storage_uri, mime_type, schema_version, status.

**Current state:** No source record preservation. Documents exist client-side only.

**Impact:** Cannot preserve or replay acquisition.

### MAJOR: Acquisition/Extraction Tracking

**Required:** `acquisition_runs` and `extraction_runs` tables.

**Current state:** The `provenance-graph` package has generic event recording but no extraction-run-specific tables.

**Impact:** Cannot audit which parser extracted which observation from which record.

---

## 3. Evidence & Provenance Gap

### MAJOR: Epistemic Type Separation

**Required:** Evidence-level `epistemic_type` field: `observation`, `direct_claim`, `derived_claim`, `inference`.

**Current state:** `evidence_nodes` has `evidence_class` (A–F from KEMS-001) which is a quality/weight classification, not an epistemic type.

**Impact:** The v2 requires separation between observed data, human assertions, deterministic derivations, and AI inferences. Currently all are stored as evidence with the same weight structure.

### MAJOR: Observations Table

**Required:** `observations` table between extraction and evidence normalization.

**Current state:** No observation layer. Data goes from extraction → evidence directly.

**Impact:** Cannot audit pre-normalization values or re-extract with different parsers.

### MAJOR: EvidenceLink (supports/contradicts/qualifies)

**Required:** `evidence_links` or `claim_evidence_links` with role enum.

**Current state:** The existing `evidence_nodes` table links to `claim_id` but has no relationship type. All evidence implicitly "supports" its claim.

**Impact:** Cannot represent contradictory or qualifying evidence — violates Constitution principle "Contradictions are Data."

### MINOR: ProvenanceRecord Schema Alignment

**Required:** `provenance_records` with: entity_type, entity_id, action (enum), actor_id, previous_state, new_state, metadata, created_at.

**Current state:** The provenance-recorder.ts service records events but the schema is ad-hoc. The `provenance` and `provenance-graph` packages have overlapping responsibilities.

**File evidence:**
- `apps/api/src/lib/provenance-recorder.ts` (405 lines) — custom implementation
- `packages/provenance/src/` and `packages/provenance-graph/src/` — existing but misaligned

---

## 4. Claims & Knowledge Gap

### CRITICAL: Claim Versioning

**Required:** `claim_versions` table: claim_id, version, predicate, value_json, subject, context_json, asserted_at, valid_from/until, epistemic_type, status, superseded_by.

**Current state:** Single `claims` table with mutable status and description. No version history.

**Impact:** Cannot support Temporal Truth principle. A claim that was true and later superseded loses its history.

**File evidence:**
- `\d claims` — no versioning columns
- `packages/types/src/claim.ts` — KAD-004 ClaimSchema has no version field

### CRITICAL: Evidence→Claim Relationship Typing

**Required:** `claim_evidence_links` with role: `supports`, `contradicts`, `qualifies`, `supersedes`.

**Current state:** Implicit `evidence_nodes.claim_id` FK — all evidence supports its parent claim.

**Impact:** Silently drops contradictory evidence. Violates Constitution §4 "Contradictions are Data."

### MAJOR: Conflicting Claim Management

**Required:** `claim_conflicts` table: id, claim_a_id, claim_b_id, conflict_type, detected_at, resolved_at, resolution, resolved_by.

**Current state:** No conflict detection exists.

**Impact:** Two incompatible Continuing Reviews (different periods, overlapping data) would silently overwrite rather than creating a conflict record.

---

## 5. Capability Intelligence Gap

### MAJOR: Capability Temporal States

**Required:** `capability_states` table: capability_id, location_id, status (candidate/observed/verified/active/constrained/unavailable/expired/superseded), availability, quantity/value/unit, conditions_json, valid_from/until, confidence_state.

**Current state:** Single `capabilities` table with mutable status. No temporal state tracking.

**Impact:** Cannot express "this capability was active from Jan to Jun 2026, then became constrained."

### MAJOR: Capability→Claim Composition

**Required:** `capability_claim_links` with role: `composes`, `supports`, `qualifies`.

**Current state:** `capabilities.primary_claim_id` FK — single-claim linkage only.

**Impact:** A capability is typically composed of multiple claims (staff, equipment, licenses, experience). Single-claim linkage is insufficient.

---

## 6. Protocol & Assessment Gap (ENTIRELY NEW)

### CRITICAL: Protocol/Requirement Model

**Required:** `protocols`, `protocol_versions`, `requirements`, `requirement_rules` tables.

**Current state:** No protocol modeling exists.

**File evidence:** No tables, no types, no API routes, no services.

### CRITICAL: Assessment Engine

**Required:** `assessments`, `assessment_results`, `gaps`, `mitigations` tables + `AssessmentService`.

**Current state:** `readiness-engine` package evaluates claims but produces a generic readiness score, not a protocol-contextual assessment.

### CRITICAL: Requirement→Capability Matching

**Required:** Rule-based matching service that compares requirements against current capabilities.

**Current state:** The `matching-engine` package exists but is oriented toward feasibility/sponsor matching, not protocol requirement matching.

---

## 7. Publication & Sharing Gap

### MAJOR: KnowledgeSnapshot

**Required:** `knowledge_snapshots` table: id, assessment_id, claim_version_ids[], evidence_ids[], capability_state_ids[], created_at, hash.

**Current state:** No snapshot mechanism. Passport entries and packages are live views of current data.

**Impact:** Published packages can change retroactively if source data changes. Violates reproducibility requirement.

### MINOR: Package Snapshot Links

**Required:** `package_snapshot_links` table linking packages to their snapshot.

**Current state:** `published_knowledge` has no snapshot reference.

---

## 8. Governance & Audit Gap

### MAJOR: Audit Event Table

**Required:** `audit_events` table: id, event_type, entity_type, entity_id, actor_id, action, previous_state, new_state, metadata, created_at.

**Current state:** Ad-hoc audit logging in `apps/api/src/lib/audit.ts` and `provenance-recorder.ts`. The v2 requires a formal, queryable audit table for GDPR and compliance.

### MINOR: Policy Engine

**Required:** Policy resolution for sharing, publication, and retention.

**Current state:** `packages/policy-engine/` exists but is in draft state. Not connected to ShareGrant or Passport workflows.

---

## 9. Gap Severity Summary

| Gap | Severity | Bounded Context | Effort (days) |
|-----|----------|----------------|---------------|
| EvidenceSource model | CRITICAL | Sources | 2 |
| SourceRecord model | CRITICAL | Sources | 2 |
| ClaimVersion table | CRITICAL | Claims | 3 |
| EvidenceLink types | CRITICAL | Evidence | 2 |
| Protocol model | CRITICAL | Protocol | 5 |
| Assessment engine | CRITICAL | Assessment | 8 |
| Requirement→Capability matching | CRITICAL | Assessment | 5 |
| ClaimConflict table | MAJOR | Claims | 2 |
| CapabilityState table | MAJOR | Capability | 3 |
| CapabilityClaimLink | MAJOR | Capability | 1 |
| Observations table | MAJOR | Evidence | 2 |
| ProvenanceRecord schema | MAJOR | Evidence | 2 |
| AuditEvent table | MAJOR | Governance | 2 |
| KnowledgeSnapshot table | MAJOR | Publication | 3 |
| EpistemicType column | MAJOR | Evidence | 1 |
| Acquisition/Extraction tracking | MAJOR | Sources | 3 |
| Package snapshot links | MINOR | Publication | 1 |
| Policy engine integration | MINOR | Governance | 5 |

**Total estimated effort:** ~50 days (core gaps excluding protocol)

---

## 10. What Does NOT Need Changes

These existing components are aligned with v2 and need no structural modification:

- Institution/Person/Location/Membership/Role entities (Identity Registry) ✅
- RLS policies on all tables ✅
- Review workflow (review_tasks table) ✅
- Passport entries + shares structure ✅
- ShareGrant with access levels ✅
- Confidence computation framework (needs extension, not rewrite) ✅
- Published knowledge concept (needs rename, not restructure) ✅

This confirms the KAD-001→012 work was well-directed. ~70% of the investment is preserved.
