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
}
