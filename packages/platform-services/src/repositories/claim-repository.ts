// ─── KAD-LOOP-003 — Claim Repository ────────────────────────────────────
// Authority: KADARN Engineering Playbook — Canonical Claims Foundation
// DB-backed repository for the `claims` table.
// Extends BaseRepository for shared CRUD; adds lifecycle, supersession,
// evidence-link, and version-summary operations.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  Claim,
  CreateClaim,
  UpdateClaim,
  ClaimLifecycleStatus,
  ClaimEvidenceLink,
  ClaimEvidenceRelationship,
  ClaimVersionSummary,
} from '@kadarn/types'

// `claims` is the canonical row shape; BaseRepository is parameterised
// over the row type so inherited CRUD returns properly typed data.
export class ClaimRepository extends BaseRepository<Claim> {
  constructor(db: ConstructorParameters<typeof BaseRepository<Claim>>[1]) {
    super('claims', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single claim by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as Claim, error: null }
  }

  /**
   * Paginated list of claims belonging to a given organization,
   * newest-first by created_at.
   */
  async findByOrganization(
    orgId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: Claim[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as Claim[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Paginated list of claims of a given claim type, newest-first.
   */
  async findByType(
    typeId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: Claim[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('claim_type_id', typeId)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as Claim[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Paginated list of claims in a given lifecycle status, newest-first.
   * `status` is the TS-only ClaimLifecycleStatus overlay; the API layer
   * is responsible for any mapping to the DB `claim_status` column.
   */
  async findByLifecycleStatus(
    status: ClaimLifecycleStatus,
    page = 1,
    limit = 50,
  ): Promise<{ data: Claim[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('lifecycle_status', status)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as Claim[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateClaim,
  ): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<Claim>)
  }

  async update(
    id: string,
    input: UpdateClaim,
  ): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<Claim>)
  }

  /**
   * Mark `id` as superseded by `supersededById`, recording the reason.
   * Sets lifecycle_status='superseded' and records the successor id +
   * supersession_reason. The successor claim is assumed to already exist;
   * this method does NOT create it.
   */
  async supersede(
    id: string,
    supersededById: string,
    reason: string,
  ): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    const patch: UpdateClaim = {
      lifecycle_status: 'superseded',
      superseded_by: supersededById,
      supersession_reason: reason,
    }
    return super.update(id, patch as unknown as Partial<Claim>)
  }

  /**
   * Mark `id` as expired (terminal lifecycle state). Typically invoked by
   * a scheduler when expires_at has passed, or by an explicit operator action.
   */
  async expire(id: string): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    const patch: UpdateClaim = { lifecycle_status: 'expired' }
    return super.update(id, patch as unknown as Partial<Claim>)
  }

  /**
   * Administratively archive `id` (terminal lifecycle state).
   */
  async archive(id: string): Promise<{ data: Claim | null; error: RepositoryError | null }> {
    const patch: UpdateClaim = { lifecycle_status: 'archived' }
    return super.update(id, patch as unknown as Partial<Claim>)
  }

  // ─── Evidence Links ──────────────────────────────────────────────────────
  // Backed by the `claim_evidence_links` table (migration 078). The link
  // table has its own PK (claim_id, evidence_id, tenant_id); the repo treats
  // it as a sibling resource rather than part of the `claims` row.

  /**
   * List all evidence links attached to `claimId`, oldest-first.
   */
  async findEvidenceLinks(
    claimId: string,
  ): Promise<{ data: ClaimEvidenceLink[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from('claim_evidence_links')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ClaimEvidenceLink[]) ?? [], error: null }
  }

  /**
   * Attach an evidence node to a claim with a given relationship type.
   * `tenantId` is required by the link table schema (migration 078).
   * `rationale` is an optional free-text justification.
   */
  async addEvidenceLink(
    claimId: string,
    evidenceId: string,
    relationshipType: ClaimEvidenceRelationship,
    tenantId: string,
    rationale?: string,
  ): Promise<{ data: ClaimEvidenceLink | null; error: RepositoryError | null }> {
    const row: Record<string, unknown> = {
      claim_id: claimId,
      evidence_id: evidenceId,
      relationship_type: relationshipType,
      tenant_id: tenantId,
    }
    if (rationale !== undefined) row.rationale = rationale

    const { data, error } = await (this.db
      .from('claim_evidence_links')
      .insert(row)
      .select('*') as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: null, error: mapError(error) }
    const rows = (data as unknown as ClaimEvidenceLink[]) ?? []
    return { data: rows[0] ?? null, error: null }
  }

  /**
   * Detach an evidence node from a claim. Deletes the link row identified
   * by the (claim_id, evidence_id) pair. Does NOT delete the evidence node.
   *
   * Returns { data: true, error: null } on success. The delete path uses
   * a structural cast because DbClient does not model `.delete()`.
   */
  async removeEvidenceLink(
    claimId: string,
    evidenceId: string,
  ): Promise<{ data: boolean; error: RepositoryError | null }> {
    // DbClient does not model `.delete()`; build the chain through `unknown`
    // casts (same escape hatch BaseRepository.findAll / findByInstitution use).
    let query: unknown = (this.db
      .from('claim_evidence_links') as unknown as { delete: () => unknown }).delete()
    query = (query as {
      eq: (column: string, value: unknown) => unknown
    }).eq('claim_id', claimId)
    query = (query as {
      eq: (column: string, value: unknown) => unknown
    }).eq('evidence_id', evidenceId)

    const { error } = await (query as Promise<{
      data: unknown
      error: { code?: string; message?: string } | null
    }>)

    if (error) return { data: false, error: mapError(error) }
    return { data: true, error: null }
  }

  // ─── Version Summaries ───────────────────────────────────────────────────
  // Lightweight view over the `claim_versions` table. Full version rows are
  // served by ClaimVersionRepository; this method returns the summary shape
  // (id, claim_id, version, lifecycle_status, review_status, superseded_by,
  // created_by_actor_id, created_at) for UI history rendering.

  /**
   * Return lightweight version summaries for `claimId`, ordered by version
   * ascending. The current (non-superseded) version is the last element
   * with `superseded_by` === null.
   */
  async findVersions(
    claimId: string,
  ): Promise<{ data: ClaimVersionSummary[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from('claim_versions')
      .select(
        'id, claim_id, version, lifecycle_status, review_status, superseded_by, created_by_actor_id, created_at',
      )
      .eq('claim_id', claimId)
      .order('version', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ClaimVersionSummary[]) ?? [], error: null }
  }
}
