// ─── KAD-006 — Review Workflow ──────────────────────────────────────────
// Authority: KADARN Product Constitution
// KAD-LOOP-002: Aligned ReviewStatus to DB review_task_status, added review fields.

import { z } from 'zod'

export const ReviewTaskType = z.enum([
  'classification',
  'extraction_review',
  'evidence_review',
  'confidence_review',
  'publication_review',
  'dispute_review',
])
export type ReviewTaskType = z.infer<typeof ReviewTaskType>

export const ReviewTaskStatus = z.enum([
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'cancelled',
])
export type ReviewTaskStatus = z.infer<typeof ReviewTaskStatus>

export const ReviewDecision = z.enum(['approved', 'rejected', 'needs_more_evidence', 'not_applicable'])
export type ReviewDecision = z.infer<typeof ReviewDecision>

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_node_id: z.string().uuid().optional().nullable(),
  task_type: ReviewTaskType,
  status: ReviewTaskStatus.default('pending'),
  assigned_to: z.string().uuid().optional().nullable(),
  assigned_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_by: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  // KAD-LOOP-002 fields (migration 080)
  review_outcome: ReviewDecision.optional().nullable(),
  required_actions: z.array(z.record(z.string(), z.unknown())).default([]),
  evidence_snapshot: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  created_by: z.string().uuid().optional().nullable(),
})
export type Review = z.infer<typeof ReviewSchema>

export const CreateReviewSchema = z.object({
  organization_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_node_id: z.string().uuid().optional(),
  task_type: ReviewTaskType.default('evidence_review'),
  assigned_to: z.string().uuid().optional(),
  notes: z.string().optional(),
})
export type CreateReview = z.infer<typeof CreateReviewSchema>

export const UpdateReviewSchema = z.object({
  status: ReviewTaskStatus.optional(),
  review_outcome: ReviewDecision.optional(),
  notes: z.string().optional(),
  required_actions: z.array(z.record(z.string(), z.unknown())).optional(),
  completed_at: z.string().datetime({ offset: true }).optional(),
  completed_by: z.string().uuid().optional(),
})
export type UpdateReview = z.infer<typeof UpdateReviewSchema>
