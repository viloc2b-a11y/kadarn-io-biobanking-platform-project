# KADARN v2 — Domain Simplification Review

**Date:** 2026-07-25
**Role:** Red Team Reviewer
**Result:** CONDITIONAL GO

---

## Reading Order

1. `01_DOMAIN_SIMPLIFICATION_REVIEW.md` — Cross-cutting simplification findings
2. `02_ENTITY_JUSTIFICATION_MATRIX.md` — 33 entities evaluated
3. `03_TABLE_JUSTIFICATION_MATRIX.md` — ~45 proposed tables evaluated
4. `04_BOUNDED_CONTEXT_REVIEW.md` — 9 contexts → 5
5. `05_ARCHITECTURE_COMPLEXITY_REPORT.md` — Complexity metrics + what-if
6. `06_MINIMAL_ARCHITECTURE_v2.md` — The simplified proposal

---

## Decision: CONDITIONAL GO

### Conditions (must satisfy before Sprint 1)

1. **Accept the minimal table set.** 24 tables (not 45). 8 new (not 27). If at any point a JSONB column exceeds 1MB or needs independent querying, extract to a table — but not before.

2. **Claim versioning via columns.** No `claim_versions` table. Add `valid_from`, `valid_until`, `version`, `epistemic_type`, `superseded_by` to the existing `claims` table. If version count exceeds 100 per claim, extract later.

3. **Capability versioning via columns.** Same pattern as claims. No `capability_states` table.

4. **Observations in JSONB.** No `observations` table. Store in extraction JSONB on `source_records`.

5. **Assessment results, mitigations in JSONB.** No separate tables. Store on `assessments` row.

6. **5 bounded contexts, not 9.** Identity | SourceEvidence | ClaimsCapability | ProtocolAssessment | Publication. Shared audit across all.

### What NOT to build now

- **Requirement rules engine** — implement matching rules as TypeScript functions, not database tables
- **Claim conflict table** — detect conflicts dynamically from evidence links
- **Identity candidate table** — transient processing, confirmed aliases go to person_aliases column
- **Provenance records table** — audit_events covers this
- **Acquisition/extraction run tables** — JSONB on source_records

### What can wait for Phase 2

- Full ClaimVersion table (if performance requires)
- Full RequirementRule table (if rules become complex enough)
- Capability composition graph (if composition rules exceed SQL)
- Independent gap/mitigation entities (if they develop their own lifecycle)
- Microservices extraction (modular monolith is correct for Phase 1)

### What the minimal architecture changes vs. Blueprint

| Dimension | Blueprint | Minimal | Δ |
|-----------|-----------|---------|---|
| New tables | 27 | **8** | -70% |
| Bounded contexts | 9 | **5** | -44% |
| New migrations | ~18 | **~10** | -44% |
| Entity types | 33 | **19** | -42% |
| Developer days | ~73 | **~45** | -38% |
| JSONB (vs. tables) | 0 | **8 columns** | Simpler |
| Risk level | Medium | **Low** | Less surface |
