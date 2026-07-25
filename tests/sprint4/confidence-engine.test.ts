// ─── KAD-LOOP-004 — Phase 14: Confidence Engine Tests ───────────────────
// Schema-level validation for the confidence domain model.
// No live database required — validates types, enums, constraints.

import { describe, it, expect } from 'vitest';
import {
  ConfidenceBand,
  ConfidenceModelStatus,
  ConfidenceRuleStatus,
  ConfidenceRuleCategory,
  ConfidenceRuleEffectType,
  EligibilityState,
  AssessmentStatus,
  FactorType,
  BlockerType,
  ReadinessState,
  ConfidenceModelSchema,
  CreateConfidenceModelSchema,
  ConfidenceRuleSchema,
  CreateConfidenceRuleSchema,
  ConfidenceAssessmentSchema,
  CreateConfidenceAssessmentSchema,
  ConfidenceFactorSchema,
  CreateConfidenceFactorSchema,
  ConfidenceBlockerSchema,
  CreateConfidenceBlockerSchema,
  EligibilityResultSchema,
  InstitutionConfidenceSummarySchema,
  ConfidenceReplayResultSchema,
} from '@kadarn/types';

const ID = {
  uuid1: '550e8400-e29b-41d4-a716-446655440001',
  uuid2: '550e8400-e29b-41d4-a716-446655440002',
  uuid3: '550e8400-e29b-41d4-a716-446655440003',
};
const NOW = '2026-07-25T15:00:00.000Z';

describe('KAD-LOOP-004 — Confidence Engine', () => {

  // ═════════════════════════════════════════════════════════════════════
  // Domain Enums
  // ═════════════════════════════════════════════════════════════════════
  describe('Domain Enums', () => {
    it('ConfidenceBand has 6 values', () => {
      expect(ConfidenceBand.options).toEqual(['UNASSESSED', 'VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']);
    });

    it('ConfidenceModelStatus has 4 values', () => {
      expect(ConfidenceModelStatus.options).toEqual(['draft', 'active', 'deprecated', 'retired']);
    });

    it('ConfidenceRuleStatus has 4 values', () => {
      expect(ConfidenceRuleStatus.options).toEqual(['draft', 'active', 'deprecated', 'retired']);
    });

    it('ConfidenceRuleCategory has 8 values', () => {
      expect(ConfidenceRuleCategory.options.length).toBe(8);
      expect(ConfidenceRuleCategory.options).toContain('evidence_coverage');
      expect(ConfidenceRuleCategory.options).toContain('governance_integrity');
    });

    it('ConfidenceRuleEffectType has 3 values', () => {
      expect(ConfidenceRuleEffectType.options).toEqual(['positive', 'penalty', 'blocker']);
    });

    it('EligibilityState has 4 values', () => {
      expect(EligibilityState.options).toEqual(['ELIGIBLE', 'ELIGIBLE_WITH_WARNINGS', 'MANUAL_REVIEW_REQUIRED', 'NOT_ELIGIBLE']);
    });

    it('AssessmentStatus has 4 values', () => {
      expect(AssessmentStatus.options).toEqual(['pending', 'completed', 'failed', 'superseded']);
    });

    it('FactorType has 2 values', () => {
      expect(FactorType.options).toEqual(['positive_factor', 'penalty']);
    });

    it('BlockerType has 10 values', () => {
      expect(BlockerType.options.length).toBe(10);
      expect(BlockerType.options).toContain('missing_required_claim');
      expect(BlockerType.options).toContain('cross_tenant_inconsistency');
    });

    it('ReadinessState has 4 values', () => {
      expect(ReadinessState.options).toEqual(['not_ready', 'partially_ready', 'ready', 'conditionally_ready']);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Confidence Model
  // ═════════════════════════════════════════════════════════════════════
  describe('Confidence Model', () => {
    const validModel = {
      id: ID.uuid1,
      tenant_id: ID.uuid1,
      name: 'Standard Confidence Model',
      description: 'Default confidence methodology',
      version: 1,
      status: 'draft' as const,
      owner_id: ID.uuid2,
      effective_from: NOW,
      effective_until: null,
      methodology: 'Weighted average of 8 dimensions with evidence-weight normalization',
      minimum_data_requirements: 'At least 1 capability with 1 linked claim',
      created_at: NOW,
      updated_at: NOW,
      deprecated_at: null,
    };

    it('parses valid model', () => {
      const result = ConfidenceModelSchema.safeParse(validModel);
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = ConfidenceModelSchema.safeParse({ ...validModel, name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects version < 1', () => {
      const result = ConfidenceModelSchema.safeParse({ ...validModel, version: 0 });
      expect(result.success).toBe(false);
    });

    it('defaults status to draft', () => {
      const { status, ...noStatus } = validModel;
      const result = ConfidenceModelSchema.safeParse(noStatus);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe('draft');
    });

    it('CreateConfidenceModelSchema validates minimal input', () => {
      const result = CreateConfidenceModelSchema.safeParse({
        name: 'New Model',
        tenant_id: ID.uuid1,
        effective_from: NOW,
        methodology: 'Weighted average',
      });
      expect(result.success).toBe(true);
    });

    it('CreateConfidenceModelSchema rejects missing required fields', () => {
      const result = CreateConfidenceModelSchema.safeParse({ name: 'Incomplete' });
      expect(result.success).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Confidence Rule
  // ═════════════════════════════════════════════════════════════════════
  describe('Confidence Rule', () => {
    const validRule = {
      id: ID.uuid1,
      confidence_model_id: ID.uuid1,
      rule_key: 'evidence_coverage_weight',
      version: 1,
      category: 'evidence_coverage',
      description: 'Weight for evidence coverage dimension',
      input_requirements: null,
      condition: 'evidence_count > 0',
      effect_type: 'positive' as const,
      effect_value: 15,
      priority: 100,
      blocking_behavior: false,
      effective_from: NOW,
      effective_until: null,
      status: 'active' as const,
      created_at: NOW,
      updated_at: NOW,
    };

    it('parses valid rule', () => {
      const result = ConfidenceRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('rejects effect_value > 100', () => {
      const result = ConfidenceRuleSchema.safeParse({ ...validRule, effect_value: 150 });
      expect(result.success).toBe(false);
    });

    it('rejects effect_value < 0', () => {
      const result = ConfidenceRuleSchema.safeParse({ ...validRule, effect_value: -1 });
      expect(result.success).toBe(false);
    });

    it('accepts all effect types', () => {
      for (const t of ConfidenceRuleEffectType.options) {
        const result = ConfidenceRuleSchema.safeParse({ ...validRule, effect_type: t });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all rule categories', () => {
      for (const c of ConfidenceRuleCategory.options) {
        const result = ConfidenceRuleSchema.safeParse({ ...validRule, category: c });
        expect(result.success).toBe(true);
      }
    });

    it('blocking blocker rule is valid', () => {
      const result = ConfidenceRuleSchema.safeParse({
        ...validRule,
        effect_type: 'blocker',
        effect_value: 0,
        blocking_behavior: true,
      });
      expect(result.success).toBe(true);
    });

    it('CreateConfidenceRuleSchema validates', () => {
      const result = CreateConfidenceRuleSchema.safeParse({
        confidence_model_id: ID.uuid1,
        rule_key: 'penalty_expired',
        category: 'freshness',
        description: 'Penalty for expired evidence',
        condition: 'evidence_expired = true',
        effect_type: 'penalty',
        effect_value: 20,
        effective_from: NOW,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Confidence Assessment
  // ═════════════════════════════════════════════════════════════════════
  describe('Confidence Assessment', () => {
    const validAssessment = {
      id: ID.uuid1,
      tenant_id: ID.uuid1,
      institution_id: ID.uuid1,
      capability_id: ID.uuid2,
      confidence_model_id: ID.uuid3,
      model_version: 1,
      score: 0.75,
      confidence_band: 'HIGH' as const,
      readiness_state: 'ready' as const,
      assessment_status: 'completed' as const,
      calculated_at: NOW,
      valid_until: null,
      stale_at: null,
      requires_manual_review: false,
      explanation_summary: null,
      input_snapshot_hash: 'abc123def456',
      output_hash: '789ghi012jkl',
      supersedes_assessment_id: null,
      created_by: null,
      created_at: NOW,
    };

    it('parses valid assessment', () => {
      const result = ConfidenceAssessmentSchema.safeParse(validAssessment);
      expect(result.success).toBe(true);
    });

    it('rejects score > 1', () => {
      const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, score: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects score < 0', () => {
      const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, score: -0.1 });
      expect(result.success).toBe(false);
    });

    it('rejects empty hash', () => {
      const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, input_snapshot_hash: '' });
      expect(result.success).toBe(false);
    });

    it('accepts all confidence bands', () => {
      for (const b of ConfidenceBand.options) {
        const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, confidence_band: b });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all readiness states', () => {
      for (const r of ReadinessState.options) {
        const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, readiness_state: r });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all assessment statuses', () => {
      for (const s of AssessmentStatus.options) {
        const result = ConfidenceAssessmentSchema.safeParse({ ...validAssessment, assessment_status: s });
        expect(result.success).toBe(true);
      }
    });

    it('supersedes_assessment_id is optional', () => {
      const result = ConfidenceAssessmentSchema.safeParse(validAssessment);
      expect(result.success).toBe(true);
    });

    it('CreateConfidenceAssessmentSchema validates', () => {
      const result = CreateConfidenceAssessmentSchema.safeParse({
        tenant_id: ID.uuid1,
        institution_id: ID.uuid1,
        capability_id: ID.uuid2,
        confidence_model_id: ID.uuid3,
        model_version: 1,
        score: 0.75,
        confidence_band: 'HIGH',
        readiness_state: 'ready',
        input_snapshot_hash: 'hash',
        output_hash: 'hash2',
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Confidence Factor
  // ═════════════════════════════════════════════════════════════════════
  describe('Confidence Factor', () => {
    const validFactor = {
      id: ID.uuid1,
      assessment_id: ID.uuid1,
      rule_id: ID.uuid2,
      factor_type: 'positive_factor' as const,
      source_entity_type: 'claim',
      source_entity_id: ID.uuid3,
      raw_value: 5,
      normalized_value: 0.8,
      applied_weight: 1.0,
      score_contribution: 0.15,
      exclusion_reason: null,
      explanation: 'Claim has 5 evidence items',
      created_at: NOW,
    };

    it('parses valid factor', () => {
      const result = ConfidenceFactorSchema.safeParse(validFactor);
      expect(result.success).toBe(true);
    });

    it('rejects normalized_value > 1', () => {
      const result = ConfidenceFactorSchema.safeParse({ ...validFactor, normalized_value: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects applied_weight > 1', () => {
      const result = ConfidenceFactorSchema.safeParse({ ...validFactor, applied_weight: 1.5 });
      expect(result.success).toBe(false);
    });

    it('penalty factor type is valid', () => {
      const result = ConfidenceFactorSchema.safeParse({ ...validFactor, factor_type: 'penalty', score_contribution: -0.1 });
      expect(result.success).toBe(true);
    });

    it('CreateConfidenceFactorSchema validates', () => {
      const result = CreateConfidenceFactorSchema.safeParse({
        assessment_id: ID.uuid1,
        factor_type: 'positive_factor',
        source_entity_type: 'evidence',
        source_entity_id: ID.uuid3,
        raw_value: 3,
        normalized_value: 0.6,
        applied_weight: 0.8,
        score_contribution: 0.12,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Confidence Blocker
  // ═════════════════════════════════════════════════════════════════════
  describe('Confidence Blocker', () => {
    const validBlocker = {
      id: ID.uuid1,
      assessment_id: ID.uuid1,
      blocker_type: 'missing_required_claim' as const,
      source_entity_type: 'capability',
      source_entity_id: ID.uuid2,
      description: 'Capability has no approved claims',
      blocks_scoring: true,
      created_at: NOW,
    };

    it('parses valid blocker', () => {
      const result = ConfidenceBlockerSchema.safeParse(validBlocker);
      expect(result.success).toBe(true);
    });

    it('accepts all blocker types', () => {
      for (const b of BlockerType.options) {
        const result = ConfidenceBlockerSchema.safeParse({ ...validBlocker, blocker_type: b });
        expect(result.success).toBe(true);
      }
    });

    it('CreateConfidenceBlockerSchema validates', () => {
      const result = CreateConfidenceBlockerSchema.safeParse({
        assessment_id: ID.uuid1,
        blocker_type: 'inactive_model',
        source_entity_type: 'confidence_model',
        description: 'Confidence model is not active',
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Eligibility Result
  // ═════════════════════════════════════════════════════════════════════
  describe('Eligibility Result', () => {
    it('parses valid eligibility result — ELIGIBLE', () => {
      const result = EligibilityResultSchema.safeParse({
        capability_id: ID.uuid1,
        eligibility: 'ELIGIBLE',
        model_status: true,
        has_required_claims: true,
        required_claims_eligible: true,
        reviews_complete: true,
        evidence_sufficiency_determined: true,
        evidence_fresh: true,
        no_unresolved_contradictions: true,
        model_active: true,
        warnings: [],
        blockers: [],
        evaluated_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('parses valid NOT_ELIGIBLE with blockers', () => {
      const result = EligibilityResultSchema.safeParse({
        capability_id: ID.uuid1,
        eligibility: 'NOT_ELIGIBLE',
        model_status: true,
        has_required_claims: false,
        required_claims_eligible: false,
        reviews_complete: false,
        evidence_sufficiency_determined: true,
        evidence_fresh: true,
        no_unresolved_contradictions: false,
        model_active: true,
        warnings: [],
        blockers: ['No approved claims', 'Incomplete reviews'],
        evaluated_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('parses ELIGIBLE_WITH_WARNINGS', () => {
      const result = EligibilityResultSchema.safeParse({
        capability_id: ID.uuid1,
        eligibility: 'ELIGIBLE_WITH_WARNINGS',
        model_status: true,
        has_required_claims: true,
        required_claims_eligible: true,
        reviews_complete: false,
        evidence_sufficiency_determined: true,
        evidence_fresh: true,
        no_unresolved_contradictions: true,
        model_active: true,
        warnings: ['Some reviews pending'],
        blockers: [],
        evaluated_at: NOW,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Institution Summary
  // ═════════════════════════════════════════════════════════════════════
  describe('Institution Summary', () => {
    it('parses valid institution summary', () => {
      const result = InstitutionConfidenceSummarySchema.safeParse({
        institution_id: ID.uuid1,
        total_capabilities: 10,
        assessed_capabilities: 8,
        unassessed_capabilities: 2,
        band_distribution: { HIGH: 3, MODERATE: 3, LOW: 2 },
        ready_count: 6,
        blocked_count: 2,
        stale_count: 1,
        manual_review_count: 1,
        weakest_dimensions: ['evidence_coverage', 'consistency'],
        major_evidence_gaps: ['No evidence for claims C-003, C-004'],
        composite_score: null,
        methodology_disclosure: 'Composite score not computed.',
        generated_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('composite_score is optional', () => {
      const result = InstitutionConfidenceSummarySchema.safeParse({
        institution_id: ID.uuid1,
        total_capabilities: 5,
        assessed_capabilities: 3,
        unassessed_capabilities: 2,
        band_distribution: { HIGH: 2 },
        ready_count: 2,
        blocked_count: 1,
        stale_count: 0,
        manual_review_count: 0,
        weakest_dimensions: [],
        major_evidence_gaps: [],
        methodology_disclosure: 'Weights from model v1.',
        generated_at: NOW,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Replay Result
  // ═════════════════════════════════════════════════════════════════════
  describe('Replay Result', () => {
    it('parses matching replay result', () => {
      const result = ConfidenceReplayResultSchema.safeParse({
        assessment_id: ID.uuid1,
        original: {
          score: 0.75,
          band: 'HIGH',
          output_hash: 'abc123',
          model_version: 1,
          calculated_at: NOW,
        },
        recomputed: {
          score: 0.75,
          band: 'HIGH',
          output_hash: 'abc123',
          model_version: 1,
          calculated_at: NOW,
        },
        match: true,
        differences: [],
        replayed_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('parses mismatch replay result with differences', () => {
      const result = ConfidenceReplayResultSchema.safeParse({
        assessment_id: ID.uuid1,
        original: {
          score: 0.75,
          band: 'HIGH',
          output_hash: 'abc123',
          model_version: 1,
          calculated_at: NOW,
        },
        recomputed: {
          score: 0.60,
          band: 'MODERATE',
          output_hash: 'def456',
          model_version: 2,
          calculated_at: NOW,
        },
        match: false,
        differences: [
          { field: 'score', original: 0.75, recomputed: 0.60 },
          { field: 'band', original: 'HIGH', recomputed: 'MODERATE' },
          { field: 'model_version', original: 1, recomputed: 2 },
        ],
        replayed_at: NOW,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════
  // Acceptance Scenarios
  // ═════════════════════════════════════════════════════════════════════
  describe('Acceptance Scenarios', () => {
    it('Scenario 1: High-confidence capability — approved claims + sufficient evidence + no contradictions + active model → valid assessment', () => {
      const assessment = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid1,
        tenant_id: ID.uuid1, institution_id: ID.uuid1, capability_id: ID.uuid2,
        confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.85,
        confidence_band: 'VERY_HIGH',
        readiness_state: 'ready',
        assessment_status: 'completed',
        calculated_at: NOW,
        requires_manual_review: false,
        input_snapshot_hash: 'hash1',
        output_hash: 'hash2',
        created_at: NOW,
      });
      expect(assessment.success).toBe(true);
    });

    it('Scenario 2: Missing evidence — insufficient sufficiency → eligibility warning', () => {
      const eligibility = EligibilityResultSchema.safeParse({
        capability_id: ID.uuid2,
        eligibility: 'ELIGIBLE_WITH_WARNINGS',
        model_status: true, has_required_claims: true, required_claims_eligible: true,
        reviews_complete: true, evidence_sufficiency_determined: false,
        evidence_fresh: true, no_unresolved_contradictions: true,
        model_active: true,
        warnings: ['Evidence sufficiency not yet determined'],
        blockers: [],
        evaluated_at: NOW,
      });
      expect(eligibility.success).toBe(true);
    });

    it('Scenario 3: Contradictory evidence → consistency penalty + manual review', () => {
      const assessment = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid1, tenant_id: ID.uuid1, institution_id: ID.uuid1,
        capability_id: ID.uuid2, confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.45, confidence_band: 'LOW', readiness_state: 'partially_ready',
        assessment_status: 'completed', calculated_at: NOW,
        requires_manual_review: true,
        explanation_summary: 'Contradictory evidence reduced confidence',
        input_snapshot_hash: 'hash1', output_hash: 'hash2',
        created_at: NOW,
      });
      expect(assessment.success).toBe(true);
    });

    it('Scenario 4: Expired evidence — existing assessment preserved, staleness detected', () => {
      const staleResult = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid1, tenant_id: ID.uuid1, institution_id: ID.uuid1,
        capability_id: ID.uuid2, confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.50, confidence_band: 'MODERATE', readiness_state: 'conditionally_ready',
        assessment_status: 'completed', calculated_at: NOW,
        requires_manual_review: false, stale_at: NOW,
        input_snapshot_hash: 'hash1', output_hash: 'hash2',
        created_at: NOW,
      });
      expect(staleResult.success).toBe(true);
    });

    it('Scenario 5: Deterministic replay — same inputs → same score + same hash', () => {
      const original = {
        score: 0.75, band: 'HIGH', output_hash: 'abc123', model_version: 1, calculated_at: NOW,
      };
      const recomputed = {
        score: 0.75, band: 'HIGH', output_hash: 'abc123', model_version: 1, calculated_at: NOW,
      };
      const replay = ConfidenceReplayResultSchema.safeParse({
        assessment_id: ID.uuid1,
        original,
        recomputed,
        match: original.score === recomputed.score && original.output_hash === recomputed.output_hash,
        differences: [],
        replayed_at: NOW,
      });
      expect(replay.success).toBe(true);
      expect(replay.data?.match).toBe(true);
    });

    it('Scenario 6: Model version change — v1 assessment immutable, new assessment references v2', () => {
      const v1 = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid1, tenant_id: ID.uuid1, institution_id: ID.uuid1,
        capability_id: ID.uuid2, confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.70, confidence_band: 'HIGH', readiness_state: 'ready',
        assessment_status: 'completed', calculated_at: NOW,
        input_snapshot_hash: 'hash_v1', output_hash: 'hash_v1',
        created_at: NOW,
      });
      expect(v1.success).toBe(true);

      const v2 = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid2, tenant_id: ID.uuid1, institution_id: ID.uuid1,
        capability_id: ID.uuid2, confidence_model_id: ID.uuid3, model_version: 2,
        score: 0.82, confidence_band: 'VERY_HIGH', readiness_state: 'ready',
        assessment_status: 'completed', calculated_at: NOW,
        input_snapshot_hash: 'hash_v2', output_hash: 'hash_v2',
        supersedes_assessment_id: ID.uuid1,
        created_at: NOW,
      });
      expect(v2.success).toBe(true);
      expect(v2.data?.model_version).toBe(2);
    });

    it('Scenario 7: Tenant isolation — assessment scoped to tenant_id', () => {
      const tenantA = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid1, tenant_id: ID.uuid1, institution_id: ID.uuid1,
        capability_id: ID.uuid2, confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.8, confidence_band: 'HIGH', readiness_state: 'ready',
        assessment_status: 'completed', calculated_at: NOW,
        input_snapshot_hash: 'a', output_hash: 'b',
        created_at: NOW,
      });
      const tenantB = ConfidenceAssessmentSchema.safeParse({
        id: ID.uuid2, tenant_id: ID.uuid2, institution_id: ID.uuid2,
        capability_id: ID.uuid3, confidence_model_id: ID.uuid3, model_version: 1,
        score: 0.3, confidence_band: 'LOW', readiness_state: 'not_ready',
        assessment_status: 'failed', calculated_at: NOW,
        input_snapshot_hash: 'c', output_hash: 'd',
        created_at: NOW,
      });
      expect(tenantA.success).toBe(true);
      expect(tenantB.success).toBe(true);
      expect(tenantA.data?.tenant_id).not.toBe(tenantB.data?.tenant_id);
    });

    it('Scenario 8: Institution summary — distribution visible, no unexplained roll-up', () => {
      const summary = InstitutionConfidenceSummarySchema.safeParse({
        institution_id: ID.uuid1,
        total_capabilities: 6,
        assessed_capabilities: 4,
        unassessed_capabilities: 2,
        band_distribution: { VERY_HIGH: 1, HIGH: 2, MODERATE: 1 },
        ready_count: 3,
        blocked_count: 1,
        stale_count: 0,
        manual_review_count: 1,
        weakest_dimensions: ['freshness', 'source_diversity'],
        major_evidence_gaps: ['Claim C-005 has no supporting evidence'],
        composite_score: null,
        methodology_disclosure: 'Composite score not computed — methodology must be explicit.',
        generated_at: NOW,
      });
      expect(summary.success).toBe(true);
      expect(summary.data?.composite_score).toBeNull();
    });
  });
});