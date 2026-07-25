// ─── KAD-LOOP-004 — Confidence Replay Service (Phase 8) ───────────────────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Replay and verification service for confidence assessments. Enables
// deterministic verification that recomputing an assessment with the same
// inputs produces the same output (same score, same band, same hash).
//
// CRITICAL RULES:
//   - No generative AI — replay is purely computational
//   - Same inputs → same output (verifiable via hash comparison)
//   - Replay results are informational (do not overwrite original assessments)

import { createClient } from '@supabase/supabase-js'
import type {
  ConfidenceAssessment,
  ConfidenceReplayResult,
  ConfidenceBand,
} from '@kadarn/types'
import { ConfidenceCalculationService } from './confidence-calculation-service'
import { ConfidenceAssessmentRepository } from './repositories/confidence-assessment-repository'
import { DbClient } from './repositories/base'

// ─── Service errors ──────────────────────────────────────────────────────

export class ConfidenceReplayServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ConfidenceReplayServiceError'
  }
}

// ─── Supabase structural type ────────────────────────────────────────────

interface SupabaseLike {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{
          data: unknown
          error: { code?: string; message?: string; details?: unknown } | null
        }>
      }
    }
  }
}

// ─── Service ─────────────────────────────────────────────────────────────

export class ConfidenceReplayService {
  private readonly supabase: SupabaseLike

  constructor(
    supabase: DbClient | SupabaseLike,
    private readonly calculationService: ConfidenceCalculationService,
  ) {
    this.supabase = supabase as unknown as SupabaseLike
  }

  /**
   * Replay an existing assessment: recompute the confidence score for the
   * same capability+model and compare the result to the original stored
   * assessment.
   *
   * Steps:
   *   1. Load original assessment (id, score, band, output_hash, model_version, calculated_at)
   *   2. Reconstruct inputs from current DB state
   *   3. Run calculation service on same capability+model
   *   4. Compare: score, band, output_hash
   *   5. Return ConfidenceReplayResult with match=true/false + differences
   */
  async replay(assessmentId: string): Promise<ConfidenceReplayResult> {
    // 1. Load the original assessment
    const original = await this.loadOriginalAssessment(assessmentId)

    // 2 & 3. Re-run the calculation with current DB state
    let recomputed: ConfidenceAssessment
    try {
      recomputed = await this.calculationService.calculate(
        original.capability_id,
        original.confidence_model_id,
      )
    } catch (err) {
      // If the model is no longer active or capability is gone, we can't replay
      return {
        assessment_id: assessmentId,
        original: {
          score: original.score,
          band: original.confidence_band,
          output_hash: original.output_hash,
          model_version: original.model_version,
          calculated_at: original.calculated_at,
        },
        recomputed: {
          score: 0,
          band: 'UNASSESSED' as ConfidenceBand,
          output_hash: '',
          model_version: original.model_version,
          calculated_at: new Date().toISOString(),
        },
        match: false,
        differences: [
          {
            field: 'replay_error',
            original: 'N/A',
            recomputed: err instanceof Error ? err.message : 'Unknown error during replay',
          },
        ],
        replayed_at: new Date().toISOString(),
      }
    }

    // 4. Compare results
    const differences: { field: string; original: unknown; recomputed: unknown }[] = []

    if (Math.abs(recomputed.score - original.score) > 0.0001) {
      differences.push({
        field: 'score',
        original: original.score,
        recomputed: recomputed.score,
      })
    }

    if (recomputed.confidence_band !== original.confidence_band) {
      differences.push({
        field: 'confidence_band',
        original: original.confidence_band,
        recomputed: recomputed.confidence_band,
      })
    }

    if (recomputed.output_hash !== original.output_hash) {
      differences.push({
        field: 'output_hash',
        original: original.output_hash,
        recomputed: recomputed.output_hash,
      })
    }

    if (recomputed.model_version !== original.model_version) {
      differences.push({
        field: 'model_version',
        original: original.model_version,
        recomputed: recomputed.model_version,
      })
    }

    const match = differences.length === 0

    // 5. Return the result
    return {
      assessment_id: assessmentId,
      original: {
        score: original.score,
        band: original.confidence_band,
        output_hash: original.output_hash,
        model_version: original.model_version,
        calculated_at: original.calculated_at,
      },
      recomputed: {
        score: recomputed.score,
        band: recomputed.confidence_band,
        output_hash: recomputed.output_hash,
        model_version: recomputed.model_version,
        calculated_at: recomputed.calculated_at,
      },
      match,
      differences,
      replayed_at: new Date().toISOString(),
    }
  }

  /**
   * Compare two assessments and report all field-level differences.
   */
  async compare(
    assessmentId1: string,
    assessmentId2: string,
  ): Promise<{ differences: { field: string; assessment1: unknown; assessment2: unknown }[] }> {
    const assessment1 = await this.loadOriginalAssessment(assessmentId1)
    const assessment2 = await this.loadOriginalAssessment(assessmentId2)

    const differences: { field: string; assessment1: unknown; assessment2: unknown }[] = []

    const fieldsToCompare: (keyof ConfidenceAssessment)[] = [
      'score',
      'confidence_band',
      'readiness_state',
      'assessment_status',
      'model_version',
      'input_snapshot_hash',
      'output_hash',
      'capability_id',
      'confidence_model_id',
    ]

    for (const field of fieldsToCompare) {
      if (field === 'score') {
        if (Math.abs((assessment1.score as number) - (assessment2.score as number)) > 0.0001) {
          differences.push({
            field,
            assessment1: assessment1[field],
            assessment2: assessment2[field],
          })
        }
      } else if (assessment1[field] !== assessment2[field]) {
        differences.push({
          field,
          assessment1: assessment1[field],
          assessment2: assessment2[field],
        })
      }
    }

    return { differences }
  }

  // ─── DB access helpers ─────────────────────────────────────────────────

  /**
   * Load the original assessment for replay. We need id, capability_id,
   * confidence_model_id, score, confidence_band, output_hash, model_version,
   * and calculated_at.
   */
  private async loadOriginalAssessment(
    assessmentId: string,
  ): Promise<ConfidenceAssessment> {
    const { data, error } = await this.supabase
      .from('confidence_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error) {
      throw new ConfidenceReplayServiceError(
        error.code ?? 'ASSESSMENT_NOT_FOUND',
        `Confidence assessment ${assessmentId} not found: ${error.message}`,
        error.details,
      )
    }

    return data as unknown as ConfidenceAssessment
  }
}