# KADARN v2 — Final Gate Decision

**Date:** 2026-07-25
**Decision:** GO FOR SPRINT 0
**Authority:** Architecture Constitution v2.0, Domain Simplification Review

---

## Summary

The four critical decisions are resolved. The minimal architecture preserves:

- **Traceability** — evidence links to claims with FK integrity, provenance chain through source→record→evidence
- **Integrity** — claim_evidence_links is relational, not JSONB; JSONB is constrained to technical metadata
- **Temporality** — self-versioning claims table with claim_family_id, append-only on change
- **Explainability** — observation promotion rule guarantees every published claim traces back to source
- **Queryability** — all critical relationships are indexed FKs; JSONB only for scoped, single-entity data

## Decision Outcomes

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| 1. Claim↔Evidence | **RELATIONAL TABLE** | Many-to-many with role, weight, validity. FK integrity required for supporting+contradicting evidence. |
| 2. Provenance vs Audit | **DISTRIBUTED** | Provenance fields live on source→record→evidence→claim chain. Audit_events covers actions, not origin. |
| 3. Observation Promotion | **TRANSITION RULE** | Observations in JSONB extraction runs. Promote to Evidence via reviewed+accepted workflow. Locator copied. |
| 4. Claim Versioning | **SELF-VERSIONING** | claim_family_id + append-only rows on claims table. No separate ClaimVersion table. |

## Minimal Schema Count

| Category | Tables |
|----------|--------|
| Identity Registry | 6 (existing) |
| Source & Evidence | 4 (2 new: evidence_sources, source_records) |
| Claims & Capability | 4 (1 new: claim_evidence_links) |
| Protocol Assessment | 4 (new) |
| Publication | 3 (existing) |
| Audit | 1 (new) |
| **Total** | **22** |
