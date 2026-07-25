// ─── KAD-LOOP-003 — Capability Repository ───────────────────────────────
// Authority: KADARN Engineering Playbook — Institutional Capability Foundation
// DB-backed repository for the `capabilities` table.
// Extends BaseRepository for shared CRUD; adds organization/status scoping,
// deprecation, and the M2M capability↔claim link management.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  InstitutionCapability,
  CreateInstitutionCapability,
  UpdateInstitutionCapability,
  InstitutionCapabilityStatus,
  EvidenceSufficiency,
  CapabilityClaimLink,
  CreateCapabilityClaimLink,
} from '@kadarn/types'

// `capabilities` is the canonical row shape; BaseRepository is parameterised
// over the row type so inherited CRUD returns properly typed data.
export class CapabilityRepository extends BaseRepository<InstitutionCapability> {
  constructor(db: ConstructorParameters<typeof BaseRepository<InstitutionCapability>>[1]) {
    super('capabilities', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single capability by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(
    id: string,
  ): Promise<{ data: InstitutionCapability | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as InstitutionCapability, error: null }
  }

  /**
   * Paginated list of capabilities belonging to a given organization,
   * newest-first by created_at.
   */
  async findByOrganization(
    orgId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: InstitutionCapability[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as InstitutionCapability[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Paginated list of capabilities in a given status, newest-first.
   * Maps 1:1 to the DB `capability_status` enum.
   */
  async findByStatus(
    status: InstitutionCapabilityStatus,
    page = 1,
    limit = 50,
  ): Promise<{ data: InstitutionCapability[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as InstitutionCapability[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateInstitutionCapability,
  ): Promise<{ data: InstitutionCapability | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<InstitutionCapability>)
  }

  async update(
    id: string,
    input: UpdateInstitutionCapability,
  ): Promise<{ data: InstitutionCapability | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<InstitutionCapability>)
  }

  /**
   * Mark a capability as deprecated (terminal status). Existing claim links
   * are preserved so historical lineage remains queryable.
   */
  async deprecate(
    id: string,
  ): Promise<{ data: InstitutionCapability | null; error: RepositoryError | null }> {
    const patch: UpdateInstitutionCapability = { status: 'deprecated' }
    return super.update(id, patch as unknown as Partial<InstitutionCapability>)
  }

  /**
   * Update the evidence-sufficiency roll-up (and optionally the claim count)
   * on a capability. Intended to be called by the evidence aggregator after
   * a claim link is added/removed or evidence state changes.
   */
  async updateEvidenceSufficiency(
    id: string,
    sufficiency: EvidenceSufficiency,
    claimCount?: number,
  ): Promise<{ data: InstitutionCapability | null; error: RepositoryError | null }> {
    const patch: UpdateInstitutionCapability = { evidence_sufficiency: sufficiency }
    if (claimCount !== undefined) patch.claim_count = claimCount
    return super.update(id, patch as unknown as Partial<InstitutionCapability>)
  }

  // ─── Capability ↔ Claim M2M Links ────────────────────────────────────────
  // Backed by the `capability_claims` table (migration 082). Columns:
  //   id, capability_id, claim_id, relationship_type, weight, created_at,
  //   created_by. The canonical link shape is CapabilityClaimLink.

  /**
   * List all claim links attached to `capabilityId`, oldest-first.
   * Returns CapabilityClaimLink[] (the typed join row, not Claim rows).
   */
  async findClaims(
    capabilityId: string,
  ): Promise<{ data: CapabilityClaimLink[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from('capability_claims')
      .select('*')
      .eq('capability_id', capabilityId)
      .order('created_at', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as CapabilityClaimLink[]) ?? [], error: null }
  }

  /**
   * Link a claim to a capability with a given relationship type and
   * optional weight (0-1; defaults to 0 in LOOP-3, used by the confidence
   * calculator in LOOP 4).
   */
  async addClaimLink(
    input: CreateCapabilityClaimLink,
  ): Promise<{ data: CapabilityClaimLink | null; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from('capability_claims')
      .insert(input as unknown as Record<string, unknown>)
      .select('*') as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: null, error: mapError(error) }
    const rows = (data as unknown as CapabilityClaimLink[]) ?? []
    return { data: rows[0] ?? null, error: null }
  }

  /**
   * Remove the link between a capability and a claim. Deletes the row
   * identified by the (capability_id, claim_id) pair. Does NOT delete
   * either the capability or the claim.
   *
   * Returns { data: true, error: null } on success. Uses a structural cast
   * because DbClient does not model `.delete()`.
   */
  async removeClaimLink(
    capabilityId: string,
    claimId: string,
  ): Promise<{ data: boolean; error: RepositoryError | null }> {
    // DbClient does not model `.delete()`; build the chain through `unknown`
    // casts (same escape hatch BaseRepository.findAll / findByInstitution use).
    let query: unknown = (this.db
      .from('capability_claims') as unknown as { delete: () => unknown }).delete()
    query = (query as {
      eq: (column: string, value: unknown) => unknown
    }).eq('capability_id', capabilityId)
    query = (query as {
      eq: (column: string, value: unknown) => unknown
    }).eq('claim_id', claimId)

    const { error } = await (query as Promise<{
      data: unknown
      error: { code?: string; message?: string } | null
    }>)

    if (error) return { data: false, error: mapError(error) }
    return { data: true, error: null }
  }
}
