# KADARN v2 — Domain Simplification Review

**Date:** 2026-07-25
**Role:** Principal Domain Architect + Red Team Reviewer
**Mission:** Challenge every entity, table, context, and service. Assume complexity until proven necessary.

---

## Guiding Question

Every component must pass this test:

> "Does this directly help answer whether an institution can execute a protocol, why we believe it, and what current evidence supports that conclusion?"

If it helps indirectly (logging, metadata, optimization), it must justify its existence with concrete value. If it only helps "someday," it is deferred.

---

## Review 1: Entities

### Cross-Cutting Finding

Many proposed v2 entities are **aspects of other entities**, not independent domain concepts.

#### ClaimVersion → ATTRIBUTE of Claim

**Challenge:** A claim version is not an independent entity. It has no identity separate from the claim. It has no lifecycle of its own. It is a temporal attribute of a claim.

**Simplification:** Add `valid_from`, `valid_until`, `version`, `epistemic_type`, `superseded_by` directly to the `claims` table. Postgres partial unique indexes on `(id, version)` and query `WHERE valid_until IS NULL` for the current version.

**Loss:** None. Full version history preserved. Queries slightly more complex (COALESCE instead of JOIN), but one table instead of two.

#### CapabilityState → ATTRIBUTE of Capability

**Challenge:** A capability's state is temporal — but at any moment, a capability has exactly ONE state. The v2 proposes a separate table with valid_from/valid_until.

**Simplification:** Add `valid_from`, `valid_until`, `availability`, `conditions`, `quantity` directly to `capabilities`. Use the same versioning pattern as claims.

**Loss:** None. Same temporal tracking, fewer tables.

#### Observation → TRANSIENT VALUE (not an entity)

**Challenge:** Observations are pre-normalization extracted values. They exist only between extraction and evidence creation. They have no lifecycle, no independent identity, and no queries beyond "what was extracted from this source record?"

**Simplification:** Store as JSONB column on `extraction_runs` (`observations: [{field, raw_value, confidence, span}]`) or as JSONB on `evidence_nodes` (`extracted_from: {run_id, field, raw_value, confidence}`).

**Loss:** Cannot query observations independently. But — should we ever need to? Observations are useful only in two contexts: (1) showing what was extracted before normalization, (2) re-extracting with a different parser. Both are scoped to an extraction_run.

#### Gap → COMPUTED VALUE (not an entity)

**Challenge:** Gaps are the difference between requirements and current capabilities. They are computed by AssessmentService, not created by users. They have no independent lifecycle.

**Simplification:** Compute gaps dynamically from assessment_results + current capabilities. Do not persist as a separate table.

**Loss:** Cannot query historical gaps. But assessment_results already contain the comparison data — gaps are a view, not a table.

#### Mitigation → ATTRIBUTE of Assessment

**Challenge:** Mitigations are proposed actions to close gaps. They are always scoped to an assessment. They have no identity independent of assessment.

**Simplification:** Store as JSONB array on `assessments` (`mitigations: [{gap, action, responsible, deadline, effect}]`).

**Loss:** None. Mitigations are always queried in the context of their assessment.

#### Identity Candidate → TRANSIENT VALUE

**Challenge:** Identity candidates are temporary resolution artifacts. They exist during the PI resolution workflow and are either confirmed (linked to Person) or discarded.

**Simplification:** Store in application memory or a temporary processing table, not a persistent entity. Only confirmed aliases go into a `person_aliases` table (simple: person_id, alias, source, confidence).

**Loss:** Cannot audit discarded candidates. But — an audit_event captures when resolution happened and what was decided, without persisting every rejected candidate forever.

### Entities that SURVIVE the review

These entities pass the independence test:

- **Institution** — aggregate root, own lifecycle KEEP
- **Person** — own identity, lifecycle KEEP
- **Location** — belongs to institution, own identity KEEP
- **Membership** — temporal relationship, own lifecycle KEEP
- **Role** — governed catalog, own identity KEEP
- **EvidenceSource** — needed for Source Authority in Explainable Confidence KEEP
- **SourceRecord** — needed for content-addressed provenance KEEP
- **Evidence** — core entity, own lifecycle KEEP
- **Claim** — core entity, extend with temporal KEEP (extend)
- **Capability** — core entity, extend with temporal KEEP (extend)
- **Protocol** — new aggregate root KEEP
- **Assessment** — execution record, own lifecycle KEEP
- **Passport** — projection, own lifecycle KEEP
- **Package** — selection, own lifecycle KEEP (was published_knowledge)
- **ShareGrant** — authorization, own lifecycle KEEP

### Entities REMOVED or MERGED

| Entity | Disposition | Rationale |
|--------|-------------|-----------|
| ClaimVersion | → Attribute | Temporal fields on claims |
| CapabilityState | → Attribute | Temporal fields on capabilities |
| Observation | → JSONB | Transient, no independent lifecycle |
| Gap | → Computed | Derived from assessment + capabilities |
| Mitigation | → JSONB | Always scoped to assessment |
| IdentityCandidate | → Transient | Temporary processing artifact |
| EvidenceProducer | → Attribute | Name/title on SourceRecord is sufficient |
| AcquisitionRun | → JSONB | Status/log embedded in SourceRecord |
| ProvenanceRecord | → JSONB | Append-only log, not queryable entity |
| EvidenceLink | → JSONB | Relationship array on claim/evidence |

### Net reduction

| Metric | v2 Blueprint | Simplified | Δ |
|--------|-------------|------------|---|
| Domain entities | ~25 | **16** | **-9 (-36%)** |
