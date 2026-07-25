// ─── KAD-004 — Canonical Claim Entity ───────────────────────────────────
// Authority: KADARN Product Constitution, Evidence Core
// Canonical Claim model. Supersedes legacy continuity_experience_claims.

import { z } from 'zod'

export const ClaimStatus = z.enum([
  'self_reported',
  'evidence_submitted',
  'reference_pending',
  'reference_confirmed',
  'kadarn_verified',
  'rejected',
  'expired',
])
export type ClaimStatus = z.infer<typeof ClaimStatus>

export const ClaimSchema = z.object({
  id: z.string().uuid(),
  claim_type_id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),
  workflow_state: ClaimStatus.default('self_reported'),
  evidence_count: z.number().int().min(0).optional().nullable(),
  tags: z.string().optional().nullable(),
  created_by_actor_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type Claim = z.infer<typeof ClaimSchema>

export const CreateClaimSchema = z.object({
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  tags: z.string().optional(),
})

export type CreateClaim = z.infer<typeof CreateClaimSchema>

export const UpdateClaimSchema = CreateClaimSchema.partial().extend({
  workflow_state: ClaimStatus.optional(),
  evidence_count: z.number().int().min(0).optional(),
})

export type UpdateClaim = z.infer<typeof UpdateClaimSchema>

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

// ─── Claim-Evidence Link (KAD-LOOP-CANONICALIZATION-001, Package D) ───
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
