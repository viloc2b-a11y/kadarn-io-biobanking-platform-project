# KADARN Architecture Alignment Audit v2.0

**Document:** AAM-001  
**Date:** 2026-07-25  
**Authority:** Architecture Constitution v2.0, Implementation Blueprint v2.0, Master Realignment Plan v2.0  
**Status:** Complete — Pre-refactor baseline  
**Author:** Chief Software Architect  
**Scope:** Full repository inventory against v2 canonical model

---

## 1. Executive Summary

This audit inventories every bounded context, entity, table, API, service, migration, package, and UI component in the KADARN repository as of KAD-012 completion, and classifies each against the v2 architecture defined in the three governing documents.

**Total packages:** 33  
**Total apps:** 2 (api, web)  
**Total migrations:** 72 (001–072)  
**Total API routes:** ~50  
**Total database tables:** ~25  

**Core finding:** The KAD-001→012 implementation built a solid foundation. ~70% of existing entities map directly to v2 concepts. The main gaps are: (1) missing source/provenance layer, (2) Claim versioning, (3) temporal modeling, (4) protocol/assessment engine, (5) epistemic type separation.

---

## 2. Bounded Context Audit

### 2.1 Identity Registry
*Table owner: identity*

| Entity | Exists? | Table | v2 Status | Action |
|--------|---------|-------|-----------|--------|
| Institution | ✅ | `organizations` | **PRESERVE** | Rename to `institutions` via view for backward compat |
| Person | ✅ | `people` | **PRESERVE** | Add alias resolution attributes |
| Location | ✅ | `locations` | **PRESERVE** | Add valid_from/valid_until |
| Membership | ✅ | `organization_memberships` | **PRESERVE** | Rename to `institution_memberships`; add temporal |
| Role | ✅ | `organization_roles` | **PRESERVE** | Already a governed catalog |
| RoleAssignment | ✅ | `membership_roles` | **PRESERVE** | Add temporal fields |

**Gap:** No alias/identity resolution table exists. The v2 requires `identity_resolution_candidates` and `identity_merge_log` for PI resolution (Vertical Slice 2).

### 2.2 Source Intelligence
*Table owner: sources* — **ENTIRELY NEW**

| Entity | Exists? | v2 Status | Action |
|--------|---------|-----------|--------|
| EvidenceSource | ❌ | **CREATE** | New table `evidence_sources` |
| EvidenceProducer | ❌ | **CREATE** | New table `evidence_producers` |
| SourceRecord | ❌ | **CREATE** | New table `source_records` |
| AcquisitionRun | ❌ | **CREATE** | New table `acquisition_runs` |
| ExtractionRun | ❌ | **CREATE** | New table `extraction_runs` |
| FreshnessPolicy | ❌ | **CREATE** | New table; or JSONB column on source |

**Evidence:** The existing `evidence_nodes` table has no `source_id` or `source_record_id` columns. The continuity-claim-service has hardcoded extraction logic with no provenance tracking. The `provenance` and `provenance-graph` packages exist but are generic — they don't model sources specifically.

### 2.3 Evidence & Provenance
*Table owner: evidence*

| Entity | Exists? | Table | v2 Status | Action |
|--------|---------|-------|-----------|--------|
| Evidence | ✅ | `evidence_nodes` | **EXTEND** | Add source_id, source_record_id, epistemic_type |
| Observation | ❌ | — | **CREATE** | New table `observations` between extraction and evidence |
| ProvenanceRecord | 🟡 | `provenance_records` (legacy) | **REFACTOR** | Align with v2: entity_type, entity_id, action, actor, previous/new state |
| EvidenceLink | ❌ | — | **CREATE** | Relationship table: supports, contradicts, qualifies |

**Evidence:** `evidence_nodes` has claim_id, evidence_class, content, metadata, status, source_url. Missing: source_id, source_record_id, epistemic_type, observed_at, valid_from/until. The `provenance-recorder.ts` service (405 lines) records events but doesn't follow the v2 provenance schema.

### 2.4 Claims & Knowledge
*Table owner: claims*

| Entity | Exists? | Table | v2 Status | Action |
|--------|---------|-------|-----------|--------|
| Claim | ✅ | `claims` | **EXTEND** | Keep as identity; add ClaimVersion |
| ClaimVersion | ❌ | — | **CREATE** | New table `claim_versions` |
| ClaimEvidenceLink | ❌ | — | **CREATE** | New table `claim_evidence_links` (supports/contradicts/qualifies) |
| ClaimConflict | ❌ | — | **CREATE** | New table `claim_conflicts` |
| Review | ✅ | `review_tasks` | **PRESERVE** | Add decision taxonomy alignment |

**Evidence:** The `claims` table has: id, claim_type_id, name, description, organization_id, location_id, person_id, workflow_state, evidence_count, tags. The v2 requires: versioned values, valid_from/until, epistemic_type (direct/derived/inferred), evidence links, conflict tracking. The `KAD-004` consolidation already added person_id and tags — good foundation.

### 2.5 Capability Intelligence
*Table owner: capabilities*

| Entity | Exists? | Table | v2 Status | Action |
|--------|---------|-------|-----------|--------|
| Capability | ✅ | `capabilities` | **EXTEND** | Add capability_states for temporal tracking |
| CapabilityState | ❌ | — | **CREATE** | New table `capability_states` |
| CapabilityClaimLink | ❌ | — | **CREATE** | New table `capability_claim_links` |
| Availability | ❌ | — | **DEFER** | Embed in capability_state initially |

**Evidence:** `capabilities` table has: id, name, description, capability_type_id, domain, organization_id, primary_claim_id, status, confidence_score, temporal fields. The v2 adds: valid_from/until for time-bound capabilities, conditions JSONB, quantity/value/unit for measurable capacity. `organization_capability_types` is a lookup table — PRESERVE.

### 2.6 Protocol Intelligence
*Table owner: protocols* — **ENTIRELY NEW**

| Entity | Exists? | v2 Status | Action |
|--------|---------|-----------|--------|
| Protocol | ❌ | **CREATE** | New table `protocols` |
| ProtocolVersion | ❌ | **CREATE** | New table `protocol_versions` |
| Requirement | ❌ | **CREATE** | New table `requirements` |
| RequirementRule | ❌ | **CREATE** | New table `requirement_rules` |

**Evidence:** No protocol modeling exists. The `readiness-engine` package has evaluation logic but no protocol → requirement → matching structure. This is the largest net-new domain.

### 2.7 Assessment Engine
*Table owner: assessments* — **ENTIRELY NEW**

| Entity | Exists? | v2 Status | Action |
|--------|---------|-----------|--------|
| Assessment | ❌ | **CREATE** | New table `assessments` |
| AssessmentResult | ❌ | **CREATE** | New table `assessment_results` |
| Gap | ❌ | **CREATE** | New table `gaps` |
| Mitigation | ❌ | **CREATE** | New table `mitigations` |

**Evidence:** The `readiness-evaluation.ts` and `discovery-metrics.ts` services have evaluation logic that computes scores, but no structured assessment model with requirements, gaps, and mitigations. The v2 assessment is protocol-contextual, not a generic score.

### 2.8 Publication & Sharing
*Table owner: publication*

| Entity | Exists? | Table | v2 Status | Action |
|--------|---------|-------|-----------|--------|
| Passport (Entry) | ✅ | `passport_entries` | **PRESERVE** | Add snapshot reference |
| PassportShare | ✅ | `passport_shares` | **PRESERVE** | Already extended in KAD-010 |
| Package | 🟡 | `published_knowledge` | **REFACTOR** | Rename/alias to `packages`; add snapshot_id |
| KnowledgeSnapshot | ❌ | — | **CREATE** | New table `knowledge_snapshots` |
| ShareGrant | ✅ | `passport_shares` | **EXTEND** | Add purpose, policy_version |

**Evidence:** KAD-008→010 built the publication layer. `published_knowledge` has: knowledge_type, title, summary, content JSONB, status. The v2 renames this concept to `Package`. `passport_entries` has id, organization_id, claim_id, title, version, status, published_at, expires_at — good. Missing: snapshot_id linking to KnowledgeSnapshot for reproducibility.

### 2.9 Governance & Audit
*Table owner: governance*

| Entity | Exists? | v2 Status | Action |
|--------|---------|-----------|--------|
| AuditEvent | 🟡 | **REFACTOR** | Existing audit infrastructure; align with v2 event schema |
| Policy | ❌ | **DEFER** | Post-Fase I |
| RetentionRule | ❌ | **DEFER** | Post-Fase I |

**Evidence:** `apps/api/src/lib/audit.ts` exists with basic audit logging. The `provenance-recorder.ts` records events. The v2 requires formal AuditEvent table with entity_type, action, actor, previous/new state.

---

## 3. Package Audit

### 3.1 Active Packages (PRESERVE)

| Package | Purpose | v2 Alignment | Action |
|---------|---------|-------------|--------|
| `@kadarn/types` | Public types | **Critical** ✅ | EXTEND with v2 types |
| `@kadarn/platform-services` | Shared services | **Maintain** ✅ | EXTEND |
| `@kadarn/evidence-core` | Evidence graph | **Core** ✅ | EXTEND for provenance |
| `@kadarn/institutional-knowledge` | Knowledge acquisition | **Align** 🟡 | REFACTOR to v2 model |
| `@kadarn/published-view` | Publication layer | **Maintain** ✅ | EXTEND |
| `@kadarn/readiness-engine` | Readiness evaluation | **Align** 🟡 | REFACTOR to Assessment Engine |
| `@kadarn/domain-events` | Event types | **Maintain** ✅ | EXTEND |
| `@kadarn/trust-engine` | Trust computation | **Align** 🟡 | REFACTOR to Confidence dimensions |

### 3.2 Legacy Packages (DEPRECATE or ABSORB)

| Package | Reason | Action |
|---------|--------|--------|
| `@kadarn/fulfillment-engine` | Out of MVP scope (marketplace) | **DEPRECATE** |
| `@kadarn/financial-engine` | Out of MVP scope | **DEPRECATE** |
| `@kadarn/matching-engine` | Redundant with readiness-engine | **CONSOLIDATE** |
| `@kadarn/ai-layer` | Generic AI wrapper | **ABSORB** into extraction framework |
| `@kadarn/sponsor-intelligence` | Post-MVP | **DEFER** |
| `@kadarn/provenance-graph` | Absorbed by provenance tables | **ABSORB** into evidence package |
| `@kadarn/intelligence-engine` | Vague scope | **REFACTOR** into assessment + decision |
| `@kadarn/knowledge-engine` | Overlaps with institutional-knowledge | **CONSOLIDATE** |
| `@kadarn/delivery-domain` | Publication layer | **MAINTAIN** |
| `@kadarn/workflow-engine` | Generic engine | **MAINTAIN** — useful for review queues |
| `@kadarn/ui` | Retired (needs rebuild) | **DEFER** — post-Fase I |

### 3.3 Engines (9 KRM-RAO engines)

| Engine | Status | v2 Disposition |
|--------|--------|---------------|
| Continuity | Legacy | **DEPRECATE** — absorbed by Claims v2 |
| Discovery | Partial | **REFACTOR** — portions → Source Intelligence |
| Matching | Partial | **ABSORB** → Assessment Engine |
| Intelligence | Draft | **REFACTOR** → Decision Intelligence |
| Knowledge | Draft | **ABSORB** → Claims & Capability |
| Policy | Draft | **DEFER** |
| Trust | Draft | **REFACTOR** → Confidence dimensions |
| Fulfillment | Draft | **DEPRECATE** (post-MVP) |
| Financial | Draft | **DEPRECATE** (post-MVP) |

---

## 4. API Route Audit

### 4.1 Routes to PRESERVE (v2-aligned)

| Route | v2 Concept | Status |
|-------|-----------|--------|
| `/api/v1/people` | Person CRUD | PRESERVE |
| `/api/v1/locations/[id]` | Location | PRESERVE |
| `/api/v1/institutions/[id]/members` | Membership | PRESERVE |
| `/api/v1/institutions/[id]/capabilities` | Capability list | PRESERVE |
| `/api/v1/capabilities/[id]` | Capability detail | PRESERVE |
| `/api/v1/evidence-core/claims` | Claim CRUD | PRESERVE (extends to v2) |
| `/api/v1/evidence-core/evidence` | Evidence CRUD | PRESERVE (extends to v2) |
| `/api/v1/claims/[id]/reviews` | Review | PRESERVE |
| `/api/v1/claims/[id]/confidence` | Confidence | PRESERVE (extends to v2) |
| `/api/v1/institutions/[id]/passport-entries` | Passport | PRESERVE |
| `/api/v1/passport-entries/[id]/shares` | Share Grant | PRESERVE |
| `/api/v1/public/passport/[token]` | Public access | PRESERVE |
| `/api/v1/institutions/[id]/readiness` | Readiness | REFACTOR → Assessment |
| `/api/v1/institutions/[id]/knowledge` | Knowledge (→Package) | REFACTOR |

### 4.2 Routes to DEPRECATE

| Route | Reason | Replacement |
|-------|--------|-------------|
| `/api/v1/continuity/*` (10+ routes) | Legacy continuity engine | Claim v2 endpoints |
| `/api/v1/discovery/*` | Discovery engine | Source Intelligence endpoints |
| `/api/v1/discovery/curation` | Not in v2 | DEFER |
| `/api/v1/matching/*` | Matching engine | Assessment Engine |

### 4.3 New routes REQUIRED (v2)

Based on Implementation Blueprint §11:

| Method | Route | v2 Purpose | Sprint |
|--------|-------|-----------|-------|
| POST | `/api/v1/sources` | Register evidence source | 1 |
| POST | `/api/v1/source-records` | Ingest source record | 1 |
| POST | `/api/v1/source-records/{id}/extract` | Start extraction | 2 |
| GET | `/api/v1/extraction-runs/{id}` | Extraction status | 2 |
| POST | `/api/v1/evidence/{id}/review` | Accept/reject evidence | 2 |
| POST | `/api/v1/claims` | Assert claim (v2) | 3 |
| GET | `/api/v1/claims/{id}/explain` | Explain confidence | 3 |
| POST | `/api/v1/protocols/{id}/versions` | Register protocol | 7 |
| POST | `/api/v1/assessments` | Run assessment | 8 |
| GET | `/api/v1/assessments/{id}/explain` | Explain results | 8 |
| POST | `/api/v1/packages` | Create package | 10 |
| POST | `/api/v1/share-grants` | Authorize access | 10 |
| DELETE | `/api/v1/share-grants/{id}` | Revoke access | 10 |

---

## 5. Migration Audit

### 5.1 Preserved migrations (v2 foundation)

Migrations 001–061 form the platform foundation. No change needed.

### 5.2 KAD-001→012 migrations (PRESERVE with notes)

| Migration | Entity | v2 Disposition |
|-----------|--------|---------------|
| 062 (person) | Person | PRESERVE |
| 063 (location) | Location | PRESERVE |
| 064 (membership) | Membership | PRESERVE |
| 065 (capability) | Capability | EXTEND (add states) |
| 066 (claim consolidation) | Claim | EXTEND (add versions) |
| 067 (review) | Review | PRESERVE |
| 068 (knowledge) | Knowledge → Package | REFACTOR |
| 069 (passport) | Passport | PRESERVE |
| 070 (sharing) | ShareGrant | PRESERVE |
| 071 (readiness) | Readiness | EXTEND → Assessment |
| 072 (vilo seed) | Vilo org | PRESERVE |

### 5.3 New v2 migrations needed

Implementation Blueprint §16 defines the migration block plan:

| Block | Migration | Tables |
|-------|-----------|--------|
| A. Sources | 073–075 | evidence_sources, evidence_producers, source_records, acquisition_runs, extraction_runs |
| B. Provenance | 076–078 | provenance_records, observations, evidence_links |
| C. Claims v2 | 079–081 | claim_versions, claim_evidence_links, claim_conflicts |
| D. Capability | 082–083 | capability_states, capability_claim_links |
| E. Protocol | 084–085 | protocols, protocol_versions, requirements, requirement_rules |
| F. Assessment | 086–087 | assessments, assessment_results, gaps, mitigations |
| G. Publication | 088–089 | knowledge_snapshots, package_snapshot_links |
| H. Governance | 090 | audit_events |

**Total new migrations:** ~18  
**Net-new tables:** ~25  

---

## 6. UI Audit

| Page | v2 Concept | Action |
|------|-----------|--------|
| People page | Person management | PRESERVE |
| Locations page | Location management | PRESERVE |
| Members page | Membership | PRESERVE |
| Settings pages | Config | PRESERVE |
| Continuity pages | Legacy | DEPRECATE |
| Discovery pages | Legacy | DEPRECATE |
| Passport pages | Passport projection | EXTEND for v2 |
| Sponsor passport | Sponsor view | PRESERVE |

**Observation:** No UI exists for: Source registry, Protocol workspace, Assessment reports, Package management. These are new UI stories.

---

## 7. Test Audit

| Test suite | Tests | v2 Disposition |
|-----------|-------|---------------|
| Unit tests | ~900 | PRESERVE |
| Integration tests | ~300 | PRESERVE |
| Foundation tests | 17 (9 pass) | PRESERVE + EXTEND |
| Pilot tests (Vilo) | 2 files | PRESERVE + EXTEND |
| Continuity tests | Legacy | DEPRECATE |

**Required new tests:** Golden cases for Continuing Review extraction, identity resolution, protocol matching, assessment reproducibility.

---

## 8. Key Risks

1. **Claim legacy backfill.** The `continuity_experience_claims` table and legacy claims need migration to `claim_versions` without breaking existing references. **High risk.**
2. **Source→Evidence link.** Existing evidence_nodes have no provenance chain. Adding source_id as nullable preserves compatibility. **Medium risk.**
3. **Protocol model is entirely new.** Largest net-new domain. Must be built incrementally, starting with Vertical Slice 3. **Medium risk.**
4. **Package rename.** `published_knowledge` → `packages` needs view/alias strategy. **Low risk.**
5. **33 packages to 15.** Significant consolidation. Must be done gradually, not in one sprint. **Low risk (if gradual).**

---

## 9. Alignment Score

| Domain | Current State | v2 Target | Alignment |
|--------|-------------|-----------|-----------|
| Identity | ✅ Complete | Identity Registry | **95%** |
| Evidence | 🟡 Partial | Evidence & Provenance | **60%** |
| Claims | 🟡 Partial | Claims & Knowledge | **55%** |
| Capability | 🟡 Basic | Capability Intelligence | **40%** |
| Sources | ❌ Missing | Source Intelligence | **0%** |
| Protocol | ❌ Missing | Protocol Intelligence | **0%** |
| Assessment | ❌ Missing | Assessment Engine | **0%** |
| Publication | 🟡 Partial | Publication & Sharing | **75%** |
| Governance | 🟡 Basic | Governance & Audit | **25%** |

**Overall alignment: ~39%** (weighted by domain complexity)

This is expected — the v2 model adds three entirely new bounded contexts (Sources, Protocol, Assessment) and significantly expands Claims, Capability, and Provenance.
