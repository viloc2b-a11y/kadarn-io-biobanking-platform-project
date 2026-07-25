// ─── KAD-LOOP-004 — Confidence Staleness Service (Phase 8) ───────────────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Detects when a confidence assessment has become stale — i.e., one or more
// of its source inputs have changed since the assessment was calculated.
// Staleness triggers a recalculation rather than mutating the original
// assessment (assessments are immutable).
//
// Staleness checks:
//   1. Capability updated (updated_at > assessment.calculated_at)
//   2. CapabilityClaim links updated/created after calculation
//   3. Claim status/lifecycle changed for linked claims
//   4. Evidence lifecycle changed (evidence_nodes updated after calculation)
//   5. Review outcomes changed (review_tasks completed/updated)
//   6. SourceRecord supersession
//   7. Confidence Model version changed
//   8. Confidence Rule versions updated

import { createClient } from '@supabase/supabase-js'
import type { ConfidenceAssessment } from '@kadarn/types'
import { ConfidenceAssessmentRepository } from './repositories/confidence-assessment-repository'

// ─── Supabase client wrapper ────────────────────────────────────────────

function query(db: SupabaseLike, table: string, columns: string) {
  return {
    eq: async (col: string, val: unknown) => {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      )
      return (await client.from(table).select(columns).eq(col, val)) as unknown as { data: unknown; error: { code?: string; message?: string } | null }
    },
  }
}
import { DbClient } from './repositories/base'

// ─── Service errors ──────────────────────────────────────────────────────

export class ConfidenceStalenessServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ConfidenceStalenessServiceError'
  }
}

// ─── Staleness result shape ──────────────────────────────────────────────

export interface StalenessResult {
  stale: boolean
  assessment_id: string
  reasons: string[]
  checked_at: string
}

// ─── Supabase structural type (wider query surface) ──────────────────────

interface SupabaseQuery {
  select: (columns: string) => SupabaseSelect
}
interface SupabaseSelect {
  eq: (column: string, value: unknown) => SupabaseEqResult
  in: (column: string, values: unknown[]) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
  order: (column: string, opts?: { ascending?: boolean }) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
  limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
}
interface SupabaseEqResult {
  single: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
  in: (column: string, values: unknown[]) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
  order: (column: string, opts?: { ascending?: boolean }) => { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }
  limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
}
interface SupabaseLike {
  from: (table: string) => SupabaseQuery
}

// ─── Service ─────────────────────────────────────────────────────────────

export class ConfidenceStalenessService {
  private readonly supabase: SupabaseLike

  constructor(
    supabase: DbClient | SupabaseLike,
    private readonly assessmentRepo: ConfidenceAssessmentRepository,
  ) {
    this.supabase = supabase as unknown as SupabaseLike
  }

  /**
   * Detect whether a single confidence assessment is stale.
   * Runs all 8 checks and returns the reasons if stale.
   */
  async detectStale(assessmentId: string): Promise<StalenessResult> {
    const reasons: string[] = []

    const { data: assessment, error } = await this.assessmentRepo.findById(assessmentId)
    if (error || !assessment) {
      throw new ConfidenceStalenessServiceError(
        error?.code ?? 'ASSESSMENT_NOT_FOUND',
        `Confidence assessment ${assessmentId} not found: ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const calculatedAt = assessment.calculated_at

    const anyClient = this.supabase as unknown as Record<string, unknown>

    // Check 1: Capability updated after calculation
    const capResult = await (this.supabase
      .from('capabilities')
      .select('updated_at')
      .eq('id', assessment.capability_id)
      .single())
    if (capResult.data) {
      const cap = capResult.data as { updated_at: string }
      if (cap.updated_at > calculatedAt) {
        reasons.push('Capability was updated after assessment was calculated')
      }
    }

    // Fetch claim links for further checks
    const claimLinksResult = await (this.supabase
      .from('capability_claim_links')
      .select('claim_id,created_at')
      .eq('capability_id', assessment.capability_id) as unknown as Promise<{
      data: unknown[]; error: { code?: string; message?: string } | null
    }>)
    const claimLinks = (claimLinksResult.data as { claim_id: string; created_at: string }[] | null) ?? []

    // Check 2: CapabilityClaim links changed after calculation
    const newLinks = claimLinks.filter((l) => l.created_at > calculatedAt)
    if (newLinks.length > 0) {
      reasons.push(`${newLinks.length} capability-claim link(s) created after assessment was calculated`)
    }

    if (claimLinks.length > 0) {
      const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))

      // Check 3: Claim status/lifecycle changed
      const claimsResult = await (this.supabase
        .from('claims')
        .select('id,updated_at')
        .eq('id', claimIds[0]) as unknown as Promise<{ data: unknown; error: { code?: string; message?: string } | null }>)
      // Use in() for batch — cast through unknown
      const inResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('claims') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
      const inChain = inResult('id,updated_at')
      const inPromise = (inChain['in'] as (c: string, v: unknown[]) => Promise<{ data: unknown[]; error: unknown }>)('id', claimIds)
      const claimsData = await inPromise
      if (claimsData.data) {
        const updatedClaims = (claimsData.data as { updated_at: string }[]).filter((c) => c.updated_at > calculatedAt)
        if (updatedClaims.length > 0) {
          reasons.push(`${updatedClaims.length} linked claim(s) were updated after assessment`)
        }
      }

      // Check 4: Evidence lifecycle changed
      const evResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('claim_evidence_links') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
      const evData = await (evResult('evidence_id,claim_id')['in'] as (c: string, v: unknown[]) => Promise<{ data: unknown[]; error: unknown }>)('claim_id', claimIds)
      if (evData.data) {
        const evIds = Array.from(new Set((evData.data as { evidence_id: string }[]).map((l) => l.evidence_id)))
        if (evIds.length > 0) {
          const enResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('evidence_nodes') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
          const enData = await (enResult('id,updated_at')['in'] as (c: string, v: unknown[]) => Promise<{ data: unknown[]; error: unknown }>)('id', evIds)
          if (enData.data) {
            const updatedEv = (enData.data as { updated_at: string }[]).filter((e) => e.updated_at > calculatedAt)
            if (updatedEv.length > 0) {
              reasons.push(`${updatedEv.length} evidence node(s) updated after assessment was calculated`)
            }
          }
        }

        // Check 5: Review outcomes changed
        const rvResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('review_tasks') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
        const rvData = await (rvResult('id,updated_at')['in'] as (c: string, v: unknown[]) => Promise<{ data: unknown[]; error: unknown }>)('claim_id', claimIds)
        if (rvData.data) {
          const updatedRv = (rvData.data as { updated_at: string }[]).filter((r) => r.updated_at > calculatedAt)
          if (updatedRv.length > 0) {
            reasons.push(`${updatedRv.length} review task(s) completed or updated after assessment`)
          }
        }
      }

      // Check 6: SourceRecord supersession
      const evIdsForSource = evData?.data
        ? Array.from(new Set((evData.data as { evidence_id: string }[]).map((l) => l.evidence_id)))
        : []
      if (evIdsForSource.length > 0) {
        // Check evidence for source_record_id references
        const srResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('source_records') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
        // Note: source_records may link to evidence differently; we check updated_at broadly
        const srData = await (srResult('id,updated_at')['in'] as (c: string, v: unknown[]) => Promise<{ data: unknown[]; error: unknown }>)('evidence_id' as string, evIdsForSource)
        if (srData.data) {
          const superseded = (srData.data as { updated_at: string }[]).filter((s) => s.updated_at > calculatedAt)
          if (superseded.length > 0) {
            reasons.push(`${superseded.length} source record(s) were updated/superseded`)
          }
        }
      }
    }

    // Check 7: Confidence Model version changed
    if (assessment.confidence_model_id) {
      const modelResult = await (this.supabase
        .from('confidence_models')
        .select('version,updated_at')
        .eq('id', assessment.confidence_model_id)
        .single())
      if (modelResult.data) {
        const model = modelResult.data as { version: number; updated_at: string }
        if (model.version !== assessment.model_version) {
          reasons.push(`Confidence model version changed: v${assessment.model_version} → v${model.version}`)
        } else if (model.updated_at > calculatedAt) {
          reasons.push('Confidence model metadata updated after assessment')
        }
      }

      // Check 8: Confidence Rule versions updated
      const ruleResult = await ((anyClient['from'] as (t: string) => Record<string, unknown>)('confidence_rules') as Record<string, unknown>)['select'] as (c: string) => Record<string, unknown>
      const ruleData = await (ruleResult('id,updated_at')['eq'] as (c: string, v: unknown) => Promise<{ data: unknown[]; error: unknown }>)('confidence_model_id', assessment.confidence_model_id)
      if (ruleData.data) {
        const updatedRules = (ruleData.data as { updated_at: string }[]).filter((r) => r.updated_at > calculatedAt)
        if (updatedRules.length > 0) {
          reasons.push(`${updatedRules.length} confidence rule(s) were updated after assessment`)
        }
      }
    }

    return {
      stale: reasons.length > 0,
      assessment_id: assessmentId,
      reasons,
      checked_at: new Date().toISOString(),
    }
  }

  /**
   * Quick check — returns true if the assessment is still fresh.
   */
  async isFresh(assessmentId: string): Promise<boolean> {
    try {
      const result = await this.detectStale(assessmentId)
      return !result.stale
    } catch {
      return false
    }
  }

  /**
   * Get all stale assessments for a given tenant with reasons.
   */
  async getStaleAssessments(
    tenantId: string,
  ): Promise<{ data: { id: string; reasons: string[] }[] | null; error: unknown }> {
    const result = await this.assessmentRepo.findByTenant(tenantId)
    if (!result.data) return { data: null, error: result.error }

    const staleResults: { id: string; reasons: string[] }[] = []
    for (const a of result.data) {
      if (a.stale_at && a.stale_at <= new Date().toISOString()) {
        try {
          const s = await this.detectStale(a.id)
          if (s.stale) {
            staleResults.push({ id: a.id, reasons: s.reasons })
          }
        } catch {
          staleResults.push({ id: a.id, reasons: ['Failed to check staleness'] })
        }
      }
    }
    return { data: staleResults, error: null }
  }
}