// ─── KAD-LOOP-004 — Confidence Scoring Engine (Phases 3, 4, 6, 7, 8) ───
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Top-level orchestrator that ties together eligibility, calculation, replay,
// and staleness into a single public API for confidence scoring.
//
// This is the facade through which all higher layers (API routes, controllers,
// CLI tools, webhooks) interact with the confidence engine. It ensures:
//   1. Eligibility is checked before any calculation runs
//   2. Immutable assessments are created with full audit trail
//   3. Stale assessments are detected and flagged
//   4. Replay is available for verification

import { createClient } from '@supabase/supabase-js'
import type {
  ConfidenceAssessment,
  ConfidenceFactor,
  ConfidenceBlocker,
} from '@kadarn/types'
import { ConfidenceEligibilityService } from './confidence-eligibility-service'
import { ConfidenceCalculationService } from './confidence-calculation-service'
import { ConfidenceReplayService } from './confidence-replay-service'
import { ConfidenceStalenessService } from './confidence-staleness-service'
import { ConfidenceModelRepository } from './repositories/confidence-model-repository'
import { ConfidenceAssessmentRepository } from './repositories/confidence-assessment-repository'
import { ConfidenceFactorRepository } from './repositories/confidence-factor-repository'
import { ConfidenceBlockerRepository } from './repositories/confidence-blocker-repository'
import { ConfidenceRuleRepository } from './repositories/confidence-rule-repository'
import { DbClient } from './repositories/base'

// ─── Service errors ──────────────────────────────────────────────────────

export class ConfidenceScoringEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ConfidenceScoringEngineError'
  }
}

// ─── Assessment breakdown (factors + blockers expanded) ──────────────────

export interface AssessmentBreakdown {
  assessment: ConfidenceAssessment
  factors: ConfidenceFactor[]
  blockers: ConfidenceBlocker[]
}

// ─── Engine ──────────────────────────────────────────────────────────────

export class ConfidenceScoringEngine {
  constructor(
    private readonly eligibility: ConfidenceEligibilityService,
    private readonly calculation: ConfidenceCalculationService,
    private readonly replay: ConfidenceReplayService,
    private readonly staleness: ConfidenceStalenessService,
    private readonly modelRepo: ConfidenceModelRepository,
    private readonly assessmentRepo: ConfidenceAssessmentRepository,
    private readonly factorRepo: ConfidenceFactorRepository,
    private readonly blockerRepo: ConfidenceBlockerRepository,
    private readonly ruleRepo: ConfidenceRuleRepository,
    private readonly db: DbClient,
  ) {}

  // ─── Public API ────────────────────────────────────────────────────────

  /**
   * Score a capability: resolve the active model, run eligibility, then
   * calculate if eligible, or create a failed assessment if not.
   */
  async scoreCapability(
    capabilityId: string,
    tenantId: string,
  ): Promise<ConfidenceAssessment> {
    // 1. Resolve active model for tenant
    const { data: activeModel, error: modelErr } =
      await this.modelRepo.findActive(tenantId)
    if (modelErr || !activeModel) {
      throw new ConfidenceScoringEngineError(
        modelErr?.code ?? 'NO_ACTIVE_MODEL',
        `No active confidence model found for tenant ${tenantId}`,
        modelErr?.details,
      )
    }

    // 2. Run eligibility check
    const eligibilityResult = await this.eligibility.evaluateEligibility(
      capabilityId,
      activeModel.id,
    )

    // 3. If NOT_ELIGIBLE, create failed assessment via the calculation service
    if (eligibilityResult.eligibility === 'NOT_ELIGIBLE') {
      return this.calculation.calculateIfEligible(capabilityId, activeModel.id)
    }

    // 4. Run full calculation
    return this.calculation.calculate(capabilityId, activeModel.id)
  }

  /**
   * Get the latest confidence assessment for a capability with full breakdown.
   * Returns null if no assessment exists.
   */
  async getCapabilityConfidence(
    capabilityId: string,
  ): Promise<AssessmentBreakdown | null> {
    const { data: assessment, error } =
      await this.assessmentRepo.findLatestByCapability(capabilityId)
    if (error || !assessment) return null

    return this.getAssessmentBreakdown(assessment.id)
  }

  /**
   * Get a full breakdown for a specific assessment (assessment + factors + blockers).
   */
  async getAssessmentBreakdown(
    assessmentId: string,
  ): Promise<AssessmentBreakdown> {
    const { data: assessment, error } =
      await this.assessmentRepo.findById(assessmentId)
    if (error || !assessment) {
      throw new ConfidenceScoringEngineError(
        error?.code ?? 'ASSESSMENT_NOT_FOUND',
        `Confidence assessment ${assessmentId} not found: ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const [factorResult, blockerResult] = await Promise.all([
      this.factorRepo.findByAssessment(assessmentId),
      this.blockerRepo.findByAssessment(assessmentId),
    ])

    return {
      assessment,
      factors: factorResult.data ?? [],
      blockers: blockerResult.data ?? [],
    }
  }

  /**
   * Generate a human-readable explanation of an assessment from its factors
   * and blockers. This is a deterministic text generation — no LLM involved.
   */
  async explainAssessment(assessmentId: string): Promise<string> {
    const breakdown = await this.getAssessmentBreakdown(assessmentId)
    const { assessment, factors, blockers } = breakdown

    const lines: string[] = []

    // Header
    lines.push(`Confidence Assessment for Capability ${assessment.capability_id}`)
    lines.push(`Assessment Status: ${assessment.assessment_status}`)
    lines.push(`Score: ${(assessment.score * 100).toFixed(1)} / 100`)
    lines.push(`Confidence Band: ${assessment.confidence_band}`)
    lines.push(`Readiness: ${assessment.readiness_state}`)
    lines.push(`Model Version: ${assessment.model_version}`)
    lines.push(`Calculated: ${assessment.calculated_at}`)
    lines.push('')

    // Blockers (if any)
    if (blockers.length > 0) {
      lines.push('── Blockers ──')
      for (const blocker of blockers) {
        lines.push(`  • [${blocker.blocker_type}] ${blocker.description}`)
      }
      lines.push('')
    }

    // Factors breakdown
    if (factors.length > 0) {
      const positiveFactors = factors.filter(
        (f) => f.factor_type === 'positive_factor',
      )
      const penalties = factors.filter((f) => f.factor_type === 'penalty')

      if (positiveFactors.length > 0) {
        lines.push('── Positive Factors ──')
        for (const factor of positiveFactors) {
          lines.push(
            `  + Factor from ${factor.source_entity_type}/${factor.source_entity_id}: ${(factor.score_contribution * 100).toFixed(1)} pts`,
          )
          if (factor.explanation) lines.push(`    ${factor.explanation}`)
        }
        lines.push('')
      }

      if (penalties.length > 0) {
        lines.push('── Penalties ──')
        for (const penalty of penalties) {
          lines.push(
            `  - Penalty from ${penalty.source_entity_type}/${penalty.source_entity_id}: ${(Math.abs(penalty.score_contribution) * 100).toFixed(1)} pts`,
          )
          if (penalty.explanation) lines.push(`    ${penalty.explanation}`)
        }
        lines.push('')
      }
    }

    // Staleness check (best-effort)
    try {
      const stalenessResult = await this.staleness.detectStale(assessmentId)
      if (stalenessResult.stale) {
        lines.push('── ⚠ Staleness Warning ──')
        for (const reason of stalenessResult.reasons) {
          lines.push(`  • ${reason}`)
        }
        lines.push('')
      }
    } catch {
      // best-effort
    }

    // Hash verification hint
    lines.push(`Input Snapshot Hash: ${assessment.input_snapshot_hash}`)
    lines.push(`Output Hash: ${assessment.output_hash}`)

    return lines.join('\n')
  }

  // ─── Convenience methods ───────────────────────────────────────────────

  /**
   * Replay an assessment to verify determinism.
   */
  async replayAssessment(assessmentId: string) {
    return this.replay.replay(assessmentId)
  }

  /**
   * Compare two assessments.
   */
  async compareAssessments(id1: string, id2: string) {
    return this.replay.compare(id1, id2)
  }

  /**
   * Check if an assessment is stale.
   */
  async checkStaleness(assessmentId: string) {
    return this.staleness.detectStale(assessmentId)
  }

  /**
   * Create a default engine with all dependencies wired to live DB instances.
   * Useful for CLI tools, scripts, and tests that want a quick setup.
   */
  static async createDefault(db: DbClient): Promise<ConfidenceScoringEngine> {
    const assessmentRepo = new ConfidenceAssessmentRepository(db)
    const factorRepo = new ConfidenceFactorRepository(db)
    const blockerRepo = new ConfidenceBlockerRepository(db)
    const ruleRepo = new ConfidenceRuleRepository(db)
    const modelRepo = new ConfidenceModelRepository(db)

    const eligibility = new ConfidenceEligibilityService(
      db as unknown as never,
    )
    const calculation = new ConfidenceCalculationService(
      assessmentRepo,
      factorRepo,
      blockerRepo,
      ruleRepo,
      modelRepo,
      db,
    )
    const replay = new ConfidenceReplayService(db, calculation)
    const staleness = new ConfidenceStalenessService(db, assessmentRepo)

    return new ConfidenceScoringEngine(
      eligibility,
      calculation,
      replay,
      staleness,
      modelRepo,
      assessmentRepo,
      factorRepo,
      blockerRepo,
      ruleRepo,
      db,
    )
  }
}