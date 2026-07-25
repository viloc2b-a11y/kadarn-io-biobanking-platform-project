// ─── KAD-007 — Confidence ────────────────────────────────────────────────
// Authority: KADARN Product Constitution KEMS-001 §2 Component D
// Confidence is a computed score derived from evidence weight and review verification.

import { z } from 'zod'

export const ConfidenceLevel = z.enum(['low', 'medium', 'high', 'very_high', 'maximum'])
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>

export const ConfidenceScoreSchema = z.object({
  claim_id: z.string().uuid(),
  overall_score: z.number().min(0).max(1),
  level: ConfidenceLevel,
  evidence_count: z.number().int().min(0),
  reviewed_count: z.number().int().min(0),
  weighted_score: z.number().min(0).max(1),
  decay_adjusted_score: z.number().min(0).max(1),
  breakdown: z.array(z.object({
    evidence_class: z.string(),
    weight: z.number().min(0).max(1),
    count: z.number().int().min(0),
    score: z.number().min(0).max(1),
  })),
  computed_at: z.string().datetime({ offset: true }),
})
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>

export const ConfidenceStateSnapshotSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  overall_score: z.number().min(0).max(1).optional().nullable(),
  level: ConfidenceLevel.optional().nullable(),
  breakdown: z.any().optional().nullable(),
  computed_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ConfidenceStateSnapshot = z.infer<typeof ConfidenceStateSnapshotSchema>
