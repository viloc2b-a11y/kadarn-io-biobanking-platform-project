# KADARN v2 — Document Authority Registry

**Date:** 2026-07-25
**Status:** Frozen

---

## Hierarchy

### Level 1 — Normative (Constitutional)

| Document | Status | Supersedes |
|----------|--------|------------|
| `v2/01_KADARN_Constitucion_Arquitectonica_v2.0.docx` | **ACTIVE** | All previous product definitions |
| `v2/02_KADARN_Implementation_Blueprint_v2.0.docx` | **ACTIVE_WITH_V2_CONSTRAINTS** | Modified by Ratified Minimal Schema (22 tables vs 45) |
| `v2/03_KADARN_Plan_Maestro_Realineacion_v2.0.docx` | **ACTIVE_WITH_V2_CONSTRAINTS** | Modified by Domain Simplification Review |

### Level 2 — Ratified Decisions

| Document | Status |
|----------|--------|
| `v2/realignment/review/final-gate/06_RATIFIED_MINIMAL_SCHEMA.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/01_CLAIM_EVIDENCE_RELATIONSHIP_DECISION.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/02_PROVENANCE_AUDIT_BOUNDARY.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/03_OBSERVATION_PROMOTION_POLICY.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/04_CLAIM_VERSIONING_DECISION.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/05_JSONB_GOVERNANCE_MATRIX.md` | **ACTIVE** |
| `v2/realignment/review/final-gate/00_FINAL_GATE_DECISION.md` | **ACTIVE** |

### Level 3 — Analysis (Explanatory, Not Normative)

| Document | Status |
|----------|--------|
| `v2/realignment/01_ARCHITECTURE_ALIGNMENT_AUDIT.md` | **HISTORICAL** (pre-simplification baseline) |
| `v2/realignment/02_GAP_ANALYSIS_REPORT.md` | **HISTORICAL** |
| `v2/realignment/03_IMPACT_MATRIX_KAD001_012.md` | **HISTORICAL** |
| `v2/realignment/04_MIGRATION_STRATEGY.md` | **HISTORICAL** (superseded by ratified sequence) |
| `v2/realignment/05_REFACTORING_BACKLOG.md` | **HISTORICAL** |
| `v2/realignment/06_MASTER_ROADMAP_v2.md` | **HISTORICAL** |
| `v2/realignment/review/01_DOMAIN_SIMPLIFICATION_REVIEW.md` | **HISTORICAL** |
| `v2/realignment/review/02_ENTITY_JUSTIFICATION_MATRIX.md` | **HISTORICAL** |
| `v2/realignment/review/03_TABLE_JUSTIFICATION_MATRIX.md` | **HISTORICAL** |
| `v2/realignment/review/04_BOUNDED_CONTEXT_REVIEW.md` | **HISTORICAL** |
| `v2/realignment/review/05_ARCHITECTURE_COMPLEXITY_REPORT.md` | **HISTORICAL** |
| `v2/realignment/review/06_MINIMAL_ARCHITECTURE_v2.md` | **HISTORICAL** |

### Level 4 — Existing Authority (Continued)

| Document | Status | Constraint |
|----------|--------|------------|
| KEMS-001 (Confidence Graph) | **ACTIVE_WITH_V2_CONSTRAINTS** | 8-dimension confidence replaces numeric score |
| KEMS-003 (Product Constitution v1) | **SUPERSEDED** | Replaced by Architecture Constitution v2 |
| ADR-002 (Multi-tenant) | **ACTIVE** | |
| ADR-011 (Evidence Core Boundary) | **ACTIVE_WITH_V2_CONSTRAINTS** | Must incorporate Source Intelligence |
| ADR-033 (Organization Membership) | **ACTIVE** | |
| `016_CANONICAL_ENTITY_SPECIFICATIONS.md` | **ACTIVE_WITH_V2_CONSTRAINTS** | Apply ratified schema decisions |
| `057_IMPLEMENTATION_BASELINE.md` | **SUPERSEDED** | Replaced by Sprint 0 baseline |

### Level 5 — Historical

| Document | Status |
|----------|--------|
| KEMS-002, 004–007 | **ACTIVE** (domain-specific, not contradicted) |
| ADRs 001–033 (except marked) | **HISTORICAL** or **ACTIVE** per ADR status |
| KAD-001→012 Implementation Reports | **HISTORICAL** (completed work, not superseded) |
| Phase 0.5–0.6 audit documents | **HISTORICAL** |

---

## Contradiction Resolution Rule

When two documents conflict:

1. Architecture Constitution v2 wins over all others.
2. Ratified Minimal Schema wins over Implementation Blueprint.
3. Final Gate Decisions win over Simplification Review.
4. Active ADRs win over historical analysis.
5. Anything not explicitly contradicted by the above remains valid.
