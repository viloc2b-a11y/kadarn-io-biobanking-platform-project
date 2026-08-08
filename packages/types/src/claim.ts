// ─── KAD-LOOP-003 — Canonical Claim Entity (Phase 1) ────────────────────
// Authority: KADARN Product Constitution, Evidence Core, LOOP-3 Spec
// Canonical Claim model. Supersedes legacy continuity_experience_claims.
//
// Phase 1 changes:
//   - Split the single ClaimStatus into four distinct status dimensions:
//       * ClaimLifecycleStatus  — spec-aligned lifecycle (7 values)
//       * ClaimWorkflowState    — maps 1:1 to DB `workflow_state` enum (7 values)
//       * ClaimVerificationStatus — legacy verification pipeline (renamed from ClaimStatus, deprecated)
//       * ClaimReviewStatus     — review gate state (4 values)
//   - Added LOOP-3 fields: claim_category, claim_scope, priority, version,
//     owner_id, source_event_id, lifecycle_status, review_status,
//     expires_at, superseded_by, supersession_reason.
//   - DB `claim_status` enum (active/archived/deprecated) is NOT touched —
//     it is frozen at 3 values by migration 045. Lifecycle status is a
//     TS-only overlay that the API layer maps onto the DB column.

import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────────────────

/**
 * Spec-aligned claim lifecycle.
 *
 * The 7-state lifecycle mandated by the LOOP-3 spec. This is a TS-only
 * overlay; it is NOT the DB `claim_status` enum (which is frozen at 3
 * values: active/archived/deprecated). The API/service layer is
 * responsible for mapping ClaimLifecycleStatus ↔ the DB column.
 *
 * States:
 *   - draft       — created, not yet submitted for review
 *   - review      — submitted, awaiting/under review
 *   - approved    — review passed, published
 *   - rejected    — review failed, terminal
 *   - superseded  — replaced by a newer version (see superseded_by)
 *   - expired     — passed expires_at, terminal
 *   - archived    — administratively archived, terminal
 *
 * Maps to: spec "Claim Lifecycle". NOT a DB column.
 */
export const ClaimLifecycleStatus = z.enum([
  'draft',
  'review',
  'approved',
  'rejected',
  'superseded',
  'expired',
  'archived',
])
export type ClaimLifecycleStatus = z.infer<typeof ClaimLifecycleStatus>

/**
 * Workflow state — maps 1:1 to the DB `workflow_state` enum
 * (migration 060, claim_workflow table).
 *
 * States:
 *   - draft            — created, no evidence yet
 *   - declared         — claim formally declared by the institution
 *   - pending_evidence — awaiting evidence submission
 *   - under_review     — in review queue
 *   - published        — review passed, publicly visible
 *   - disputed         — a dispute has been filed
 *   - archived         — administratively archived
 *
 * Maps to: DB column `claims.workflow_state` (enum, 7 values).
 */
export const ClaimWorkflowState = z.enum([
  'draft',
  'declared',
  'pending_evidence',
  'under_review',
  'published',
  'disputed',
  'archived',
])
export type ClaimWorkflowState = z.infer<typeof ClaimWorkflowState>

/**
 * Legacy verification pipeline status.
 *
 * This is the original `ClaimStatus` enum (7 values) representing the
 * evidence-verification pipeline. It DIVERGES from the DB `claim_status`
 * enum and from ClaimWorkflowState. Preserved for backward compatibility
 * with existing service code that references the verification stage of a
 * claim.
 *
 * @deprecated Since KAD-LOOP-003. New code should use
 *   {@link ClaimLifecycleStatus} for lifecycle and
 *   {@link ClaimWorkflowState} for DB workflow_state. This enum is kept
 *   only to avoid a breaking rename across services; do not introduce
 *   new usages.
 *
 * dashboard-next-best-action Phase A (design D2): this enum is demoted to
 * an INPUT SIGNAL only — a provenance entry such as "externally confirmed
 * by <reference>" (see {@link ProvenanceEntry} in claim-confidence.ts).
 * It MUST NOT be rendered as a Claim state or Confidence State on its own;
 * the canonical claim-level state is {@link DerivedClaimState}
 * (claim-derived-state.ts), derived from `workflow_state` + evidence, not
 * from this legacy pipeline.
 *
 * States:
 *   - self_reported       — asserted by the institution, no evidence
 *   - evidence_submitted  — at least one evidence item linked
 *   - reference_pending   — awaiting reference/counterparty confirmation
 *   - reference_confirmed — reference confirmed
 *   - kadarn_verified     — passed KADARN verification
 *   - rejected            — verification failed
 *   - expired             — passed expiry
 *
 * Maps to: no single DB column (legacy derived field).
 */
export const ClaimVerificationStatus = z.enum([
  'self_reported',
  'evidence_submitted',
  'reference_pending',
  'reference_confirmed',
  'kadarn_verified',
  'rejected',
  'expired',
])
export type ClaimVerificationStatus = z.infer<typeof ClaimVerificationStatus>

/**
 * Backward-compatible alias for {@link ClaimVerificationStatus}.
 * Preserved so existing imports of `ClaimStatus` keep compiling.
 * @deprecated Use {@link ClaimVerificationStatus} in new code.
 */
export const ClaimStatus = ClaimVerificationStatus
export type ClaimStatus = ClaimVerificationStatus

/**
 * Review gate status for a claim (LOOP-3 spec "Claim Review Status").
 *
 * States:
 *   - pending   — no review task created yet
 *   - in_review — at least one open review task
 *   - approved  — most recent review approved
 *   - rejected  — most recent review rejected
 *
 * Maps to: derived from `reviews` table (no direct DB column).
 */
export const ClaimReviewStatus = z.enum([
  'pending',
  'in_review',
  'approved',
  'rejected',
])
export type ClaimReviewStatus = z.infer<typeof ClaimReviewStatus>

/**
 * Scope of a claim — what the claim is about (LOOP-3 spec "Claim Scope").
 *
 * Values:
 *   - institution — about the institution as a whole
 *   - location    — about a specific location/facility
 *   - person      — about a specific person
 *
 * Maps to: derived from which of organization_id/location_id/person_id
 * is populated. Stored as a denormalized column for fast filtering.
 */
export const ClaimScope = z.enum(['institution', 'location', 'person'])
export type ClaimScope = z.infer<typeof ClaimScope>

/**
 * Priority of a claim (LOOP-3 spec "Claim Priority").
 *
 * Values:
 *   - low      — informational
 *   - medium   — standard
 *   - high     — elevated
 *   - critical — must be resolved before publication
 *
 * Maps to: `claims.priority` (text column, CHECK constraint).
 */
export const ClaimPriority = z.enum(['low', 'medium', 'high', 'critical'])
export type ClaimPriority = z.infer<typeof ClaimPriority>

/**
 * Category of a claim (LOOP-3 spec "Claim Category").
 *
 * Values:
 *   - regulatory  — regulatory compliance assertion
 *   - operational — operational capability/state assertion
 *   - competency  — competency assertion (people/process)
 *   - capability  — capability assertion (links to capabilities table)
 *   - compliance  — compliance attestation
 *
 * Maps to: `claims.claim_category` (text column).
 */
export const ClaimCategory = z.enum([
  'regulatory',
  'operational',
  'competency',
  'capability',
  'compliance',
])
export type ClaimCategory = z.infer<typeof ClaimCategory>

// ─── Canonical Claim Schema ─────────────────────────────────────────────

export const ClaimSchema = z.object({
  id: z.string().uuid(),

  // Identity & content
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),

  // Scope targets (at least organization_id required)
  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),

  // LOOP-3 classification fields
  claim_category: ClaimCategory.optional().nullable(),
  claim_scope: ClaimScope.optional().nullable(),
  priority: ClaimPriority.default('medium'),

  // Versioning & ownership (LOOP-3)
  version: z.number().int().min(1).default(1),
  owner_id: z.string().uuid().optional().nullable(),
  source_event_id: z.string().uuid().optional().nullable(),

  // Status dimensions
  workflow_state: ClaimWorkflowState.default('draft'),
  lifecycle_status: ClaimLifecycleStatus.default('draft'),
  review_status: ClaimReviewStatus.default('pending'),
  /** @deprecated Legacy verification pipeline. Use lifecycle_status + workflow_state. */
  verification_status: ClaimVerificationStatus.optional().nullable(),

  // Evidence
  evidence_count: z.number().int().min(0).default(0),

  // Lifecycle: expiration & supersession (LOOP-3)
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  superseded_by: z.string().uuid().optional().nullable(),
  supersession_reason: z.string().optional().nullable(),

  // Misc
  tags: z.string().optional().nullable(),
  created_by_actor_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type Claim = z.infer<typeof ClaimSchema>

// ─── Create / Update DTOs ───────────────────────────────────────────────

export const CreateClaimSchema = z.object({
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),

  claim_category: ClaimCategory.optional(),
  claim_scope: ClaimScope.optional(),
  priority: ClaimPriority.optional(),

  owner_id: z.string().uuid().optional(),
  source_event_id: z.string().uuid().optional(),

  expires_at: z.string().datetime({ offset: true }).optional(),
  tags: z.string().optional(),
})
export type CreateClaim = z.infer<typeof CreateClaimSchema>

export const UpdateClaimSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),

  claim_category: ClaimCategory.optional(),
  claim_scope: ClaimScope.optional(),
  priority: ClaimPriority.optional(),

  owner_id: z.string().uuid().optional(),
  source_event_id: z.string().uuid().optional(),

  workflow_state: ClaimWorkflowState.optional(),
  lifecycle_status: ClaimLifecycleStatus.optional(),
  review_status: ClaimReviewStatus.optional(),
  /** @deprecated Legacy. */
  verification_status: ClaimVerificationStatus.optional(),

  evidence_count: z.number().int().min(0).optional(),

  expires_at: z.string().datetime({ offset: true }).optional(),
  superseded_by: z.string().uuid().optional(),
  supersession_reason: z.string().optional(),

  tags: z.string().optional(),
})
export type UpdateClaim = z.infer<typeof UpdateClaimSchema>

// ─── Legacy compatibility ───────────────────────────────────────────────

/**
 * Legacy Capability type from workspace — maps to claim_type_id.
 * Kept for backward compatibility. New code should use claim_type_id directly.
 * @deprecated Use claim_type_id on Claim instead.
 */
export type ClaimLegacyType =
  | 'inventory'
  | 'collections'
  | 'experience_phase1'
  | 'experience_phase2'
  | 'experience_phase3'
  | 'experience_phase4'
  | 'site_capability'

// ─── Claim-Evidence Link (KAD-LOOP-CANONICALIZATION-001, Package D) ─────
// Relationship between a claim and an evidence node. Backed by the
// claim_evidence_links table (migration 078). NOTE: that table currently
// has no RLS policy — a known gap to be addressed in a later loop.

export const ClaimEvidenceRelationshipType = z.enum([
  'SUPPORTS',
  'PARTIALLY_SUPPORTS',
  'CONTRADICTS',
  'REQUIRES_REVIEW',
  'OBSOLETES',
])
export type ClaimEvidenceRelationship = z.infer<typeof ClaimEvidenceRelationshipType>

export const ClaimEvidenceLinkSchema = z.object({
  claim_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  relationship_type: ClaimEvidenceRelationshipType,
  tenant_id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  created_by: z.string().uuid().optional().nullable(),
  rationale: z.string().optional().nullable(),
  provenance: z.string().optional().nullable(),
})
export type ClaimEvidenceLink = z.infer<typeof ClaimEvidenceLinkSchema>
