# Phase 0 — Current State & Capability Inventory

## 1. Migration Lineage (008–079)

| Range | Domain | Key Tables |
|-------|--------|------------|
| 008–012 | Foundation | organizations, capabilities, RLS, audit, seed |
| 013–041 | Phase 8 | continuity, discovery, exchange, processing, logistics |
| 042–043 | Continuity Engine | continuity_evidence_items, continuity_experience_claims |
| 045 | Evidence Core | claims, evidence_nodes, evidence_relationships, right_of_response, confidence_state_snapshots, evidence_class_ref |
| 046–049 | Evidence Core ext | RLS, indexes, triggers |
| 050–057 | Sprint 1 (renumbered) | Renumbered to 060–061, deleted from supabase/ |
| 058–061 | Sprint 1 | GRANT fixes, review_workflow, claim_consolidation |
| 062–072 | KAD-002–012 | Person, Location, Membership, Role, Credential, Capability, Claim, Review, Knowledge, Passport, ShareGrant, Readiness, Vilo seed |
| 073 | Sprint 1 | evidence_sources (5 enums: source_type, producer_type, authority_level, acquisition_method, freshness_policy, acquisition_status) |
| 074 | Sprint 1 | source_records (with RLS, indexes, triggers) |
| 075 | Loop C forward-port | institutional_events (append-only ledger) |
| 076 | Loop C forward-port | source_records supersession (superseded_by, invalidation_status) |
| 077 | Loop C forward-port | evidence_generation_rules + evidence_nodes provenance columns |
| 078 | Loop C forward-port | claim_evidence_links (relational, 5 relationship types, PK) |
| 079 | Loop C forward-port | COMMENT ON COLUMN (security classification) |

**Migration head: 079. Next migration: 080.**

---

## 2. Current Domain Tables

### SourceRecord (migration 074 + 076)
```
source_records:
  id, evidence_source_id (FK), institution_id (FK), external_record_id,
  record_type, source_version, acquired_at, observed_at, valid_from, valid_until,
  content_hash, locator_uri, acquisition_status (enum), raw_metadata (JSONB),
  superseded_by (self-FK, added in 076), supersession_reason (added in 076),
  invalidation_status (added in 076: active/superseded/invalidated),
  created_at, updated_at
```

**RLS: ✅** (institution-scoped select/insert/update, service_role full access)

### EvidenceSource (migration 073)
```
evidence_sources:
  id, institution_id (FK), source_type (enum), canonical_name (UNIQUE),
  producer_type (enum), producer_name, authority_level (enum),
  acquisition_method (enum), freshness_policy (JSONB), verification_policy,
  base_uri, external_system_identifier, active, metadata (JSONB),
  created_at, updated_at
```

**Enums defined:**
- `source_type`: registry, system, document, declaration, device, api_endpoint, export, other
- `producer_type`: regulatory_agency, institution, system, person, device, external_service
- `authority_level`: regulatory, authoritative_registry, transactional_system, institutional_record, human_attestation, inferred_or_generated
- `acquisition_method`: api_query, web_scrape, file_upload, system_push, manual_entry, batch_import, periodic_export
- `freshness_policy`: no_expiration, fixed_duration, source_defined, event_driven, manual_review
- `acquisition_status`: pending, acquired, verified, invalidated, superseded

**RLS: ✅** (institution-scoped + global sources visible to all authenticated)

### InstitutionalEvent (migration 075)
```
institutional_events:
  id, organization_id (FK), event_type, event_version, occurred_at, recorded_at,
  actor_id, actor_type (person/system/external), subject_id, subject_type,
  correlation_id, causation_id, payload (JSONB), idempotency_key (UNIQUE),
  tenant_id, created_at
```

**RLS: ✅** (enabled but no policies defined — GAP)

### Evidence Nodes (migration 045 + 077)
```
evidence_nodes:
  id, claim_id (FK), evidence_class (enum: A-F), content, source, node_date,
  status (evidence_node_status: active/superseded/disputed/resolved),
  weight (NUMERIC), provenance (JSONB), visibility (JSONB),
  is_counter_evidence, has_response, response_id,
  -- Forward-port columns (077):
  generation_rule_id (FK), input_hash, generator, generated_at, source_record_id (FK),
  created_at, updated_at
```

**Append-only: ✅** (triggers prevent UPDATE/DELETE)
**RLS: ✅** (org-scoped + sponsor visibility)

### Evidence Generation Rules (migration 077)
```
evidence_generation_rules:
  id, rule_name, rule_version (UNIQUE pair), event_pattern, required_inputs (JSONB),
  output_evidence_type, preconditions (JSONB), review_mode (manual/automatic/conditional),
  confidence_policy (JSONB), owner, active, effective_from, effective_until,
  created_at, updated_at
```

**RLS: ❌ NOT ENABLED — GAP**

### Claim-Evidence Links (migration 078)
```
claim_evidence_links:
  claim_id (FK), evidence_id (FK), relationship_type (CHECK: 5 values),
  tenant_id, created_at, created_by, rationale, provenance (text),
  PRIMARY KEY (claim_id, evidence_id)
```

**Relationship types:** SUPPORTS, PARTIALLY_SUPPORTS, CONTRADICTS, REQUIRES_REVIEW, OBSOLETES
**RLS: ❌ NOT ENABLED — GAP**

### Claims (migration 045 + 066)
```
claims:
  id, claim_type_id, name, description, organization_id (FK), status (claim_status),
  domain, decays, decay_period_months, valid_evidence_classes (evidence_class[]),
  required_evidence_classes (evidence_class[]), created_by_actor_id, created_by_org_id,
  correlation_id, provenance_summary, source_event_id,
  owning_org_id, visibility_scope, authorized_sponsor_ids,
  person_id (added 066), tags (added 066), evidence_count (added 066),
  workflow_state (added 060: draft/declared/pending_evidence/under_review/published/disputed/archived),
  created_at, updated_at
```

**RLS: ✅** (org-scoped + sponsor + system visibility)

### Review Tasks (migration 060)
```
review_tasks:
  id, organization_id (FK), claim_id (FK), evidence_node_id (FK),
  task_type (review_task_type: classification/extraction_review/evidence_review/
    confidence_review/publication_review/dispute_review),
  status (review_task_status: pending/in_progress/completed/skipped/cancelled),
  assigned_to, assigned_at, completed_at, completed_by, notes,
  created_at, created_by
```

**RLS: ✅** (organization-scoped)
**Note:** This is a workflow table, not a review metadata table. Loop 2 Phase 8 needs review metadata (reviewer, outcome, notes, required actions) — this table provides the workflow but may need extension.

---

## 3. Current Types (@kadarn/types)

| File | Types Exported |
|------|---------------|
| `sources.ts` | SourceType, ProducerType, AuthorityLevel, AcquisitionMethod, FreshnessPolicy, AcquisitionStatus, EvidenceSourceSchema, CreateEvidenceSourceSchema, UpdateEvidenceSourceSchema, SourceRecordSchema, CreateSourceRecordSchema |
| `evidence.ts` | EvidenceClassEnum (12 values), EvidenceStatus (6 values), EvidenceSchema, CreateEvidenceSchema, UpdateEvidenceSchema, ProvenanceAction, ProvenanceRecordSchema, GenerationProvenanceSchema |
| `events.ts` | InstitutionalEvent (interface, not Zod) |
| `generation-rule.ts` | GenerationRule (type, not Zod) |
| `claim.ts` | ClaimStatus, ClaimSchema, CreateClaimSchema, UpdateClaimSchema, ClaimEvidenceRelationshipType, ClaimEvidenceLinkSchema |
| `review.ts` | ReviewStatus, ReviewDecision, ReviewSchema, CreateReviewSchema, UpdateReviewSchema |
| `confidence.ts` | ConfidenceLevel, ConfidenceScoreSchema, ConfidenceStateSnapshotSchema |
| `knowledge.ts` | KnowledgeType, PublicationStatus, PublishedKnowledgeSchema, CreatePublishedKnowledgeSchema, UpdatePublishedKnowledgeSchema |
| `passport.ts` | AccessLevel, PassportStatus, PassportEntrySchema, CreatePassportEntrySchema, PassportShareSchema, GrantPassportAccessSchema |
| `readiness.ts` | ReadinessDimensionSchema, ReadinessScoreSchema, ReadinessLevel, computeReadinessLevel, ComputeReadinessResponseSchema |

**ISSUE:** Two parallel evidence class systems exist:
1. `evidence_class` DB enum (045): A, B, C, D, E, F (6 classes, KEMS-001 model)
2. `EvidenceClassEnum` in types (evidence.ts): regulatory, contract, cv, training, publication, financial, policy, certification, photo, video, document, other (12 classes)

**These are misaligned.** The DB has 6 classes; the types have 12. This must be reconciled in Phase 2.

---

## 4. Current Repositories (packages/platform-services)

| Repository | Status |
|-----------|--------|
| `person-repository.ts` | ✅ Functional |
| `location-repository.ts` | ✅ Functional |
| `membership-repository.ts` | ✅ Functional |
| `event-repository.ts` | ✅ Stub (in-memory Map, not DB-backed) — GAP |
| `base.ts` | ✅ Base repository pattern |

**Missing repositories:** SourceRecord, EvidenceSource, EvidenceNode, GenerationRule, ClaimEvidenceLink, Review

---

## 5. Current Services

| Service | Status |
|---------|--------|
| `lineage-service.ts` | ✅ Stub (placeholder interface, no DB queries) — GAP |
| `background-jobs.ts` | ✅ Exists (not examined in detail) |

---

## 6. Current API Routes (Evidence-related)

| Route | Status |
|-------|--------|
| `evidence-sources/route.ts` | ✅ Exists (GET, POST) |
| `evidence-sources/[id]/route.ts` | ✅ Exists |
| `evidence-sources/[id]/records/route.ts` | ✅ Exists |
| `source-records/[id]/route.ts` | ✅ Exists |
| `events/route.ts` | ✅ Exists (POST, GET) |
| `events/[id]/route.ts` | ✅ Exists |
| `claims/[id]/evidence/route.ts` | ✅ Exists |
| `claims/[id]/evidence/[evidenceId]/route.ts` | ✅ Exists |
| `claims/[id]/reviews/route.ts` | ✅ Exists |
| `claims/[id]/confidence/route.ts` | ✅ Exists |
| `lineage/route.ts` | ✅ Exists (stub) |
| `evidence-core/evidence/route.ts` | ✅ Exists |
| `evidence-core/claims/route.ts` | ✅ Exists |
| `evidence-core/counter-evidence/route.ts` | ✅ Exists |
| `evidence-core/relationships/route.ts` | ✅ Exists |
| `evidence-lineage/claims/[id]/provenance/route.ts` | ✅ Exists |
| `reviews/[id]/route.ts` | ✅ Exists |
| `review/tasks/route.ts` | ✅ Exists |
| `review/tasks/[id]/route.ts` | ✅ Exists |

**Missing APIs:** Generate Evidence, Replay Generation, List Generation Rules, Retrieve Rule

---

## 7. Current UI Pages

| Page | Status |
|------|--------|
| workspace/locations | ✅ Exists |
| workspace/people | ✅ Exists |
| workspace/documents | ✅ Exists |
| workspace/continuity | ✅ Exists |

**Missing UI:** Source Records, Evidence, Evidence Lineage, Generation Rules, Review Queue

---

## 8. Current Tests (Evidence-related)

| Test | Status |
|------|--------|
| `sprint1/source-intelligence.test.ts` | ✅ 15 tests |
| `sprint1/event-ledger.test.ts` | ✅ 3 tests |
| `sprint1/generation-rules.test.ts` | ✅ 4 tests |
| `sprint1/claim-evidence-links.test.ts` | ✅ 4 tests |
| `sprint1/lineage.test.ts` | ✅ 4 tests |
| `provenance/provenance-append-only.test.ts` | ✅ Exists |
| `provenance/provenance-graph.test.ts` | ✅ Exists |
| `integration/evidence-core-idor.test.ts` | ✅ Exists |
| `integration/rls-coverage-045-049.test.ts` | ✅ Exists |

---

## 9. Gap Analysis Summary

| # | Gap | Phase | Severity |
|---|-----|-------|----------|
| 1 | `evidence_class` DB enum (6 values) vs `EvidenceClassEnum` types (12 values) misalignment | 2 | CRITICAL |
| 2 | `institutional_events` RLS enabled but NO policies defined | 1 | HIGH |
| 3 | `evidence_generation_rules` has NO RLS | 3 | HIGH |
| 4 | `claim_evidence_links` has NO RLS | 7 | HIGH |
| 5 | `EventRepository` is in-memory stub, not DB-backed | 1 | MEDIUM |
| 6 | `LineageService` is placeholder, no DB queries | 5 | MEDIUM |
| 7 | Missing repositories: SourceRecord, EvidenceNode, GenerationRule, ClaimEvidenceLink, Review | 1-8 | MEDIUM |
| 8 | Missing APIs: Generate Evidence, Replay Generation, List Rules, Retrieve Rule | 9 | MEDIUM |
| 9 | Missing UI: Source Records, Evidence, Lineage, Generation Rules, Review Queue | 10 | LOW |
| 10 | `events.ts` uses interface not Zod schema | 2 | LOW |
| 11 | `generation-rule.ts` uses type not Zod schema | 3 | LOW |
| 12 | Evidence lifecycle states in DB (active/superseded/disputed/resolved) vs types (draft/submitted/under_review/approved/rejected/expired) misaligned | 6 | CRITICAL |
| 13 | No deterministic replay mechanism implemented | 4 | HIGH |
| 14 | No generation pipeline executor | 4 | HIGH |
| 15 | `review_tasks` is workflow, not review metadata — may need extension for reviewer/outcome/notes/required_actions | 8 | MEDIUM |
| 16 | `evidence_sources` has no `tenant_id` column — uses `institution_id` for tenancy | 2 | LOW (design choice) |
| 17 | `claim_evidence_links` has no RLS policies | 7 | HIGH |
| 18 | `evidence_generation_rules` has no `tenant_id` — governance entity, may be global | 3 | LOW (design choice) |

---

## 10. Key Architectural Decisions for Loop 2

### Decision 1: Evidence Class Reconciliation
Two systems exist. The DB `evidence_class` enum (A-F, KEMS-001) is the canonical model (migration 045, append-only, with reference table). The `EvidenceClassEnum` in types.ts (12 values) was created later and is misaligned.

**Recommendation:** Align types to DB. The DB enum is authoritative (frozen by migration 045). Add a mapping layer in types if the 12-value taxonomy is needed for UI/API.

### Decision 2: Evidence Lifecycle Reconciliation
DB `evidence_node_status`: active, superseded, disputed, resolved (4 states)
Types `EvidenceStatus`: draft, submitted, under_review, approved, rejected, expired (6 states)

**Recommendation:** The Loop 2 spec requires 10 states: draft, generated, imported, verified, reviewed, accepted, rejected, superseded, archived, invalidated. This needs a new enum (migration 080) that extends the existing DB enum without modifying it. Existing 4 states must map to the new 10-state model.

### Decision 3: Generation Rule Governance
`evidence_generation_rules` exists (077) but has no RLS, no tenant_id, and limited governance metadata. Phase 3 needs to extend it with: owner (exists), status (exists as `active`), deprecation state (exists as `effective_until`), input requirements (exists as `required_inputs`), output evidence type (exists), review policy (exists as `review_mode`), confidence policy (exists). Most fields exist — need RLS and validation.

### Decision 4: Provenance vs Lineage
`provenance` is a JSONB column on `evidence_nodes` (unstructured). `lineage-service.ts` is a placeholder. Phase 5 needs a structured lineage graph: Event → SourceRecord → Rule → Evidence → ClaimEvidenceLink → Claim → Review → Passport. The lineage API exists as a stub.

**Recommendation:** Implement lineage as queries over existing tables (no new lineage table needed — the graph is implicit in the FK relationships). The lineage service traverses: source_record_id → evidence_source_id, generation_rule_id, claim_id via claim_evidence_links, review_tasks via claim_id/evidence_node_id, passport_entries via claim_id.
