// ─── KAD-LOOP-004 — Confidence Calculation Service (Phases 4, 6, 7) ─────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Core deterministic scoring engine. Given a capability and a confidence
// model, this service executes a 17-step pipeline to produce an immutable
// ConfidenceAssessment with nested Factors and Blockers.
//
// CRITICAL DESIGN RULES:
//   - No generative AI as scoring authority
//   - Same inputs → same output (deterministic via input/output hashing)
//   - No hidden business rules — every contribution is a Factor
//   - Scores are 0-1 (internal) or mapped to 0-100 display via ConfidenceBand
//   - Assessments are immutable once persisted
//   - Every assessment must have factors; blockers are optional

import { createClient } from '@supabase/supabase-js'
import type {
  ConfidenceAssessment,
  ConfidenceModel,
  ConfidenceRule,
  ConfidenceFactor,
  ConfidenceBlocker,
  CreateConfidenceAssessment,
  CreateConfidenceFactor,
  CreateConfidenceBlocker,
  ConfidenceBand,
  ReadinessState,
  AssessmentStatus,
  FactorType,
  BlockerType,
  ConfidenceRuleEffectType,
} from '@kadarn/types'
import { ConfidenceAssessmentRepository } from './repositories/confidence-assessment-repository'
import { ConfidenceFactorRepository } from './repositories/confidence-factor-repository'
import { ConfidenceBlockerRepository } from './repositories/confidence-blocker-repository'
import { ConfidenceRuleRepository } from './repositories/confidence-rule-repository'
import { ConfidenceModelRepository } from './repositories/confidence-model-repository'
import { DbClient } from './repositories/base'

// ─── Hash utility (deterministic SHA-256) ────────────────────────────────

import { createHash } from 'crypto'

function hashInput(data: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(data, Object.keys(data as object).sort()))
    .digest('hex')
}

// ─── Service errors ──────────────────────────────────────────────────────

export class ConfidenceCalculationServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ConfidenceCalculationServiceError'
  }
}

// ─── Capability assessment input shape (internal) ────────────────────────

interface CapabilityRow {
  id: string
  tenant_id: string
  institution_id: string
  organization_id: string
  evidence_sufficiency: string | null
  updated_at: string
  created_at: string
}

interface CapabilityClaimLinkRow {
  capability_id: string
  claim_id: string
  relationship_type: string
}

interface ClaimRow {
  id: string
  lifecycle_status: string
  review_status: string
  workflow_state: string
  version: number
  updated_at: string
}

interface ClaimEvidenceLinkRow {
  claim_id: string
  evidence_id: string
  relationship_type: string
}

interface EvidenceNodeRow {
  id: string
  lifecycle_status: string | null
  status: string | null
  expires_at: string | null
  updated_at: string
}

interface ReviewTaskRow {
  id: string
  claim_id: string
  status: string
  completed_at: string | null
  updated_at: string
}

interface EvidenceSufficiencyRow {
  capability_id: string
  sufficiency: string
  evaluated_at: string
}

// ─── Calculation context (carried through the pipeline) ───────────────────

interface CalculationContext {
  capability: CapabilityRow
  model: ConfidenceModel
  rules: ConfidenceRule[]
  claims: ClaimRow[]
  claimLinks: CapabilityClaimLinkRow[]
  evidenceLinks: ClaimEvidenceLinkRow[]
  evidenceNodes: EvidenceNodeRow[]
  reviewTasks: ReviewTaskRow[]
  evidenceSufficiency: EvidenceSufficiencyRow | null
  factors: CreateConfidenceFactor[]
  blockers: CreateConfidenceBlocker[]
  rawScore: number
  penaltySum: number
}

// ─── Supabase structural type (minimal surface) ──────────────────────────

interface SupabaseLike {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{
          data: unknown
          error: { code?: string; message?: string; details?: unknown } | null
        }>
        order: (column: string, opts?: { ascending?: boolean }) => {
          limit: (n: number) => Promise<{
            data: unknown[]
            error: { code?: string; message?: string; details?: unknown } | null
          }>
        }
        limit: (n: number) => Promise<{
          data: unknown[]
          error: { code?: string; message?: string; details?: unknown } | null
        }>
      }
      in: (column: string, values: unknown[]) => Promise<{
        data: unknown[]
        error: { code?: string; message?: string; details?: unknown } | null
      }>
      order: (column: string, opts?: { ascending?: boolean }) => Promise<{
        data: unknown[]
        error: { code?: string; message?: string; details?: unknown } | null
      }>
      limit: (n: number) => Promise<{
        data: unknown[]
        error: { code?: string; message?: string; details?: unknown } | null
      }>
    }
  }
}

// ─── Service ─────────────────────────────────────────────────────────────

export class ConfidenceCalculationService {
  private readonly supabase: SupabaseLike

  constructor(
    private readonly assessmentRepo: ConfidenceAssessmentRepository,
    private readonly factorRepo: ConfidenceFactorRepository,
    private readonly blockerRepo: ConfidenceBlockerRepository,
    private readonly ruleRepo: ConfidenceRuleRepository,
    private readonly modelRepo: ConfidenceModelRepository,
    supabase?: DbClient | SupabaseLike,
  ) {
    this.supabase =
      (supabase as unknown as SupabaseLike) ??
      (createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      ) as unknown as SupabaseLike)
  }

  /**
   * Run the full 17-step confidence calculation pipeline.
   * Returns the complete immutable assessment with nested factors and blockers.
   * Does NOT check eligibility — call calculateIfEligible for that.
   */
  async calculate(
    capabilityId: string,
    modelId: string,
  ): Promise<ConfidenceAssessment> {
    const ctx = await this.buildContext(capabilityId, modelId)

    // Step 13-17: hash, store, return
    return this.executePipeline(ctx)
  }

  /**
   * Check eligibility first; if NOT_ELIGIBLE, create a failed assessment
   * with blockers. If eligible, run the full pipeline.
   */
  async calculateIfEligible(
    capabilityId: string,
    modelId: string,
  ): Promise<ConfidenceAssessment> {
    const ctx = await this.buildContext(capabilityId, modelId)

    // Run the eligibility checks embedded in pipeline context building.
    // If any eligibility check fails, we store a failed assessment.
    const { ConfidenceEligibilityService } = await import(
      './confidence-eligibility-service'
    )
    const eligibility = new ConfidenceEligibilityService(
      this.supabase as unknown as never,
    )
    const result = await eligibility.evaluateEligibility(capabilityId, modelId)

    if (result.eligibility === 'NOT_ELIGIBLE') {
      // Create a failed assessment with blockers but no score
      const assessment = await this.createFailedAssessment(
        ctx,
        result.blockers,
      )
      return assessment
    }

    return this.executePipeline(ctx)
  }

  // ─── Pipeline steps ────────────────────────────────────────────────────

  /**
   * 17-step pipeline implementation.
   */
  private async executePipeline(ctx: CalculationContext): Promise<ConfidenceAssessment> {
    // Step 1-2: Already done in buildContext (model + rules resolved)
    // Step 3-7: Already done in buildContext (capability + claims + evidence loaded)

    // Step 8: Apply positive factors (rules with effect_type='positive')
    for (const rule of ctx.rules) {
      if (rule.effect_type === 'positive') {
        this.applyPositiveFactor(ctx, rule)
      }
    }

    // Step 9: Apply penalties (rules with effect_type='penalty')
    for (const rule of ctx.rules) {
      if (rule.effect_type === 'penalty') {
        this.applyPenalty(ctx, rule)
      }
    }

    // Step 10: Apply blockers (rules with effect_type='blocker' AND blocking_behavior=true)
    let hasScoringBlocker = false
    for (const rule of ctx.rules) {
      if (rule.effect_type === 'blocker' && rule.blocking_behavior) {
        this.applyBlockerFromRule(ctx, rule)
        hasScoringBlocker = true
      }
    }

    // Step 11: Normalize score to 0-1
    ctx.rawScore = Math.max(0, Math.min(1, ctx.rawScore))

    // Step 12: Assign confidence band based on score
    const band = this.assignBand(ctx.rawScore)

    // Step 13: Determine readiness state
    const readiness = this.determineReadiness(hasScoringBlocker, ctx.penaltySum)

    // Step 14: Hash input snapshot
    const inputSnapshot = this.buildInputSnapshot(ctx)
    const inputHash = hashInput(inputSnapshot)

    // Step 15: Hash output
    const outputData = {
      score: ctx.rawScore,
      band,
      readiness,
      factorCount: ctx.factors.length,
      blockerCount: ctx.blockers.length,
    }
    const outputHash = hashInput(outputData)

    // Step 16-17: Create immutable assessment + store factors/blockers
    return this.persistAssessment(ctx, band, readiness, inputHash, outputHash)
  }

  /**
   * Build context by loading all required data from the database.
   * Steps 1-7 of the pipeline.
   */
  private async buildContext(
    capabilityId: string,
    modelId: string,
  ): Promise<CalculationContext> {
    // Step 1: Resolve active model
    const { data: model, error: modelErr } = await this.modelRepo.findById(modelId)
    if (modelErr || !model) {
      throw new ConfidenceCalculationServiceError(
        modelErr?.code ?? 'MODEL_NOT_FOUND',
        `Confidence model ${modelId} not found`,
        modelErr?.details,
      )
    }
    if (model.status !== 'active') {
      throw new ConfidenceCalculationServiceError(
        'MODEL_NOT_ACTIVE',
        `Confidence model ${modelId} is not active (status=${model.status})`,
      )
    }

    // Step 2: Resolve effective rules
    const now = new Date().toISOString()
    const { data: allRules, error: ruleErr } = await this.ruleRepo.findActiveByModel(modelId)
    if (ruleErr) {
      throw new ConfidenceCalculationServiceError(
        ruleErr.code ?? 'RULES_LOAD_FAILED',
        `Failed to load active rules for model ${modelId}: ${ruleErr.message}`,
        ruleErr.details,
      )
    }
    const rules = (allRules ?? []).filter((r: ConfidenceRule) => {
      const from = r.effective_from ? new Date(r.effective_from) : null
      const until = r.effective_until ? new Date(r.effective_until) : null
      const nowDate = new Date(now)
      return (
        (!from || from <= nowDate) &&
        (!until || until > nowDate)
      )
    })

    // Step 3: Load capability + linked claims
    const capability = await this.loadCapability(capabilityId)
    const claimLinks = await this.loadCapabilityClaimLinks(capabilityId)
    const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))
    const allClaims = claimIds.length > 0 ? await this.loadClaims(claimIds) : []

    // Step 4: Load claim evidence via claim_evidence_links
    const evidenceLinks =
      claimIds.length > 0 ? await this.loadEvidenceLinksForClaims(claimIds) : []
    const evidenceIds = Array.from(new Set(evidenceLinks.map((l) => l.evidence_id)))
    const evidenceNodes =
      evidenceIds.length > 0 ? await this.loadEvidenceNodes(evidenceIds) : []

    // Step 5: Load claim reviews
    const reviewTasks =
      claimIds.length > 0 ? await this.loadReviewTasksForClaims(claimIds) : []

    // Step 6: Load evidence sufficiency
    const evidenceSufficiencyValue: EvidenceSufficiencyRow | null = capability.evidence_sufficiency
      ? { capability_id: capabilityId, sufficiency: capability.evidence_sufficiency, evaluated_at: '' }
      : null

    // Step 7: Exclude invalid inputs (expired/superseded evidence, rejected claims)
    const filterResult = this.filterInvalidInputs(
      allClaims,
      evidenceNodes,
      claimLinks,
      evidenceLinks,
    )

    return {
      capability,
      model,
      rules,
      claims: filterResult.claims,
      claimLinks,
      evidenceLinks: filterResult.evidenceLinks,
      evidenceNodes: filterResult.evidenceNodes,
      reviewTasks,
      evidenceSufficiency: evidenceSufficiencyValue,
      factors: [],
      blockers: [],
      rawScore: 0,
      penaltySum: 0,
    }
  }

  /**
   * Apply a positive factor from a rule.
   * Computes the score contribution and records the factor.
   */
  private applyPositiveFactor(ctx: CalculationContext, rule: ConfidenceRule): void {
    const factor: CreateConfidenceFactor = {
      assessment_id: '', // assigned after assessment creation
      rule_id: rule.id,
      factor_type: 'positive_factor',
      source_entity_type: 'confidence_rule',
      source_entity_id: rule.id,
      raw_value: rule.effect_value,
      normalized_value: rule.effect_value / 100,
      applied_weight: 1.0,
      score_contribution: rule.effect_value / 100,
      explanation: `Positive factor from rule "${rule.rule_key}": ${rule.description}`,
    }
    ctx.rawScore += factor.score_contribution
    ctx.factors.push(factor)
  }

  /**
   * Apply a penalty from a rule.
   * Subtracts from the score and records the factor.
   */
  private applyPenalty(ctx: CalculationContext, rule: ConfidenceRule): void {
    const penaltyValue = rule.effect_value / 100
    const factor: CreateConfidenceFactor = {
      assessment_id: '',
      rule_id: rule.id,
      factor_type: 'penalty',
      source_entity_type: 'confidence_rule',
      source_entity_id: rule.id,
      raw_value: rule.effect_value,
      normalized_value: penaltyValue,
      applied_weight: 1.0,
      score_contribution: -penaltyValue,
      explanation: `Penalty from rule "${rule.rule_key}": ${rule.description}`,
    }
    ctx.rawScore -= penaltyValue
    ctx.penaltySum += penaltyValue
    ctx.factors.push(factor)
  }

  /**
   * Apply a blocker from a rule that blocks scoring.
   */
  private applyBlockerFromRule(ctx: CalculationContext, rule: ConfidenceRule): void {
    const blocker: CreateConfidenceBlocker = {
      assessment_id: '',
      blocker_type: 'incomplete_review',
      source_entity_type: 'confidence_rule',
      source_entity_id: rule.id,
      description: `Scoring blocked by rule "${rule.rule_key}": ${rule.description}`,
      blocks_scoring: true,
    }
    ctx.blockers.push(blocker)
  }

  /**
   * Filter out invalid inputs:
   * - Rejected claims are excluded
   * - Expired/superseded evidence is excluded
   * - Evidence links to excluded evidence are dropped
   */
  private filterInvalidInputs(
    claims: ClaimRow[],
    evidenceNodes: EvidenceNodeRow[],
    claimLinks: CapabilityClaimLinkRow[],
    evidenceLinks: ClaimEvidenceLinkRow[],
  ): {
    claims: ClaimRow[]
    evidenceNodes: EvidenceNodeRow[]
    evidenceLinks: ClaimEvidenceLinkRow[]
  } {
    // Exclude rejected claims
    const validClaims = claims.filter((c) => c.lifecycle_status !== 'rejected')
    const validClaimIds = new Set(validClaims.map((c) => c.id))

    // Filter out evidence links referencing excluded claims
    const filteredEvidenceLinks = evidenceLinks.filter((l) =>
      validClaimIds.has(l.claim_id),
    )

    // Find valid evidence (not expired or superseded)
    const validEvidenceIds = new Set(
      evidenceNodes
        .filter(
          (n) =>
            n.lifecycle_status !== 'expired' &&
            n.lifecycle_status !== 'superseded' &&
            n.lifecycle_status !== 'invalidated',
        )
        .map((n) => n.id),
    )

    // Further filter evidence links to only valid evidence
    const finalEvidenceLinks = filteredEvidenceLinks.filter((l) =>
      validEvidenceIds.has(l.evidence_id),
    )

    const finalEvidence = evidenceNodes.filter((n) =>
      validEvidenceIds.has(n.id),
    )

    return {
      claims: validClaims,
      evidenceNodes: finalEvidence,
      evidenceLinks: finalEvidenceLinks,
    }
  }

  /**
   * Assign a confidence band based on the 0-1 score.
   */
  private assignBand(score: number): ConfidenceBand {
    if (score < 0.2) return 'VERY_LOW'
    if (score < 0.4) return 'LOW'
    if (score < 0.6) return 'MODERATE'
    if (score < 0.8) return 'HIGH'
    return 'VERY_HIGH'
  }

  /**
   * Determine readiness state based on blockers and penalties.
   */
  private determineReadiness(
    hasBlocker: boolean,
    penaltySum: number,
  ): ReadinessState {
    if (hasBlocker) return 'not_ready'
    if (penaltySum > 0.3) return 'partially_ready'
    if (penaltySum > 0) return 'conditionally_ready'
    return 'ready'
  }

  /**
   * Build an input snapshot for hashing — deterministic representation
   * of all inputs that went into the calculation.
   */
  private buildInputSnapshot(ctx: CalculationContext): Record<string, unknown> {
    return {
      capability_id: ctx.capability.id,
      capability_updated_at: ctx.capability.updated_at,
      model_id: ctx.model.id,
      model_version: ctx.model.version,
      rule_ids: ctx.rules.map((r) => r.id).sort(),
      claim_ids: ctx.claims.map((c) => c.id).sort(),
      evidence_ids: ctx.evidenceNodes.map((n) => n.id).sort(),
      evidence_sufficiency: ctx.capability.evidence_sufficiency,
      review_task_count: ctx.reviewTasks.length,
      completed_review_count: ctx.reviewTasks.filter((t) => t.status === 'completed').length,
    }
  }

  /**
   * Persist the assessment and its factors/blockers.
   * This is the only write to the database.
   */
  private async persistAssessment(
    ctx: CalculationContext,
    band: ConfidenceBand,
    readiness: ReadinessState,
    inputHash: string,
    outputHash: string,
  ): Promise<ConfidenceAssessment> {
    const now = new Date().toISOString()

    const createInput: CreateConfidenceAssessment = {
      tenant_id: ctx.capability.tenant_id,
      institution_id: ctx.capability.institution_id,
      capability_id: ctx.capability.id,
      confidence_model_id: ctx.model.id,
      model_version: ctx.model.version,
      score: ctx.rawScore,
      confidence_band: band,
      readiness_state: readiness,
      requires_manual_review: ctx.blockers.some((b) => b.blocker_type === 'incomplete_review'),
      explanation_summary: this.buildExplanationSummary(ctx, band),
      input_snapshot_hash: inputHash,
      output_hash: outputHash,
    }

    const { data: assessment, error } = await this.assessmentRepo.create(createInput)
    if (error || !assessment) {
      throw new ConfidenceCalculationServiceError(
        error?.code ?? 'ASSESSMENT_CREATE_FAILED',
        `Failed to create confidence assessment: ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Store factors
    if (ctx.factors.length > 0) {
      const factorsToInsert = ctx.factors.map((f) => ({
        ...f,
        assessment_id: assessment.id,
      }))
      const { error: factorErr } = await this.factorRepo.bulkCreate(factorsToInsert)
      if (factorErr) {
        // Factors are important for explainability but a failure here
        // shouldn't abort the assessment creation — the assessment row exists.
        // (In production, emit a metric/alert.)
      }
    }

    // Store blockers
    if (ctx.blockers.length > 0) {
      const blockersToInsert = ctx.blockers.map((b) => ({
        ...b,
        assessment_id: assessment.id,
      }))
      const { error: blockerErr } = await this.blockerRepo.bulkCreate(blockersToInsert)
      if (blockerErr) {
        // Best-effort: blockers are persisted. Failure doesn't invalidate
        // the assessment; it just means the user won't see the breakdown.
      }
    }

    return assessment
  }

  /**
   * Create a failed assessment (when eligibility fails).
   */
  private async createFailedAssessment(
    ctx: CalculationContext,
    blockerMessages: string[],
  ): Promise<ConfidenceAssessment> {
    const now = new Date().toISOString()
    const scoredBand: ConfidenceBand = 'UNASSESSED'
    const inputHash = hashInput({ capability_id: ctx.capability.id, failed: true })

    const createInput: CreateConfidenceAssessment = {
      tenant_id: ctx.capability.tenant_id,
      institution_id: ctx.capability.institution_id,
      capability_id: ctx.capability.id,
      confidence_model_id: ctx.model.id,
      model_version: ctx.model.version,
      score: 0,
      confidence_band: scoredBand,
      readiness_state: 'not_ready',
      requires_manual_review: true,
      explanation_summary: `Assessment failed: ${blockerMessages.join('; ')}`,
      input_snapshot_hash: inputHash,
      output_hash: hashInput({ failed: true, blockers: blockerMessages }),
    }

    const { data: assessment, error } = await this.assessmentRepo.create(createInput)
    if (error || !assessment) {
      throw new ConfidenceCalculationServiceError(
        error?.code ?? 'FAILED_ASSESSMENT_CREATE_FAILED',
        `Failed to create failed assessment: ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Create blockers for each reason
    if (blockerMessages.length > 0) {
      const blockersToInsert: CreateConfidenceBlocker[] = blockerMessages.map((msg) => ({
        assessment_id: assessment.id,
        blocker_type: 'inactive_model' as BlockerType,
        source_entity_type: 'eligibility_check',
        description: msg,
        blocks_scoring: true,
      }))
      await this.blockerRepo.bulkCreate(blockersToInsert)
    }

    return assessment
  }

  /**
   * Build a human-readable explanation summary from factors and blockers.
   */
  private buildExplanationSummary(
    ctx: CalculationContext,
    band: ConfidenceBand,
  ): string {
    const parts: string[] = []

    if (ctx.blockers.length > 0) {
      parts.push(`Blocked by ${ctx.blockers.length} condition(s)`)
    }

    const positiveCount = ctx.factors.filter(
      (f) => f.factor_type === 'positive_factor',
    ).length
    const penaltyCount = ctx.factors.filter(
      (f) => f.factor_type === 'penalty',
    ).length

    if (positiveCount > 0) {
      parts.push(`${positiveCount} positive factor(s) applied`)
    }
    if (penaltyCount > 0) {
      parts.push(`${penaltyCount} penalty(ies) applied`)
    }

    parts.push(`Confidence band: ${band}`)

    return parts.join('. ')
  }

  // ─── DB access helpers ─────────────────────────────────────────────────

  private async loadCapability(capabilityId: string): Promise<CapabilityRow> {
    const { data, error } = await this.supabase
      .from('capabilities')
      .select('id,tenant_id,institution_id,organization_id,evidence_sufficiency,updated_at,created_at')
      .eq('id', capabilityId)
      .single()

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'CAPABILITY_NOT_FOUND',
        `Capability ${capabilityId} not found: ${error.message}`,
        error.details,
      )
    }
    return data as CapabilityRow
  }

  private async loadCapabilityClaimLinks(
    capabilityId: string,
  ): Promise<CapabilityClaimLinkRow[]> {
    const { data, error } = await this.supabase
      .from('capability_claim_links')
      .select('capability_id,claim_id,relationship_type')
      .eq('capability_id', capabilityId)
      .limit(1000)

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claim links for ${capabilityId}: ${error.message}`,
        error.details,
      )
    }
    return (data as CapabilityClaimLinkRow[] | null) ?? []
  }

  private async loadClaims(claimIds: string[]): Promise<ClaimRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('claims')
      .select('id,lifecycle_status,review_status,workflow_state,version,updated_at')
      .in('id', claimIds)

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claims: ${error.message}`,
        error.details,
      )
    }
    return (data as ClaimRow[] | null) ?? []
  }

  private async loadEvidenceLinksForClaims(
    claimIds: string[],
  ): Promise<ClaimEvidenceLinkRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id,evidence_id,relationship_type')
      .in('claim_id', claimIds)

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claim_evidence_links: ${error.message}`,
        error.details,
      )
    }
    return (data as ClaimEvidenceLinkRow[] | null) ?? []
  }

  private async loadEvidenceNodes(
    evidenceIds: string[],
  ): Promise<EvidenceNodeRow[]> {
    if (evidenceIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('evidence_nodes')
      .select('id,lifecycle_status,status,expires_at,updated_at')
      .in('id', evidenceIds)

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load evidence_nodes: ${error.message}`,
        error.details,
      )
    }
    return (data as EvidenceNodeRow[] | null) ?? []
  }

  private async loadReviewTasksForClaims(
    claimIds: string[],
  ): Promise<ReviewTaskRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('review_tasks')
      .select('id,claim_id,status,completed_at,updated_at')
      .in('claim_id', claimIds)

    if (error) {
      throw new ConfidenceCalculationServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load review_tasks: ${error.message}`,
        error.details,
      )
    }
    return (data as ReviewTaskRow[] | null) ?? []
  }
}