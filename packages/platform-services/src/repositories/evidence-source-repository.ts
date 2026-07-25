// ─── KAD-LOOP-002 — Evidence Source Repository ────────────────────────────
// Authority: KADARN Engineering Playbook — Evidence Acquisition Foundation
// DB-backed repository for the `evidence_sources` table.
// Extends BaseRepository for shared CRUD; adds institution-scoped + active listing.

import { BaseRepository, RepositoryError, mapError } from './base'
import type { EvidenceSource, CreateEvidenceSource, UpdateEvidenceSource } from '@kadarn/types'

export class EvidenceSourceRepository extends BaseRepository<EvidenceSource> {
  constructor(db: ConstructorParameters<typeof BaseRepository<EvidenceSource>>[1]) {
    super('evidence_sources', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single evidence source by its primary key.
   * Returns { data: null, error: null } when the row does not exist.
   */
  async findById(id: string): Promise<{ data: EvidenceSource | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as EvidenceSource, error: null }
  }

  /**
   * Paginated list of evidence sources owned by an institution, newest-first.
   */
  async findByInstitution(
    institutionId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: EvidenceSource[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as EvidenceSource[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Paginated list of all evidence sources, newest-first.
   *
   * Accepts either a page number (domain usage) or the BaseRepository options
   * object (base-class compatibility) as its first argument — the union keeps
   * the override contravariantly compatible with `BaseRepository.findAll`.
   */
  async findAll(
    pageOrOptions:
      | number
      | {
          select?: string
          orderBy?: { column: string; ascending?: boolean }
          filters?: Record<string, unknown>
          limit?: number
        }
      | undefined = 1,
    limit = 50,
  ): Promise<{ data: EvidenceSource[]; error: RepositoryError | null }> {
    const page = typeof pageOrOptions === 'number' ? pageOrOptions : 1
    const offset = Math.max(0, (page - 1) * limit)

    // No .eq() precedes .order() here, so the select-level .order() returns a
    // bare Promise per DbClient — build the chain through `unknown` casts
    // (same escape hatch BaseRepository.findAll uses internally).
    let query: unknown = this.db.from(this.tableName).select('*')
    query = (query as {
      order: (column: string, opts?: { ascending?: boolean }) => unknown
    }).order('created_at', { ascending: false })
    query = (query as { limit: (n: number) => unknown }).limit(limit)

    const { data, error } = await (query as Promise<{
      data: unknown[]
      error: { code?: string; message?: string } | null
    }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as EvidenceSource[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateEvidenceSource,
  ): Promise<{ data: EvidenceSource | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<EvidenceSource>)
  }

  async update(
    id: string,
    input: UpdateEvidenceSource,
  ): Promise<{ data: EvidenceSource | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<EvidenceSource>)
  }

  /**
   * Soft-deactivate an evidence source by flipping `active` to false.
   * Does not delete the row — historical source records still reference it.
   */
  async deactivate(id: string): Promise<{ data: EvidenceSource | null; error: RepositoryError | null }> {
    return super.update(id, { active: false } as unknown as Partial<EvidenceSource>)
  }
}
