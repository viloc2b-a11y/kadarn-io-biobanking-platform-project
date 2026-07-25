# KAD-LOOP-004 — Phase 0: Current State Report

**Date:** 2026-07-25 | **Branch:** `feat/loop-4-confidence` (from master, post LOOP-3 merge) | **Migration head:** 085

---

## 1. CAPABILITY MODEL

| Item | Details |
|---|---|
| `InstitutionCapabilityStatus` | 6 values: declared, evidence_submitted, under_review, verified, published, deprecated |
| `EvidenceSufficiency` | 6 values: sufficient, insufficient, conflicting, expired, superseded, manual_review_required |
| `CapabilityClaimRelationship` | 4 values: primary, secondary, supporting, contradicting |
| `confidence_score` | number(0-1), optional/nullable — **placeholder for LOOP-4** |
| `confidence_placeholder` | @deprecated alias of confidence_score |
| `evidence_sufficiency` | EvidenceSufficiency.optional().nullable() |
| `review_status` | ClaimReviewStatus.default('pending') |
| `claim_count` | int.min(0).default(0) |
| `CapabilityClaimLink.weight` | 0-1, defaults to 0 (intended for LOOP-4 aggregation) |

**Gaps**: No confidence_band, no confidence_computed_at, no confidence calculation logic.

---

## 2. CLAIM LIFECYCLE

| Enum | Values | Maps To |
|---|---|---|
| ClaimLifecycleStatus (7) | draft, review, approved, rejected, superseded, expired, archived | TS-only overlay |
| ClaimWorkflowState (7) | draft, declared, pending_evidence, under_review, published, disputed, archived | DB workflow_state |
| ClaimVerificationStatus (7) | self_reported, evidence_submitted, ..., expired (@deprecated) | Legacy pipeline |
| ClaimReviewStatus (4) | pending, in_review, approved, rejected | reviews table |
| ClaimScope (3) | institution, location, person | |
| ClaimPriority (4) | low, medium, high, critical | |
| ClaimCategory (5) | regulatory, operational, competency, capability, compliance | |

Key fields: workflow_state, lifecycle_status, review_status, evidence_count, expires_at, superseded_by.

---

## 3. CLAIM REVIEW STATE

| Enum | Values |
|---|---|
| ReviewTaskType (6) | classification, extraction_review, evidence_review, **confidence_review**, publication_review, dispute_review |
| ReviewTaskStatus (5) | pending, in_progress, completed, skipped, cancelled |
| ReviewDecision (4) | approved, rejected, needs_more_evidence, not_applicable |

`confidence_review` task type exists — explicit LOOP-4 hook. `review_outcome`, `required_actions`, `evidence_snapshot` added by migration 080.

---

## 4. EVIDENCE SUFFICIENCY SERVICE

`EvidenceSufficiencyService` (485 lines) — deterministic 6-rule evaluator:
1. No evidence → insufficient
2. All expired → expired
3. All superseded → superseded
4. Any CONTRADICTS → conflicting
5. Manual review flagged → manual_review_required
6. Otherwise → sufficient

**Gaps**: No numeric scores, no review-state consideration, no freshness/decay model, no confidence integration.

---

## 5. KNOWLEDGE GRAPH

`KnowledgeGraphService` (1,127 lines): forward traversal, reverse traversal, CoverageStats (totalCapabilities, totalClaims, totalEvidence, claimsWithEvidence, claimsWithoutEvidence, capabilitiesWithClaims, capabilitiesWithoutClaims, evidenceByClass).

**Gaps**: No confidence-specific methods, no conflict detection graph, no freshness/staleness in nodes.

---

## 6. EXISTING CONFIDENCE FIELDS

| Location | Field | Type | Status |
|---|---|---|---|
| capability.ts | confidence_score | number(0-1) | Placeholder slot |
| capability.ts | confidence_placeholder | number(0-1) | @deprecated alias |
| confidence.ts | ConfidenceLevel | 5 values (low/medium/high/very_high/maximum) | Claim-level |
| confidence.ts | ConfidenceScoreSchema | Full computed score | Claim-scoped |
| phase8/confidence.ts | ConfidenceState | Derived state contract | Phase 8 |
| Migration 043 | confidence_score | INTEGER(0-100) | Legacy column |
| Migration 045 | confidence_level enum | high/moderate/low/insufficient (4) | DB enum — **DIVERGES from TS** |
| Migration 045 | confidence_state_snapshots | Append-only | Reusable pattern |
| Migration 053 | minimum_confidence | NUMERIC(3,2) | Readiness threshold |
| Migration 054 | overall_confidence | NUMERIC(3,2) | Readiness evaluation |

**Key Finding: Three distinct confidence domains:**
1. **Claim-level** (ConfidenceScore) — KAD-007, weighted evidence classes + review coverage
2. **Legacy continuity** (continuity_experience_claims) — verification-status-based integer 0-100
3. **Capability-level** (confidence_score) — placeholder, NOT computed. **Target for LOOP-4.**

---

## 7. LEGACY SCORE IMPLEMENTATIONS

| Implementation | File | Algorithm | Scope |
|---|---|---|---|
| Claim confidence API | claims/[id]/confidence/route.ts | Weighted evidence classes × 0.6 + review × 0.4 | Per-claim |
| Legacy continuity | continuity-claim-service.ts (DEPRECATED) | Verification status → 0-100 | Per-claim |
| Readiness evaluate | readiness/evaluate/route.ts | mandatoryMet/mandatoryTotal | Per-institution |
| Institution readiness | institutions/[id]/readiness/route.ts | 6 dimensions weighted | Per-institution |
| Site passport score | continuity-claim-service.ts | 5 components weighted | Per-site |

**All scoring logic is scattered across route handlers. No centralized confidence service exists.**

---

## 8. PASSPORT DEPENDENCIES

Passport has NO own confidence concept. It:
- Consumes claim-level confidence from `evaluateClaim()` 
- Displays legacy `confidence_score` from continuity_experience_claims
- Has NO `passport_score` field
- `passport_completeness` dimension is count-based, not confidence-based

**Passport is a downstream consumer — it will display LOOP-4 capability confidence once available.**

---

## 9. UI REFERENCES

| Page | What It Shows |
|---|---|
| Capabilities page | `confidence_score` (when not null), evidence_sufficiency badges, status badges |
| Continuity page | Legacy `Confidence: {claim.confidence_score}` |
| Site passport page | `Confidence {claim.confidence_score}/100` |

**Gaps**: No confidence band visualization, no trends, no explanation component, no governance/freshness indicators.

---

## 10. MIGRATION ARTIFACTS (001-085)

Key confidence-related tables: `confidence_state_snapshots` (045), `readiness_capability_requirements` (053), `readiness_evaluations` (054).

**Critical mismatch**: DB `confidence_level` (4: high/moderate/low/insufficient) ≠ TS `ConfidenceLevel` (5: low/medium/high/very_high/maximum). LOOP-4 must reconcile.

---

## 11. REUSABLE ASSETS

- `CapabilityClaimLink.weight` (0-1) — direct input
- `EvidenceSufficiencyService` — input signal
- `KnowledgeGraphService.getCoverageStats()` — input signal
- `ReviewSchema.review_outcome` — gate
- `ClaimReviewStatus` — pending reduces confidence
- `ClaimLifecycleStatus` (expired, superseded) — freshness signal
- `ConfidenceLevel` enum (TS) — needs Capability-level adaptation
- `confidence_state_snapshots` table — append-only pattern
- UI Capabilities page — already renders confidence_score