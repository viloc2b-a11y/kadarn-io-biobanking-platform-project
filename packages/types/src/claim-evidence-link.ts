// ─── KADARN v2 — Sprint 2: Claim–Evidence Link Types ──────────────────
import { z } from 'zod'

export const EvidenceLinkRole = z.enum(['supports', 'contradicts', 'qualifies'])
export type EvidenceLinkRole = z.infer<typeof EvidenceLinkRole>

export const LinkReviewStatus = z.enum(['pending', 'accepted', 'rejected'])
export type LinkReviewStatus = z.infer<typeof LinkReviewStatus>

export const ClaimEvidenceLinkSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  role: EvidenceLinkRole.default('supports'),
  weight: z.number().min(0).max(1).default(1.0),
  valid_from: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  review_status: LinkReviewStatus.default('pending'),
  revoked_at: z.string().datetime({ offset: true }).optional().nullable(),
  revoked_by: z.string().uuid().optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ClaimEvidenceLink = z.infer<typeof ClaimEvidenceLinkSchema>

export const CreateClaimEvidenceLinkSchema = z.object({
  claim_id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  role: EvidenceLinkRole.default('supports'),
  weight: z.number().min(0).max(1).default(1.0),
})
export type CreateClaimEvidenceLink = z.infer<typeof CreateClaimEvidenceLinkSchema>

// ─── Epistemic Type ──────────────────────────────────────────────────────
export const EpistemicType = z.enum(['observation', 'direct_claim', 'derived_claim', 'inference'])
export type EpistemicType = z.infer<typeof EpistemicType>
