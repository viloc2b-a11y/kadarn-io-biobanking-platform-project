# Impact Matrix — KAD-001 → KAD-012

**Document:** IMP-001  
**Date:** 2026-07-25  
**Authority:** Architecture Constitution v2.0  

---

## Classification Legend

| Code | Meaning | Action |
|------|---------|--------|
| **PRESERVE** | Fully aligned with v2 | No changes needed |
| **EXTEND** | Concept is correct, needs additional fields/tables | Add columns or related tables |
| **REFACTOR** | Exists but needs structural change | Modify schema, code, or types |
| **DEPRECATE** | Replaced or out of scope | Mark as legacy, no new features |
| **DEFER** | Valid concept but not needed in current phase | Defer to later phase |

---

## KAD-001.5 — Canonical Entity Specifications

**Classification:** PRESERVE

**Evidence:** `foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md` (227 lines)

**v2 Alignment:** The entity specifications defined Person, Location, Institution, Membership, Role, Credential, Capability, Claim, Evidence, Passport. All are explicitly preserved in the v2 Identity Registry and Evidence contexts.

**Dependencies:** None. Stable foundation.

**Risk:** None.

**Cost:** $0 (no changes needed)

---

## KAD-002A — Person Model

**Classification:** EXTEND

**Evidence:**
- Migration 062: `people` table with 14 columns
- `packages/types/src/person.ts` — PersonSchema
- API: GET/POST/PATCH/DELETE `/api/v1/people`

**v2 Alignment:** Identity Registry requires Person + alias resolution. The current model is 95% aligned.

**Required extensions:**
1. Add `aliases` JSONB column for alternate names/IDs
2. Add `identity_resolved_at` timestamp
3. Add `identity_confidence` numeric column

**Dependencies:** None.

**Risk:** Low. All changes are backward-compatible nullable columns.

**Cost:** 0.5 day (migration + types)

---

## KAD-002B — Location Model

**Classification:** EXTEND

**Evidence:**
- Migration 063: `locations` table
- `packages/types/src/location.ts`
- API: CRUD under `/api/v1/institutions/[id]/locations`

**v2 Alignment:** Location is preserved in Identity Registry.

**Required extensions:**
1. Add `valid_from`/`valid_until` temporal columns
2. Add `conditions` JSONB for operational constraints

**Dependencies:** None.

**Risk:** Low.

**Cost:** 0.5 day

---

## KAD-002C — Membership & Role

**Classification:** PRESERVE

**Evidence:**
- Migration 064: `organization_memberships` + `membership_roles` + `organization_roles`
- `packages/types/src/membership.ts`
- API: 4 routes for member/role management

**v2 Alignment:** Identity Registry requires Membership + Role exactly as implemented. Temporal fields already exist (started_at, ended_at, deactivated_at). The governed role catalog is part of v2.

**Required extensions:** None.

**Dependencies:** Person → Membership (existing FK).

**Risk:** None.

**Cost:** $0

---

## KAD-002D — Repositories

**Classification:** PRESERVE

**Evidence:**
- `packages/platform-services/src/repositories/person-repository.ts`
- `packages/platform-services/src/repositories/location-repository.ts`
- `packages/platform-services/src/repositories/membership-repository.ts`

**v2 Alignment:** Repository pattern is a valid application-layer abstraction. The v2 Implementation Blueprint §9 defines domain services that should be layered on top of repositories, not replace them.

**Required extensions:** New repositories needed for v2 entities (sources, claims v2, capabilities v2, protocols, assessments).

**Dependencies:** None.

**Risk:** None.

**Cost:** $0 (existing); ~2 days per new repository

---

## KAD-002E — API Refactoring

**Classification:** PRESERVE

**Evidence:** 8 API routes refactored to use repository layer

**v2 Alignment:** Clean API layer with error handling is platform standard. The v2 Blueprint §10 defines commands/queries pattern — the existing route handlers can be adapted to this pattern without rewrite.

**Required extensions:** New v2 routes per Blueprint §11.

**Dependencies:** Repository layer.

**Risk:** None.

**Cost:** $0 (existing); incremental for new routes

---

## KAD-002F — Minimal Core UI

**Classification:** PRESERVE (with caveat)

**Evidence:** People + Locations management pages in `apps/web`

**v2 Alignment:** Constitution §5 (Principle 9) states "Capability before Presentation — the UI must not become a source of truth." The existing UI pages are read/write but source data comes from canonical tables — this is acceptable.

**Caveat:** UI must not bypass RLS or write directly to domain tables. Current implementation goes through API routes, which is correct.

**Risk:** Low.

**Cost:** $0

---

## KAD-002G — Integration Tests

**Classification:** EXTEND

**Evidence:** `tests/foundation/domain-integration.test.ts` — 17 tests

**v2 Alignment:** The foundation integration tests cover Person, Location, Membership CRUD and RLS. These remain valid and should be extended with v2 entity tests.

**Required extensions:**
1. Add tests for Source Record → Evidence pipeline
2. Add tests for Claim Version lifecycle
3. Add golden case tests for Continuing Review extraction

**Dependencies:** New v2 entities.

**Risk:** Low.

**Cost:** 1 day per new golden case suite

---

## KAD-003 — Capability Model

**Classification:** EXTEND

**Evidence:**
- Migration 065: `capabilities` table
- `packages/types/src/capability.ts` — InstitutionCapabilitySchema
- API: 4 routes

**v2 Alignment:** The capability table exists but is single-state (one status per capability). The v2 requires capability_states for temporal tracking, capability_claim_links for composition.

**Required extensions:**
1. Create `capability_states` table (v2 CapabilityState entity)
2. Create `capability_claim_links` table
3. Add valid_from/valid_until to capability lifecycle

**Dependencies:** Claim→Capability link.

**Risk:** Medium. Existing capabilities table must remain with backward-compatible columns while new tables are added.

**Cost:** 3 days

---

## KAD-004 — Claim Consolidation

**Classification:** REFACTOR

**Evidence:**
- Migration 066: KAD-004 claim consolidation
- `packages/types/src/claim.ts` — ClaimSchema
- `apps/api/src/lib/continuity-claim-service.ts` — deprecation banner

**v2 Alignment:** KAD-004 consolidated continuity_experience_claims into the canonical claims table. This was the right direction, but the v2 requires a fundamentally different claim model with versioning, epistemic types, and relationship typing.

**Required refactoring:**
1. Create `claim_versions` table (existing `claims` becomes claim identity)
2. Add `epistemic_type` column: direct, derived, inferred, human, automated
3. Add valid_from/valid_until to claims
4. Create `claim_evidence_links` with supports/contradicts/qualifies roles
5. Create `claim_conflicts` table
6. Backfill existing claims into initial ClaimVersion

**Dependencies:** Evidence table must be extended first (source_id, epistemic_type).

**Risk:** HIGH. This is the most impactful refactoring. Existing code references `claims.id` in evidence_nodes, passport_entries, review_tasks, capabilities. The migration strategy must:
1. Keep `claims` table as identity (stable IDs)
2. Create `claim_versions` with FK to claims.id
3. Add trigger to auto-create version on insert
4. Update foreign keys that need version references

**Cost:** 5 days

---

## KAD-005 — Evidence & Provenance

**Classification:** EXTEND + REFACTOR

**Evidence:**
- Migration 066 (partial): claim consolidation
- `packages/types/src/evidence.ts` — EvidenceSchema + ProvenanceRecordSchema
- `apps/api/src/lib/provenance-recorder.ts` — 405 lines
- `packages/provenance/` and `packages/provenance-graph/`

**v2 Alignment:** The v2 requires Evidence to be connected to Sources (source_id, source_record_id) and to have epistemic type separation. Observations must be extracted before being normalized into evidence.

**Required extensions:**
1. Add `source_id` and `source_record_id` to evidence_nodes
2. Add `epistemic_type` column to evidence_nodes
3. Create `observations` table (pre-normalization)
4. Refactor provenance_recorder into v2 ProvenanceRecord schema
5. Consolidate provenance packages

**Dependencies:** Source Intelligence (new tables).

**Risk:** Medium. Evidence_nodes has existing test references. Added columns as nullable preserves compatibility.

**Cost:** 4 days

---

## KAD-006 — Review Workflow

**Classification:** PRESERVE

**Evidence:**
- Migration 067: review_tasks extended with evidence_id, decision, reviewer_notes
- `packages/types/src/review.ts` — ReviewSchema
- API: 3 routes

**v2 Alignment:** Review is preserved as-is. The decision taxonomy can map to the v2 Review events.

**Required extensions:** Minimal. Add `reviewed_at` index optimization.

**Dependencies:** Claims → Reviews FK.

**Risk:** None.

**Cost:** $0

---

## KAD-007 — Confidence

**Classification:** EXTEND

**Evidence:**
- `packages/types/src/confidence.ts` — ConfidenceScoreSchema
- API: `GET /api/v1/claims/[id]/confidence`
- `packages/evidence-core/src/confidence-state.ts` — ConfidenceState type
- `evidence_class_ref` table with weights

**v2 Alignment:** The v2 Constitution §10 defines 8 Explainable Confidence dimensions: Source Authority, Identity Confidence, Extraction Confidence, Freshness, Completeness, Corroboration, Consistency, Human Verification. The current implementation combines evidence weight + review coverage into a single score.

**Required extensions:**
1. Expand confidence computation to produce 8-dimension breakdown
2. Store full dimension breakdown in confidence_state_snapshots
3. Add dimension explanations with evidence references
4. Create `GET /api/v1/claims/{id}/explain` endpoint (Blueprinte §11)

**Dependencies:** Source Intelligence, Epistemic types.

**Risk:** Medium. The existing confidence_score column can remain; new confidence_state table stores the v2 breakdown.

**Cost:** 3 days

---

## KAD-008 — Knowledge Publication

**Classification:** REFACTOR

**Evidence:**
- Migration 068: `published_knowledge` table
- `packages/types/src/knowledge.ts` — PublishedKnowledgeSchema
- API: 2 routes

**v2 Alignment:** The v2 renames "Published Knowledge" to "Package" and requires: snapshot reference (for reproducibility), purpose field, policy_version, and link to Assessment.

**Required refactoring:**
1. Rename `published_knowledge` → `packages` (or create view)
2. Add `assessment_id` FK to link packages to their generating assessment
3. Add `snapshot_id` FK for reproducible publication
4. Add `purpose` text field
5. Add `policy_version` for sharing governance

**Dependencies:** Assessment Engine, KnowledgeSnapshot.

**Risk:** Low. Can be done via ADD COLUMN + backward-compatible view.

**Cost:** 2 days

---

## KAD-009 — Passport

**Classification:** PRESERVE

**Evidence:**
- Migration 069: passport_entries + passport_shares extended
- `packages/types/src/passport.ts` — PassportEntrySchema + PassportShareSchema
- API: 4 routes

**v2 Alignment:** Passport as projection is exactly what v2 requires. Constitution §12 states "Passport is a readable, versioned projection. Package is a selection of knowledge for a concrete purpose."

**Required extensions:**
1. Add `snapshot_id` FK to passport_entries
2. Add `assessment_id` FK for contextual linking

**Dependencies:** KnowledgeSnapshot table.

**Risk:** None (nullable columns).

**Cost:** 0.5 day

---

## KAD-010 — Sharing & Access Grants

**Classification:** PRESERVE

**Evidence:**
- Migration 070: passport_shares extended with access_level, granted_by, revoked_at, access_token, permissions
- `packages/types/src/passport.ts` — AccessLevel + GrantPassportAccessSchema
- API: 3 routes

**v2 Alignment:** ShareGrant with access levels, tokens, and revocation matches v2 §12. The v2 adds purpose field and policy_version.

**Required extensions:**
1. Add `purpose` text field to passport_shares
2. Add `policy_version` for sharing governance

**Dependencies:** None.

**Risk:** None.

**Cost:** 0.5 day

---

## KAD-011 — Readiness

**Classification:** REFACTOR

**Evidence:**
- Migration 071: `readiness_scores` table
- `packages/types/src/readiness.ts` — ReadinessScoreSchema
- API: `GET /api/v1/institutions/[id]/readiness`
- `packages/readiness-engine/` — evaluation logic

**v2 Alignment:** The v2 replaces "Readiness Score" with "Contextual Assessment." Rather than a generic institutional readiness score, assessment is protocol-specific: "Can this institution execute this specific protocol?"

**Required refactoring:**
1. Map readiness dimensions → Assessment dimensions
2. `readiness_scores` table becomes assessment cache, not primary model
3. Readiness engine evaluators → Assessment engine rules
4. Add protocol_context_id to assessment for contextualization

**Dependencies:** Protocol model, Assessment Engine.

**Risk:** Medium. The readiness score concept is deeply embedded in existing UI and tests. Must be dual-supported during migration.

**Cost:** 3 days

---

## KAD-012 — Vilo Production Pilot

**Classification:** PRESERVE

**Evidence:**
- Migration 072: Vilo Research Group seed
- `VILO_PILOT_READINESS_CHECKLIST.md` — 15-step workflow
- `tests/pilots/vilo-walkthrough.test.ts` — pilot tests

**v2 Alignment:** Vilo remains the validation institution. The pilot workflow steps are valid and map to v2 concepts. The three vertical slices in v2 (Continuing Review, PI Identity, Protocol Assessment) are explicitly prioritized.

**Required extensions:**
1. Update pilot checklist to include v2 steps (Source acquisition, Assessment, Snapshot)
2. Add Continuing Review golden cases
3. Add PI identity resolution golden cases

**Dependencies:** All v2 entities.

**Risk:** None (the checklist is a living document).

**Cost:** 1 day (documentation update)

---

## Summary Impact Table

| Story | Classification | Cost (days) | Risk | v2 Impact |
|-------|---------------|-------------|------|-----------|
| KAD-001.5 | PRESERVE | 0 | None | Foundation |
| KAD-002A | EXTEND | 0.5 | Low | Identity Registry |
| KAD-002B | EXTEND | 0.5 | Low | Identity Registry |
| KAD-002C | PRESERVE | 0 | None | Identity Registry |
| KAD-002D | PRESERVE | 0 | None | Application layer |
| KAD-002E | PRESERVE | 0 | None | API layer |
| KAD-002F | PRESERVE | 0 | None | UI layer |
| KAD-002G | EXTEND | 3 | Low | Tests |
| KAD-003 | EXTEND | 3 | Medium | Capability Intelligence |
| KAD-004 | REFACTOR | 5 | **HIGH** | Claims & Knowledge |
| KAD-005 | EXTEND + REFACTOR | 4 | Medium | Evidence & Provenance |
| KAD-006 | PRESERVE | 0 | None | Review |
| KAD-007 | EXTEND | 3 | Medium | Confidence |
| KAD-008 | REFACTOR | 2 | Low | Publication |
| KAD-009 | PRESERVE | 0.5 | None | Passport |
| KAD-010 | PRESERVE | 0.5 | None | ShareGrant |
| KAD-011 | REFACTOR | 3 | Medium | Assessment |
| KAD-012 | PRESERVE | 1 | None | Vilo Pilot |

**Total rework cost:** ~26 days (core stories KAD-001→012)
**Total new build cost:** ~50 days (v2 gaps)

**Combined estimate:** ~76 days to full v2 alignment
**Preservation rate:** 70% of existing codebase untouched
