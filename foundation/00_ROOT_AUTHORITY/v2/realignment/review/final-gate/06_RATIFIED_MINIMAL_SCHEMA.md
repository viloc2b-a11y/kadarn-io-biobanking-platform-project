# KADARN v2 — Ratified Minimal Schema

**Date:** 2026-07-25
**Decision:** GO FOR SPRINT 0
**Total Tables:** 22 (14 existing + 1 extended + 7 new)
**JSONB Columns:** 7 (all APPROVED or APPROVED WITH CONSTRAINTS)

---

## Table Inventory

### Identity Registry — 6 tables (all existing, preserved)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `institutions` (was `organizations`) | PRESERVE | id, name, legal_name, tax_id, website, org_type | — | Add VIEW `organizations` for backward compat |
| `people` | PRESERVE | id, email, first_name, last_name, status | — | Add `aliases` JSONB in Phase 2 |
| `locations` | PRESERVE | id, name, location_type, institution_id, address, status | → institutions.id | Add valid_from/valid_until |
| `organization_memberships` | PRESERVE | id, user_id, person_id, organization_id, title, status, started_at, ended_at | → institutions.id, → people.id | Rename VIEW: institution_memberships |
| `organization_roles` | PRESERVE | id, key, name, scope, priority | — | Governed catalog |
| `membership_roles` | PRESERVE | id, membership_id, role_id, assigned_by, assigned_at | → memberships.id, → roles.id | — |

### Source & Evidence — 4 tables (2 new)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `evidence_sources` | **NEW** | id, name, source_type, authority_level (T1–T4), producer_name, freshness_policy (JSONB), status | — | T1–T4 levels per Constitution §8 |
| `source_records` | **NEW** | id, source_id, external_id, content_hash, storage_uri, mime_type, schema_version, acquired_at, effective_at, status, extractions (JSONB) | → evidence_sources.id | Extractions JSONB: parser runs + observations |
| `evidence_nodes` | EXTEND | id, claim_id, source_record_id (NEW), evidence_class, content, metadata (JSONB), status, epistemic_type (NEW), extraction_info (JSONB), locator_json (NEW), source_url | → source_records.id | Add 3 nullable columns |
| `evidence_class_ref` | PRESERVE | id, name, description, decay_months, default_weight | — | Confidence weight reference |

### Claims & Capability — 4 tables (1 new)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `claims` | EXTEND | id, claim_family_id (NEW), version_number (NEW), supersedes_id (NEW), valid_from (NEW), valid_until (NEW), epistemic_type (NEW), name, description, organization_id, location_id, person_id, workflow_state, tags | → institutions.id | Self-versioning via append-only rows |
| `claim_evidence_links` | **NEW** | id, claim_id, evidence_id, role, weight, valid_from, valid_until, review_status, revoked_at, revoked_by, created_by | → claims.id, → evidence_nodes.id | Many-to-many with role semantics |
| `review_tasks` | PRESERVE | id, organization_id, claim_id, evidence_id, reviewer_id, status, decision, comments, assigned_at, completed_at | → claims.id, → evidence_nodes.id | Decision 2: human verification provenance |
| `capabilities` | EXTEND | id, name, description, organization_id, primary_claim_id, status, confidence_score, valid_from (NEW), valid_until (NEW), conditions (JSONB), availability (TEXT), quantity (NUMERIC), unit (TEXT), claim_ids (UUID[] JSONB) | → institutions.id | Temporal + conditions added as columns |

### Protocol Assessment — 5 tables (4 new)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `protocols` | **NEW** | id, short_name, full_title, sponsor, phase, therapeutic_area | — | Aggregate root |
| `protocol_versions` | **NEW** | id, protocol_id, version, effective_date, content_hash, status, requirements (JSONB) | → protocols.id | Requirements JSONB: max 200, GIN index |
| `assessments` | **NEW** | id, protocol_version_id, institution_id, knowledge_snapshot_id, ruleset_version, status, overall_conclusion, results (JSONB), mitigations (JSONB) | → protocol_versions.id, → institutions.id, → knowledge_snapshots.id | Results + mitigations as JSONB |
| `gaps` | **COMPUTED** | — | — | Derived from assessment results + capabilities. No table. |
| `knowledge_snapshots` | **NEW** | id, assessment_id, frozen_at, claim_version_ids (UUID[]), evidence_ids (UUID[]), capability_ids (UUID[]), content_hash | → assessments.id | Immutable publication record |

### Publication — 3 tables (all existing)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `passport_entries` | EXTEND | id, organization_id, claim_id, title, version, status, snapshot_id (NEW), published_at, expires_at, metadata | → institutions.id, → knowledge_snapshots.id | Add snapshot_id |
| `packages` (was `published_knowledge`) | RENAME | id, organization_id, knowledge_type, title, content (JSONB), status, snapshot_id (NEW), assessment_id (NEW), published_at | → institutions.id | VIEW for backward compat |
| `passport_shares` | PRESERVE | id, passport_entry_id, sponsor_organization_id, access_level, access_token, granted_by, expires_at, revoked_at | → passport_entries.id | Extended in KAD-010 |

### Audit — 1 table (new)

| Table | Status | Key Columns | FKs | Notes |
|-------|--------|-------------|-----|-------|
| `audit_events` | **NEW** | id, entity_type, entity_id, action, actor_id, previous_state (JSONB), new_state (JSONB), metadata (JSONB) | — | Append-only. NOT a provenance substitute. |

---

## Tables NOT Built (from Blueprint)

| Blueprint Table | Reason for Rejection | Alternative |
|----------------|---------------------|-------------|
| evidence_producers | Merged into evidence_sources | producer_name, producer_type columns |
| acquisition_runs | Transient execution log | JSONB in source_records |
| extraction_runs | Parser metadata | JSONB in source_records.extractions |
| observations | Pre-normalization extraction | JSONB in extractions[].observations |
| provenance_records | Merged into audit vs distributed | FK chain (source→record→evidence→claim) + audit_events |
| evidence_links | Replaced by claim_evidence_links | claim_evidence_links table (relational) |
| claim_versions | Self-versioning on claims | claim_family_id + version fields on claims |
| claim_conflicts | Detectable from claim_evidence_links | Deferred to Phase 2 |
| capability_states | Temporal columns on capabilities | valid_from/until on capabilities |
| capability_claim_links | JSONB on capabilities | claim_ids UUID[] on capabilities |
| requirements | JSONB on protocol_versions | requirements JSONB column |
| requirement_rules | Code-first, not data-first | Deferred to Phase 2 |
| assessment_results | JSONB on assessments | results JSONB column |
| packate_snapshot_links | FK on packages | snapshot_id column on packages |

---

## Migration Order (Preliminary)

| Sprint | Migration | Tables | Type |
|--------|-----------|--------|------|
| 0 | — | No migrations | Freeze + governance |
| 1 | 073 | evidence_sources, source_records | **NEW** |
| 2 | 074 | evidence_nodes (extend), claim_evidence_links | **EXTEND + NEW** |
| 2 | 075 | review_tasks (extend) | **EXTEND** |
| 3 | 076 | claims (extend: self-versioning) | **EXTEND** (backfill) |
| 3 | 077 | capabilities (extend) | **EXTEND** (backfill) |
| 4 | 078 | knowledge_snapshots | **NEW** |
| 5 | 079 | protocols, protocol_versions | **NEW** |
| 5 | 080 | assessments | **NEW** |
| 6 | 081 | passport_entries, packages (extend) | **EXTEND** |
| 6 | 082 | audit_events | **NEW** |
| 7+ | — | packages (rename from published_knowledge) | **RENAME** |

**Total migrations:** ~10 (vs. ~18 in Blueprint — 44% fewer)

---

## Invariants

1. Every `claim_evidence_links` row references existing `claims` and `evidence_nodes` (FK enforced).
2. Every `evidence_nodes.source_record_id` references existing `source_records` (or is NULL for legacy data).
3. Every `source_records.source_id` references existing `evidence_sources`.
4. Every claim has exactly one current version: `WHERE claim_family_id = X AND valid_until IS NULL`.
5. No two active `claim_evidence_links` may have the same (claim_id, evidence_id, role) with overlapping validity.
6. KnowledgeSnapshots are immutable after creation.
7. Audit events are append-only.
8. Passport entries and packages reference snapshot IDs when published (nullable during draft).
