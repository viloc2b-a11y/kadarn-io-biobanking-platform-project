// ─── KAD-011 — Readiness ─────────────────────────────────────────────────
// Authority: Foundation Library — Discovery Readiness Specification
// Composite institutional readiness score used for sponsor discovery.

import { z } from 'zod'

export const ReadinessDimensionSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
  weight: z.number().min(0).max(1),
  reason: z.string().optional(),
})
export type ReadinessDimension = z.infer<typeof ReadinessDimensionSchema>

export const ReadinessScoreSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  overall_score: z.number().min(0).max(1),
  profile_completeness: z.number().min(0).max(1).optional().nullable(),
  evidence_coverage: z.number().min(0).max(1).optional().nullable(),
  credential_validity: z.number().min(0).max(1).optional().nullable(),
  operational_metrics: z.number().min(0).max(1).optional().nullable(),
  recruitment_capability: z.number().min(0).max(1).optional().nullable(),
  passport_completeness: z.number().min(0).max(1).optional().nullable(),
  breakdown: z.any().optional().nullable(),
  computed_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
})
export type ReadinessScore = z.infer<typeof ReadinessScoreSchema>

export type ReadinessLevel = 'low' | 'medium' | 'high' | 'very_high'

export function computeReadinessLevel(score: number): ReadinessLevel {
  if (score >= 0.85) return 'very_high'
  if (score >= 0.65) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

export const ComputeReadinessResponseSchema = z.object({
  overall_score: z.number().min(0).max(1),
  level: z.enum(['low', 'medium', 'high', 'very_high']),
  dimensions: z.array(ReadinessDimensionSchema),
  computed_at: z.string().datetime({ offset: true }),
})
export type ComputeReadinessResponse = z.infer<typeof ComputeReadinessResponseSchema>
