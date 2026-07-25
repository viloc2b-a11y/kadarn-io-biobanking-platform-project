// ─── KAD-LOOP-004 — Confidence Eligibility Service (Phase 3) ─────────────
// Authority: KADARN Product Constitution, LOOP-4 Spec
//
// Gate that determines whether a capability is eligible for confidence
// assessment. Runs 9 independent checks — each returns a boolean + optional
// warning/blocker. Eligibility is NOT a scoring step; it is a prerequisite
// gate. If any blocker condition is met, the capability cannot be scored.
//
// Evaluation is deterministic: same DB state → same eligibility result.
// No generative AI, no hidden business rules.
//
// ─── Eligibility checks (evaluated in order, all run — no short-circuit) ─
//   1. Capability exists
//   2. Capability belongs to tenant + institution
//   3. Required claims exist (via capability_claims join)
//   4. Claims are in eligible lifecycle (approved or published)
//   5. Reviews are complete (review_tasks with status='completed' for linked claims)
//   6. Evidence sufficiency exists (capabilities.evidence_sufficiency)
//   7. Evidence is not invalidated (check evidence_nodes lifecycle_status)
//   8. No unresolved contradictions (check claim_evidence_links for CONTRADICTS)
//   9. Model is active (check confidence_models.status = 'active')

import { createClient } from '@supabase/supabase-js'
import type {
  EligibilityState,
  EligibilityResult,
  ConfidenceModel,
} from '@kadarn/types'

// ─── Service errors ──────────────────────────────────────────────────────

export class ConfidenceEligibilityServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ConfidenceEligibilityServiceError'
  }
}

// ─── Internal row shapes (DB projection) ─────────────────────────────────

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
}

interface ReviewTaskRow {
  id: string
  claim_id: string
  status: string
  completed_at: string | null
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

// ─── Eligibility check result builder ────────────────────────────────────

interface CheckResult {
  passed: boolean
  warnings: string[]
  blockers: string[]
}

// ─── Service ─────────────────────────────────────────────────────────────

export class ConfidenceEligibilityService {
  private readonly supabase: SupabaseLike

  constructor(supabase?: SupabaseLike) {
    this.supabase =
      (supabase as SupabaseLike) ??
      (createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      ) as unknown as SupabaseLike)
  }

  /**
   * Evaluate all eligibility checks for a capability under a given model.
   * Returns a detailed EligibilityResult with per-check booleans, warnings,
   * and blockers. All checks are evaluated — there is no short-circuit.
   */
  async evaluateEligibility(
    capabilityId: string,
    modelId: string,
  ): Promise<EligibilityResult> {
    const warnings: string[] = []
    const blockers: string[] = []

    // ── Check 1: Capability exists ──────────────────────────────────────
    const capability = await this.getCapability(capabilityId)
    const exists = capability !== null
    if (!exists) {
      blockers.push('Capability not found')
    }

    // ── Check 2: Capability belongs to tenant + institution ──────────────
    let capabilityTenantId: string | null = null
    let capabilityInstitutionId: string | null = null
    let belongsToTenant = false
    if (capability) {
      capabilityTenantId = capability.tenant_id
      capabilityInstitutionId = capability.institution_id
      // If tenant_id and institution_id are both populated, the capability
      // is considered properly scoped. (The identity of the calling tenant
      // is resolved at the API/controller layer — here we verify the row
      // has valid tenant/institution references.)
      belongsToTenant = !!capability.tenant_id && !!capability.institution_id
      if (!belongsToTenant) {
        blockers.push('Capability is not properly scoped to a tenant and institution')
      }
    }

    // ── Check 3: Required claims exist ──────────────────────────────────
    const claimLinks = capability
      ? await this.getCapabilityClaimLinks(capabilityId)
      : []
    const hasRequiredClaims = claimLinks.length > 0
    if (!hasRequiredClaims) {
      blockers.push('No claims linked to capability')
    }

    // ── Check 4: Claims are in eligible lifecycle ────────────────────────
    let requiredClaimsEligible = false
    if (claimLinks.length > 0) {
      const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))
      const claims = await this.getClaims(claimIds)
      const eligibleStatuses = ['approved', 'published']
      const ineligibleClaims = claims.filter(
        (c) => !eligibleStatuses.includes(c.lifecycle_status),
      )
      requiredClaimsEligible = ineligibleClaims.length === 0
      if (!requiredClaimsEligible) {
        blockers.push(
          `Found ${ineligibleClaims.length} claim(s) with ineligible lifecycle status`,
        )
      }
    }

    // ── Check 5: Reviews are complete ───────────────────────────────────
    let reviewsComplete = false
    if (claimLinks.length > 0) {
      const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))
      const reviewTasks = await this.getReviewTasksForClaims(claimIds)
      const incompleteTasks = reviewTasks.filter(
        (t) => t.status !== 'completed',
      )
      reviewsComplete = incompleteTasks.length === 0
      if (!reviewsComplete) {
        blockers.push(
          `Found ${incompleteTasks.length} incomplete review task(s) for linked claims`,
        )
      }
    }

    // ── Check 6: Evidence sufficiency exists ────────────────────────────
    let evidenceSufficiencyDetermined = false
    if (capability && capability.evidence_sufficiency) {
      const sufficientValues = [
        'sufficient',
        'conflicting',
        'manual_review_required',
      ]
      evidenceSufficiencyDetermined = sufficientValues.includes(
        capability.evidence_sufficiency,
      )
    }
    if (!evidenceSufficiencyDetermined) {
      warnings.push('Evidence sufficiency has not been determined or is insufficient')
    }

    // ── Check 7: Evidence is not invalidated ────────────────────────────
    let evidenceFresh = true
    if (claimLinks.length > 0) {
      const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))
      const evidenceLinks = await this.getEvidenceLinksForClaims(claimIds)
      const evidenceIds = Array.from(
        new Set(evidenceLinks.map((l) => l.evidence_id)),
      )
      if (evidenceIds.length > 0) {
        const evidenceNodes = await this.getEvidenceNodes(evidenceIds)
        const invalidStatuses = ['invalidated', 'expired', 'superseded', 'rejected']
        const invalidEvidence = evidenceNodes.filter((n) =>
          invalidStatuses.includes(n.lifecycle_status ?? ''),
        )
        if (invalidEvidence.length > 0) {
          evidenceFresh = false
          warnings.push(
            `Found ${invalidEvidence.length} evidence node(s) with invalidated/expired/superseded lifecycle`,
          )
        }
      }
    }

    // ── Check 8: No unresolved contradictions ───────────────────────────
    let noUnresolvedContradictions = true
    if (claimLinks.length > 0) {
      const claimIds = Array.from(new Set(claimLinks.map((l) => l.claim_id)))
      const evidenceLinks = await this.getEvidenceLinksForClaims(claimIds)
      const contradictions = evidenceLinks.filter(
        (l) => l.relationship_type === 'CONTRADICTS',
      )
      if (contradictions.length > 0) {
        noUnresolvedContradictions = false
        blockers.push(`Found ${contradictions.length} unresolved contradiction(s) in evidence links`)
      }
    }

    // ── Check 9: Model is active ────────────────────────────────────────
    let modelActive = false
    try {
      const model = await this.getModel(modelId)
      modelActive = model !== null && model.status === 'active'
    } catch {
      modelActive = false
    }
    if (!modelActive) {
      blockers.push('Confidence model is not active')
    }

    // ── Determine overall eligibility state ─────────────────────────────
    const eligibility: EligibilityState =
      blockers.length > 0
        ? 'NOT_ELIGIBLE'
        : warnings.length > 0
          ? 'ELIGIBLE_WITH_WARNINGS'
          : 'ELIGIBLE'

    return {
      capability_id: capabilityId,
      eligibility,
      model_status: exists && belongsToTenant && modelActive,
      has_required_claims: hasRequiredClaims,
      required_claims_eligible: requiredClaimsEligible,
      reviews_complete: reviewsComplete,
      evidence_sufficiency_determined: evidenceSufficiencyDetermined,
      evidence_fresh: evidenceFresh,
      no_unresolved_contradictions: noUnresolvedContradictions,
      model_active: modelActive,
      warnings,
      blockers,
      evaluated_at: new Date().toISOString(),
    }
  }

  /**
   * Quick check: is the capability eligible for scoring?
   * Returns true only if eligibility state is ELIGIBLE or ELIGIBLE_WITH_WARNINGS
   * (warnings don't block scoring, blockers do).
   */
  async isEligible(capabilityId: string, modelId: string): Promise<boolean> {
    const result = await this.evaluateEligibility(capabilityId, modelId)
    return result.eligibility === 'ELIGIBLE' || result.eligibility === 'ELIGIBLE_WITH_WARNINGS'
  }

  // ─── DB access helpers ─────────────────────────────────────────────────

  private async getCapability(capabilityId: string): Promise<CapabilityRow | null> {
    const { data, error } = await this.supabase
      .from('capabilities')
      .select('id,tenant_id,institution_id,organization_id,evidence_sufficiency,updated_at,created_at')
      .eq('id', capabilityId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load capability ${capabilityId}: ${error.message}`,
        error.details,
      )
    }
    return data as CapabilityRow | null
  }

  private async getCapabilityClaimLinks(
    capabilityId: string,
  ): Promise<CapabilityClaimLinkRow[]> {
    const { data, error } = await this.supabase
      .from('capability_claim_links')
      .select('capability_id,claim_id,relationship_type')
      .eq('capability_id', capabilityId)
      .limit(1000)

    if (error) {
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load capability_claim_links for ${capabilityId}: ${error.message}`,
        error.details,
      )
    }
    return (data as CapabilityClaimLinkRow[] | null) ?? []
  }

  private async getClaims(claimIds: string[]): Promise<ClaimRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('claims')
      .select('id,lifecycle_status,review_status')
      .in('id', claimIds)

    if (error) {
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claims: ${error.message}`,
        error.details,
      )
    }
    return (data as ClaimRow[] | null) ?? []
  }

  private async getReviewTasksForClaims(
    claimIds: string[],
  ): Promise<ReviewTaskRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('review_tasks')
      .select('id,claim_id,status,completed_at')
      .in('claim_id', claimIds)

    if (error) {
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load review_tasks: ${error.message}`,
        error.details,
      )
    }
    return (data as ReviewTaskRow[] | null) ?? []
  }

  private async getEvidenceLinksForClaims(
    claimIds: string[],
  ): Promise<ClaimEvidenceLinkRow[]> {
    if (claimIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id,evidence_id,relationship_type')
      .in('claim_id', claimIds)

    if (error) {
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claim_evidence_links: ${error.message}`,
        error.details,
      )
    }
    return (data as ClaimEvidenceLinkRow[] | null) ?? []
  }

  private async getEvidenceNodes(
    evidenceIds: string[],
  ): Promise<EvidenceNodeRow[]> {
    if (evidenceIds.length === 0) return []
    const { data, error } = await this.supabase
      .from('evidence_nodes')
      .select('id,lifecycle_status,status')
      .in('id', evidenceIds)

    if (error) {
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load evidence_nodes: ${error.message}`,
        error.details,
      )
    }
    return (data as EvidenceNodeRow[] | null) ?? []
  }

  private async getModel(modelId: string): Promise<ConfidenceModel | null> {
    const { data, error } = await this.supabase
      .from('confidence_models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new ConfidenceEligibilityServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load confidence model ${modelId}: ${error.message}`,
        error.details,
      )
    }
    return data as unknown as ConfidenceModel | null
  }
}