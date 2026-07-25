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
