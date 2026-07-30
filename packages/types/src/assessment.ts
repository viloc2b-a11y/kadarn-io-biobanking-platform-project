// ─── Block 03-A — Assessment Engine Domain Model ──────────────────────────
// Authority: Architecture Alignment Audit v2, Block 03-A Assessment Engine
//
// Formal assessment model for institution-level evaluations.
// An Assessment groups per-capability AssessmentResults, each of which
// may surface Gaps (deficiencies) with proposed Mitigations.
// All entities are institution-scoped via RLS.

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Type of assessment run.
 */
export const AssessmentType = z.enum([
  'readiness',
  'confidence',
  'gap_analysis',
])
export type AssessmentType = z.infer<typeof AssessmentType>

/**
 * Assessment run lifecycle status.
 * NOTE: Distinct from confidence.AssessmentStatus (which governs confidence
 * assessment processing). This enum tracks the overall assessment engine run.
 */
export const AssessmentRunStatus = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
])
export type AssessmentRunStatus = z.infer<typeof AssessmentRunStatus>

/**
 * Confidence in a single assessment result.
 */
export const AssessmentConfidenceLevel = z.enum([
  'low',
  'medium',
  'high',
  'very_high',
])
export type AssessmentConfidenceLevel = z.infer<typeof AssessmentConfidenceLevel>

/**
 * Gap classification — what kind of deficiency was found.
 */
export const GapType = z.enum([
  'evidence_gap',
  'documentation_gap',
  'capability_gap',
  'staffing_gap',
  'infrastructure_gap',
  'compliance_gap',
  'process_gap',
])
export type GapType = z.infer<typeof GapType>

/**
 * Gap severity.
 */
export const GapSeverity = z.enum([
  'critical',
  'high',
  'medium',
  'low',
])
export type GapSeverity = z.infer<typeof GapSeverity>

/**
 * Mitigation lifecycle status.
 */
export const MitigationStatus = z.enum([
  'proposed',
  'approved',
  'in_progress',
  'completed',
  'rejected',
])
export type MitigationStatus = z.infer<typeof MitigationStatus>

// ═══════════════════════════════════════════════════════════════════════
// ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Top-level assessment record. Groups per-capability results produced
 * during a single evaluation run against an institution.
 */
export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  institution_id: z.string().uuid(),
  assessment_type: AssessmentType,
  status: AssessmentRunStatus.default('pending'),
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  results_summary: z.record(z.string(), z.unknown()).optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type Assessment = z.infer<typeof AssessmentSchema>

export const CreateAssessmentSchema = z.object({
  institution_id: z.string().uuid(),
  assessment_type: AssessmentType,
  status: AssessmentRunStatus.optional(),
  started_at: z.string().datetime({ offset: true }).optional(),
  results_summary: z.record(z.string(), z.unknown()).optional(),
})
export type CreateAssessment = z.infer<typeof CreateAssessmentSchema>

export const UpdateAssessmentSchema = z.object({
  status: AssessmentRunStatus.optional(),
  started_at: z.string().datetime({ offset: true }).optional(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  results_summary: z.record(z.string(), z.unknown()).optional(),
})
export type UpdateAssessment = z.infer<typeof UpdateAssessmentSchema>

// ═══════════════════════════════════════════════════════════════════════
// ASSESSMENT RESULT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-capability result within an assessment. Each row scores one
 * capability with a confidence level and gaps snapshot.
 */
export const AssessmentResultSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  capability_id: z.string().uuid().optional().nullable(),
  score: z.number().min(0).max(1).optional().nullable(),
  confidence_level: AssessmentConfidenceLevel.optional().nullable(),
  gaps_summary: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>

export const CreateAssessmentResultSchema = z.object({
  assessment_id: z.string().uuid(),
  capability_id: z.string().uuid().optional(),
  score: z.number().min(0).max(1).optional(),
  confidence_level: AssessmentConfidenceLevel.optional(),
  gaps_summary: z.record(z.string(), z.unknown()).optional(),
})
export type CreateAssessmentResult = z.infer<typeof CreateAssessmentResultSchema>

export const UpdateAssessmentResultSchema = z.object({
  score: z.number().min(0).max(1).optional(),
  confidence_level: AssessmentConfidenceLevel.optional(),
  gaps_summary: z.record(z.string(), z.unknown()).optional(),
})
export type UpdateAssessmentResult = z.infer<typeof UpdateAssessmentResultSchema>

// ═══════════════════════════════════════════════════════════════════════
// GAP
// ═══════════════════════════════════════════════════════════════════════

/**
 * A shortfall or deficiency discovered during an assessment result.
 * Each gap can have one or more mitigations proposed.
 */
export const GapSchema = z.object({
  id: z.string().uuid(),
  assessment_result_id: z.string().uuid(),
  gap_type: GapType.optional().nullable(),
  description: z.string().optional().nullable(),
  severity: GapSeverity.default('medium'),
  mitigation_summary: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type Gap = z.infer<typeof GapSchema>

export const CreateGapSchema = z.object({
  assessment_result_id: z.string().uuid(),
  gap_type: GapType.optional(),
  description: z.string().optional(),
  severity: GapSeverity.optional(),
  mitigation_summary: z.string().optional(),
})
export type CreateGap = z.infer<typeof CreateGapSchema>

export const UpdateGapSchema = z.object({
  gap_type: GapType.optional(),
  description: z.string().optional(),
  severity: GapSeverity.optional(),
  mitigation_summary: z.string().optional().nullable(),
})
export type UpdateGap = z.infer<typeof UpdateGapSchema>

// ═══════════════════════════════════════════════════════════════════════
// MITIGATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * A concrete action proposed to close or reduce a gap.
 * Multiple mitigations can target the same gap.
 */
export const MitigationSchema = z.object({
  id: z.string().uuid(),
  gap_id: z.string().uuid(),
  description: z.string().optional().nullable(),
  effort_estimate: z.string().optional().nullable(),
  status: MitigationStatus.default('proposed'),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type Mitigation = z.infer<typeof MitigationSchema>

export const CreateMitigationSchema = z.object({
  gap_id: z.string().uuid(),
  description: z.string().optional(),
  effort_estimate: z.string().optional(),
  status: MitigationStatus.optional(),
})
export type CreateMitigation = z.infer<typeof CreateMitigationSchema>

export const UpdateMitigationSchema = z.object({
  description: z.string().optional(),
  effort_estimate: z.string().optional().nullable(),
  status: MitigationStatus.optional(),
})
export type UpdateMitigation = z.infer<typeof UpdateMitigationSchema>
