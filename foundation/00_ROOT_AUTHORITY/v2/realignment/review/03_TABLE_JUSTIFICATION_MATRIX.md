# KADARN v2 — Table Justification Matrix

**Date:** 2026-07-25
**Standard:** Each table must justify its existence. Could this be a column on an existing table? JSONB? A view? Computed dynamically? Deferred?

---

## Existing Tables (v1, KAD-001→012)

| Table | v2 Disposition | Alternative | Cost to Keep | Recommendation |
|-------|---------------|-------------|-------------|----------------|
| organizations | KEEP | — | $0 | KEEP (rename view: institutions) |
| people | KEEP | — | $0 | KEEP |
| locations | KEEP | — | $0 | KEEP; add valid_from/valid_until |
| organization_memberships | KEEP | — | $0 | KEEP; rename view: institution_memberships |
| organization_roles | KEEP | — | $0 | KEEP |
| membership_roles | KEEP | — | $0 | KEEP |
| claims | **EXTEND** | Add columns directly | Low | Add valid_from/until, version, epistemic_type, superseded_by |
| evidence_nodes | **EXTEND** | Add source_id, source_record_id, epistemic_type | Low | Add as nullable columns |
| evidence_class_ref | KEEP | — | $0 | KEEP (used by confidence computation) |
| review_tasks | KEEP | — | $0 | KEEP |
| capabilities | **EXTEND** | Add valid_from/until, conditions, availability | Low | Add as nullable columns |
| organization_capability_types | KEEP | — | $0 | KEEP (lookup table) |
| passport_entries | KEEP | — | $0 | KEEP; add snapshot_id |
| passport_shares | KEEP | — | $0 | KEEP |
| published_knowledge | **RENAME** | → packages (view for compat) | Low | VIEW + new table |
| readiness_scores | **RETAIN** | Assessment cache | Low | KEEP as cache; write new assessments table |
| confidence_state_snapshots | KEEP | — | $0 | KEEP; extend with 8-dimension breakdown |
| continuity_experience_claims | DEPRECATE | Replaced by claims + versions | $0 | Already deprecated in KAD-004 |

## New Tables (v2 Proposed)

| Proposed Table | Independent Need? | Alternative | Cost to Keep | Recommendation |
|---------------|------------------|-------------|-------------|----------------|
| evidence_sources | **YES** — Source Authority, freshness policy, T1–T4 levels | Column on source_records | Necessary | **CREATE** — this is core to Explainable Confidence |
| evidence_producers | **NO** — name/title is enough | Attribute on source | Low (1 table) | **MERGE** into evidence_sources (add producer_name, producer_type) |
| source_records | **YES** — content-addressed, immutable acquisition | Embed in evidence | Necessary | **CREATE** — needed for provenance |
| acquisition_runs | **NO** — transient execution log | JSONB on source_records | Low | **EMBED** as JSONB: `{last_acquisition: {started_at, completed_at, status, records_count}}` |
| extraction_runs | **PARTIAL** — parser versioning needed | JSONB on source_records | Low | **CREATE SIMPLIFIED** — store as JSONB array: `extractions: [{parser_model, version, confidence, observations: []}]` |
| observations | **NO** — transient pre-evidence | JSONB in extraction | Low | **EMBED** in extraction_runs JSONB |
| provenance_records | **PARTIAL** — append-only log | Use audit_events table | Low | **MERGE** into audit_events (add entity_type, action, actor, previous_state, new_state) |
| evidence_links | **NO** — relationship type | JSONB on claim/evidence | Low | **EMBED** as JSONB on claims: `evidence_links: [{evidence_id, role}]` |
| claim_versions | **NO** — temporal attribute of claim | Columns on claims | Slightly complex queries | **MERGE** — add version fields to claims table |
| claim_evidence_links | **PARTIAL** — supports/contradicts needs querying | JSONB vs table | Medium (needs query by role) | **KEEP** — needed for "why do we believe it?" queries |
| claim_conflicts | **DEFER** | Dynamically detectable from evidence_links | Low | **DEFER** — detect from claim_evidence_links with contradicts role |
| capability_states | **NO** — temporal attribute | Columns on capabilities | Low | **MERGE** — add valid_from/until, conditions, availability to capabilities |
| capability_claim_links | **PARTIAL** — composition query | JSONB on capability | Low | **EMBED** as `claim_ids[]` on capabilities |
| protocols | **YES** — new aggregate | — | Necessary | **CREATE** |
| protocol_versions | **YES** — versioned content | — | Necessary | **CREATE** |
| requirements | **SIMPLIFY** | JSONB on protocol_versions for MVP | Low | **JSONB for MVP** — `requirements: [{code, statement, criticality, evidence_expectation}]` |
| requirement_rules | **DEFER** | Start as code (functions) | Low | **DEFER** to Phase 2 |
| assessments | **YES** — execution record | — | Necessary | **CREATE** |
| assessment_results | **NO** — per-requirement result | JSONB on assessments | Low | **EMBED** as `results: [{requirement_code, result, matched_capability, evidence_snapshot, confidence}]` |
| gaps | **NO** — computed | Dynamic SQL | $0 | **COMPUTE** on read, don't store |
| mitigations | **NO** — scoped to assessment | JSONB on assessments | Low | **EMBED** as `mitigations: [{gap, action, responsible, deadline}]` |
| knowledge_snapshots | **YES** — immutable publication | — | Necessary | **CREATE** |
| package_snapshot_links | **PARTIAL** — package→snapshot | FK on packages | Low | **MERGE** — add snapshot_id FK to packages |
| audit_events | **YES** — compliance requirement | — | Necessary | **CREATE** |

## Final Table Count

| Category | v2 Blueprint | Simplified | Δ |
|----------|-------------|------------|---|
| Existing tables | 18 | 18 (all preserved) | 0 |
| New tables proposed | ~27 | **14** | **-13 (-48%)** |
| **Total** | **~45** | **32** | **-13** |

## Key Simplifications

1. **No observations table** → JSONB in extraction_runs
2. **No acquisition_runs table** → JSONB in source_records
3. **No claim_versions table** → version fields in claims
4. **No capability_states table** → version fields in capabilities
5. **No provenance_records table** → audit_events covers this
6. **No evidence_links table** → JSONB in claims
7. **No assessment_results table** → JSONB in assessments
8. **No gaps/mitigations tables** → computed/embedded
9. **No requirement_rules table** → deferred (code-first)
10. **No evidence_producers table** → merged into evidence_sources
