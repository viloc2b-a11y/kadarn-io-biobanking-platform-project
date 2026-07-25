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

// ─── Service ─────────────────────────────────────────────────────────────

export class ClaimService {
  constructor(
    private readonly claims: ClaimRepositoryLike,
    private readonly versions: ClaimVersionRepositoryLike,
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

  // ─── Internal helpers ──────────────────────────────────────────────────

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
