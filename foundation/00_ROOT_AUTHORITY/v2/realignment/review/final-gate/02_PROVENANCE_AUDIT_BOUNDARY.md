# KADARN v2 — Decision 2: Provenance vs Audit Boundary

**Date:** 2026-07-25
**Question:** Where does provenance live if we don't create a provenance_records table?

---

## Conceptual Distinction

| Dimension | Audit | Provenance |
|-----------|-------|------------|
| Question | Who approved/reviewed this? | Where did this data come from? |
| Granularity | Action-level | Source-level |
| Mutability | Append-only | Immutable after recording |
| Consumer | Compliance, GDPR | Knowledge Graph, Explainability |
| Retention | 5+ years | Duration of the knowledge |

**Critical insight:** These are NOT the same concept. Audit tells us WHO. Provenance tells us WHERE FROM. Both are needed, but they attach to different entities.

---

## Distribution Strategy

Provenance fields are distributed across the entities they describe. This avoids a single `provenance_records` table while preserving the chain.

### 1. Source Identity → `evidence_sources` table

| Field | Location |
|-------|----------|
| Source name | `evidence_sources.name` |
| Source type (API, document, registry, human) | `evidence_sources.source_type` |
| Authority level (T1–T4) | `evidence_sources.authority_level` |
| Producer identity | `evidence_sources.producer_name`, `.producer_type` |
| Freshness policy | `evidence_sources.freshness_policy_json` (JSONB) |

**No new table needed.**

### 2. External Record Identity → `source_records` table

| Field | Location |
|-------|----------|
| External record ID | `source_records.external_id` |
| Document version | `source_records.schema_version` |
| Content hash | `source_records.content_hash` |
| Acquisition timestamp | `source_records.acquired_at` |
| Effective timestamp | `source_records.effective_at` |
| Storage URI | `source_records.storage_uri` |
| MIME type | `source_records.mime_type` |

**No new table needed.** This IS the source record.

### 3. Extraction Provenance → JSONB on `evidence_nodes`

| Field | Location |
|-------|----------|
| Parser/model used | `evidence_nodes.extraction_info->>'parser_model'` |
| Parser version | `evidence_nodes.extraction_info->>'parser_version'` |
| Extraction confidence | `evidence_nodes.extraction_info->>'extraction_confidence'` |
| Page/locator | `evidence_nodes.extraction_info->>'locator'` |
| Extraction run ID | `evidence_nodes.extraction_info->>'extraction_run_id'` |
| Extraction timestamp | `evidence_nodes.extraction_info->>'extracted_at'` |

**JSONB APPROVED.** This is technical metadata, always scoped to one evidence node.

### 4. Human Verification → Columns on evidence + claim_evidence_links

| Field | Location |
|-------|----------|
| Reviewer identity | `review_tasks.reviewer_id` |
| Verification decision | `review_tasks.decision` |
| Verification timestamp | `review_tasks.completed_at` |
| Link acceptance | `claim_evidence_links.review_status` |
| Link rejection | `claim_evidence_links.revoked_at`, `.revoked_by` |

**No new table needed.** Review_tasks already exists.

### 5. Transformation Lineage → FK Chain

The chain is implicit in foreign keys:

```
evidence_sources.id
    → source_records.source_id
        → evidence_nodes.source_record_id
            → claim_evidence_links.evidence_id
                → claim_evidence_links.claim_id
```

**This IS the provenance chain.** No separate table needed. Any point in the chain can be navigated via JOINs.

---

## Audit Table

`audit_events` records WHO did WHAT inside KADARN:

| Column | Purpose |
|--------|---------|
| entity_type | 'claim', 'evidence', 'passport', etc. |
| entity_id | ID of the affected entity |
| action | 'created', 'updated', 'approved', 'rejected', 'published', 'revoked' |
| actor_id | User who performed the action |
| previous_state | JSONB snapshot before change |
| new_state | JSONB snapshot after change |
| metadata | Additional context |
| created_at | When the action occurred |

**audit_events is NOT a provenance table.** It records actions, not origins. The provenance chain (source → record → evidence → claim) is tracked via FKs.

---

## Decision

**DISTRIBUTED PROVENANCE.** Provenance fields live on the entities they describe. The chain is implicit in FKs. No `provenance_records` table.

| Concept | Location | Type |
|---------|----------|------|
| Source identity | evidence_sources | Table |
| Record identity | source_records | Table |
| Extraction metadata | evidence_nodes.extraction_info | JSONB |
| Human verification | review_tasks + claim_evidence_links | Existing + new table |
| Transformation chain | FK chain (source→record→evidence→claim) | Relational |
| Actions | audit_events | Table |
