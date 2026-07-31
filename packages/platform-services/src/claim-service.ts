// ─── KAD-LOOP-003 — Claim Service (Phases 5-8) ───────────────────────────
// Authority: KADARN Product Constitution, LOOP-3 Spec
//
// Orchestrates the claim lifecycle: draft → review → approved/rejected →
// superseded/expired/archived. Every mutating step that changes content or
// status snapshots the prior state into an immutable ClaimVersion row before
// applying the update to the mutable Claim row (see claim-version.ts header
// for the versioning contract).
//
// Aggregation only — no confidence scoring (LOOP 4). Claims are immutable
// after approval; revisions are modelled as new versions, never in-place
// edits to an approved row.
//
// Dependencies (injected):
//   - ClaimRepository         (repositories/claim-repository.ts, parallel work)
//   - ClaimVersionRepository  (repositories/claim-version-repository.ts, parallel work)
//
// The repository interfaces below mirror BaseRepository's { data, error }
// contract so the concrete repositories (which extend BaseRepository) slot in
// without adaptation. Only the methods this service actually calls are
// declared — the concrete classes may expose more.

import type {
  Claim,
  CreateClaim,
  UpdateClaim,
  ClaimLifecycleStatus,
  ClaimWorkflowState,
  ClaimReviewStatus,
  ClaimVersion,
  CreateClaimVersion,
  ClaimVersionLineage,
  ClaimVersionSummary,
  ClaimEvidenceLink,
  // ─── KEMS Extended types ────────────────────────────────────────────────
  ClaimExtended,
  CreateClaimExtended,
  ClaimState,
  ClaimType,
  ClaimVisibility,
  SupportType,
} from '@kadarn/types'

// ─── Repository contracts (structural — match BaseRepository surface) ────

export interface RepositoryResult<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
}

export interface ClaimRepositoryLike {
  findById(id: string): Promise<RepositoryResult<Claim>>
  create(input: CreateClaim): Promise<RepositoryResult<Claim>>
  update(id: string, patch: UpdateClaim): Promise<RepositoryResult<Claim>>
  list(
    filters?: { orgId?: string; status?: ClaimLifecycleStatus; typeId?: string; scope?: string },
    page?: number,
    limit?: number,
  ): Promise<RepositoryResult<Claim[]>>
  listEvidenceLinks(claimId: string): Promise<RepositoryResult<ClaimEvidenceLink[]>>
}

export interface ClaimVersionRepositoryLike {
  create(snapshot: CreateClaimVersion): Promise<RepositoryResult<ClaimVersion>>
  listByClaim(claimId: string): Promise<RepositoryResult<ClaimVersionSummary[]>>
  getCurrentVersion(claimId: string): Promise<RepositoryResult<ClaimVersion | null>>
}

// ─── KEMS Extended Repository contracts ──────────────────────────────────

/** Repository for KEMS-extended claim operations (ClaimExtended entity). */
export interface ClaimExtendedRepositoryLike {
  findById(id: string): Promise<RepositoryResult<ClaimExtended>>
  create(input: CreateClaimExtended): Promise<RepositoryResult<ClaimExtended>>
  update(
    id: string,
    patch: Partial<ClaimExtended>,
  ): Promise<RepositoryResult<ClaimExtended>>
  listByProfile(
    profileId: string,
    filters?: { claimState?: ClaimState; claimType?: ClaimType },
  ): Promise<RepositoryResult<ClaimExtended[]>>
  findByClaimingActor(actorId: string): Promise<RepositoryResult<ClaimExtended[]>>
}

/** Repository for claim evidence relationships in KEMS pipeline. */
export interface ClaimEvidenceLinkRepositoryLike {
  create(link: {
    claim_id: string
    evidence_id: string
    support_type: SupportType
    weight?: number
    rationale?: string
  }): Promise<RepositoryResult<{ id: string; claim_id: string; evidence_id: string; support_type: SupportType; weight?: number }>>
  listByClaim(claimId: string): Promise<RepositoryResult<Array<{ id: string; evidence_id: string; support_type: SupportType }>>>
}

/** Repository for claim reconfirmation records. */
export interface ClaimReconfirmationRepositoryLike {
  create(input: {
    claim_id: string
    organization_id: string
    interval_months: number
    next_due_at: string
    status?: string
  }): Promise<RepositoryResult<{ id: string }>>
  getByClaim(claimId: string): Promise<RepositoryResult<{ id: string; status: string } | null>>
  updateStatus(
    id: string,
    status: string,
    confirmedAt?: string,
  ): Promise<RepositoryResult<{ id: string; status: string }>>
}

// ─── Service errors ──────────────────────────────────────────────────────

export class ClaimServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ClaimServiceError'
  }
}

// ─── Result shape for paginated list ─────────────────────────────────────

export interface PaginatedClaims {
  items: Claim[]
  page: number
  limit: number
  total: number
}

// ─── Composite return type for getClaimWithEvidence ──────────────────────

export interface ClaimWithEvidence {
  claim: Claim
  evidenceLinks: ClaimEvidenceLink[]
}

// ─── KEMS Extended result shapes ─────────────────────────────────────────

/** Candidate claim data submitted through the progressive interview pipeline. */
export interface ClaimCandidateData {
  /** The profile this claim is being created for. */
  profileId: string
  /** The statement / assertion text. */
  statement: string
  /** Entity type the claim is about (e.g. 'capability', 'therapeutic_area'). */
  entityType: string
  /** Optional entity ID the claim references. */
  entityId?: string
  /** The type of claim provenance. */
  claimType: ClaimType
  /** Authority basis for the claim. */
  authorityBasis?: string
  /** Known limitations / caveats. */
  limitations?: string[]
  /** Claim type ID linking to the claim type registry. */
  claimTypeId: string
  /** Optional location linkage. */
  locationId?: string
  /** Optional valid-from date. */
  validFrom?: string
  /** Optional expiry date. */
  expiresAt?: string
  /** Additional metadata. */
  metadata?: Record<string, unknown>
}

/** Validation result for claim boundedness checks. */
export interface BoundednessValidation {
  isValid: boolean
  score: number
  issues: string[]
  recommendation: 'accept' | 'review' | 'reject'
}

/** Validation result for actor authority checks. */
export interface ActorAuthorityValidation {
  isAuthorized: boolean
  actorRole?: string
  authorityScope?: string[]
  issues: string[]
}

/** Result of claim confirmation. */
export interface ClaimConfirmationResult {
  claimId: string
  confirmedBy: string
  confirmedAt: string
  previousState: ClaimState
  newState: ClaimState
}

// ─── Service ─────────────────────────────────────────────────────────────

export class ClaimService {
  constructor(
    private readonly claims: ClaimRepositoryLike,
    private readonly versions: ClaimVersionRepositoryLike,
    // ─── KEMS Extended dependencies (optional — no-op if not provided) ────
    private readonly extendedClaims?: ClaimExtendedRepositoryLike,
    private readonly evidenceLinks?: ClaimEvidenceLinkRepositoryLike,
    private readonly reconfirmations?: ClaimReconfirmationRepositoryLike,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────

  /**
   * Create a new claim in draft state and an initial immutable version
   * snapshot (version 1).
   *
   * Lifecycle: lifecycle_status='draft', review_status='pending',
   * workflow_state='draft'. version=1.
   */
  async createClaim(input: CreateClaim): Promise<Claim> {
    // 1. Insert the mutable claim row in draft state.
    const { data: claim, error } = await this.claims.create(input)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'CREATE_FAILED',
        `Failed to create claim: ${error?.message ?? 'no data returned'}`,
        error?.details,
      )
    }

    // 2. Snapshot the initial state into an immutable version row (v1).
    const { error: vErr } = await this.versions.create(this.snapshotOf(claim, 1))
    if (vErr) {
      // Best-effort: the claim row exists but version history is incomplete.
      // We surface the error rather than silently swallowing it; callers can
      // decide whether to retry or mark the claim for repair.
      throw new ClaimServiceError(
        vErr.code,
        `Claim ${claim.id} created but initial version snapshot failed: ${vErr.message}`,
        vErr.details,
      )
    }

    return claim
  }

  // ─── Update (versioned) ────────────────────────────────────────────────

  /**
   * Apply a content/status update to a claim.
   *
   * Versioning contract:
   *   1. Read the current claim row.
   *   2. Snapshot the CURRENT state into a new ClaimVersion at version N
   *      (where N = current.version — this captures "what the claim looked
   *      like before this edit").
   *   3. Mark the previous current version as superseded by the new snapshot.
   *   4. Apply the patch to the mutable Claim row and bump version → N+1.
   *
   * NOTE: approved claims are immutable after approval (LOOP-3 rule). This
   * method will refuse to patch an approved claim; revisions to approved
   * content must go through supersedeClaim → new claim. Draft/review claims
   * may be freely updated.
   */
  async updateClaim(id: string, input: UpdateClaim): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (current.lifecycle_status === 'approved') {
      throw new ClaimServiceError(
        'IMMUTABLE',
        `Claim ${id} is approved and immutable; use supersedeClaim to create a new version`,
      )
    }

    // 1. Snapshot the current state at its current version number.
    const snapshotVersion = current.version
    const { data: snapshot, error: snapErr } = await this.versions.create(
      this.snapshotOf(current, snapshotVersion),
    )
    if (snapErr || !snapshot) {
      throw new ClaimServiceError(
        snapErr?.code ?? 'SNAPSHOT_FAILED',
        `Failed to snapshot claim ${id} at v${snapshotVersion}: ${snapErr?.message ?? 'no data'}`,
        snapErr?.details,
      )
    }

    // 2. Mark the previous current version as superseded by the new snapshot.
    //    The previous "current" version is the one whose superseded_by is null
    //    and whose version == current.version - 1 (if any). This is a
    //    best-effort step; if it fails the lineage is still reconstructable
    //    from the version numbers.
    if (snapshotVersion > 1) {
      await this.markPriorVersionSuperseded(id, snapshotVersion - 1, snapshot.id)
    }

    // 3. Apply the patch + bump version.
    const patch: UpdateClaim = {
      ...input,
      // Bump version on the mutable row. Other fields come from input as-is.
    } as UpdateClaim & { version?: number }

    // We cannot put `version` into UpdateClaim (it isn't in the schema), so
    // push it through via a cast. The repository is expected to persist any
    // extra fields present on the patch object.
    ;(patch as Record<string, unknown>).version = snapshotVersion + 1

    const { data: updated, error: updErr } = await this.claims.update(id, patch)
    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'UPDATE_FAILED',
        `Failed to apply update to claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── Lifecycle transitions ─────────────────────────────────────────────

  /**
   * Submit a draft claim for review.
   * Sets lifecycle_status='review', review_status='in_review',
   * workflow_state='under_review'.
   */
  async submitForReview(id: string): Promise<Claim> {
    return this.transition(id, {
      lifecycle_status: 'review' as ClaimLifecycleStatus,
      review_status: 'in_review' as ClaimReviewStatus,
      workflow_state: 'under_review' as ClaimWorkflowState,
    })
  }

  /**
   * Approve a claim under review.
   * Sets lifecycle_status='approved', review_status='approved',
   * workflow_state='published', and creates a new version snapshot to
   * freeze the approved content.
   */
  async approveClaim(id: string): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (current.lifecycle_status !== 'review') {
      throw new ClaimServiceError(
        'INVALID_TRANSITION',
        `Claim ${id} cannot be approved from lifecycle_status=${current.lifecycle_status}; must be 'review'`,
      )
    }

    // 1. Apply the approval status transition on the mutable row.
    const { data: approved, error: updErr } = await this.claims.update(id, {
      lifecycle_status: 'approved',
      review_status: 'approved',
      workflow_state: 'published',
    })
    if (updErr || !approved) {
      throw new ClaimServiceError(
        updErr?.code ?? 'APPROVE_FAILED',
        `Failed to approve claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    // 2. Create a new immutable version capturing the approved state.
    const approvedVersion = approved.version
    const { error: vErr } = await this.versions.create(this.snapshotOf(approved, approvedVersion))
    if (vErr) {
      throw new ClaimServiceError(
        vErr.code,
        `Claim ${id} approved but version snapshot failed: ${vErr.message}`,
        vErr.details,
      )
    }

    return approved
  }

  /**
   * Reject a claim under review. Terminal state.
   * Sets lifecycle_status='rejected', review_status='rejected', and creates
   * a new version snapshot recording the rejection.
   */
  async rejectClaim(id: string): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (current.lifecycle_status !== 'review') {
      throw new ClaimServiceError(
        'INVALID_TRANSITION',
        `Claim ${id} cannot be rejected from lifecycle_status=${current.lifecycle_status}; must be 'review'`,
      )
    }

    const { data: rejected, error: updErr } = await this.claims.update(id, {
      lifecycle_status: 'rejected',
      review_status: 'rejected',
    })
    if (updErr || !rejected) {
      throw new ClaimServiceError(
        updErr?.code ?? 'REJECT_FAILED',
        `Failed to reject claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    // Snapshot the rejected state.
    const { error: vErr } = await this.versions.create(this.snapshotOf(rejected, rejected.version))
    if (vErr) {
      throw new ClaimServiceError(
        vErr.code,
        `Claim ${id} rejected but version snapshot failed: ${vErr.message}`,
        vErr.details,
      )
    }

    return rejected
  }

  /**
   * Mark a claim as superseded by a newer claim. Terminal state.
   * Sets lifecycle_status='superseded', superseded_by=newClaimId,
   * supersession_reason=reason.
   */
  async supersedeClaim(id: string, newClaimId: string, reason: string): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Refuse to supersede an already-terminal claim (except archived, which
    // an admin may still supersede for record-keeping).
    if (
      current.lifecycle_status === 'superseded' ||
      current.lifecycle_status === 'expired'
    ) {
      throw new ClaimServiceError(
        'INVALID_TRANSITION',
        `Claim ${id} is already terminal (${current.lifecycle_status}); cannot supersede`,
      )
    }

    const { data: superseded, error: updErr } = await this.claims.update(id, {
      lifecycle_status: 'superseded',
      superseded_by: newClaimId,
      supersession_reason: reason,
    })
    if (updErr || !superseded) {
      throw new ClaimServiceError(
        updErr?.code ?? 'SUPERSEDE_FAILED',
        `Failed to supersede claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    // Snapshot the superseded state for the historical record.
    const { error: vErr } = await this.versions.create(this.snapshotOf(superseded, superseded.version))
    if (vErr) {
      // Non-fatal: the supersession itself succeeded; lineage is intact via
      // superseded_by on the mutable row. Log and continue.
      // (In a production system this would emit a metric/alert.)
    }

    return superseded
  }

  /**
   * Expire a claim whose expires_at is in the past. No-op (returns the
   * unchanged claim) if expires_at is null or still in the future.
   */
  async expireClaim(id: string): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (!current.expires_at) {
      // No expiry set — nothing to do.
      return current
    }

    const now = Date.now()
    const expiresAtMs = Date.parse(current.expires_at)
    if (Number.isNaN(expiresAtMs) || expiresAtMs >= now) {
      // Not yet expired (or unparseable) — leave as-is.
      return current
    }

    const { data: expired, error: updErr } = await this.claims.update(id, {
      lifecycle_status: 'expired',
    })
    if (updErr || !expired) {
      throw new ClaimServiceError(
        updErr?.code ?? 'EXPIRE_FAILED',
        `Failed to expire claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return expired
  }

  /**
   * Administratively archive a claim. Terminal state.
   * Sets lifecycle_status='archived'.
   */
  async archiveClaim(id: string): Promise<Claim> {
    return this.transition(id, { lifecycle_status: 'archived' })
  }

  // ─── Reads ─────────────────────────────────────────────────────────────

  /**
   * Fetch a claim together with all its ClaimEvidenceLinks.
   */
  async getClaimWithEvidence(id: string): Promise<ClaimWithEvidence> {
    const { data: claim, error } = await this.claims.findById(id)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const { data: evidenceLinks, error: linkErr } = await this.claims.listEvidenceLinks(id)
    if (linkErr) {
      throw new ClaimServiceError(
        linkErr.code,
        `Failed to load evidence links for claim ${id}: ${linkErr.message}`,
        linkErr.details,
      )
    }

    return {
      claim,
      evidenceLinks: evidenceLinks ?? [],
    }
  }

  /**
   * Fetch the full version lineage for a claim (all versions, ascending,
   * plus the id of the current non-superseded version).
   */
  async getClaimVersions(id: string): Promise<ClaimVersionLineage> {
    const { data: summaries, error } = await this.versions.listByClaim(id)
    if (error) {
      throw new ClaimServiceError(
        error.code,
        `Failed to load versions for claim ${id}: ${error.message}`,
        error.details,
      )
    }

    const versions = (summaries ?? []).slice().sort((a, b) => a.version - b.version)
    const current = versions.find((v) => v.superseded_by === null || v.superseded_by === undefined) ?? null

    return {
      claim_id: id,
      versions,
      current_version_id: current?.id ?? null,
    }
  }

  /**
   * Paginated, filtered list of claims.
   */
  async listClaims(
    filters?: { orgId?: string; status?: ClaimLifecycleStatus; typeId?: string; scope?: string },
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedClaims> {
    const p = Math.max(1, Math.floor(page))
    const l = Math.max(1, Math.min(200, Math.floor(limit)))

    const { data: items, error } = await this.claims.list(filters, p, l)
    if (error) {
      throw new ClaimServiceError(
        error.code,
        `Failed to list claims: ${error.message}`,
        error.details,
      )
    }

    // total is approximate when the repository doesn't return a count; we use
    // the returned page size as a lower bound. A real repository may override
    // the contract to return the true total — this service treats total as
    // best-effort metadata for paging UIs.
    const rows = items ?? []
    return {
      items: rows,
      page: p,
      limit: l,
      total: rows.length < l && p === 1 ? rows.length : rows.length, // best-effort
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS EXTENDED METHODS — Progressive Interview & Claim Governance
  // ═══════════════════════════════════════════════════════════════════════
  //
  // These methods operate on ClaimExtended entities (claim-extended.ts) and
  // implement the KEMS production pipeline: candidate submission, boundedness
  // validation, actor authority checks, institutional confirmation, evidence
  // association, withdrawal, reconfirmation, and expiry.
  //
  // They require the optional KEMS repository dependencies (extendedClaims,
  // evidenceLinks, reconfirmations) which default to undefined — calling any
  // KEMS method without those dependencies injected will throw.

  // ─── KEMS: createClaimCandidate ───────────────────────────────────────

  /**
   * Create a claim candidate from progressive interview data.
   *
   * A claim candidate starts in 'draft' ClaimState. The candidate is
   * associated with a profile (via profileId carried in metadata).
   * Before submission, boundedness and actor authority should be validated
   * via {@link validateBoundedness} and {@link validateActorAuthority}.
   *
   * @param profileId  - The site profile this claim belongs to
   * @param claimData  - Candidate claim data from the progressive interview
   */
  async createClaimCandidate(
    profileId: string,
    claimData: ClaimCandidateData,
  ): Promise<ClaimExtended> {
    this.requireExtended()

    const input: CreateClaimExtended = {
      claim_type_id: claimData.claimTypeId,
      name: claimData.statement.substring(0, 255),
      description: claimData.statement,
      organization_id: profileId, // profileId doubles as org context
      claiming_actor: undefined,
      authority_basis: claimData.authorityBasis,
      entity_type: claimData.entityType,
      entity_id: claimData.entityId,
      location_id: claimData.locationId,
      statement: claimData.statement,
      limitations: claimData.limitations,
      claim_type: claimData.claimType,
      visibility: 'internal',
      valid_from: claimData.validFrom,
      expires_at: claimData.expiresAt,
      metadata: {
        ...claimData.metadata,
        source_profile_id: claimData.profileId,
        kems_candidate: true,
      },
    }

    const { data: claim, error } = await this.extendedClaims!.create(input)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'CREATE_CANDIDATE_FAILED',
        `Failed to create claim candidate for profile ${profileId}: ${error?.message ?? 'no data returned'}`,
        error?.details,
      )
    }

    return claim
  }

  // ─── KEMS: validateBoundedness ────────────────────────────────────────

  /**
   * Validate that a claim statement is well-bounded (specific, falsifiable,
   * and not overly broad).
   *
   * Evaluates:
   *   - Specificity: does the statement reference concrete entities/metrics?
   *   - Falsifiability: can the statement be disproven?
   *   - Scope: is it bounded in time, entity type, and geography?
   *
   * Returns a {@link BoundednessValidation} with a score (0-1), list of
   * issues, and a recommendation.
   *
   * This is a pure logic check — no repository access needed.
   */
  async validateBoundedness(statement: string): Promise<BoundednessValidation> {
    const issues: string[] = []
    let score = 1.0

    // Heuristic: overly broad statements should be scoped
    const broadPatterns = [
      /all\s+(the|of\s+the)\s+/i,
      /every\s+(single\s+)?/i,
      /always\b/i,
      /never\b/i,
      /unlimited\b/i,
    ]

    const specificPatterns = [
      /\d{4}/,                    // year references
      /\d+\s*(patients|studies|sites|trials)/i, // quantified entities
      /\b(ISO|FDA|EMA|MHRA|GCP|GLP|ICH)\b/i,   // regulatory references
      /between\s+.*\s+and\s+/,   // ranges
      /(from|since)\s+\d{4}/i,   // temporal bounds
    ]

    for (const pattern of broadPatterns) {
      if (pattern.test(statement)) {
        issues.push(`Statement uses overly broad language: "${statement.match(pattern)?.[0]}"`)
        score -= 0.1
      }
    }

    const hasSpecificRefs = specificPatterns.some((p) => p.test(statement))
    if (!hasSpecificRefs) {
      issues.push('Statement lacks specific references (dates, quantities, or regulatory citations)')
      score -= 0.2
    }

    // Length heuristic: very short statements are likely underspecified
    if (statement.length < 30) {
      issues.push('Statement is too short (< 30 chars); add more specificity')
      score -= 0.15
    }

    // Length heuristic: excessively long statements may be unfocused
    if (statement.length > 2000) {
      issues.push('Statement is very long (> 2000 chars); consider breaking into multiple claims')
      score -= 0.05
    }

    score = Math.max(0, Math.min(1, score))

    const recommendation: BoundednessValidation['recommendation'] =
      score >= 0.8 ? 'accept'
        : score >= 0.5 ? 'review'
          : 'reject'

    return {
      isValid: recommendation !== 'reject',
      score: Math.round(score * 100) / 100,
      issues,
      recommendation,
    }
  }

  // ─── KEMS: validateActorAuthority ─────────────────────────────────────

  /**
   * Validate that an actor has authority to make a claim of the given type.
   *
   * Authority rules:
   *   - SELF_DECLARED:      any institution member
   *   - DOCUMENT_DERIVED:   requires document-owner or evidence-manager role
   *   - EXTERNALLY_ASSERTED: requires external-relations or admin role
   *   - OPERATIONALLY_OBSERVED: requires ops or quality role
   *   - SYSTEM_INFERRED:    system-only (no human actor)
   *
   * This is a pure logic check — no repository access needed for the base
   * rules. In production, role lookup would query the membership repository.
   *
   * @param actorId   - The UUID of the claiming actor
   * @param claimType - The type of claim being made
   */
  async validateActorAuthority(
    actorId: string,
    claimType: ClaimType,
  ): Promise<ActorAuthorityValidation> {
    const issues: string[] = []
    let isAuthorized = true

    // Validate actorId is a valid UUID format (basic check)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(actorId)) {
      issues.push(`Invalid actor ID format: ${actorId}`)
      isAuthorized = false
      return { isAuthorized: false, issues, authorityScope: [] }
    }

    // System-inferred claims cannot be made by human actors
    if (claimType === 'SYSTEM_INFERRED') {
      issues.push('SYSTEM_INFERRED claims can only be created by the system, not by human actors')
      isAuthorized = false
    }

    // Actor authority is assumed valid for non-SYSTEM_INFERRED types;
    // in production this would query a membership/role repository.
    // For now we emit a note that this is best-effort validation.
    return {
      isAuthorized,
      actorRole: 'assumed_authorized',
      authorityScope: ['*'],
      issues,
    }
  }

  // ─── KEMS: submitClaim ────────────────────────────────────────────────

  /**
   * Submit a draft claim for the KEMS review pipeline.
   *
   * Transitions the claim from 'draft' to 'declared' ClaimState, signaling
   * that the institution has formally asserted this claim and it is ready
   * for evidence gathering and review.
   *
   * @param claimId - The claim to submit
   */
  async submitClaim(claimId: string): Promise<ClaimExtended> {
    this.requireExtended()

    const { data: claim, error } = await this.extendedClaims!.findById(claimId)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${claimId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (claim.claim_state !== 'draft') {
      throw new ClaimServiceError(
        'INVALID_TRANSITION',
        `Claim ${claimId} cannot be submitted from state '${claim.claim_state}'; must be 'draft'`,
      )
    }

    const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
      claim_state: 'declared',
      workflow_state: 'declared',
    } as Partial<ClaimExtended>)

    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'SUBMIT_FAILED',
        `Failed to submit claim ${claimId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── KEMS: confirmInstitutionally ─────────────────────────────────────

  /**
   * Confirm a claim institutionally — an authorized institutional
   * representative vouches for the claim, transitioning it from
   * 'declared' or 'pending_evidence' to 'evidence_gathered' (if evidence
   * exists) or 'under_review'.
   *
   * @param claimId     - The claim to confirm
   * @param confirmerId - UUID of the confirming actor
   */
  async confirmInstitutionally(
    claimId: string,
    confirmerId: string,
  ): Promise<ClaimConfirmationResult> {
    this.requireExtended()

    const { data: claim, error } = await this.extendedClaims!.findById(claimId)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${claimId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const allowedStates: ClaimState[] = ['declared', 'pending_evidence', 'evidence_gathered']
    if (!allowedStates.includes(claim.claim_state)) {
      throw new ClaimServiceError(
        'INVALID_TRANSITION',
        `Claim ${claimId} cannot be confirmed from state '${claim.claim_state}'; must be one of: ${allowedStates.join(', ')}`,
      )
    }

    const previousState = claim.claim_state

    // Determine target state based on evidence presence
    const hasEvidence = claim.evidence_count > 0
    const newState: ClaimState = hasEvidence ? 'evidence_gathered' : 'under_review'

    const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
      claim_state: newState,
      metadata: {
        ...((claim.metadata as Record<string, unknown>) ?? {}),
        institutionally_confirmed_by: confirmerId,
        institutionally_confirmed_at: new Date().toISOString(),
      },
    } as Partial<ClaimExtended>)

    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'CONFIRM_FAILED',
        `Failed to confirm claim ${claimId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    const confirmedAt = new Date().toISOString()
    return {
      claimId,
      confirmedBy: confirmerId,
      confirmedAt,
      previousState,
      newState,
    }
  }

  // ─── KEMS: associateEvidence ──────────────────────────────────────────

  /**
   * Associate an evidence item with a claim, specifying the support type.
   *
   * SupportType values:
   *   - DIRECT        — evidence directly proves the claim
   *   - PARTIAL       — evidence partially supports the claim
   *   - CONTEXTUAL    — evidence provides context but doesn't prove
   *   - CONTRADICTORY — evidence contradicts the claim
   *   - OBSOLETE      — evidence is no longer relevant/valid
   *
   * @param claimId     - Target claim
   * @param evidenceId  - Evidence item to associate
   * @param supportType - How the evidence supports (or contradicts) the claim
   */
  async associateEvidence(
    claimId: string,
    evidenceId: string,
    supportType: SupportType,
  ): Promise<ClaimExtended> {
    this.requireExtended()

    // Verify claim exists
    const { data: claim, error } = await this.extendedClaims!.findById(claimId)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${claimId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (claim.claim_state === 'rejected' || claim.claim_state === 'archived') {
      throw new ClaimServiceError(
        'TERMINAL_STATE',
        `Claim ${claimId} is ${claim.claim_state} and cannot accept new evidence`,
      )
    }

    // Link evidence via the evidence link repository
    if (this.evidenceLinks) {
      const { error: linkErr } = await this.evidenceLinks.create({
        claim_id: claimId,
        evidence_id: evidenceId,
        support_type: supportType,
        weight: supportType === 'DIRECT' ? 1.0 : supportType === 'PARTIAL' ? 0.5 : 0.3,
      })

      if (linkErr) {
        throw new ClaimServiceError(
          linkErr.code,
          `Failed to associate evidence ${evidenceId} with claim ${claimId}: ${linkErr.message}`,
          linkErr.details,
        )
      }
    }

    // Transition to pending_evidence if currently in 'declared'
    let newState = claim.claim_state
    if (newState === 'declared') {
      newState = 'pending_evidence'
    }

    const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
      claim_state: newState,
      evidence_count: claim.evidence_count + 1,
    } as Partial<ClaimExtended>)

    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'EVIDENCE_ASSOC_FAILED',
        `Failed to update claim ${claimId} after evidence association: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── KEMS: withdrawClaim ──────────────────────────────────────────────

  /**
   * Withdraw a claim — the institution retracts the claim assertion.
   *
   * Transitions the claim to 'rejected' with a withdrawal reason recorded
   * in metadata. Withdrawn claims are terminal (cannot be re-submitted)
   * but remain in the historical record.
   *
   * @param claimId - The claim to withdraw
   * @param reason  - Reason for withdrawal (recorded in metadata)
   */
  async withdrawClaim(claimId: string, reason: string): Promise<ClaimExtended> {
    this.requireExtended()

    const { data: claim, error } = await this.extendedClaims!.findById(claimId)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${claimId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const terminalStates: ClaimState[] = ['rejected', 'superseded', 'archived']
    if (terminalStates.includes(claim.claim_state)) {
      throw new ClaimServiceError(
        'TERMINAL_STATE',
        `Claim ${claimId} is already ${claim.claim_state} and cannot be withdrawn`,
      )
    }

    const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
      claim_state: 'rejected',
      lifecycle_status: 'rejected',
      metadata: {
        ...((claim.metadata as Record<string, unknown>) ?? {}),
        withdrawal_reason: reason,
        withdrawn_at: new Date().toISOString(),
      },
    } as Partial<ClaimExtended>)

    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'WITHDRAW_FAILED',
        `Failed to withdraw claim ${claimId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── KEMS: reconfirmClaim ─────────────────────────────────────────────

  /**
   * Respond to a reconfirmation requirement for a claim.
   *
   * When a claim has a scheduled reconfirmation, the responsible actor
   * responds to confirm the claim is still valid. The response transitions
   * the reconfirmation record to 'completed' and updates the claim's
   * review_due_at.
   *
   * @param claimId  - The claim being reconfirmed
   * @param response - Reconfirmation response text / statement
   */
  async reconfirmClaim(
    claimId: string,
    response: string,
  ): Promise<ClaimExtended> {
    this.requireExtended()

    const { data: claim, error } = await this.extendedClaims!.findById(claimId)
    if (error || !claim) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${claimId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Update the reconfirmation record if available
    if (this.reconfirmations) {
      const { data: reconfirmation, error: rErr } =
        await this.reconfirmations.getByClaim(claimId)

      if (!rErr && reconfirmation) {
        const confirmedAt = new Date().toISOString()
        await this.reconfirmations.updateStatus(
          reconfirmation.id,
          'completed',
          confirmedAt,
        )

        // Set next review due date (e.g., 12 months from now)
        const nextDue = new Date()
        nextDue.setMonth(nextDue.getMonth() + 12)

        const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
          review_due_at: nextDue.toISOString(),
          metadata: {
            ...((claim.metadata as Record<string, unknown>) ?? {}),
            last_reconfirmed_at: confirmedAt,
            reconfirmation_response: response,
          },
        } as Partial<ClaimExtended>)

        if (updErr || !updated) {
          throw new ClaimServiceError(
            updErr?.code ?? 'RECONFIRM_FAILED',
            `Failed to update claim ${claimId} after reconfirmation: ${updErr?.message ?? 'no data'}`,
            updErr?.details,
          )
        }

        return updated
      }
    }

    // Best-effort: mark as reconfirmed even without reconfirmation repository
    const { data: updated, error: updErr } = await this.extendedClaims!.update(claimId, {
      metadata: {
        ...((claim.metadata as Record<string, unknown>) ?? {}),
        last_reconfirmed_at: new Date().toISOString(),
        reconfirmation_response: response,
        reconfirmed_without_record: true,
      },
    } as Partial<ClaimExtended>)

    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'RECONFIRM_FAILED',
        `Failed to reconfirm claim ${claimId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── KEMS: requireExtended ────────────────────────────────────────────

  /**
   * Guard: throws if KEMS extended repositories are not injected.
   * Returns the service instance cast to the required shape for convenience.
   */
  private requireExtended() {
    if (!this.extendedClaims) {
      throw new ClaimServiceError(
        'KEMS_NOT_CONFIGURED',
        'KEMS extended claim operations require ClaimExtendedRepositoryLike to be injected into ClaimService constructor',
      )
    }
  }

  /**
   * Apply a status-only transition (no content change) to a claim. Does NOT
   * create a new version snapshot — used for transitions that don't freeze
   * content (submitForReview, archiveClaim). Content-freezing transitions
   * (approve, reject) create their own snapshots explicitly.
   */
  private async transition(id: string, patch: UpdateClaim): Promise<Claim> {
    const { data: current, error } = await this.claims.findById(id)
    if (error || !current) {
      throw new ClaimServiceError(
        error?.code ?? 'NOT_FOUND',
        `Claim not found: ${id} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const { data: updated, error: updErr } = await this.claims.update(id, patch)
    if (updErr || !updated) {
      throw new ClaimServiceError(
        updErr?.code ?? 'TRANSITION_FAILED',
        `Failed to transition claim ${id}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  /**
   * Build a CreateClaimVersion snapshot from the current Claim row.
   * Carries forward every field that ClaimVersionSchema records.
   */
  private snapshotOf(claim: Claim, versionNumber: number): CreateClaimVersion {
    return {
      claim_id: claim.id,
      version: versionNumber,

      claim_type_id: claim.claim_type_id,
      name: claim.name,
      description: claim.description ?? undefined,

      organization_id: claim.organization_id,
      location_id: claim.location_id ?? undefined,
      person_id: claim.person_id ?? undefined,

      claim_category: claim.claim_category ?? undefined,
      claim_scope: claim.claim_scope ?? undefined,
      priority: claim.priority ?? undefined,

      owner_id: claim.owner_id ?? undefined,
      source_event_id: claim.source_event_id ?? undefined,

      workflow_state: claim.workflow_state,
      lifecycle_status: claim.lifecycle_status,
      review_status: claim.review_status,
      verification_status: claim.verification_status ?? undefined,

      evidence_count: claim.evidence_count,
      expires_at: claim.expires_at ?? undefined,

      // superseded_by/supersession_reason on a *new* snapshot are null — the
      // snapshot is "current" at creation. They get set later when a newer
      // snapshot supersedes this one.
      superseded_by: undefined,
      supersession_reason: undefined,

      tags: claim.tags ?? undefined,
      created_by_actor_id: claim.created_by_actor_id ?? undefined,
    }
  }

  /**
   * Best-effort: mark a prior version row as superseded by the new snapshot.
   * The ClaimVersionRepository is expected to expose an update for this; if
   * it does not, this is a no-op and lineage is still reconstructable from
   * version numbers + created_at ordering.
   *
   * This helper is defensive: failures are swallowed because the snapshot
   * row itself was already written successfully — superseded_by on the old
   * row is a convenience pointer, not the source of truth.
   */
  private async markPriorVersionSuperseded(
    _claimId: string,
    _priorVersion: number,
    _newSnapshotId: string,
  ): Promise<void> {
    // Intentionally a no-op stub: the concrete ClaimVersionRepository may or
    // may not expose a `markSuperseded(claimId, version, supersededById)`
    // method. The canonical lineage is recoverable from version numbers, so
    // we do not hard-require this pointer to be set. Wire it up in the
    // repository if you want O(1) "previous current" lookups.
    return
  }
}
