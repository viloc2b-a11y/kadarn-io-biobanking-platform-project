// ─── KAD-LOOP-003 — Capability Entity (Phase 1) ─────────────────────────
// Authority: Foundation Library, KEMS-001, LOOP-3 Spec
//
// Phase 1 changes:
//   - Added EvidenceSufficiency enum (6 values) and `evidence_sufficiency`
//     field on InstitutionCapabilitySchema.
//   - Added `claim_count` (int), `review_status`, and
//     `confidence_placeholder` (number 0-1, nullable — populated in LOOP 4).
//   - Added CapabilityClaimLinkSchema for the M2M join between capabilities
//     and claims (replaces the 1:1 primary_claim_id-only link for LOOP-3).
//   - `primary_claim_id` retained for backward compatibility.
//   - No confidence calculation here — that is LOOP 4. The
//     `confidence_placeholder` field is a slot, not a computed value.

import { z } from 'zod'
import {
  ClaimReviewStatus,
} from './claim'

// ─── Enums ──────────────────────────────────────────────────────────────

/**
 * Capability status — maps 1:1 to the DB `capability_status` enum
 * (migration 065, capabilities table, 6 values).
 *
 * States:
 *   - declared          — asserted by the institution, no evidence
 *   - evidence_submitted — at least one evidence item linked
 *   - under_review      — in review queue
 *   - verified          — review passed
 *   - published         — publicly visible
 *   - deprecated        — administratively retired
 *
 * Maps to: DB column `capabilities.status` (enum, 6 values).
 */
export const InstitutionCapabilityStatus = z.enum([
  'declared',
  'evidence_submitted',
  'under_review',
  'verified',
  'published',
  'deprecated',
])
export type InstitutionCapabilityStatus = z.infer<typeof InstitutionCapabilityStatus>

/**
 * Evidence sufficiency for a capability (LOOP-3 spec).
 *
 * A roll-up of how the linked evidence supports the capability. This is
 * NOT a confidence score (that is LOOP 4); it is a qualitative
 * assessment of whether the evidence base is adequate.
 *
 * Values:
 *   - sufficient              — enough evidence of adequate weight
 *   - insufficient            — not enough evidence
 *   - conflicting             — evidence contradicts the claim
 *   - expired                 — all linked evidence has expired
 *   - superseded             — all linked evidence has been superseded
 *   - manual_review_required — cannot auto-classify; needs a human
 *
 * Maps to: `capabilities.evidence_sufficiency` (text column).
 */
export const EvidenceSufficiency = z.enum([
  'sufficient',
  'insufficient',
  'conflicting',
  'expired',
  'superseded',
  'manual_review_required',
])
export type EvidenceSufficiency = z.infer<typeof EvidenceSufficiency>

/**
 * Relationship between a capability and a claim in the M2M link table
 * (LOOP-3 spec "CapabilityClaimRelationship").
 *
 * Values:
 *   - primary       — this claim is the primary assertion of the capability
 *   - secondary     — this claim supports the capability but is not primary
 *   - supporting    — this claim provides supporting/contextual evidence
 *   - contradicting — this claim contradicts the capability
 *
 * Maps to: `capability_claim_links.relationship_type` (text column).
 */
export const CapabilityClaimRelationship = z.enum([
  'primary',
  'secondary',
  'supporting',
  'contradicting',
])
export type CapabilityClaimRelationship = z.infer<typeof CapabilityClaimRelationship>

// ─── Capability Schema ──────────────────────────────────────────────────

export const InstitutionCapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  capability_type_id: z.string().uuid().optional().nullable(),
  domain: z.string().optional().nullable(),
  organization_id: z.string().uuid(),

  // Legacy 1:1 link — retained for backward compatibility. The M2M
  // capability_claim_links table is the canonical source for LOOP-3.
  primary_claim_id: z.string().uuid().optional().nullable(),

  // Status & review
  status: InstitutionCapabilityStatus.default('declared'),
  review_status: ClaimReviewStatus.default('pending'),

  // Evidence roll-up (LOOP-3)
  evidence_sufficiency: EvidenceSufficiency.optional().nullable(),
  claim_count: z.number().int().min(0).default(0),

  // Confidence (LOOP 4 placeholder — NOT computed in LOOP-3)
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  /** @deprecated Alias of confidence_score; renamed for LOOP-4 clarity. */
  confidence_placeholder: z.number().min(0).max(1).optional().nullable(),

  // Timestamps
  first_declared_at: z.string().datetime({ offset: true }),
  last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type InstitutionCapability = z.infer<typeof InstitutionCapabilitySchema>

// ─── Create / Update DTOs ───────────────────────────────────────────────

export const CreateInstitutionCapabilitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  capability_type_id: z.string().uuid().optional(),
  domain: z.string().optional(),
  organization_id: z.string().uuid(),
  primary_claim_id: z.string().uuid().optional(),
})
export type CreateInstitutionCapability = z.infer<typeof CreateInstitutionCapabilitySchema>

export const UpdateInstitutionCapabilitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  capability_type_id: z.string().uuid().optional(),
  domain: z.string().optional(),
  primary_claim_id: z.string().uuid().optional(),

  status: InstitutionCapabilityStatus.optional(),
  review_status: ClaimReviewStatus.optional(),
  evidence_sufficiency: EvidenceSufficiency.optional(),
  claim_count: z.number().int().min(0).optional(),

  confidence_score: z.number().min(0).max(1).optional(),
  confidence_placeholder: z.number().min(0).max(1).optional(),

  last_verified_at: z.string().datetime({ offset: true }).optional(),
})
export type UpdateInstitutionCapability = z.infer<typeof UpdateInstitutionCapabilitySchema>

// ─── Capability ↔ Claim M2M Link (LOOP-3) ───────────────────────────────
// Replaces the 1:1 primary_claim_id relationship as the canonical join
// for LOOP-3. A capability can be backed by many claims, each with a
// relationship type and a weight (used by the confidence calculator in
// LOOP 4 — left unset/0 in LOOP-3).

export const CapabilityClaimLinkSchema = z.object({
  id: z.string().uuid(),
  capability_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  relationship_type: CapabilityClaimRelationship,
  /** Weight 0-1 for confidence aggregation (LOOP 4). Defaults to 0 in LOOP-3. */
  weight: z.number().min(0).max(1).default(0),
  created_at: z.string().datetime({ offset: true }),
  created_by: z.string().uuid().optional().nullable(),
})
export type CapabilityClaimLink = z.infer<typeof CapabilityClaimLinkSchema>

export const CreateCapabilityClaimLinkSchema = z.object({
  capability_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  relationship_type: CapabilityClaimRelationship,
  weight: z.number().min(0).max(1).optional(),
})
export type CreateCapabilityClaimLink = z.infer<typeof CreateCapabilityClaimLinkSchema>

// ─── Capability State (Block 02-C: Temporal Tracking) ───────────────────
// Authority: Architecture Alignment Audit v2, Block 02-C
//
// Each capability has a chronological chain of state records.
// When a capability transitions (declared → documented → verified),
// a new row is inserted and the previous row's valid_until is set.
//
// The state enum values:
//   - declared   — capability asserted by the institution, not yet backed
//   - documented — capability has documentation/evidence submitted
//   - verified   — capability has been independently verified/reviewed
//
// Maps to: DB `capability_state_type` enum (migration 092).

export const CapabilityStateType = z.enum([
  'declared',
  'documented',
  'verified',
])
export type CapabilityStateType = z.infer<typeof CapabilityStateType>

export const CapabilityStateSchema = z.object({
  id: z.string().uuid(),
  capability_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  state: CapabilityStateType,
  valid_from: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  evidence_summary: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type CapabilityState = z.infer<typeof CapabilityStateSchema>

export const CreateCapabilityStateSchema = z.object({
  capability_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  state: CapabilityStateType,
  valid_from: z.string().datetime({ offset: true }).optional(),
  evidence_summary: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateCapabilityState = z.infer<typeof CreateCapabilityStateSchema>

export const UpdateCapabilityStateSchema = z.object({
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  evidence_summary: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type UpdateCapabilityState = z.infer<typeof UpdateCapabilityStateSchema>

// ─── KEMS Extension: Capability Lifecycle State (8 states) ─────────────
// Authority: KEMS Site Profile Production Spec
//
// Extended 8-state lifecycle for capabilities in the KEMS production
// pipeline. Supersedes the 3-state CapabilityStateType for KEMS workflows.
//
// States:
//   - declared           — asserted by the institution, no evidence
//   - evidence_submitted — at least one evidence item linked
//   - evidence_reviewed  — evidence has passed review
//   - under_review       — in review queue
//   - verified           — independent verification passed
//   - published          — publicly visible
//   - suspended          — temporarily inactive
//   - deprecated         — administratively retired
export const CapabilityLifecycleState = z.enum([
  'declared',
  'evidence_submitted',
  'evidence_reviewed',
  'under_review',
  'verified',
  'published',
  'suspended',
  'deprecated',
])
export type CapabilityLifecycleState = z.infer<typeof CapabilityLifecycleState>

// ─── CapabilityArea ────────────────────────────────────────────────────

/**
 * Functional area / domain classification for capabilities.
 *
 * Values:
 *   - clinical_operations    — clinical service delivery
 *   - quality_management     — quality assurance & improvement
 *   - regulatory_compliance  — regulatory adherence
 *   - workforce              — staffing, training, credentialing
 *   - infrastructure         — facilities, equipment, IT
 *   - data_management        — data governance, reporting
 *   - patient_experience     — patient-facing services
 *   - financial_operations   — billing, contracts, revenue cycle
 *   - research               — clinical trials, investigator sites
 *   - other                  — uncategorized / custom
 */
export const CapabilityArea = z.enum([
  'clinical_operations',
  'quality_management',
  'regulatory_compliance',
  'workforce',
  'infrastructure',
  'data_management',
  'patient_experience',
  'financial_operations',
  'research',
  'other',
])
export type CapabilityArea = z.infer<typeof CapabilityArea>

// ─── CapabilityInstance ────────────────────────────────────────────────

/**
 * A KEMS-extended capability instance, adding production-pipeline
 * fields to the base InstitutionCapability model. Includes area
 * classification, dependency tracking, activation events, and
 * readiness contributions.
 */
export const CapabilityInstanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  capability_type_id: z.string().uuid().optional().nullable(),
  area: CapabilityArea.optional().nullable(),
  domain: z.string().optional().nullable(),
  organization_id: z.string().uuid(),

  // M2M claim link (primary for backward compat)
  primary_claim_id: z.string().uuid().optional().nullable(),

  // Extended lifecycle
  status: InstitutionCapabilityStatus.default('declared'),
  lifecycle_state: CapabilityLifecycleState.default('declared'),
  review_status: ClaimReviewStatus.default('pending'),

  // Evidence roll-up
  evidence_sufficiency: EvidenceSufficiency.optional().nullable(),
  claim_count: z.number().int().min(0).default(0),

  // Confidence (LOOP 4 placeholder)
  confidence_score: z.number().min(0).max(1).optional().nullable(),

  // Dependency tracking
  dependency_count: z.number().int().min(0).default(0),
  dependency_status: z.enum(['satisfied', 'partial', 'unsatisfied', 'not_applicable']).optional().nullable(),

  // Activation tracking
  last_activated_at: z.string().datetime({ offset: true }).optional().nullable(),
  activation_count: z.number().int().min(0).default(0),

  // Readiness contribution (placeholder for LOOP 4)
  readiness_contribution: z.number().min(0).max(1).optional().nullable(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),

  // Timestamps
  first_declared_at: z.string().datetime({ offset: true }),
  last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type CapabilityInstance = z.infer<typeof CapabilityInstanceSchema>

// ─── CapabilityDependencyStatus ────────────────────────────────────────

/**
 * Tracks the satisfaction status of a capability's dependencies.
 * A capability may depend on other capabilities being verified first.
 */
export const CapabilityDependencyStatusSchema = z.object({
  id: z.string().uuid(),
  capability_id: z.string().uuid(),
  depends_on_capability_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Dependency type
  dependency_type: z.enum([
    'requires',
    'recommends',
    'enhances',
    'supersedes',
  ]).default('requires'),

  // Status
  status: z.enum(['satisfied', 'partial', 'unsatisfied', 'waived']).default('unsatisfied'),
  satisfied_at: z.string().datetime({ offset: true }).optional().nullable(),

  // Weight for readiness aggregation
  weight: z.number().min(0).max(1).default(0.5),

  // Notes
  rationale: z.string().optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type CapabilityDependencyStatus = z.infer<typeof CapabilityDependencyStatusSchema>

// ─── CapabilityActivationEvent ─────────────────────────────────────────

/**
 * Records each activation event for a capability.
 * Activation confirms the capability is operationally live.
 */
export const CapabilityActivationEventSchema = z.object({
  id: z.string().uuid(),
  capability_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Activation details
  activation_type: z.enum([
    'initial',
    'renewal',
    'reactivation',
    'upgrade',
    'transfer',
  ]).default('initial'),

  // Who activated
  activated_by: z.string().uuid().optional().nullable(),
  activation_method: z.string().optional().nullable(),

  // State before/after
  previous_state: CapabilityLifecycleState.optional().nullable(),
  new_state: CapabilityLifecycleState.optional().nullable(),

  // Evidence
  evidence_ref: z.string().uuid().optional().nullable(),
  activation_summary: z.string().optional().nullable(),

  // Validity window
  valid_from: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),

  // Audit
  created_at: z.string().datetime({ offset: true }),
})
export type CapabilityActivationEvent = z.infer<typeof CapabilityActivationEventSchema>

// ─── ReadinessContribution ─────────────────────────────────────────────

/**
 * How a capability contributes to overall organizational readiness.
 * Aggregated in LOOP 4 for readiness scoring.
 */
export const ReadinessContributionSchema = z.object({
  id: z.string().uuid(),
  capability_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Contribution value (placeholder for LOOP 4)
  contribution_value: z.number().min(0).max(1).default(0),

  // Confidence in this contribution
  confidence: z.number().min(0).max(1).default(0),

  // Weight of this capability in the readiness calculation
  weight: z.number().min(0).max(1).default(0.5),

  // Classification
  contribution_area: CapabilityArea.optional().nullable(),
  contribution_type: z.enum([
    'core',
    'supporting',
    'enhancing',
    'required',
    'optional',
  ]).default('supporting'),

  // Evidence backing
  evidence_count: z.number().int().min(0).default(0),
  evidence_weighted_score: z.number().min(0).max(1).optional().nullable(),

  // Notes
  rationale: z.string().optional().nullable(),

  // Temporal
  computed_at: z.string().datetime({ offset: true }),

  // Audit
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ReadinessContribution = z.infer<typeof ReadinessContributionSchema>

// ─── Create DTOs ───────────────────────────────────────────────────────

export const CreateCapabilityInstanceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  capability_type_id: z.string().uuid().optional(),
  area: CapabilityArea.optional(),
  domain: z.string().optional(),
  organization_id: z.string().uuid(),
  primary_claim_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateCapabilityInstance = z.infer<typeof CreateCapabilityInstanceSchema>
