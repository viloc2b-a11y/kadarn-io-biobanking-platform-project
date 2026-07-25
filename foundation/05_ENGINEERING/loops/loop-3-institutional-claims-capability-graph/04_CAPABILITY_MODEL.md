# KAD-LOOP-003 — Phase 4: Capability Model Report

## Objective
Implement canonical Capability entity with: ID, Name, Category, Description, Institution Scope, Status, Version, Evidence Sufficiency, Claim Count, Review Status, Confidence Placeholder.

## What Exists (Pre-LOOP-3)
- **DB table**: `capabilities` (migration 065)
- **DB enum**: `capability_status` (6: declared/evidence_submitted/under_review/verified/published/deprecated)
- **Types**: `InstitutionCapabilitySchema` (12 fields), `InstitutionCapabilityStatus` (6 values, matches DB)
- **1:1 link**: `primary_claim_id` → `claims.id`

## What Was Implemented

### Type Extensions
New fields on `InstitutionCapabilitySchema`:
- `evidence_sufficiency` — `EvidenceSufficiency` enum (6 values)
- `claim_count` — int, default 0
- `review_status` — `ClaimReviewStatus` (4 values)
- `confidence_score` — number 0-1, nullable (LOOP 4 placeholder)
- `confidence_placeholder` — deprecated alias of `confidence_score`

New enums:
- `EvidenceSufficiency`: sufficient/insufficient/conflicting/expired/superseded/manual_review_required (6)
- `CapabilityClaimRelationship`: primary/secondary/supporting/contradicting (4)

### M2M Link (replaces 1:1)
- **Migration 082**: `capability_claims` join table
- `CapabilityClaimLinkSchema`: capability_id, claim_id, relationship_type, weight, created_at, created_by
- `CreateCapabilityClaimLinkSchema`: DTO for creating links
- Backfill: existing `primary_claim_id` values migrated to M2M with `relationship_type='primary'`

### Repository
- `CapabilityRepository`: findById, findByOrganization, findByStatus, create, update, deprecate, findClaims, addClaimLink, removeClaimLink, updateEvidenceSufficiency

### Service
- `CapabilityService`: createCapability, updateCapability, deprecateCapability, linkClaim, unlinkClaim, getCapabilityWithClaims, listCapabilities, recalculateClaimCount

## Verification
- Typecheck: 0 errors
- `primary_claim_id` retained for backward compatibility (not removed)
- M2M is canonical source for LOOP-3; 1:1 is legacy

## Design Decisions
1. **`confidence_placeholder` is a slot, not a computed value** — LOOP 4 populates it
2. **`weight` on M2M links defaults to 0** — used by confidence calculator in LOOP 4
3. **`evidence_sufficiency` is qualitative, not numeric** — deterministic evaluator output, not a score
4. **`primary_claim_id` not removed** — backward compat with existing API routes
