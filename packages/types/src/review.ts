// ─── KAD-006 — Review Workflow ──────────────────────────────────────────
// Authority: KADARN Product Constitution

import { z } from 'zod'

export const ReviewStatus = z.enum([
  'pending',
  'in_progress',
  'approved',
  'rejected_with_modifications',
  'rejected',
  'withdrawn',
])
export type ReviewStatus = z.infer<typeof ReviewStatus>

export const ReviewDecision = z.enum(['approved', 'rejected', 'needs_more_evidence', 'not_applicable'])
export type ReviewDecision = z.infer<typeof ReviewDecision>

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_id: z.string().uuid().optional().nullable(),
  reviewer_id: z.string().uuid(),
  status: ReviewStatus.default('pending'),
  decision: ReviewDecision.optional().nullable(),
  comments: z.string().optional().nullable(),
  reviewer_notes: z.string().optional().nullable(),
  assigned_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type Review = z.infer<typeof ReviewSchema>

export const CreateReviewSchema = z.object({
  organization_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_id: z.string().uuid().optional(),
  reviewer_id: z.string().uuid(),
  comments: z.string().optional(),
})
export type CreateReview = z.infer<typeof CreateReviewSchema>

export const UpdateReviewSchema = z.object({
  status: ReviewStatus.optional(),
  decision: ReviewDecision.optional(),
  comments: z.string().optional(),
  reviewer_notes: z.string().optional(),
  completed_at: z.string().datetime({ offset: true }).optional(),
})
export type UpdateReview = z.infer<typeof UpdateReviewSchema>
