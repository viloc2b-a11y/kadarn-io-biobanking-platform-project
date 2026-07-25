// ─── KAD-LOOP-003 — Claim Version Repository ────────────────────────────
// Authority: KADARN Engineering Playbook — Immutable Claim Versioning
// DB-backed repository for the `claim_versions` table.
//
// ClaimVersion rows are IMMUTABLE append-only snapshots of a Claim at a
// point in time. Once created, a version row MUST NOT be destructively
// updated. The only permitted mutation is recording supersession
// (superseded_by + supersession_reason) on a prior version when a newer
// version is created. See @kadarn/types/claim-version.ts for the full
// contract.
//
// Extends BaseRepository for inherited findById/create plumbing; adds
// per-claim listing, current-version resolution, lineage assembly, and
// supersession recording.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ClaimVersion,
  CreateClaimVersion,
  ClaimVersionLineage,
  ClaimVersionSummary,
} from '@kadarn/types'

export class ClaimVersionRepository extends BaseRepository<ClaimVersion> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ClaimVersion>>[1]) {
    super('claim_versions', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single claim version by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(
    id: string,
  ): Promise<{ data: ClaimVersion | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ClaimVersion, error: null }
  }

  /**
   * Return ALL versions for `claimId`, ordered by version ascending.
   * Full ClaimVersion snapshots (not summaries). Use findLineage() for the
   * lightweight summary + current pointer when full snapshots aren't needed.
   */
  async findByClaim(
    claimId: string,
  ): Promise<{ data: ClaimVersion[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('claim_id', claimId)
      .order('version', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ClaimVersion[]) ?? [], error: null }
  }

  /**
   * Resolve the current (latest non-superseded) version for `claimId`.
   *
   * "Current" = the version with superseded_by === null that has the
   * highest version number for this claim. If no versions exist, returns
   * { data: null, error: null }. If multiple non-superseded rows exist
   * (should not happen with well-formed data), the highest version wins.
   */
  async findCurrentVersion(
    claimId: string,
  ): Promise<{ data: ClaimVersion | null; error: RepositoryError | null }> {
    // Fetch all versions for the claim, then pick the latest non-superseded
    // one client-side. The set per claim is small (version history), so a
    // single round-trip is cheaper and simpler than a filtered PostgREST
    // query that DbClient's structural type cannot express cleanly.
    const { data: versions, error } = await this.findByClaim(claimId)
    if (error) return { data: null, error }

    const current = (versions ?? [])
      .filter((v) => v.superseded_by === null || v.superseded_by === undefined)
      .sort((a, b) => b.version - a.version)[0]

    return { data: current ?? null, error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  /**
   * Snapshot the current state of a Claim into a new immutable version.
   * The caller (service layer) is responsible for:
   *   1. Determining the next version number (typically current.version + 1).
   *   2. Supplying the full snapshot of fields from the Claim row.
   *   3. Calling supersede() on the previously-current version afterwards.
   *
   * This method performs NO supersession bookkeeping — it only inserts.
   */
  async create(
    input: CreateClaimVersion,
  ): Promise<{ data: ClaimVersion | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<ClaimVersion>)
  }

  /**
   * Record that `versionId` was superseded by `supersededByVersionId`,
   * capturing the reason. This is the ONLY permitted mutation on an
   * existing ClaimVersion row — it sets superseded_by and
   * supersession_reason on the prior version, marking it non-current.
   *
   * The successor version is assumed to already exist (created by a prior
   * create() call); this method does NOT create it.
   */
  async supersede(
    versionId: string,
    supersededByVersionId: string,
    reason: string,
  ): Promise<{ data: ClaimVersion | null; error: RepositoryError | null }> {
    const patch: Partial<ClaimVersion> = {
      superseded_by: supersededByVersionId,
      supersession_reason: reason,
    }
    return super.update(versionId, patch)
  }

  // ─── Lineage ─────────────────────────────────────────────────────────────

  /**
   * Assemble the full version lineage for `claimId`: all version summaries
   * ordered by version ascending, plus the id of the current
   * (non-superseded) version if one exists.
   *
   * Uses the summary projection (id, claim_id, version, lifecycle_status,
   * review_status, superseded_by, created_by_actor_id, created_at) —
   * lighter than full snapshots and sufficient for history rendering.
   */
  async findLineage(
    claimId: string,
  ): Promise<{ data: ClaimVersionLineage | null; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select(
        'id, claim_id, version, lifecycle_status, review_status, superseded_by, created_by_actor_id, created_at',
      )
      .eq('claim_id', claimId)
      .order('version', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: null, error: mapError(error) }

    const summaries = (data as unknown as ClaimVersionSummary[]) ?? []
    const current = summaries
      .filter((v) => v.superseded_by === null || v.superseded_by === undefined)
      .sort((a, b) => b.version - a.version)[0]

    const lineage: ClaimVersionLineage = {
      claim_id: claimId,
      versions: summaries,
      current_version_id: current?.id ?? null,
    }
    return { data: lineage, error: null }
  }
}
