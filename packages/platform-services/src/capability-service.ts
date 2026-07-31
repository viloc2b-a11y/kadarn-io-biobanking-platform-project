// ─── KAD-LOOP-003 — Capability Service (Phases 5-8) ──────────────────────
// Authority: KADARN Product Constitution, LOOP-3 Spec
//
// Manages institution capabilities and their M2M links to claims. Capabilities
// are the aggregates that evidence sufficiency (see evidence-sufficiency-service)
// rolls up against. A capability starts as 'declared' and progresses through
// the InstitutionCapabilityStatus lifecycle as evidence/claims are linked and
// reviewed.
//
// Aggregation only — no confidence scoring (LOOP 4). The `claim_count` field
// is a denormalized count of linked claims, kept in sync by
// recalculateClaimCount. The `evidence_sufficiency` field is owned by the
// EvidenceSufficiencyService, not this service.
//
// Dependencies (injected):
//   - CapabilityRepository  (repositories/capability-repository.ts, parallel work)
//
// The repository interface below mirrors BaseRepository's { data, error }
// contract and adds the M2M link operations the service needs.

import type {
  InstitutionCapability,
  CreateInstitutionCapability,
  UpdateInstitutionCapability,
  InstitutionCapabilityStatus,
  CapabilityClaimLink,
  CapabilityClaimRelationship,
  CreateCapabilityClaimLink,
  // ─── KEMS Extended types ────────────────────────────────────────────────
  CapabilityState,
  CapabilityStateType,
  CapabilityLifecycleState,
  CapabilityInstance,
  CapabilityArea,
  CapabilityActivationEvent,
  ReadinessContribution,
} from '@kadarn/types'

// ─── Repository contract (structural — match BaseRepository surface) ─────

export interface RepositoryResult<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
}

export interface CapabilityRepositoryLike {
  findById(id: string): Promise<RepositoryResult<InstitutionCapability>>
  create(input: CreateInstitutionCapability): Promise<RepositoryResult<InstitutionCapability>>
  update(id: string, patch: UpdateInstitutionCapability): Promise<RepositoryResult<InstitutionCapability>>
  list(
    filters?: { orgId?: string; status?: InstitutionCapabilityStatus },
    page?: number,
    limit?: number,
  ): Promise<RepositoryResult<InstitutionCapability[]>>

  // M2M capability ↔ claim links
  addClaimLink(link: CreateCapabilityClaimLink): Promise<RepositoryResult<CapabilityClaimLink>>
  removeClaimLink(capabilityId: string, claimId: string): Promise<RepositoryResult<null>>
  listClaimLinks(capabilityId: string): Promise<RepositoryResult<CapabilityClaimLink[]>>

  // Denormalized count maintenance
  setClaimCount(capabilityId: string, count: number): Promise<RepositoryResult<InstitutionCapability>>
}

// ─── KEMS Extended Repository contracts ──────────────────────────────────

/** Repository for KEMS capability instance operations. */
export interface CapabilityInstanceRepositoryLike {
  findById(id: string): Promise<RepositoryResult<CapabilityInstance>>
  listByProfile(
    profileId: string,
    filters?: { lifecycleState?: CapabilityLifecycleState; area?: CapabilityArea },
  ): Promise<RepositoryResult<CapabilityInstance[]>>
  update(
    id: string,
    patch: Partial<CapabilityInstance>,
  ): Promise<RepositoryResult<CapabilityInstance>>
}

/** Repository for capability state records (temporal tracking). */
export interface CapabilityStateRepositoryLike {
  create(input: {
    capability_id: string
    organization_id: string
    state: CapabilityStateType
    valid_from?: string
    evidence_summary?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }): Promise<RepositoryResult<CapabilityState>>
  listByCapability(capabilityId: string): Promise<RepositoryResult<CapabilityState[]>>
  endCurrentState(capabilityId: string, validUntil: string): Promise<RepositoryResult<CapabilityState>>
}

/** Repository for capability activation events. */
export interface CapabilityActivationEventRepositoryLike {
  create(input: {
    capability_id: string
    organization_id: string
    activation_type: string
    activated_by?: string
    activation_method?: string
    previous_state?: CapabilityLifecycleState
    new_state?: CapabilityLifecycleState
    evidence_ref?: string
    activation_summary?: string
    valid_from: string
    valid_until?: string
  }): Promise<RepositoryResult<CapabilityActivationEvent>>
  listByCapability(capabilityId: string): Promise<RepositoryResult<CapabilityActivationEvent[]>>
}

/** Repository for readiness contributions. */
export interface ReadinessContributionRepositoryLike {
  findByCapability(capabilityId: string): Promise<RepositoryResult<ReadinessContribution>>
  findByProfile(profileId: string): Promise<RepositoryResult<ReadinessContribution[]>>
  upsert(
    capabilityId: string,
    data: {
      organization_id: string
      contribution_value: number
      confidence: number
      weight: number
      contribution_area?: CapabilityArea
      contribution_type?: string
      evidence_count?: number
      evidence_weighted_score?: number
      rationale?: string
    },
  ): Promise<RepositoryResult<ReadinessContribution>>
}

// ─── Service errors ──────────────────────────────────────────────────────

export class CapabilityServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'CapabilityServiceError'
  }
}

// ─── Result shapes ───────────────────────────────────────────────────────

export interface PaginatedCapabilities {
  items: InstitutionCapability[]
  page: number
  limit: number
  total: number
}

export interface CapabilityWithClaims {
  capability: InstitutionCapability
  claimLinks: CapabilityClaimLink[]
}

// ─── KEMS Extended result shapes ─────────────────────────────────────────

/** Evaluation result for a capability's current state. */
export interface CapabilityEvaluation {
  capabilityId: string
  lifecycleState: CapabilityLifecycleState
  isActive: boolean
  activationCount: number
  lastActivatedAt: string | null
  dependencyStatus: 'satisfied' | 'partial' | 'unsatisfied' | 'not_applicable'
  evidenceSufficiency: string | null
  readinessContribution: number | null
  recommendation: 'maintain' | 'enhance' | 'degrade' | 'suspend' | 'verify'
  issues: string[]
}

/** The computed activation state for a capability. */
export interface ActivationState {
  capabilityId: string
  state: CapabilityLifecycleState
  isOperationallyActive: boolean
  lastActivation: CapabilityActivationEvent | null
  activationHistory: CapabilityActivationEvent[]
  validUntil: string | null
  requiresRenewal: boolean
}

/** Capability gaps for a profile. */
export interface CapabilityGap {
  capabilityId: string
  area: string
  gap: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
}

/** Aggregated readiness contribution for a profile. */
export interface ProfileReadinessContribution {
  profileId: string
  overallContribution: number
  capabilityContributions: ReadinessContribution[]
  gapCount: number
  computedAt: string
}

// ─── Service ─────────────────────────────────────────────────────────────

export class CapabilityService {
  constructor(
    private readonly capabilities: CapabilityRepositoryLike,
    // ─── KEMS Extended dependencies (optional) ──────────────────────────
    private readonly capabilityInstances?: CapabilityInstanceRepositoryLike,
    private readonly capabilityStates?: CapabilityStateRepositoryLike,
    private readonly activationEvents?: CapabilityActivationEventRepositoryLike,
    private readonly readinessContributions?: ReadinessContributionRepositoryLike,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────

  /**
   * Create a new capability in 'declared' status. `claim_count` starts at 0;
   * `evidence_sufficiency` is left null until EvidenceSufficiencyService
   * evaluates it.
   */
  async createCapability(input: CreateInstitutionCapability): Promise<InstitutionCapability> {
    const { data: capability, error } = await this.capabilities.create(input)
    if (error || !capability) {
      throw new CapabilityServiceError(
        error?.code ?? 'CREATE_FAILED',
        `Failed to create capability: ${error?.message ?? 'no data returned'}`,
        error?.details,
      )
    }
    return capability
  }

  // ─── Update ────────────────────────────────────────────────────────────

  /**
   * Update editable fields on a capability. Status transitions are also
   * applied through this method (the repository is expected to persist
   * whatever subset of fields is present on the patch).
   */
  async updateCapability(
    id: string,
    input: UpdateInstitutionCapability,
  ): Promise<InstitutionCapability> {
    const { data: current, error } = await this.capabilities.findById(id)
    if (error || !current) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (current.status === 'deprecated') {
      throw new CapabilityServiceError(
        'INVALID_TRANSITION',
        `Capability ${id} is deprecated and cannot be updated`,
      )
    }

    const { data: updated, error: updErr } = await this.capabilities.update(id, input)
    if (updErr || !updated) {
      throw new CapabilityServiceError(
        updErr?.code ?? 'UPDATE_FAILED',
        `Failed to update capability ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── Deprecate ─────────────────────────────────────────────────────────

  /**
   * Mark a capability as deprecated. Terminal — deprecated capabilities
   * cannot be updated further. Does NOT remove existing claim links (they
   * remain for historical/evidence-trail purposes).
   */
  async deprecateCapability(id: string): Promise<InstitutionCapability> {
    const { data: current, error } = await this.capabilities.findById(id)
    if (error || !current) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (current.status === 'deprecated') {
      // Idempotent: already deprecated.
      return current
    }

    const { data: deprecated, error: updErr } = await this.capabilities.update(id, {
      status: 'deprecated',
    })
    if (updErr || !deprecated) {
      throw new CapabilityServiceError(
        updErr?.code ?? 'DEPRECATE_FAILED',
        `Failed to deprecate capability ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return deprecated
  }

  // ─── Claim M2M links ───────────────────────────────────────────────────

  /**
   * Link a claim to a capability with a relationship type and optional
   * weight (weight is a LOOP-4 confidence input; defaults to 0 in LOOP-3).
   * After linking, claim_count is recalculated.
   */
  async linkClaim(
    capabilityId: string,
    claimId: string,
    relationship: CapabilityClaimRelationship,
    weight?: number,
  ): Promise<CapabilityClaimLink> {
    // Verify the capability exists.
    const { data: cap, error: capErr } = await this.capabilities.findById(capabilityId)
    if (capErr || !cap) {
      throw new CapabilityServiceError(
        capErr?.code ?? 'NOT_FOUND',
        `Capability not found: ${capabilityId} — ${capErr?.message ?? 'no data'}`,
        capErr?.details,
      )
    }

    if (cap.status === 'deprecated') {
      throw new CapabilityServiceError(
        'INVALID_TRANSITION',
        `Cannot link claims to deprecated capability ${capabilityId}`,
      )
    }

    const linkInput: CreateCapabilityClaimLink = {
      capability_id: capabilityId,
      claim_id: claimId,
      relationship_type: relationship,
      weight: weight,
    }

    const { data: link, error: linkErr } = await this.capabilities.addClaimLink(linkInput)
    if (linkErr || !link) {
      throw new CapabilityServiceError(
        linkErr?.code ?? 'LINK_FAILED',
        `Failed to link claim ${claimId} to capability ${capabilityId}: ${linkErr?.message ?? 'no data'}`,
        linkErr?.details,
      )
    }

    // Keep the denormalized claim_count in sync.
    await this.recalculateClaimCount(capabilityId)

    return link
  }

  /**
   * Remove a claim link from a capability. After unlinking, claim_count is
   * recalculated.
   */
  async unlinkClaim(capabilityId: string, claimId: string): Promise<void> {
    const { error } = await this.capabilities.removeClaimLink(capabilityId, claimId)
    if (error) {
      // Idempotent: if the link doesn't exist, treat as success.
      if (error.code === 'NOT_FOUND') return
      throw new CapabilityServiceError(
        error.code,
        `Failed to unlink claim ${claimId} from capability ${capabilityId}: ${error.message}`,
        error.details,
      )
    }

    await this.recalculateClaimCount(capabilityId)
  }

  // ─── Reads ─────────────────────────────────────────────────────────────

  /**
   * Fetch a capability together with all its CapabilityClaimLinks.
   */
  async getCapabilityWithClaims(id: string): Promise<CapabilityWithClaims> {
    const { data: capability, error } = await this.capabilities.findById(id)
    if (error || !capability) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const { data: claimLinks, error: linkErr } = await this.capabilities.listClaimLinks(id)
    if (linkErr) {
      throw new CapabilityServiceError(
        linkErr.code,
        `Failed to load claim links for capability ${id}: ${linkErr.message}`,
        linkErr.details,
      )
    }

    return {
      capability,
      claimLinks: claimLinks ?? [],
    }
  }

  /**
   * Paginated, filtered list of capabilities.
   */
  async listCapabilities(
    filters?: { orgId?: string; status?: InstitutionCapabilityStatus },
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedCapabilities> {
    const p = Math.max(1, Math.floor(page))
    const l = Math.max(1, Math.min(200, Math.floor(limit)))

    const { data: items, error } = await this.capabilities.list(filters, p, l)
    if (error) {
      throw new CapabilityServiceError(
        error.code,
        `Failed to list capabilities: ${error.message}`,
        error.details,
      )
    }

    const rows = items ?? []
    return {
      items: rows,
      page: p,
      limit: l,
      total: rows.length, // best-effort; repository may override with true count
    }
  }

  // ─── Denormalized count maintenance ────────────────────────────────────

  /**
   * Recalculate and persist the `claim_count` field for a capability by
   * counting its current CapabilityClaimLinks. Called automatically after
   * link/unlink; can also be called directly to repair drift.
   */
  async recalculateClaimCount(id: string): Promise<InstitutionCapability> {
    const { data: links, error } = await this.capabilities.listClaimLinks(id)
    if (error) {
      throw new CapabilityServiceError(
        error.code,
        `Failed to list claim links for recalc on capability ${id}: ${error.message}`,
        error.details,
      )
    }

    const count = (links ?? []).length
    const { data: updated, error: updErr } = await this.capabilities.setClaimCount(id, count)
    if (updErr || !updated) {
      throw new CapabilityServiceError(
        updErr?.code ?? 'COUNT_UPDATE_FAILED',
        `Failed to update claim_count on capability ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS EXTENDED METHODS — Capability Management & Readiness
  // ═══════════════════════════════════════════════════════════════════════
  //
  // These methods implement the KEMS capability evaluation pipeline:
  // capability assessment, activation state calculation, degradation/restore
  // lifecycle, gap analysis, and readiness contribution aggregation.
  //
  // They require the optional KEMS repository dependencies which default to
  // undefined — calling any KEMS method without those dependencies injected
  // will throw.

  // ─── KEMS: evaluateCapability ─────────────────────────────────────────

  /**
   * Evaluate a capability's current state and produce a recommendation.
   *
   * Examines:
   *   - Lifecycle state (declared → published → suspended → deprecated)
   *   - Activation history (how many times, when last activated)
   *   - Dependency status (are downstream capabilities satisfied?)
   *   - Evidence sufficiency (is there enough supporting evidence?)
   *   - Readiness contribution (how much does this contribute to overall readiness?)
   *
   * Returns a {@link CapabilityEvaluation} with a recommendation.
   */
  async evaluateCapability(capabilityId: string): Promise<CapabilityEvaluation> {
    this.requireKems()

    const { data: instance, error } =
      await this.capabilityInstances!.findById(capabilityId)
    if (error || !instance) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${capabilityId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const issues: string[] = []
    let recommendation: CapabilityEvaluation['recommendation'] = 'maintain'

    // Evaluate lifecycle state
    const isActive = !['suspended', 'deprecated'].includes(instance.lifecycle_state)

    if (!isActive) {
      issues.push(`Capability is ${instance.lifecycle_state}`)
      recommendation = instance.lifecycle_state === 'suspended' ? 'suspend' : 'degrade'
    }

    // Check evidence sufficiency
    if (instance.evidence_sufficiency === 'insufficient' || instance.evidence_sufficiency === 'conflicting') {
      issues.push(`Evidence sufficiency is ${instance.evidence_sufficiency}`)
      recommendation = 'verify'
    }

    // Check dependencies
    if (instance.dependency_status === 'unsatisfied') {
      issues.push('Capability has unsatisfied dependencies')
      if (recommendation === 'maintain') recommendation = 'enhance'
    }

    // Check readiness contribution
    if (instance.readiness_contribution !== null && instance.readiness_contribution !== undefined) {
      if (instance.readiness_contribution < 0.3) {
        issues.push('Low readiness contribution (< 0.3)')
        if (recommendation === 'maintain') recommendation = 'enhance'
      }
    }

    // Check activation recency
    if (instance.last_activated_at) {
      const lastActivated = Date.parse(instance.last_activated_at)
      const daysSinceActivation = (Date.now() - lastActivated) / (1000 * 60 * 60 * 24)
      if (daysSinceActivation > 365) {
        issues.push(`Last activated ${Math.round(daysSinceActivation)} days ago; may need renewal`)
        recommendation = 'verify'
      }
    } else if (instance.activation_count === 0) {
      issues.push('Capability has never been activated')
      recommendation = 'verify'
    }

    return {
      capabilityId,
      lifecycleState: instance.lifecycle_state,
      isActive,
      activationCount: instance.activation_count,
      lastActivatedAt: instance.last_activated_at ?? null,
      dependencyStatus: instance.dependency_status ?? 'not_applicable',
      evidenceSufficiency: instance.evidence_sufficiency ?? null,
      readinessContribution: instance.readiness_contribution ?? null,
      recommendation,
      issues,
    }
  }

  // ─── KEMS: calculateActivationState ───────────────────────────────────

  /**
   * Calculate the current activation state for a capability.
   *
   * Examines the capability's activation event history to determine:
   *   - Whether it is operationally active (most recent activation is still valid)
   *   - When the current activation expires (valid_until)
   *   - Whether renewal is required (expiring within 30 days)
   *
   * @param capabilityId - Target capability ID
   */
  async calculateActivationState(capabilityId: string): Promise<ActivationState> {
    this.requireKems()

    const { data: instance, error } =
      await this.capabilityInstances!.findById(capabilityId)
    if (error || !instance) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${capabilityId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Load activation event history
    let activationHistory: CapabilityActivationEvent[] = []
    if (this.activationEvents) {
      const { data: events } = await this.activationEvents.listByCapability(capabilityId)
      activationHistory = events ?? []
    }

    // Sort by valid_from descending to find most recent activation
    const sorted = [...activationHistory].sort(
      (a, b) => Date.parse(b.valid_from) - Date.parse(a.valid_from),
    )

    const lastActivation = sorted[0] ?? null
    let isOperationallyActive = false
    let validUntil: string | null = null
    let requiresRenewal = false

    if (lastActivation) {
      // Check if the activation is still within its validity window
      if (lastActivation.valid_until) {
        const expiry = Date.parse(lastActivation.valid_until)
        validUntil = lastActivation.valid_until
        isOperationallyActive = Date.now() < expiry

        // Renewal needed if expiring within 30 days
        const daysUntilExpiry = (expiry - Date.now()) / (1000 * 60 * 60 * 24)
        requiresRenewal = daysUntilExpiry > 0 && daysUntilExpiry < 30
      } else {
        // No expiry — activation is perpetual unless explicitly degraded
        isOperationallyActive = lastActivation.activation_type !== 'transfer'
        validUntil = null
        requiresRenewal = false
      }

      // An active 'suspended' or 'deprecated' lifecycle state overrides activation
      if (['suspended', 'deprecated'].includes(instance.lifecycle_state)) {
        isOperationallyActive = false
      }
    }

    return {
      capabilityId,
      state: instance.lifecycle_state,
      isOperationallyActive,
      lastActivation,
      activationHistory,
      validUntil,
      requiresRenewal,
    }
  }

  // ─── KEMS: degradeCapability ──────────────────────────────────────────

  /**
   * Degrade a capability — mark it as suspended or deprecated with a reason.
   *
   * Transitions the capability to 'suspended' (temporary) lifecycle state
   * and ends the current capability state record. Degraded capabilities are
   * excluded from readiness calculations and publication projections.
   *
   * @param capabilityId - Target capability ID
   * @param reason       - Reason for degradation
   */
  async degradeCapability(
    capabilityId: string,
    reason: string,
  ): Promise<CapabilityInstance> {
    this.requireKems()

    const { data: instance, error } =
      await this.capabilityInstances!.findById(capabilityId)
    if (error || !instance) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${capabilityId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (instance.lifecycle_state === 'suspended' || instance.lifecycle_state === 'deprecated') {
      throw new CapabilityServiceError(
        'ALREADY_DEGRADED',
        `Capability ${capabilityId} is already ${instance.lifecycle_state}`,
      )
    }

    // End the current capability state record
    const now = new Date().toISOString()
    if (this.capabilityStates) {
      await this.capabilityStates.endCurrentState(capabilityId, now).catch(() => {
        // Best-effort: state tracking is not critical for the degradation itself
      })
    }

    // Transition lifecycle state
    const { data: updated, error: updErr } = await this.capabilityInstances!.update(
      capabilityId,
      {
        lifecycle_state: 'suspended',
        status: 'deprecated',
        metadata: {
          ...((instance.metadata as Record<string, unknown>) ?? {}),
          degradation_reason: reason,
          degraded_at: now,
        },
      },
    )

    if (updErr || !updated) {
      throw new CapabilityServiceError(
        updErr?.code ?? 'DEGRADE_FAILED',
        `Failed to degrade capability ${capabilityId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    // Record activation event for the degradation
    if (this.activationEvents) {
      await this.activationEvents.create({
        capability_id: capabilityId,
        organization_id: instance.organization_id,
        activation_type: 'transfer',
        previous_state: instance.lifecycle_state,
        new_state: 'suspended',
        activation_summary: `Degraded: ${reason}`,
        valid_from: now,
      }).catch(() => { /* best-effort */ })
    }

    return updated
  }

  // ─── KEMS: restoreCapability ──────────────────────────────────────────

  /**
   * Restore a previously degraded capability back to active status.
   *
   * Transitions the capability from 'suspended' back to its previous
   * lifecycle state and creates a new activation event recording the
   * restoration.
   *
   * @param capabilityId - Target capability ID
   */
  async restoreCapability(capabilityId: string): Promise<CapabilityInstance> {
    this.requireKems()

    const { data: instance, error } =
      await this.capabilityInstances!.findById(capabilityId)
    if (error || !instance) {
      throw new CapabilityServiceError(
        error?.code ?? 'NOT_FOUND',
        `Capability not found: ${capabilityId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (instance.lifecycle_state !== 'suspended') {
      throw new CapabilityServiceError(
        'NOT_DEGRADED',
        `Capability ${capabilityId} is not suspended (current: ${instance.lifecycle_state}); cannot restore`,
      )
    }

    // Determine the target state based on evidence and review status
    const targetState: CapabilityLifecycleState =
      instance.evidence_sufficiency === 'sufficient' ? 'verified'
        : instance.claim_count > 0 ? 'evidence_submitted'
          : 'declared'

    const now = new Date().toISOString()

    const { data: updated, error: updErr } = await this.capabilityInstances!.update(
      capabilityId,
      {
        lifecycle_state: targetState,
        status: targetState === 'verified' ? 'verified'
          : targetState === 'evidence_submitted' ? 'evidence_submitted'
            : 'declared',
        metadata: {
          ...((instance.metadata as Record<string, unknown>) ?? {}),
          restored_at: now,
          restored_from: 'suspended',
        },
      },
    )

    if (updErr || !updated) {
      throw new CapabilityServiceError(
        updErr?.code ?? 'RESTORE_FAILED',
        `Failed to restore capability ${capabilityId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    // Record reactivation event
    if (this.activationEvents) {
      await this.activationEvents.create({
        capability_id: capabilityId,
        organization_id: instance.organization_id,
        activation_type: 'reactivation',
        previous_state: 'suspended',
        new_state: targetState,
        activation_summary: 'Restored from suspended state',
        valid_from: now,
      }).catch(() => { /* best-effort */ })
    }

    return updated
  }

  // ─── KEMS: getGaps ────────────────────────────────────────────────────

  /**
   * Identify capability gaps for a profile.
   *
   * A gap exists when:
   *   - A capability is in 'declared' status (asserted but never evidenced)
   *   - A capability has 'insufficient' or 'conflicting' evidence
   *   - A capability has unsatisfied dependencies
   *   - A capability has never been activated
   *
   * @param profileId - The site profile ID to analyze gaps for
   */
  async getGaps(profileId: string): Promise<CapabilityGap[]> {
    this.requireKems()

    const { data: instances, error } =
      await this.capabilityInstances!.listByProfile(profileId)
    if (error) {
      throw new CapabilityServiceError(
        error.code,
        `Failed to list capabilities for profile ${profileId}: ${error.message}`,
        error.details,
      )
    }

    const gaps: CapabilityGap[] = []

    for (const cap of instances ?? []) {
      // Gap: declared but never evidenced
      if (cap.lifecycle_state === 'declared' && cap.claim_count === 0) {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Capability is declared but has no supporting evidence',
          severity: 'high',
          recommendation: 'Submit evidence or link claims to this capability',
        })
        continue
      }

      // Gap: insufficient or conflicting evidence
      if (cap.evidence_sufficiency === 'insufficient') {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Evidence is insufficient to support the capability',
          severity: 'medium',
          recommendation: 'Add more evidence or upgrade evidence class',
        })
      }

      if (cap.evidence_sufficiency === 'conflicting') {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Evidence conflicts with the capability assertion',
          severity: 'critical',
          recommendation: 'Resolve evidence conflicts before publication',
        })
      }

      // Gap: unsatisfied dependencies
      if (cap.dependency_status === 'unsatisfied') {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Capability has unsatisfied dependencies',
          severity: 'high',
          recommendation: 'Resolve dependencies before claiming this capability',
        })
      }

      // Gap: never activated
      if (cap.activation_count === 0 && cap.lifecycle_state === 'verified') {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Capability is verified but has never been operationally activated',
          severity: 'low',
          recommendation: 'Record an activation event to confirm operational readiness',
        })
      }

      // Gap: not published
      if (cap.claim_count > 0 && cap.lifecycle_state !== 'published') {
        gaps.push({
          capabilityId: cap.id,
          area: cap.area ?? 'other',
          gap: 'Capability has claims but is not published',
          severity: 'medium',
          recommendation: 'Complete review and publish the capability',
        })
      }
    }

    return gaps
  }

  // ─── KEMS: getReadinessContribution ───────────────────────────────────

  /**
   * Compute the aggregated readiness contribution for a profile.
   *
   * Reads all readiness contributions linked to capabilities belonging to
   * the profile and aggregates them into an overall score. Contributions
   * are weighted by their `weight` field and penalized by gap count.
   *
   * @param profileId - The site profile ID
   */
  async getReadinessContribution(
    profileId: string,
  ): Promise<ProfileReadinessContribution> {
    this.requireKems()

    if (!this.readinessContributions) {
      throw new CapabilityServiceError(
        'KEMS_NOT_CONFIGURED',
        'Readiness contribution calculation requires ReadinessContributionRepositoryLike to be injected',
      )
    }

    const { data: contributions, error } =
      await this.readinessContributions.findByProfile(profileId)

    if (error) {
      throw new CapabilityServiceError(
        error.code,
        `Failed to load readiness contributions for profile ${profileId}: ${error.message}`,
        error.details,
      )
    }

    const items = contributions ?? []

    // Weighted average of capability contributions
    const totalWeight = items.reduce((sum: number, c) => sum + c.weight, 0)
    const overallContribution =
      totalWeight > 0
        ? items.reduce((sum: number, c) => sum + c.contribution_value * c.weight, 0) / totalWeight
        : 0

    // Count gaps to adjust
    const gaps = await this.getGaps(profileId).catch(() => [] as CapabilityGap[])

    return {
      profileId,
      overallContribution: Math.round(overallContribution * 100) / 100,
      capabilityContributions: items,
      gapCount: gaps.length,
      computedAt: new Date().toISOString(),
    }
  }

  // ─── KEMS: requireKems ────────────────────────────────────────────────

  /**
   * Guard: throws if KEMS capability instance repository is not injected.
   */
  private requireKems() {
    if (!this.capabilityInstances) {
      throw new CapabilityServiceError(
        'KEMS_NOT_CONFIGURED',
        'KEMS capability operations require CapabilityInstanceRepositoryLike to be injected into CapabilityService constructor',
      )
    }
  }
}
