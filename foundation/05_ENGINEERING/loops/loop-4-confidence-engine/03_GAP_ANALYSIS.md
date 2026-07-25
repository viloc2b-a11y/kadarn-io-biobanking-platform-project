# KAD-LOOP-004 — Phase 0: Gap Analysis

## Critical Gaps (Must Build)

| # | Gap | Priority | Impact |
|---|---|---|---|
| 1 | No capability-level confidence calculator | CRITICAL | Core LOOP-4 deliverable |
| 2 | No Confidence Model entity (governed methodology) | CRITICAL | Required for versioned, reproducible assessments |
| 3 | No Confidence Rule entity (explicit scoring rules) | CRITICAL | Hidden business rules scattered in route handlers |
| 4 | No Confidence Assessment entity (immutable result) | CRITICAL | No audit trail for scores |
| 5 | No input eligibility gate | CRITICAL | Scores produced without checking preconditions |
| 6 | No deterministic replay capability | CRITICAL | Cannot verify past assessments |
| 7 | No stale detection | CRITICAL | Changes to evidence/claims silently invalidate scores |
| 8 | No confidence banding at capability level | HIGH | Only numeric 0-1 placeholder |
| 9 | No scoring dimensions decomposition | HIGH | All current scoring is opaque weighted averages |
| 10 | No penalty/blocker framework | HIGH | Contradictions, expired evidence not systematically penalized |

## Integration Gaps

| # | Gap | Status |
|---|---|---|
| 11 | EvidenceSufficiencyService → numeric confidence | Needs bridge (categorical → numeric) |
| 12 | KnowledgeGraph coverage → confidence dimensions | Needs connector |
| 13 | Review outcomes → confidence gate | `confidence_review` type exists, no service uses it |
| 14 | CapabilityClaimLink.weight → aggregation | weight defaults to 0, never populated |

## Reconciliation Required

| # | Issue | Resolution |
|---|---|---|
| 15 | DB `confidence_level` (4 values) ≠ TS `ConfidenceLevel` (5 values) | Adopt TS enum, migrate DB enum |
| 16 | `confidence_score` on Capability is 0-1 but legacy is 0-100 | LOOP-4 should use 0-1 internally, display as 0-100 |
| 17 | Three scattered confidence domains (claim, legacy, capability) | Unify under capability-level assessment as canonical |

## Missing Infrastructure

| # | Gap |
|---|---|
| 18 | No ConfidenceModelRepository |
| 19 | No ConfidenceRuleRepository |
| 20 | No ConfidenceAssessmentRepository |
| 21 | No ConfidenceFactorRepository |
| 22 | No ConfidenceBlockerRepository |
| 23 | No ConfidenceCalculationService |
| 24 | No ConfidenceReplayService |
| 25 | No ConfidenceStalenessService |
| 26 | No ConfidenceExplanationService |
| 27 | No confidence-specific API endpoints |

## UI Gaps

| # | Gap |
|---|---|
| 28 | No confidence band visualization |
| 29 | No contributing factors breakdown |
| 30 | No penalty/blocker display |
| 31 | No assessment history view |
| 32 | No replay result view |
| 33 | No stale assessment indicator |
| 34 | No institution confidence summary |

## Migration Requirements (Starting at 086)

| # | New Artifact | Purpose |
|---|---|---|
| 35 | `confidence_model` enum (status: draft/active/deprecated/retired) | Model lifecycle |
| 36 | `confidence_models` table | Governed methodology |
| 37 | `confidence_rules` table | Explicit scoring rules |
| 38 | `confidence_assessments` table | Immutable results |
| 39 | `confidence_factors` table | Per-assessment contributions |
| 40 | `confidence_blockers` table | Blocking conditions |
| 41 | Reconcile `confidence_level` DB enum with TS `ConfidenceLevel` | Remove divergence |
| 42 | RLS on all new tables | Tenant isolation |

## Total Gaps: 42

18 critical, 12 high, 12 medium. All must be resolved before LOOP-4 exit criteria are met.