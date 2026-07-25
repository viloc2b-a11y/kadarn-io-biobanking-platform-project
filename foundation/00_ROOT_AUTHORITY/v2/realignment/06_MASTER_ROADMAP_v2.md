# KADARN Master Roadmap v2.0

**Document:** RDM-001  
**Date:** 2026-07-25  
**Authority:** Master Realignment Plan v2.0  

---

## 1. Roadmap Structure

Each sprint delivers:
- Database migrations (backward-compatible)
- Type definitions in `@kadarn/types`
- API endpoints (new or extended)
- Repository/services layer
- Tests (unit + integration + golden case)
- RLS policies
- Implementation report

---

## 2. Phases & Gates

```
Phase A — Alignment Audit ──── Gate A ──┐
                                         ├── Phase B — Canonical Catalogs ──── Gate B ──┐
Phase C — Domain Corrections ────────────┘                                              │
                                                                                        ├── Phase D — VS1: Continuing Review ── Gate D ──┐
Phase E — VS2: PI Identity ─────────────────────────────────────────────────────────────┘       │
                                                                                                  ├── Phase F — Protocol Intelligence ── Gate F ──┐
Phase G — VS3: Vilo Assessment ───────────────────────────────────────────────────────────────────┘       │
                                                                                                              ├── Phase H — Controlled Sharing ── Gate H ──┐
Phase I — Hardening ─────────────────────────────────────────────────────────────────────────────────────────┘       │
                                                                                                                       ├── External Pilot Gate
```

### Gate Criteria

| Gate | Condition | Artifacts |
|------|-----------|-----------|
| A | Audit complete, backlog approved | Alignment Audit, Impact Matrix |
| B | Attribute Catalog, Source Catalog, Taxonomy | Three catalog documents |
| C | Backfill complete, baseline green | ADRs, migrations, backfill report |
| D | Tracing + CR pipeline demonstrated | Golden cases, demo |
| E | PI ambiguity + human review demonstrated | Identity resolution tests |
| F | Requirements normalized | Protocol workspace |
| G | Gaps actionable for Vilo | Assessment report |
| H | Controlled sharing proven | Sharing policy tests |
| I | Pilot-ready | Security report, runbook |

---

## 3. Sprint Plan

### Sprint 0 — Freeze & Baseline (3 days)

**Objective:** Lock architecture, inventory current state, establish governance.

**Backlog items:**
- BL-001: Architecture freeze + governance
- BL-002: Deprecate continuity engine
- BL-003: Schema inventory + documentation

**Deliverables:**
- Updated freeze policy
- Deprecated continuity routes
- Full schema-to-v2 mapping document

**Validation:** `npm run build ✅`, `npm run test ✅` (baseline)

---

### Sprint 1 — Source Registry (7 days)

**Objective:** EvidenceSource and SourceRecord models.

**Epic:** KAD-SRC-001 + KAD-SRC-002
**Backlog:** BL-101, BL-102

**Migrations:** 073 (evidence_sources, evidence_producers), 074 (source_records)

**New tables:**
- `evidence_sources` (id, name, source_type, authority_level, producer_id, freshness_policy, status)
- `evidence_producers` (id, name, producer_type, contact)
- `source_records` (id, source_id, external_id, acquired_at, effective_at, content_hash, storage_uri, mime_type, schema_version, status)

**New types:**
- `EvidenceSource` (Zod schema)
- `EvidenceProducer`
- `SourceRecord`
- `EvidenceSourceAuthorityLevel` (T1–T4 enum)

**New API:**
- `POST /api/v1/sources`
- `GET /api/v1/sources`
- `POST /api/v1/source-records`

**New services:**
- `SourceRegistryService`
- `SourceRecordRepository`

**Tests:**
- CRUD for sources (4 tests)
- CRUD for source records (4 tests)
- RLS isolation (2 tests)
- Idempotency (1 test)

**Vertical slice validation:** Source → SourceRecord (first two steps of pipeline)

---

### Sprint 2 — Acquisition & Provenance (6 days)

**Objective:** Extraction framework and provenance chain.

**Epic:** KAD-SRC-003 + KAD-PROV-001
**Backlog:** BL-103, BL-201, BL-202, BL-203

**Migrations:** 075 (acquisition_runs, extraction_runs), 076 (observations), 077 (evidence_nodes extended), 078 (provenance_records)

**New tables:**
- `acquisition_runs` (id, source_id, started_at, completed_at, status, records_count, error_log)
- `extraction_runs` (id, source_record_id, parser_model, parser_version, parameters, output_summary, confidence, started_at, completed_at)
- `observations` (id, extraction_run_id, field_name, raw_value, confidence, span_location)

**Existing tables extended:**
- `evidence_nodes` — add `source_id`, `source_record_id`, `epistemic_type`
- `provenance_records` — align schema to v2

**New API:**
- `POST /api/v1/source-records/{id}/extract`
- `GET /api/v1/extraction-runs/{id}`
- `POST /api/v1/evidence/{id}/review`

**Tests:**
- Extraction pipeline (3 tests)
- Observation creation (2 tests)
- Provenance recording (2 tests)

**Vertical slice validation:** SourceRecord → ExtractionRun → Observations → Evidence

---

### Sprint 3 — Claim Versioning (6 days) ⚠️

**Objective:** Versioned claims with evidence links and conflict detection.

**Epic:** KAD-CLM-001 + KAD-CLM-002
**Backlog:** BL-301, BL-302, BL-303

**Migrations:** 079 (claim_versions), 080 (claim_evidence_links), 081 (claim_conflicts)

**New tables:**
- `claim_versions` (claim_id, version, predicate, value_json, subject, context_json, epistemic_type, valid_from, valid_until, status, superseded_by)
- `claim_evidence_links` (claim_id, evidence_id, role, created_at, created_by)
- `claim_conflicts` (claim_a_id, claim_b_id, conflict_type, detected_at, resolved_at, resolution, resolved_by)

**Backfill:**
- Each existing `claims` row → initial `claim_versions` (version=1, epistemic_type='human')
- Each existing `evidence_nodes.claim_id` → implicit supports link

**New API:**
- `POST /api/v1/claims` (v2 — accepts evidence links)
- `GET /api/v1/claims/{id}` (v2 — returns latest version + history)

**Services:**
- `ClaimAssertionService`
- `ConflictDetectionService`

**Tests:**
- Claim version creation (2 tests)
- Evidence linking with roles (3 tests)
- Conflict detection (2 tests)
- Backfill correctness (2 tests)
- Temporal validity (2 tests)

**Vertical slice validation:** Evidence → ClaimVersion (supports/contradicts)

**⚠️ This sprint has HIGH risk. Backfill must be tested on a full database dump first.**

---

### Sprint 4 — Capability States (3 days)

**Objective:** Temporal capability states and claim composition.

**Epic:** KAD-CAP-001
**Backlog:** BL-401, BL-402

**Migrations:** 082 (capability_states), 083 (capability_claim_links)

**New tables:**
- `capability_states` (capability_id, location_id, status, availability, quantity, unit, conditions_json, valid_from, valid_until, confidence_state)
- `capability_claim_links` (capability_id, claim_id, role, created_at)

**Backfill:**
- Each `capabilities` row → initial `capability_states`
- `capabilities.primary_claim_id` → initial `capability_claim_links`

**Services:**
- `CapabilityCompositionService`

**Tests:**
- State temporal transitions (3 tests)
- Multi-claim composition (2 tests)
- Backfill (1 test)

---

### Sprint 5 — Continuing Review Slice (8 days)

**Objective:** End-to-end pipeline from CR upload to Passport.

**Epic:** KAD-VS-001
**Backlog:** BL-501

**This sprint produces the first full v2 vertical slice.**

**Workflow:**
1. Upload Continuing Review PDF → SourceRecord
2. Run extraction → Observations (screened, enrolled, screen failures, early terminations, completed, period, study status)
3. Human review → Evidence acceptance
4. ClaimVersions for each metric
5. CapabilityState for performance
6. Passport projection
7. Readiness for assessment

**Key deliverable:** Golden case with a real Continuing Review document from Vilo.

**Acceptance criteria:**
- Reproducibility: same file + extractor = same output
- Traceability: every metric links to document page/span
- Temporality: reporting period ≠ acquired_at
- Conflict: incompatible reports create conflict, not overwrite
- Reusability: metrics appear in Passport without re-entry
- Audit: reviewer identity and timestamp recorded

**Tests:** Golden case suite (7 tests)

---

### Sprint 6 — PI Identity Resolution (5 days)

**Objective:** Multi-source identity resolution for Principal Investigators.

**Epic:** KAD-ID-001
**Backlog:** BL-601

**Sources:** NPPES/NPI, ClinicalTrials.gov, PubMed, ORCID, State Board

**Workflow:**
1. Query public sources by name + location
2. Generate candidate matches with identity scores
3. Present candidates for human review
4. Confirm or merge identities
5. Record rejected candidates

**New tables:** `identity_candidates`
**Services:** `IdentityResolutionService`

**Acceptance criteria:**
- Candidates from ≥3 independent sources
- Ambiguity flagged, not auto-merged
- Confirmed identity linked to Person

**Tests:** Golden case for ambiguous name resolution

---

### Sprint 7 — Protocol Model (6 days)

**Objective:** Protocol versioning and requirement normalization.

**Epic:** KAD-PTL-001 + KAD-REQ-001
**Backlog:** BL-701, BL-702

**Migrations:** 084 (protocols, protocol_versions), 085 (requirements, requirement_rules)

**New tables:**
- `protocols` (id, short_name, full_title, sponsor, phase, therapeutic_area)
- `protocol_versions` (id, protocol_id, version, effective_date, content_hash, status)
- `requirements` (id, protocol_version_id, code, statement, criticality, applies_when, evidence_expectation, matching_rule_id)
- `requirement_rules` (id, name, rule_type, logic_json, version)

**New types:** `Protocol`, `ProtocolVersion`, `Requirement`, `RequirementRule`
**New API:** `POST /api/v1/protocols/{id}/versions`

**Effort:** 6 days

---

### Sprint 8 — Assessment Engine (8 days)

**Objective:** Matching engine that compares requirements against institutional knowledge.

**Epic:** KAD-ASM-001
**Backlog:** BL-801

**Migrations:** 086 (assessments, assessment_results), 087 (gaps, mitigations)

**New tables:**
- `assessments` (protocol_version_id, institution_id, knowledge_snapshot_id, ruleset_version, started_at, completed_at, status, overall_conclusion)
- `assessment_results` (assessment_id, requirement_id, result, matched_capability_id, evidence_snapshot, confidence, explanation)
- `gaps` (assessment_id, requirement_id, severity, missing_evidence, suggested_source)
- `mitigations` (gap_id, description, responsible, deadline, effect)

**Services:**
- `RequirementMatchingService`
- `AssessmentService`
- `ConfidenceExplanationService`

**New API:**
- `POST /api/v1/assessments` — execute assessment
- `GET /api/v1/assessments/{id}/explain` — per-requirement results

**Tests:**
- Requirement→Capability matching (4 tests)
- Gap detection (2 tests)
- Mitigation proposal (1 test)
- Assessment reproducibility (2 tests)
- Golden cases (3 tests)

---

### Sprint 9 — Vilo Protocol Assessment (5 days)

**Objective:** Run a real Vilo protocol through the assessment engine.

**Epic:** KAD-VS-003
**Backlog:** BL-901

**Workflow:**
1. Register real Vilo protocol + version
2. Extract 15–30 critical and operational requirements
3. Map requirements to canonical attributes and capabilities
4. Execute RequirementMatchingService on current KnowledgeSnapshot
5. Produce: satisfied, partial, gap, conflict, unknown per requirement
6. Add mitigations with responsible parties
7. Generate Assessment report and authorized Package

**Deliverable:** Assessment explaining gaps in Vilo's readiness for a specific protocol.

**Stop condition:** Not publishable if explanation per requirement is missing.

---

### Sprint 10 — Publication v2 (5 days)

**Objective:** Reproducible snapshots and Package refactoring.

**Epic:** KAD-PUB-001
**Backlog:** BL-1001, BL-1002

**Migrations:** 088 (knowledge_snapshots), 089 (package refactoring)

**New tables:**
- `knowledge_snapshots` (id, assessment_id, frozen_at, claim_version_ids[], evidence_ids[], capability_state_ids[], content_hash)

**Refactoring:**
- Rename `published_knowledge` → `packages`
- Add `snapshot_id`, `assessment_id` to packages
- Create backward-compatible VIEW

**Services:** `PublicationService`

---

### Sprint 11 — Sharing + Hardening (11 days)

**Objective:** Controlled sharing governance and platform hardening.

**Epic:** KAD-SHR-001 + KAD-MIG-001 + KAD-OBS-001
**Backlog:** BL-1101, BL-1102, BL-1103

**Migration:** 090 (audit_events)

**New tables:**
- `audit_events` (entity_type, entity_id, action, actor_id, previous_state, new_state, metadata)

**Extensions:**
- ShareGrant: add `purpose`, `policy_version`
- Confidence: 8-dimension explainability
- Performance tuning
- External pilot runbook

**Final gate:** External pilot ready.

---

## 4. Vertical Slice Validation

Each vertical slice must demonstrate end-to-end traceability:

### VS1: Continuing Review → Performance Intelligence
```
CR PDF → SourceRecord → ExtractionRun → Observations → Evidence
→ ClaimVersions → CapabilityStates → Passport projection
```
**Gate D:** Traceability and reusability demonstrated.

### VS2: PI Identity → Experience Resolution
```
Public sources → Identity candidates → Human review → Confirmed Person
→ Linked credentials → Experience claims
```
**Gate E:** Ambiguity and human review resolved.

### VS3: Protocol → Assessment → Package
```
Protocol + Requirements → Assessment → Gaps → Mitigations → Package
```
**Gate G:** Conclusion explainable, gaps actionable.

---

## 5. Risk Calendar

| Sprint | Risk | Mitigation |
|--------|------|-----------|
| 0 | Scope creep | Freeze policy, strict backlog |
| 1–2 | Source model over-engineering | Limit to fields needed by VS1 |
| 3 | Backfill failure | Database dump before migration |
| 4 | Capability refactor scope | Keep v1 reads, add v2 writes |
| 5 | CR extraction quality | Golden case validation |
| 6 | Public source rate limits | Local cache, staggered queries |
| 7 | Protocol schema overspec | 15–30 requirements max per slice |
| 8 | Matching rule complexity | Rule versioning, not AI-first |
| 9 | Vilo data gaps | Document missing data as findings |
| 10 | Package migration | VIEW + dual-write |
| 11 | Hardening fatigue | Prioritize by pilot blocker list |

---

## 6. Success Metrics

| Dimension | Target | Measured By |
|-----------|--------|-------------|
| Acquisition | ≥80% attributes without manual re-entry | Source coverage report |
| Traceability | 100% published claims linked to provenance | Provenance completeness check |
| Freshness | 100% critical attributes with freshness policy | Policy coverage scan |
| Conflict | Zero silent overwrites | Conflict detection log |
| Reusability | Same claim in Passport + Assessment | Cross-reference query |
| Explainability | Per-requirement evidence and reason | Assessment report review |
| Migration | Zero legacy data loss | Record count comparison |
| Tests | Baseline + 50% new golden cases | Coverage report |
| Security | RLS + ShareGrant verified | Integration test pass |
| Decision value | Actionable gaps for Vilo | Vilo review session |
