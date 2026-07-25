# KAD-LOOP-004 — Phase 1: Confidence Domain Model

## Entities

| Entity | Table | Purpose |
|---|---|---|
| Confidence Model | `confidence_models` | Governed methodology. Versioned, immutable once active. |
| Confidence Rule | `confidence_rules` | Explicit scoring/eligibility rule. Belongs to model. |
| Confidence Assessment | `confidence_assessments` | Immutable capability-level result with hash. |
| Confidence Factor | `confidence_factors` | One contribution or penalty. Traceable to rule + entity. |
| Confidence Blocker | `confidence_blockers` | Condition preventing scoring. Separate from factors. |

## Key Enums

| Enum | Values | Count |
|---|---|---|
| ConfidenceBand | UNASSESSED, VERY_LOW, LOW, MODERATE, HIGH, VERY_HIGH | 6 |
| EligibilityState | ELIGIBLE, ELIGIBLE_WITH_WARNINGS, MANUAL_REVIEW_REQUIRED, NOT_ELIGIBLE | 4 |
| BlockerType | missing_required_claim, unreviewed_claim, conflicting_evidence, expired_evidence, rejected_evidence, stale_source, incomplete_review, insufficient_coverage, inactive_model, cross_tenant_inconsistency | 10 |
| ReadinessState | not_ready, partially_ready, ready, conditionally_ready | 4 |

## Migrations
- 086: Core enums + confidence_models + confidence_rules tables
- 087: confidence_assessments + factors + blockers tables
- 088: RLS for assessment sub-tables

## Design Decisions
1. DB `confidence_level` (045, 4 values) kept unchanged — new `ConfidenceBand` (6 values) is the LOOP-4 standard
2. All assessments are immutable — no UPDATE path
3. Factors and blockers are separate tables for independent querying
4. Input/output hashing enables deterministic replay verification