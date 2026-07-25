# KAD-LOOP-004 — Phase 3: Eligibility Engine

## Purpose
Deterministic gate before any confidence calculation. Prevents misleading scores when inputs are insufficient.

## Eligibility States

| State | Meaning |
|---|---|
| ELIGIBLE | All checks pass, can proceed to calculation |
| ELIGIBLE_WITH_WARNINGS | Minor issues detected (e.g., some reviews pending) |
| MANUAL_REVIEW_REQUIRED | Conditions require human validation |
| NOT_ELIGIBLE | Hard blockers prevent scoring |

## Checks (9 total, all evaluated — no short-circuit)

1. **Capability exists** — query capabilities table
2. **Tenant ownership** — capability belongs to requesting tenant
3. **Required claims exist** — via capability_claims join table
4. **Claims eligible** — lifecycle_status in (approved, published)
5. **Reviews complete** — review_tasks with status='completed' for linked claims
6. **Evidence sufficiency** — capabilities.evidence_sufficiency is set
7. **Evidence valid** — no invalidated evidence_nodes
8. **No contradictions** — no CONTRADICTS in claim_evidence_links
9. **Model active** — confidence_models.status = 'active'

## Key Rule
When NOT_ELIGIBLE: DO NOT produce a misleading numeric score.
The scoring engine creates a failed assessment with blockers instead.

## Service
`ConfidenceEligibilityService.evaluateEligibility(capabilityId, modelId) → EligibilityResult`