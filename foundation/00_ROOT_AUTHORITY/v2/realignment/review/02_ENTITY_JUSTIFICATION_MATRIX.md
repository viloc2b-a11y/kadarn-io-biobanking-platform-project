# KADARN v2 — Entity Justification Matrix

**Date:** 2026-07-25
**Challenge standard:** Each entity must have independent identity, lifecycle, and purpose. If it fails any of these, it must be merged, derived, or removed.

---

| # | Entity | Version | Independent Identity? | Own Lifecycle? | Can exist alone? | Could be VO/Attribute/Relation? | Recommend | Rationale |
|---|--------|---------|---------------------|--------------|-----------------|-------------------------------|-----------|-----------|
| 1 | Institution | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Aggregate root. Existing. |
| 2 | Person | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Identity exists independent of institutions. Existing. |
| 3 | Location | v1 ✅ | Yes | Yes | No (belongs to institution) | No | **KEEP** | Location lifecycle (commission, decommission) independent. Existing. |
| 4 | Membership | v1 ✅ | Yes | Yes | No | No | **KEEP** | Temporal relationship with lifecycle (invite→active→terminated). Existing. |
| 5 | Role | v1 ✅ | Yes | Limited | No | Could be enum | **KEEP** | Governed catalog with permissions. Enum insufficient for CRUD. Existing. |
| 6 | EvidenceSource | v2 new | Yes | Yes | Yes | No | **KEEP** | Needed for Source Authority in Explainable Confidence. Has own type, policy, authority level. |
| 7 | SourceRecord | v2 new | Yes | Yes | Yes | No | **KEEP** | Content-addressed, immutable acquisition. Different lifecycle from source. |
| 8 | AcquisitionRun | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Transient execution metadata. Embed in SourceRecord as JSONB. |
| 9 | ExtractionRun | v2 new | Limited | Yes | No | Yes | **MERGE** → Attribute | Execution of a parser. Results (observations) are what matters. Embed as JSONB in SourceRecord. |
| 10 | Observation | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Transient pre-normalization value. Store in extraction_run JSONB. |
| 11 | Evidence | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Core entity. Normalized, with source+claim links. Extend with epistemic_type. |
| 12 | ProvenanceRecord | v2 new | Limited | Yes | No | Yes | **MERGE** → Attribute | Append-only record. Could be an event in audit_events table, not a separate entity. |
| 13 | EvidenceLink | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Relationship (supports/contradicts). Store as JSONB on claim or evidence. |
| 14 | Claim | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Extend with valid_from/valid_until/version/epistemic_type directly on table. |
| 15 | ClaimVersion | v2 new | No | No | No | Yes (Attribute) | **REMOVE** | Temporal aspect of Claim. Versioning via columns on claims table. |
| 16 | ClaimConflict | v2 new | Limited | Yes | No | Yes | **DEFER** | Conflict can be detected dynamically from claim_evidence_links. Dedicated table only if conflict resolution workflow is needed. |
| 17 | Capability | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Extend with valid_from/until/conditions/availability directly on table. |
| 18 | CapabilityState | v2 new | No | No | No | Yes (Attribute) | **REMOVE** | Temporal aspect of Capability. Versioning via columns on capabilities. |
| 19 | CapabilityClaimLink | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Composition relationship. Embed as claim_ids[] on capability. |
| 20 | Protocol | v2 new | Yes | Yes | Yes | No | **KEEP** | New aggregate root for assessment. |
| 21 | ProtocolVersion | v2 new | Yes | Yes | No | No | **KEEP** | Versioned snapshots of protocol content. |
| 22 | Requirement | v2 new | Limited | Yes | No | Yes | **SIMPLIFY** | For MVP, store as JSONB array on protocol_versions. Full table when rule engine needed. |
| 23 | RequirementRule | v2 new | Yes | Yes | Yes | Could be view | **DEFER** | Rule versioning can start as code, not data. Defer to Phase 2. |
| 24 | Assessment | v2 new | Yes | Yes | Yes | No | **KEEP** | Execution record of a matching run. |
| 25 | AssessmentResult | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Per-requirement result. Embed as JSONB on assessments. |
| 26 | Gap | v2 new | No | No | No | Yes (Computed) | **REMOVE** | Derived from assessment + capabilities. Compute dynamically. |
| 27 | Mitigation | v2 new | No | No | No | Yes (JSONB) | **REMOVE** | Always scoped to assessment. Embed as JSONB. |
| 28 | KnowledgeSnapshot | v2 new | Yes | Yes | Yes | No | **KEEP** | Immutable publication record. Needed for reproducibility. |
| 29 | Passport | v1 ✅ | Yes | Yes | Yes | No | **KEEP** | Projection. Own lifecycle (draft→published→archived). Existing. |
| 30 | Package | v1 🟡 | Yes | Yes | Yes | No | **KEEP** | Selection of knowledge. Was `published_knowledge`. |
| 31 | ShareGrant | v1 ✅ | Yes | Yes | No | No | **KEEP** | Authorization with lifecycle (active→revoked/expired). Existing. |
| 32 | AuditEvent | v2 new | Yes | Yes | Yes | No | **KEEP** | Immutable compliance record. One table, append-only. |
| 33 | IdentityCandidate | v2 new | No | No | No | Yes (Transient) | **REMOVE** | Processing artifact. Only confirmed aliases persist in person_aliases. |

## Summary

| Disposition | Count | Entities |
|-------------|-------|----------|
| **KEEP** | 16 | Institution, Person, Location, Membership, Role, EvidenceSource, SourceRecord, Evidence, Claim, Capability, Protocol, ProtocolVersion, Assessment, KnowledgeSnapshot, Passport, Package, ShareGrant, AuditEvent |
| **MERGE** (→Attribute) | 3 | ExtractionRun, ProvenanceRecord, CapabilityClaimLink |
| **REMOVE** (→JSONB) | 8 | AcquisitionRun, Observation, EvidenceLink, AssessmentResult, Mitigation, IdentityCandidate |
| **SIMPLIFY** (→JSONB for MVP) | 1 | Requirement |
| **DEFER** | 2 | ClaimConflict, RequirementRule |

**Net reduction: 33 → 19 (42% fewer entities)**
