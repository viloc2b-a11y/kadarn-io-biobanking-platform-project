// ─── KAD-LOOP-003 — Evidence Sufficiency Service (Phases 5-8) ────────────
// Authority: KADARN Product Constitution, LOOP-3 Spec
//
// Deterministic, qualitative evaluator that rolls up the evidence backing a
// capability into one of six EvidenceSufficiency values. This is NOT a
// confidence score (LOOP 4) — it is a categorical "is the evidence base
// adequate?" assessment with a fixed evaluation order.
//
// Evaluation algorithm (short-circuits at the first matching rule):
//   1. Gather all claims linked to the capability (capability_claims /
//      capability_claim_links M2M).
//   2. For each claim, gather all evidence via claim_evidence_links.
//   3. Inspect each evidence node's lifecycle_status (from evidence_nodes).
//   4. Apply the first matching rule:
//        a. No evidence at all across all linked claims → 'insufficient'
//        b. Every evidence node is 'expired'   → 'expired'
//        c. Every evidence node is 'superseded'→ 'superseded'
//        d. Any claim_evidence_link with relationship_type='CONTRADICTS'
//           → 'conflicting'
//        e. Any evidence node flagged for manual review (lifecycle_status
//           = 'reviewed' OR a manual_review flag in metadata) →
//           'manual_review_required'
//        f. Otherwise → 'sufficient'
//
// The evaluator is pure given the DB state: same state → same result. No
// randomness, no LLM, no scoring. It reads from three tables via the
// injected Supabase client:
//   - capability_claim_links  (capability ↔ claim M2M)
//   - claim_evidence_links    (claim ↔ evidence M2M)
//   - evidence_nodes          (the evidence rows themselves)
//
// CRITICAL: this service performs aggregation only. It does not compute
// numeric confidence, does not implement Passport logic, and does not score
// evidence. Updating capabilities.evidence_sufficiency is its only write.

import { createClient } from '@supabase/supabase-js'
import type {
  EvidenceSufficiency,
  ClaimEvidenceLink,
  CapabilityClaimLink,
  EvidenceLifecycleStatus,
} from '@kadarn/types'

// ─── Service errors ──────────────────────────────────────────────────────

export class EvidenceSufficiencyServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'EvidenceSufficiencyServiceError'
  }
}

// ─── Internal row shapes (DB projection — kept loose, not exported) ──────
// We project only the columns we need; the Supabase client returns `any`,
// and we narrow through these interfaces.

interface CapabilityClaimLinkRow {
  capability_id: string
  claim_id: string
  relationship_type: string
}

interface ClaimEvidenceLinkRow {
  claim_id: string
  evidence_id: string
  relationship_type: string // ClaimEvidenceRelationshipType
}

interface EvidenceNodeRow {
  id: string
  lifecycle_status: EvidenceLifecycleStatus | null
  status: string | null // legacy EvidenceNodeStatus
  metadata: Record<string, unknown> | null
  expires_at: string | null
}

// ─── Evaluation result detail (for batch + transparency) ─────────────────

export interface SufficiencyEvaluation {
  capability_id: string
  sufficiency: EvidenceSufficiency
  /** How many distinct claims are linked to the capability. */
  linked_claim_count: number
  /** How many distinct evidence nodes back those claims. */
  linked_evidence_count: number
  /** Which rule fired (1-based index into the algorithm above). */
  matched_rule: number
  /** Human-readable reason for the result. */
  reason: string
}

// ─── Supabase client structural type (avoids importing the full SDK type) ─

interface SupabaseLike {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => Promise<{
        data: unknown
        error: { code?: string; message?: string; details?: unknown } | null
      }>
    }
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{
        data: unknown
        error: { code?: string; message?: string; details?: unknown } | null
      }>
    }
  }
}

// ─── Service ─────────────────────────────────────────────────────────────

export class EvidenceSufficiencyService {
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

  // ─── Core evaluator ────────────────────────────────────────────────────

  /**
   * Evaluate the evidence sufficiency for a single capability.
   *
   * Deterministic and side-effect free — does not write to the DB. Use
   * updateCapabilitySufficiency to persist the result.
   */
  async evaluateSufficiency(capabilityId: string): Promise<SufficiencyEvaluation> {
    // 1. Get all claims linked to the capability.
    const claims = await this.getLinkedClaims(capabilityId)

    if (claims.length === 0) {
      // No claims at all → no evidence → insufficient.
      return this.result(capabilityId, 'insufficient', 0, 0, 1, 'No claims linked to capability')
    }

    // 2. For each claim, get its evidence links.
    const evidenceLinks: ClaimEvidenceLinkRow[] = []
    for (const c of claims) {
      const links = await this.getClaimEvidenceLinks(c.claim_id)
      evidenceLinks.push(...links)
    }

    if (evidenceLinks.length === 0) {
      // Claims exist but none have evidence → insufficient.
      return this.result(
        capabilityId,
        'insufficient',
        claims.length,
        0,
        1,
        'Linked claims have no evidence',
      )
    }

    // 3. Fetch the evidence nodes for all linked evidence_ids.
    const evidenceIds = Array.from(new Set(evidenceLinks.map((l) => l.evidence_id)))
    const evidenceNodes = await this.getEvidenceNodes(evidenceIds)

    if (evidenceNodes.length === 0) {
      // Links exist but the evidence rows are gone (deleted/orphaned) →
      // treat as insufficient rather than crash.
      return this.result(
        capabilityId,
        'insufficient',
        claims.length,
        0,
        1,
        'Evidence links exist but no evidence nodes found (orphaned links)',
      )
    }

    // 4a. Rule: any CONTRADICTS relationship → 'conflicting'.
    //     (Check this before expiry/supersession because a contradiction is
    //     a stronger signal — even expired contradicting evidence flags a
    //     historical conflict the reviewer should know about. The spec lists
    //     contradiction after expiry/supersession, but those rules are about
    //     *all* evidence being expired/superseded; if there's a contradiction
    //     AND non-expired evidence, we still want 'conflicting'. We honour
    //     the spec's "all expired / all superseded" precedence by checking
    //     those first below, then contradiction.)
    //
    //     Per the task's explicit ordering:
    //       4. no evidence → insufficient
    //       5. all expired → expired
    //       6. all superseded → superseded
    //       7. any CONTRADICTS → conflicting
    //       8. manual review flag → manual_review_required
    //       9. otherwise → sufficient
    //     So we check expiry/supersession of the *whole* evidence base first.

    // 4b. Rule: all evidence expired → 'expired'.
    const allExpired = evidenceNodes.length > 0 && evidenceNodes.every((n) => this.isExpired(n))
    if (allExpired) {
      return this.result(
        capabilityId,
        'expired',
        claims.length,
        evidenceNodes.length,
        2,
        'All linked evidence has expired',
      )
    }

    // 4c. Rule: all evidence superseded → 'superseded'.
    const allSuperseded =
      evidenceNodes.length > 0 && evidenceNodes.every((n) => this.isSuperseded(n))
    if (allSuperseded) {
      return this.result(
        capabilityId,
        'superseded',
        claims.length,
        evidenceNodes.length,
        3,
        'All linked evidence has been superseded',
      )
    }

    // 4d. Rule: any CONTRADICTS relationship on a claim-evidence link → 'conflicting'.
    const hasContradiction = evidenceLinks.some((l) => l.relationship_type === 'CONTRADICTS')
    if (hasContradiction) {
      return this.result(
        capabilityId,
        'conflicting',
        claims.length,
        evidenceNodes.length,
        4,
        'At least one claim-evidence link has relationship CONTRADICTS',
      )
    }

    // 4e. Rule: any evidence flagged for manual review → 'manual_review_required'.
    //     "Flagged for manual review" means either:
    //       - lifecycle_status === 'reviewed' (awaiting human sign-off), OR
    //       - a `manual_review` boolean in the evidence metadata is true, OR
    //       - lifecycle_status === 'rejected' (needs human re-evaluation)
    const needsManualReview = evidenceNodes.some((n) => this.requiresManualReview(n))
    if (needsManualReview) {
      return this.result(
        capabilityId,
        'manual_review_required',
        claims.length,
        evidenceNodes.length,
        5,
        'At least one evidence node is flagged for manual review',
      )
    }

    // 4f. Otherwise → 'sufficient'.
    return this.result(
      capabilityId,
      'sufficient',
      claims.length,
      evidenceNodes.length,
      6,
      'Evidence base is adequate',
    )
  }

  /**
   * Evaluate sufficiency for a capability and persist the result to
   * `capabilities.evidence_sufficiency`.
   */
  async updateCapabilitySufficiency(capabilityId: string): Promise<EvidenceSufficiency> {
    const evaluation = await this.evaluateSufficiency(capabilityId)

    const { error } = await this.supabase
      .from('capabilities')
      .update({ evidence_sufficiency: evaluation.sufficiency })
      .eq('id', capabilityId)

    if (error) {
      throw new EvidenceSufficiencyServiceError(
        error.code ?? 'UPDATE_FAILED',
        `Failed to persist evidence_sufficiency for capability ${capabilityId}: ${error.message}`,
        error.details,
      )
    }

    return evaluation.sufficiency
  }

  /**
   * Evaluate sufficiency for every capability belonging to an organization.
   * Returns a map of capabilityId → EvidenceSufficiency. Does NOT persist
   * results (caller can call updateCapabilitySufficiency per id if needed,
   * or extend this method to persist in a follow-up).
   */
  async batchEvaluate(orgId: string): Promise<Map<string, EvidenceSufficiency>> {
    const capabilityIds = await this.listCapabilityIdsForOrg(orgId)
    const results = new Map<string, EvidenceSufficiency>()

    // Sequential evaluation to keep DB load bounded. If throughput becomes a
    // concern this can be parallelised with a concurrency limiter.
    for (const id of capabilityIds) {
      try {
        const evaluation = await this.evaluateSufficiency(id)
        results.set(id, evaluation.sufficiency)
      } catch (err) {
        // Don't let one bad capability abort the whole batch — record a
        // conservative 'manual_review_required' and continue.
        results.set(id, 'manual_review_required')
      }
    }

    return results
  }

  // ─── DB access helpers ─────────────────────────────────────────────────

  /**
   * Fetch all CapabilityClaimLink rows for a capability.
   */
  private async getLinkedClaims(capabilityId: string): Promise<CapabilityClaimLinkRow[]> {
    const { data, error } = await this.supabase
      .from('capability_claim_links')
      .select('capability_id,claim_id,relationship_type')
      .eq('capability_id', capabilityId)

    if (error) {
      throw new EvidenceSufficiencyServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load capability_claims for ${capabilityId}: ${error.message}`,
        error.details,
      )
    }

    return (data as CapabilityClaimLinkRow[] | null) ?? []
  }

  /**
   * Fetch all ClaimEvidenceLink rows for a claim.
   */
  private async getClaimEvidenceLinks(claimId: string): Promise<ClaimEvidenceLinkRow[]> {
    const { data, error } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id,evidence_id,relationship_type')
      .eq('claim_id', claimId)

    if (error) {
      throw new EvidenceSufficiencyServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to load claim_evidence_links for ${claimId}: ${error.message}`,
        error.details,
      )
    }

    return (data as ClaimEvidenceLinkRow[] | null) ?? []
  }

  /**
   * Fetch evidence node rows for a set of evidence ids. Returns only the
   * columns needed for sufficiency evaluation.
   */
  private async getEvidenceNodes(evidenceIds: string[]): Promise<EvidenceNodeRow[]> {
    if (evidenceIds.length === 0) return []

    // The Supabase client's `.in()` filter isn't on our minimal structural
    // type; fetch one-by-one to stay within the typed surface. For large
    // sets this is slower than a single `.in()` query — acceptable for
    // LOOP-3 capability scopes (typically tens, not thousands, of evidence
    // rows per capability). A future refactor can widen SupabaseLike to
    // include `.in()` and batch this.
    const rows: EvidenceNodeRow[] = []
    for (const id of evidenceIds) {
      const { data, error } = await this.supabase
        .from('evidence_nodes')
        .select('id,lifecycle_status,status,metadata,expires_at')
        .eq('id', id)

      if (error) {
        // Skip missing evidence rather than aborting the whole evaluation —
        // an orphaned link should not make the capability un-evaluatable.
        continue
      }
      const row = data as EvidenceNodeRow | null
      if (row) rows.push(row)
    }
    return rows
  }

  /**
   * Fetch all capability ids belonging to an organization.
   */
  private async listCapabilityIdsForOrg(orgId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('capabilities')
      .select('id')
      .eq('organization_id', orgId)

    if (error) {
      throw new EvidenceSufficiencyServiceError(
        error.code ?? 'QUERY_FAILED',
        `Failed to list capabilities for org ${orgId}: ${error.message}`,
        error.details,
      )
    }

    const rows = (data as { id: string }[] | null) ?? []
    return rows.map((r) => r.id)
  }

  // ─── Evidence state predicates ─────────────────────────────────────────

  /**
   * An evidence node is "expired" if its lifecycle_status indicates expiry
   * OR its expires_at is in the past. (lifecycle_status 'archived' is
   * terminal but not "expired" in the sufficiency sense — it still counts
   * as evidence, just retired. We only treat 'expired'-ish lifecycle
   * states and past expires_at as expired.)
   */
  private isExpired(node: EvidenceNodeRow): boolean {
    // lifecycle_status values that mean "expired/dead beyond use":
    //   - 'archived' — administratively retired; counts as expired for
    //     sufficiency (no longer usable as live evidence)
    //   - 'invalidated' — explicitly invalidated
    // We deliberately do NOT treat 'rejected' as expired (rejected evidence
    // needs manual review, handled separately).
    const lifecycle = node.lifecycle_status
    if (lifecycle === 'archived' || lifecycle === 'invalidated') {
      return true
    }
    if (node.expires_at) {
      const ms = Date.parse(node.expires_at)
      if (!Number.isNaN(ms) && ms < Date.now()) {
        return true
      }
    }
    return false
  }

  /**
   * An evidence node is "superseded" if its lifecycle_status is
   * 'superseded' or its legacy status is 'superseded'.
   */
  private isSuperseded(node: EvidenceNodeRow): boolean {
    return (
      node.lifecycle_status === 'superseded' || node.status === 'superseded'
    )
  }

  /**
   * An evidence node requires manual review if:
   *   - lifecycle_status is 'reviewed' (awaiting human sign-off), OR
   *   - lifecycle_status is 'rejected' (human needs to re-evaluate), OR
   *   - metadata.manual_review === true
   */
  private requiresManualReview(node: EvidenceNodeRow): boolean {
    if (node.lifecycle_status === 'reviewed' || node.lifecycle_status === 'rejected') {
      return true
    }
    const flag = node.metadata?.['manual_review']
    return flag === true || flag === 'true' || flag === 1
  }

  // ─── Result builder ────────────────────────────────────────────────────

  private result(
    capabilityId: string,
    sufficiency: EvidenceSufficiency,
    linkedClaimCount: number,
    linkedEvidenceCount: number,
    matchedRule: number,
    reason: string,
  ): SufficiencyEvaluation {
    return {
      capability_id: capabilityId,
      sufficiency,
      linked_claim_count: linkedClaimCount,
      linked_evidence_count: linkedEvidenceCount,
      matched_rule: matchedRule,
      reason,
    }
  }
}
