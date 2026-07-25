// ─── KAD-LOOP-002 — Source Record Repository ─────────────────────────────
// Authority: KADARN Engineering Playbook — Evidence Acquisition Foundation
// DB-backed repository for the `source_records` table.
// Extends BaseRepository for shared CRUD; adds supersession-traversal logic.

import { BaseRepository, RepositoryError, mapError } from './base'
import type { SourceRecord, CreateSourceRecord, UpdateSourceRecord } from '@kadarn/types'

// `source_records` is the canonical row shape; BaseRepository is parameterised
// over the row type so inherited CRUD returns properly typed data.
export class SourceRecordRepository extends BaseRepository<SourceRecord> {
  constructor(db: ConstructorParameters<typeof BaseRepository<SourceRecord>>[1]) {
    super('source_records', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single source record by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: SourceRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as SourceRecord, error: null }
  }

  /**
   * Paginated list of source records belonging to a given evidence source,
   * newest-first by acquired_at.
   */
  async findByEvidenceSource(
    sourceId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: SourceRecord[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    // DbClient's structural type doesn't model .range(); cast at the boundary
    // (same escape hatch BaseRepository.findAll uses internally).
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('evidence_source_id', sourceId)
      .order('acquired_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }

    // PostgREST .limit() returns the leading window; apply offset client-side
    // to stay within DbClient's typed surface.
    const rows = (data as unknown as SourceRecord[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateSourceRecord,
  ): Promise<{ data: SourceRecord | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<SourceRecord>)
  }

  /**
   * Mark `id` as superseded by `supersededById`, recording the reason.
   * Sets both acquisition_status='superseded' and invalidation_status='superseded'
   * (schema fields defined in @kadarn/types SourceRecordSchema).
   */
  async supersede(
    id: string,
    supersededById: string,
    reason: string,
  ): Promise<{ data: SourceRecord | null; error: RepositoryError | null }> {
    const patch: UpdateSourceRecord = {
      acquisition_status: 'superseded',
      invalidation_status: 'superseded',
      superseded_by: supersededById,
      supersession_reason: reason,
    }
    return super.update(id, patch as unknown as Partial<SourceRecord>)
  }

  /**
   * Mark `id` as invalidated (without a successor), recording the reason.
   */
  async invalidate(
    id: string,
    reason: string,
  ): Promise<{ data: SourceRecord | null; error: RepositoryError | null }> {
    const patch: UpdateSourceRecord = {
      acquisition_status: 'invalidated',
      invalidation_status: 'invalidated',
      supersession_reason: reason,
    }
    return super.update(id, patch as unknown as Partial<SourceRecord>)
  }

  // ─── Supersession chain ──────────────────────────────────────────────────

  /**
   * Traverse the `superseded_by` chain starting at `id` and return the
   * ordered list of records: [id, successor, successor-of-successor, …].
   * The starting record is included as the first element.
   *
   * Stops when a record has no `superseded_by`, or when a cycle is detected
   * (defensive — should not happen with well-formed data, but a cycle would
   * otherwise hang the recursion). Returns an error if any lookup fails
   * for a reason other than not-found.
   */
  async findSupersessionChain(
    id: string,
  ): Promise<{ data: SourceRecord[]; error: RepositoryError | null }> {
    const chain: SourceRecord[] = []
    const visited = new Set<string>()
    let currentId: string | null = id

    while (currentId !== null) {
      if (visited.has(currentId)) {
        // Cycle guard — break instead of looping forever.
        return {
          data: chain,
          error: {
            code: 'SUPERSESSION_CYCLE',
            message: `Cycle detected in supersession chain at record ${currentId}`,
          },
        }
      }
      visited.add(currentId)

      const { data: record, error } = await this.findById(currentId)
      if (error) return { data: chain, error }
      if (!record) {
        // Not found — return what we have so far without erroring, since the
        // caller may have passed an id that was concurrently deleted.
        return { data: chain, error: null }
      }

      chain.push(record)
      currentId = record.superseded_by ?? null
    }

    return { data: chain, error: null }
  }
}
