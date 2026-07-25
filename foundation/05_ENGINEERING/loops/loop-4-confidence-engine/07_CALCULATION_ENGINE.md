# KAD-LOOP-004 — Phases 4-9: Calculation, Dimensions, Penalties, Replay, Staleness, Services

## Calculation Engine (Phase 4)

17-step deterministic pipeline in `ConfidenceCalculationService.calculate()`:

1. Resolve active model
2. Resolve effective rules
3. Load capability + linked claims
4. Load claim evidence
5. Load claim reviews
6. Load evidence sufficiency
7. Exclude invalid inputs (expired/superseded evidence, rejected claims)
8. Apply positive factors
9. Apply penalties
10. Apply blockers (blocking_behavior=true → prevent scoring)
11. Normalize to 0-1
12. Assign band: <0.2 VERY_LOW, <0.4 LOW, <0.6 MODERATE, <0.8 HIGH, >=0.8 VERY_HIGH
13. Determine readiness (blockers→not_ready, penalties→partially_ready, else ready)
14. Hash input snapshot (SHA-256)
15. Hash output (SHA-256)
16. Persist immutable assessment
17. Persist factors and blockers

## Scoring Dimensions (Phase 5)

| Dimension | Description | Source |
|---|---|---|
| Evidence Coverage | Claims with sufficient evidence ÷ total required claims | CapabilityClaimLink + evidence sufficiency |
| Evidence Quality | Weighted by evidence class | EvidenceClassEnum |
| Review Completeness | Completed reviews ÷ required reviews | review_tasks |
| Freshness | Evidence not expired relative to assessment date | evidence_nodes.expires_at |
| Consistency | No contradictory evidence | ClaimEvidenceLink.CONTRADICTS |
| Claim Completeness | Required claims exist and are approved | Claim lifecycle status |
| Source Diversity | Independent/distinct sources | SourceRecord distinct count |
| Governance Integrity | Lineage, provenance, rule versions complete | Audit metadata |

Weights belong to the Confidence Model version — not hard-coded in services.

## Penalties & Blockers (Phase 6)

| Penalty | Effect | Rule Category |
|---|---|---|
| Expired evidence | Reduces score | freshness |
| Superseded evidence | Reduces score | freshness |
| Incomplete review | Reduces score | review_completeness |
| Unresolved contradiction | Reduces score | consistency |
| Low-authority evidence | Reduces score | evidence_quality |
| Single-source dependency | Reduces score | source_diversity |
| Missing provenance | Reduces score | governance_integrity |
| Stale claim | Reduces score | freshness |
| Manual assertion | Reduces score | evidence_quality |

| Blocker | Blocks Scoring | Rule Category |
|---|---|---|
| No required claims | Yes | claim_completeness |
| All evidence invalidated | Yes | evidence_coverage |
| Critical contradiction | Yes | consistency |
| Inactive model | Yes | governance_integrity |
| Cross-tenant inconsistency | Yes | governance_integrity |
| Missing provenance (critical) | Yes | governance_integrity |

## Replay (Phase 7)

`ConfidenceReplayService.replay(assessmentId) → ConfidenceReplayResult`

Compares: model version, rule versions, input hash, score, band, factors, blockers, output hash. Returns explicit match/mismatch. Never replaces original.

## Staleness Detection (Phase 8)

`ConfidenceStalenessService.detectStale(assessmentId) → { stale, reasons[] }`

Detects changes in: capability, capability-claim links, claim status/version, evidence lifecycle, review outcomes, source supersession, model version, rule versions. Historical assessments never deleted.

## Services (Phase 9)

| Service | Files | Purpose |
|---|---|---|
| ConfidenceEligibilityService | confidence-eligibility-service.ts (453 lines) | 9-check eligibility gate |
| ConfidenceCalculationService | confidence-calculation-service.ts (810 lines) | 17-step pipeline |
| ConfidenceReplayService | confidence-replay-service.ts (~200 lines) | Deterministic verification |
| ConfidenceStalenessService | confidence-staleness-service.ts (275 lines) | Upstream change detection |
| ConfidenceExplanationService | confidence-explanation-service.ts (~200 lines) | Deterministic prose from facts |
| ConfidenceScoringEngine | confidence-scoring-engine.ts (286 lines) | Orchestrator tying all services