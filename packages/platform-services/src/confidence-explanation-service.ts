// ─── KAD-LOOP-004 — Confidence Explanation Service (Phase 6) ──────────────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Generates human-readable explanations from persisted deterministic facts:
// dimensions, factors, penalties, blockers, excluded inputs, model version,
// and assessment freshness.
//
// No AI-generated prose as canonical explanation.

import type {
  ConfidenceAssessment,
  ConfidenceFactor,
  ConfidenceBlocker,
  ConfidenceModel,
} from '@kadarn/types'
import { ConfidenceAssessmentRepository } from './repositories/confidence-assessment-repository'
import { ConfidenceFactorRepository } from './repositories/confidence-factor-repository'
import { ConfidenceBlockerRepository } from './repositories/confidence-blocker-repository'
import { ConfidenceModelRepository } from './repositories/confidence-model-repository'

export class ConfidenceExplanationServiceError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message)
    this.name = 'ConfidenceExplanationServiceError'
  }
}

export class ConfidenceExplanationService {
  constructor(
    private assessmentRepo: ConfidenceAssessmentRepository,
    private factorRepo: ConfidenceFactorRepository,
    private blockerRepo: ConfidenceBlockerRepository,
    private modelRepo: ConfidenceModelRepository,
  ) {}

  async explainAssessment(assessmentId: string): Promise<{
    summary: string
    details: string[]
    assessment: ConfidenceAssessment
    model: ConfidenceModel | null
    factors: ConfidenceFactor[]
    blockers: ConfidenceBlocker[]
  }> {
    const assessmentResult = await this.assessmentRepo.findById(assessmentId)
    if (assessmentResult.error || !assessmentResult.data) {
      throw new ConfidenceExplanationServiceError('NOT_FOUND', `Assessment ${assessmentId} not found`)
    }
    const assessment = assessmentResult.data

    const factorsResult = await this.factorRepo.findByAssessment(assessmentId)
    const factors = factorsResult.data ?? []

    const blockersResult = await this.blockerRepo.findByAssessment(assessmentId)
    const blockers = blockersResult.data ?? []

    const modelResult = await this.modelRepo.findById(assessment.confidence_model_id)
    const model = modelResult.data ?? null

    const details: string[] = []

    // Model info
    if (model) {
      details.push(`Confidence Model: ${model.name} v${assessment.model_version}`)
    } else {
      details.push(`Confidence Model: ${assessment.confidence_model_id} (not found)`)
    }

    // Score & band
    details.push(`Score: ${assessment.score} → ${assessment.confidence_band}`)
    details.push(`Readiness: ${assessment.readiness_state}`)

    // Freshness
    const now = new Date().toISOString()
    if (assessment.stale_at && assessment.stale_at < now) {
      details.push('⚠ Assessment is stale — upstream data has changed')
    }

    // Factors breakdown
    const positive = factors.filter(f => f.factor_type === 'positive_factor')
    const penalties = factors.filter(f => f.factor_type === 'penalty')

    if (positive.length > 0) {
      details.push(`\nPositive factors (${positive.length}):`)
      for (const f of positive) {
        details.push(`  + ${f.source_entity_type}/${f.source_entity_id.slice(0, 8)}: +${(f.score_contribution * 100).toFixed(1)}% (weight: ${f.applied_weight})`)
        if (f.explanation) details.push(`    ${f.explanation}`)
      }
    }

    if (penalties.length > 0) {
      details.push(`\nPenalties (${penalties.length}):`)
      for (const f of penalties) {
        details.push(`  - ${f.source_entity_type}/${f.source_entity_id.slice(0, 8)}: ${(f.score_contribution * 100).toFixed(1)}%`)
        if (f.explanation) details.push(`    ${f.explanation}`)
      }
    }

    // Blockers
    if (blockers.length > 0) {
      details.push(`\nBlockers (${blockers.length}):`)
      for (const b of blockers) {
        details.push(`  🚫 ${b.blocker_type}: ${b.description}`)
      }
    }

    // Excluded inputs
    const excluded = factors.filter(f => f.exclusion_reason)
    if (excluded.length > 0) {
      details.push(`\nExcluded inputs (${excluded.length}):`)
      for (const f of excluded) {
        details.push(`  ${f.source_entity_type}/${f.source_entity_id.slice(0, 8)}: ${f.exclusion_reason}`)
      }
    }

    // Manual review
    if (assessment.requires_manual_review) {
      details.push('\n⚠ Manual review required — results should be validated by a human')
    }

    // Summary sentence
    const bandLabel = assessment.confidence_band
    const summary = assessment.requires_manual_review
      ? `Capability confidence is ${bandLabel} (${(assessment.score * 100).toFixed(0)}%) but requires manual review. ${positive.length} positive factors, ${penalties.length} penalties, ${blockers.length} blockers.`
      : `Capability confidence is ${bandLabel} (${(assessment.score * 100).toFixed(0)}%). ${positive.length} positive factors, ${penalties.length} penalties, ${blockers.length} blockers. Readiness: ${assessment.readiness_state}.`

    return { summary, details, assessment, model, factors, blockers }
  }

  async getAssessmentBreakdown(assessmentId: string): Promise<{
    dimensions: Record<string, { raw: number; normalized: number; weight: number; contribution: number }>
    total_score: number
    band: string
  }> {
    const factorsResult = await this.factorRepo.findByAssessment(assessmentId)
    const factors = factorsResult.data ?? []

    const dimensions: Record<string, { raw: number; normalized: number; weight: number; contribution: number }> = {}

    for (const f of factors) {
      const key = f.source_entity_type || 'unknown'
      dimensions[key] = {
        raw: f.raw_value,
        normalized: f.normalized_value,
        weight: f.applied_weight,
        contribution: f.score_contribution,
      }
    }

    const total_score = factors.reduce((acc, f) => acc + f.score_contribution, 0)

    return {
      dimensions,
      total_score: Math.max(0, Math.min(1, total_score)),
      band: total_score >= 0.8 ? 'VERY_HIGH' : total_score >= 0.6 ? 'HIGH' : total_score >= 0.4 ? 'MODERATE' : total_score >= 0.2 ? 'LOW' : 'VERY_LOW',
    }
  }
}