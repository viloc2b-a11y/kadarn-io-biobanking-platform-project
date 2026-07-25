# KADARN v2 — JSONB Governance Matrix

**Date:** 2026-07-25
**Rule:** JSONB for flexible structure and technical metadata. Relational for domain relationships with FK requirements.

---

## Eight Proposed JSONB Columns

| # | Table.Column | Structure | Max Size | Indexed? | Query Freq | FK Needed? | Classification |
|---|-------------|-----------|----------|----------|------------|------------|----------------|
| 1 | `source_records.extractions` | `[{parser_model, parser_version, parameters, confidence, started_at, completed_at, observations: [{field, raw_value, confidence, locator}], status}]` | ~50 KB (50 obs × 1KB) | No (only queried via SR) | Low (during extraction review only) | No | **APPROVED** — extraction is technical metadata, not domain entity |
| 2 | ~~`claims.evidence_links`~~ | REPLACED by `claim_evidence_links` table | — | — | — | Yes | **RELATIONAL REQUIRED** (moved to table — see Decision 1) |
| 3 | `capabilities.claim_ids` | `[uuid, uuid, ...]` — claim family IDs that compose this capability | ~500 bytes (20 UUIDs) | GIN recommended | Medium (capability composition view) | No (app-layer validation) | **APPROVED WITH CONSTRAINTS** — max 50 UUIDs, validated on write |
| 4 | `evidence_nodes.extraction_info` | `{parser_model, parser_version, extraction_confidence, locator: {page, section, span}, extraction_run_id, extracted_at}` | ~500 bytes | No (only queried via evidence) | Low (confidence explanation) | No | **APPROVED** — technical extraction metadata |
| 5 | `protocol_versions.requirements` | `[{code, statement, criticality, applies_when, evidence_expectation}]` | ~50 KB (30 req × 1.5KB) | GIN for requirement code lookup | Medium (assessment runs) | No (validated by Zod) | **APPROVED WITH CONSTRAINTS** — max 200 requirements, GIN index on codes |
| 6 | `assessments.results` | `[{requirement_code, result, matched_capability_id, confidence, explanation}]` | ~30 KB (30 results × 1KB) | No (always scoped to assessment) | High (assessment detail view) | No (result references cap by FK) | **APPROVED** — scoped to assessment, not independently queried |
| 7 | `assessments.mitigations` | `[{gap_description, action, responsible, deadline, effect}]` | ~10 KB (10 mitigations × 1KB) | No | Low (post-assessment planning) | No | **APPROVED** — scoped to assessment |
| 8 | `evidence_nodes.metadata` | Existing JSONB: `{tags, source, notes}` | ~2 KB | No | Low | No | **APPROVED** — existing, flexible metadata |

---

## Summary

| Classification | Count | Columns |
|---------------|-------|---------|
| APPROVED | 5 | extractions, extraction_info, results, mitigations, metadata |
| APPROVED WITH CONSTRAINTS | 2 | claim_ids (max 50), requirements (max 200, GIN index) |
| RELATIONAL REQUIRED | 1 | ~~claims.evidence_links~~ → `claim_evidence_links` table |
| DEFER | 0 | — |

---

## Future Extraction Criteria

Any JSONB column must be extracted to a table when:

| Criterion | Threshold |
|-----------|-----------|
| Independent querying | Column is queried outside parent entity context |
| FK requirement | Column values need referential integrity |
| Size | Single cell exceeds 1MB |
| Versioning | Column values need their own temporal tracking |
| Concurrency | Multiple concurrent writers to the same cell cause contention |
