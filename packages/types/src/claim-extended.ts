// ─── KAD-CLAIM-EXTENDED — Extended Claim Types ──────────────────────────
// Authority: KEMS Site Profile Production Spec, LOOP-3 Extended Spec
//
// Extends the canonical Claim model (claim.ts) with additional fields
// required by the KEMS production pipeline: actor attribution,
// authority basis, entity/location linkage, temporal windows,
// visibility controls, and dependency/conflict tracking.
//
// ClaimExtended does NOT replace ClaimSchema — it is a superset used
// in contexts where the full KEMS metadata surface is needed.
// When only the canonical LOOP-3 fields are required, use ClaimSchema
// from claim.ts directly.

import { z } from 'zod'
import {
  ClaimCategory,
  ClaimScope,
  ClaimPriority,
  ClaimLifecycleStatus,
  ClaimWorkflowState,
  ClaimReviewStatus,
  ClaimVerificationStatus,
} from './claim'

// ─── Enums ──────────────────────────────────────────────────────────────

/**
 * ClaimState — full 14-state lifecycle for the KEMS production pipeline.
 *
 * Extends the 7-state ClaimLifecycleStatus with KEMS-specific
 * intermediate states for progressive interview, evidence gathering,
 * and verification workflows.
 *
 * States (14 total):
 *   - draft              — created, not yet submitted for review
 *   - declared           — formally asserted by the institution
 *   - pending_evidence   — awaiting evidence submission
 *   - evidence_gathered  — evidence submitted, awaiting verification
 *   - under_review       — in review queue
 *   - review_escalated   — review requires escalation
 *   - disputed           — a dispute has been filed
 *   - resolved           — dispute resolved
 *   - verified           — verification passed
 *   - approved           — review passed, ready for publication
 *   - published          — publicly visible
 *   - rejected           — review/verification failed
 *   - superseded         — replaced by a newer version
 *   - archived           — administratively retired
 */
export const ClaimState = z.enum([
  'draft',
  'declared',
  'pending_evidence',
  'evidence_gathered',
  'under_review',
  'review_escalated',
  'disputed',
  'resolved',
  'verified',
  'approved',
  'published',
  'rejected',
  'superseded',
  'archived',
])
export type ClaimState = z.infer<typeof ClaimState>

/**
 * ClaimType — how the claim was established.
 *
 * 5 types covering the full range of claim provenance:
 *   - SELF_DECLARED            — asserted by the institution directly
 *   - DOCUMENT_DERIVED         — extracted/derived from a document
 *   - EXTERNALLY_ASSERTED      — asserted by an external authority
 *   - OPERATIONALLY_OBSERVED   — observed from operational data
 *   - SYSTEM_INFERRED          — inferred by the system (AI/rule)
 */
export const ClaimType = z.enum([
  'SELF_DECLARED',
  'DOCUMENT_DERIVED',
  'EXTERNALLY_ASSERTED',
  'OPERATIONALLY_OBSERVED',
  'SYSTEM_INFERRED',
])
export type ClaimType = z.infer<typeof ClaimType>

/**
 * Visibility of a claim in the KEMS system.
 */
export const ClaimVisibility = z.enum([
  'internal',
  'restricted',
  'public',
  'registry',
])
export type ClaimVisibility = z.infer<typeof ClaimVisibility>

/**
 * Relationship type for claim dependencies.
 */
export const ClaimDependencyType = z.enum([
  'blocks',
  'requires',
  'supersedes',
  'contradicts',
  'qualifies',
  'corroborates',
])
export type ClaimDependencyType = z.infer<typeof ClaimDependencyType>

/**
 * Resolution status for claim conflicts.
 */
export const ClaimConflictStatus = z.enum([
  'open',
  'under_review',
  'resolved',
  'dismissed',
  'escalated',
])
export type ClaimConflictStatus = z.infer<typeof ClaimConflictStatus>

// ─── ClaimExtended ──────────────────────────────────────────────────────

/**
 * Extended claim with KEMS production fields.
 *
 * Builds on ClaimSchema from claim.ts. Fields that overlap with
 * ClaimSchema are documented; new KEMS-specific fields carry the
 * @kems annotation.
 */
export const ClaimExtendedSchema = z.object({
  // ── Base identity (canonical from ClaimSchema) ──
  id: z.string().uuid(),
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),

  // ── Scope targets ──
  organization_id: z.string().uuid(),

  // ── @kems: Claiming actor — who is making this claim ──
  claiming_actor: z.string().uuid().optional().nullable(),

  // ── @kems: Authority basis — what gives this claim legitimacy ──
  authority_basis: z.string().optional().nullable(),

  // ── @kems: Entity classification ──
  entity_type: z.string().min(1).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),

  // ── Location linkage ──
  location_id: z.string().uuid().optional().nullable(),

  // ── @kems: Full statement text ──
  statement: z.string().optional().nullable(),

  // ── @kems: Known limitations / caveats ──
  limitations: z.array(z.string()).default([]),

  // ── Classification (canonical) ──
  claim_category: ClaimCategory.optional().nullable(),
  claim_scope: ClaimScope.optional().nullable(),
  priority: ClaimPriority.default('medium'),

  // ── @kems: Claim type provenance ──
  claim_type: ClaimType.optional().nullable(),

  // ── @kems: Canonical claim code (stable identifier) ──
  canonical_claim_code: z.string().optional().nullable(),

  // ── Temporal windows ──
  valid_from: z.string().datetime({ offset: true }).optional().nullable(),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  review_due_at: z.string().datetime({ offset: true }).optional().nullable(),

  // ── Visibility ──
  visibility: ClaimVisibility.default('internal'),

  // ── Status dimensions ──
  workflow_state: ClaimWorkflowState.default('draft'),
  lifecycle_status: ClaimLifecycleStatus.default('draft'),
  review_status: ClaimReviewStatus.default('pending'),
  /** @kems Extended 14-state lifecycle; superset of lifecycle_status. */
  claim_state: ClaimState.default('draft'),
  /** @deprecated Legacy verification pipeline. */
  verification_status: ClaimVerificationStatus.optional().nullable(),

  // ── Versioning & ownership ──
  version: z.number().int().min(1).default(1),
  owner_id: z.string().uuid().optional().nullable(),
  source_event_id: z.string().uuid().optional().nullable(),

  // ── Evidence ──
  evidence_count: z.number().int().min(0).default(0),

  // ── Supersession ──
  superseded_by: z.string().uuid().optional().nullable(),
  supersession_reason: z.string().optional().nullable(),

  // ── Misc ──
  tags: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_by_actor_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ClaimExtended = z.infer<typeof ClaimExtendedSchema>

// ─── ClaimVersion (KEMS extended variant) ───────────────────────────────

/**
 * Extended immutable claim version snapshot.
 *
 * Differs from claim-version.ts ClaimVersionSchema by including
 * KEMS-specific extended fields: claiming_actor, authority_basis,
 * entity_type, entity_id, statement, limitations, canonical_claim_code,
 * claim_type, visibility, claim_state.
 */
export const ClaimExtendedVersionSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  version: z.number().int().min(1),

  // Snapshot of extended claim fields
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),

  organization_id: z.string().uuid(),
  claiming_actor: z.string().uuid().optional().nullable(),
  authority_basis: z.string().optional().nullable(),
  entity_type: z.string().min(1).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid().optional().nullable(),
  statement: z.string().optional().nullable(),
  limitations: z.array(z.string()).default([]),

  claim_category: ClaimCategory.optional().nullable(),
  claim_scope: ClaimScope.optional().nullable(),
  priority: ClaimPriority.optional().nullable(),
  claim_type: ClaimType.optional().nullable(),
  canonical_claim_code: z.string().optional().nullable(),

  workflow_state: ClaimWorkflowState,
  lifecycle_status: ClaimLifecycleStatus,
  review_status: ClaimReviewStatus,
  claim_state: ClaimState,
  verification_status: ClaimVerificationStatus.optional().nullable(),
  visibility: ClaimVisibility,

  evidence_count: z.number().int().min(0).default(0),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  review_due_at: z.string().datetime({ offset: true }).optional().nullable(),
  superseded_by: z.string().uuid().optional().nullable(),
  supersession_reason: z.string().optional().nullable(),

  tags: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_by_actor_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ClaimExtendedVersion = z.infer<typeof ClaimExtendedVersionSchema>

// ─── ClaimAttestation ───────────────────────────────────────────────────

/**
 * A signed attestation on a claim, similar to ProfileAttestation
 * but scoped to claims. Tracks who attested what and when.
 */
export const ClaimAttestationSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  claim_version_id: z.string().uuid().optional().nullable(),
  organization_id: z.string().uuid(),

  // Who attested
  attester_id: z.string().uuid(),
  attester_role: z.string().optional().nullable(),

  // What was attested
  attestation_type: z.string().min(1),
  statement: z.string().optional().nullable(),
  attestation_scope: z.array(z.string()).default([]),

  // Verification
  signature_ref: z.string().optional().nullable(),
  verified_by: z.string().uuid().optional().nullable(),
  verification_method: z.string().optional().nullable(),

  // Audit
  attested_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ClaimAttestation = z.infer<typeof ClaimAttestationSchema>

// ─── ClaimDependency ────────────────────────────────────────────────────

/**
 * A directed dependency between two claims.
 * claim A → claim B means A depends on B (e.g., A requires B to be verified first).
 */
export const ClaimDependencySchema = z.object({
  id: z.string().uuid(),
  source_claim_id: z.string().uuid(),
  target_claim_id: z.string().uuid(),
  dependency_type: ClaimDependencyType,
  rationale: z.string().optional().nullable(),
  weight: z.number().min(0).max(1).default(0.5),
  is_transitive: z.boolean().default(false),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ClaimDependency = z.infer<typeof ClaimDependencySchema>

// ─── ClaimConflict ──────────────────────────────────────────────────────

/**
 * A recorded conflict between two claims that cannot both be true.
 */
export const ClaimConflictSchema = z.object({
  id: z.string().uuid(),
  claim_a_id: z.string().uuid(),
  claim_b_id: z.string().uuid(),
  conflict_type: z.string().min(1),
  description: z.string().optional().nullable(),
  status: ClaimConflictStatus.default('open'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  detected_by: z.string().uuid().optional().nullable(),
  detected_at: z.string().datetime({ offset: true }),
  resolved_by: z.string().uuid().optional().nullable(),
  resolved_at: z.string().datetime({ offset: true }).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ClaimConflict = z.infer<typeof ClaimConflictSchema>

// ─── ClaimReconfirmation ────────────────────────────────────────────────

/**
 * Periodic reconfirmation requirement for a claim.
 * Tracks when a claim needs to be re-verified or re-attested.
 */
export const ClaimReconfirmationSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Schedule
  interval_months: z.number().int().min(1),
  next_due_at: z.string().datetime({ offset: true }),
  last_confirmed_at: z.string().datetime({ offset: true }).optional().nullable(),

  // Status
  status: z.enum(['scheduled', 'overdue', 'in_progress', 'completed', 'waived']).default('scheduled'),

  // Who is responsible
  assignee_id: z.string().uuid().optional().nullable(),
  confirmation_method: z.string().optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ClaimReconfirmation = z.infer<typeof ClaimReconfirmationSchema>

// ─── Create / Update DTOs ───────────────────────────────────────────────

export const CreateClaimExtendedSchema = z.object({
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  organization_id: z.string().uuid(),
  claiming_actor: z.string().uuid().optional(),
  authority_basis: z.string().optional(),
  entity_type: z.string().min(1).optional(),
  entity_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  statement: z.string().optional(),
  limitations: z.array(z.string()).optional(),
  claim_category: ClaimCategory.optional(),
  claim_scope: ClaimScope.optional(),
  priority: ClaimPriority.optional(),
  claim_type: ClaimType.optional(),
  canonical_claim_code: z.string().optional(),
  valid_from: z.string().datetime({ offset: true }).optional(),
  expires_at: z.string().datetime({ offset: true }).optional(),
  review_due_at: z.string().datetime({ offset: true }).optional(),
  visibility: ClaimVisibility.optional(),
  owner_id: z.string().uuid().optional(),
  source_event_id: z.string().uuid().optional(),
  tags: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateClaimExtended = z.infer<typeof CreateClaimExtendedSchema>
