// ─── KAD-LOOP-004 — Confidence Engine Domain Model ─────────────────────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// LOOP-4 adds capability-level confidence entities alongside the existing
// claim-level ConfidenceScore (KAD-007).
//
// Key design decisions:
//   - New ConfidenceBand enum (6 values) is separate from the existing
//     ConfidenceLevel (5 values). Both coexist until reconciliation in
//     a future migration pass.
//   - All assessment entities are immutable once persisted.
//   - Every score must have an audit trail (factors + blockers + hash).

import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Confidence band — governs how a numeric score maps to a category.
 * These bands are capability-scoped (unlike the claim-level ConfidenceLevel).
 *
 * Values:
 *   - UNASSESSED  — no assessment has been performed
 *   - VERY_LOW    — 0–19
 *   - LOW         — 20–39
 *   - MODERATE    — 40–59
 *   - HIGH        — 60–79
 *   - VERY_HIGH   — 80–100
 *
 * Maps to: confidence_assessments.confidence_band (enum, 6 values).
 */
export const ConfidenceBand = z.enum([
  'UNASSESSED',
  'VERY_LOW',
  'LOW',
  'MODERATE',
  'HIGH',
  'VERY_HIGH',
])
export type ConfidenceBand = z.infer<typeof ConfidenceBand>

/**
 * Lifecycle status for a Confidence Model (governed methodology).
 *
 * Values:
 *   - draft     — being authored, not yet ready for use
 *   - active    — current methodology, used for new assessments
 *   - deprecated — replaced by a newer version, existing assessments preserved
 *   - retired   — no longer valid, all assessments superseded
 */
export const ConfidenceModelStatus = z.enum([
  'draft',
  'active',
  'deprecated',
  'retired',
])
export type ConfidenceModelStatus = z.infer<typeof ConfidenceModelStatus>

/**
 * Lifecycle status for a Confidence Rule.
 */
export const ConfidenceRuleStatus = z.enum([
  'draft',
  'active',
  'deprecated',
  'retired',
])
export type ConfidenceRuleStatus = z.infer<typeof ConfidenceRuleStatus>

/**
 * Category of a confidence rule — which scoring dimension it belongs to.
 */
export const ConfidenceRuleCategory = z.enum([
  'evidence_coverage',
  'evidence_quality',
  'review_completeness',
  'freshness',
  'consistency',
  'claim_completeness',
  'source_diversity',
  'governance_integrity',
])
export type ConfidenceRuleCategory = z.infer<typeof ConfidenceRuleCategory>

/**
 * Effect type of a rule on the confidence score.
 *   - positive  — adds to score
 *   - penalty   — subtracts from score
 *   - blocker   — prevents scoring entirely
 */
export const ConfidenceRuleEffectType = z.enum([
  'positive',
  'penalty',
  'blocker',
])
export type ConfidenceRuleEffectType = z.infer<typeof ConfidenceRuleEffectType>

/**
 * Eligibility state returned by the eligibility gate.
 */
export const EligibilityState = z.enum([
  'ELIGIBLE',
  'ELIGIBLE_WITH_WARNINGS',
  'MANUAL_REVIEW_REQUIRED',
  'NOT_ELIGIBLE',
])
export type EligibilityState = z.infer<typeof EligibilityState>

/**
 * Readiness state for a capability assessment.
 */
export const ReadinessState = z.enum([
  'not_ready',
  'partially_ready',
  'ready',
  'conditionally_ready',
])
export type ReadinessState = z.infer<typeof ReadinessState>

/**
 * Assessment status for a confidence assessment.
 */
export const AssessmentStatus = z.enum([
  'pending',
  'completed',
  'failed',
  'superseded',
])
export type AssessmentStatus = z.infer<typeof AssessmentStatus>

/**
 * Factor type in a confidence breakdown.
 */
export const FactorType = z.enum([
  'positive_factor',
  'penalty',
])
export type FactorType = z.infer<typeof FactorType>

/**
 * Blocker type — what condition is preventing scoring.
 */
export const BlockerType = z.enum([
  'missing_required_claim',
  'unreviewed_claim',
  'conflicting_evidence',
  'expired_evidence',
  'rejected_evidence',
  'stale_source',
  'incomplete_review',
  'insufficient_coverage',
  'inactive_model',
  'cross_tenant_inconsistency',
])
export type BlockerType = z.infer<typeof BlockerType>

// ═══════════════════════════════════════════════════════════════════════
// CONFIDENCE MODEL
// ═══════════════════════════════════════════════════════════════════════

/**
 * A governed Confidence Model — the methodology for computing confidence.
 * Models are versioned and immutable once active.
 */
export const ConfidenceModelSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  version: z.number().int().min(1),
  status: ConfidenceModelStatus.default('draft'),
  owner_id: z.string().uuid().optional().nullable(),
  effective_from: z.string().datetime({ offset: true }),
  effective_until: z.string().datetime({ offset: true }).optional().nullable(),
  methodology: z.string().min(1),
  minimum_data_requirements: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deprecated_at: z.string().datetime({ offset: true }).optional().nullable(),
})
export type ConfidenceModel = z.infer<typeof ConfidenceModelSchema>

export const CreateConfidenceModelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  tenant_id: z.string().uuid(),
  owner_id: z.string().uuid().optional(),
  effective_from: z.string().datetime({ offset: true }),
  effective_until: z.string().datetime({ offset: true }).optional(),
  methodology: z.string().min(1),
  minimum_data_requirements: z.string().optional(),
})
export type CreateConfidenceModel = z.infer<typeof CreateConfidenceModelSchema>

export const UpdateConfidenceModelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: ConfidenceModelStatus.optional(),
  methodology: z.string().min(1).optional(),
  minimum_data_requirements: z.string().optional(),
  effective_until: z.string().datetime({ offset: true }).optional(),
})
export type UpdateConfidenceModel = z.infer<typeof UpdateConfidenceModelSchema>

// ═══════════════════════════════════════════════════════════════════════
// CONFIDENCE RULE
// ═══════════════════════════════════════════════════════════════════════

/**
 * An explicit scoring or eligibility rule belonging to a Confidence Model.
 * Rules are versioned and effective-dated.
 */
export const ConfidenceRuleSchema = z.object({
  id: z.string().uuid(),
  confidence_model_id: z.string().uuid(),
  rule_key: z.string().min(1),
  version: z.number().int().min(1),
  category: ConfidenceRuleCategory,
  description: z.string().min(1),
  input_requirements: z.string().optional().nullable(),
  condition: z.string().min(1),
  effect_type: ConfidenceRuleEffectType,
  effect_value: z.number().min(0).max(100),
  priority: z.number().int().default(0),
  blocking_behavior: z.boolean().default(false),
  effective_from: z.string().datetime({ offset: true }),
  effective_until: z.string().datetime({ offset: true }).optional().nullable(),
  status: ConfidenceRuleStatus.default('draft'),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ConfidenceRule = z.infer<typeof ConfidenceRuleSchema>

export const CreateConfidenceRuleSchema = z.object({
  confidence_model_id: z.string().uuid(),
  rule_key: z.string().min(1),
  category: ConfidenceRuleCategory,
  description: z.string().min(1),
  input_requirements: z.string().optional(),
  condition: z.string().min(1),
  effect_type: ConfidenceRuleEffectType,
  effect_value: z.number().min(0).max(100),
  priority: z.number().int().optional(),
  blocking_behavior: z.boolean().optional(),
  effective_from: z.string().datetime({ offset: true }),
  effective_until: z.string().datetime({ offset: true }).optional(),
})
export type CreateConfidenceRule = z.infer<typeof CreateConfidenceRuleSchema>

export const UpdateConfidenceRuleSchema = z.object({
  description: z.string().min(1).optional(),
  condition: z.string().min(1).optional(),
  effect_value: z.number().min(0).max(100).optional(),
  priority: z.number().int().optional(),
  blocking_behavior: z.boolean().optional(),
  effective_until: z.string().datetime({ offset: true }).optional(),
  status: ConfidenceRuleStatus.optional(),
})
export type UpdateConfidenceRule = z.infer<typeof UpdateConfidenceRuleSchema>

// ═══════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — KAD-007 Claim-Level Confidence
// ═══════════════════════════════════════════════════════════════════════

/**
 * Legacy claim-level confidence score (KAD-007).
 * @deprecated Since KAD-LOOP-004. New code should use ConfidenceAssessment
 *   for capability-level confidence. This schema is preserved for backward
 *   compatibility with the /claims/[id]/confidence API endpoint.
 */
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
  created_at: z.string().datetime({ offset: true }).optional().nullable(),
})
// ═══════════════════════════════════════════════════════════════════════

/**
 * An immutable confidence assessment for a capability.
 * Once created, the score, factors, and blockers are frozen.
 */
export const ConfidenceAssessmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  institution_id: z.string().uuid(),
  capability_id: z.string().uuid(),
  confidence_model_id: z.string().uuid(),
  model_version: z.number().int().min(1),

  // Core result
  score: z.number().min(0).max(1),
  confidence_band: ConfidenceBand,
  readiness_state: ReadinessState,
  assessment_status: AssessmentStatus.default('completed'),

  // Timing & freshness
  calculated_at: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  stale_at: z.string().datetime({ offset: true }).optional().nullable(),

  // Governance
  requires_manual_review: z.boolean().default(false),
  explanation_summary: z.string().optional().nullable(),

  // Determinism & replay
  input_snapshot_hash: z.string().min(1),
  output_hash: z.string().min(1),

  // Supersession chain
  supersedes_assessment_id: z.string().uuid().optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ConfidenceAssessment = z.infer<typeof ConfidenceAssessmentSchema>

export const CreateConfidenceAssessmentSchema = z.object({
  tenant_id: z.string().uuid(),
  institution_id: z.string().uuid(),
  capability_id: z.string().uuid(),
  confidence_model_id: z.string().uuid(),
  model_version: z.number().int().min(1),
  score: z.number().min(0).max(1),
  confidence_band: ConfidenceBand,
  readiness_state: ReadinessState,
  requires_manual_review: z.boolean().optional(),
  explanation_summary: z.string().optional(),
  input_snapshot_hash: z.string().min(1),
  output_hash: z.string().min(1),
  supersedes_assessment_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
})
export type CreateConfidenceAssessment = z.infer<typeof CreateConfidenceAssessmentSchema>

// ═══════════════════════════════════════════════════════════════════════
// CONFIDENCE FACTOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * One contribution or penalty within a confidence assessment.
 * Enables full explainability: each factor is traceable to a rule and source.
 */
export const ConfidenceFactorSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  rule_id: z.string().uuid().optional().nullable(),
  factor_type: FactorType,
  source_entity_type: z.string().min(1),
  source_entity_id: z.string().uuid(),
  raw_value: z.number(),
  normalized_value: z.number().min(0).max(1),
  applied_weight: z.number().min(0).max(1),
  score_contribution: z.number(),
  exclusion_reason: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ConfidenceFactor = z.infer<typeof ConfidenceFactorSchema>

export const CreateConfidenceFactorSchema = z.object({
  assessment_id: z.string().uuid(),
  rule_id: z.string().uuid().optional(),
  factor_type: FactorType,
  source_entity_type: z.string().min(1),
  source_entity_id: z.string().uuid(),
  raw_value: z.number(),
  normalized_value: z.number().min(0).max(1),
  applied_weight: z.number().min(0).max(1),
  score_contribution: z.number(),
  exclusion_reason: z.string().optional(),
  explanation: z.string().optional(),
})
export type CreateConfidenceFactor = z.infer<typeof CreateConfidenceFactorSchema>

// ═══════════════════════════════════════════════════════════════════════
// CONFIDENCE BLOCKER
// ═══════════════════════════════════════════════════════════════════════

/**
 * A condition that prevents or limits a confidence assessment.
 * Blockers are separate from factors so they can be surfaced independently.
 */
export const ConfidenceBlockerSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  blocker_type: BlockerType,
  source_entity_type: z.string().min(1),
  source_entity_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  blocks_scoring: z.boolean().default(true),
  created_at: z.string().datetime({ offset: true }),
})
export type ConfidenceBlocker = z.infer<typeof ConfidenceBlockerSchema>

export const CreateConfidenceBlockerSchema = z.object({
  assessment_id: z.string().uuid(),
  blocker_type: BlockerType,
  source_entity_type: z.string().min(1),
  source_entity_id: z.string().uuid().optional(),
  description: z.string().min(1),
  blocks_scoring: z.boolean().optional(),
})
export type CreateConfidenceBlocker = z.infer<typeof CreateConfidenceBlockerSchema>

// ═══════════════════════════════════════════════════════════════════════
// ELIGIBILITY RESULT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Result of the eligibility gate — returned before any calculation.
 */
export const EligibilityResultSchema = z.object({
  capability_id: z.string().uuid(),
  eligibility: EligibilityState,
  model_status: z.boolean(),
  has_required_claims: z.boolean(),
  required_claims_eligible: z.boolean(),
  reviews_complete: z.boolean(),
  evidence_sufficiency_determined: z.boolean(),
  evidence_fresh: z.boolean(),
  no_unresolved_contradictions: z.boolean(),
  model_active: z.boolean(),
  warnings: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  evaluated_at: z.string().datetime({ offset: true }),
})
export type EligibilityResult = z.infer<typeof EligibilityResultSchema>

// ═══════════════════════════════════════════════════════════════════════
// INSTITUTION SUMMARY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Institution-level confidence summary — aggregated from individual
 * capability assessments. Does NOT collapse into an unexplained score.
 */
export const InstitutionConfidenceSummarySchema = z.object({
  institution_id: z.string().uuid(),
  total_capabilities: z.number().int().min(0),
  assessed_capabilities: z.number().int().min(0),
  unassessed_capabilities: z.number().int().min(0),
  band_distribution: z.record(z.string(), z.number().int()),
  ready_count: z.number().int().min(0),
  blocked_count: z.number().int().min(0),
  stale_count: z.number().int().min(0),
  manual_review_count: z.number().int().min(0),
  weakest_dimensions: z.array(z.string()).default([]),
  major_evidence_gaps: z.array(z.string()).default([]),
  composite_score: z.number().min(0).max(1).optional().nullable(),
  methodology_disclosure: z.string().optional().nullable(),
  generated_at: z.string().datetime({ offset: true }),
})
export type InstitutionConfidenceSummary = z.infer<typeof InstitutionConfidenceSummarySchema>

// ═══════════════════════════════════════════════════════════════════════
// REPLAY RESULT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Result of an assessment replay — compares original vs recomputed.
 */
export const ConfidenceReplayResultSchema = z.object({
  assessment_id: z.string().uuid(),
  original: z.object({
    score: z.number().min(0).max(1),
    band: ConfidenceBand,
    output_hash: z.string(),
    model_version: z.number(),
    calculated_at: z.string().datetime({ offset: true }),
  }),
  recomputed: z.object({
    score: z.number().min(0).max(1),
    band: ConfidenceBand,
    output_hash: z.string(),
    model_version: z.number(),
    calculated_at: z.string().datetime({ offset: true }),
  }),
  match: z.boolean(),
  differences: z.array(z.object({
    field: z.string(),
    original: z.any(),
    recomputed: z.any(),
  })).default([]),
  replayed_at: z.string().datetime({ offset: true }),
})
export type ConfidenceReplayResult = z.infer<typeof ConfidenceReplayResultSchema>