// ─── KAD-LOOP-004 — Confidence Factor Repository ────────────────────────
// Authority: KADARN Engineering Playbook — Confidence Engine Foundation
// DB-backed repository for the `confidence_factors` table.
// Extends BaseRepository for shared CRUD; adds assessment-scoped lookups,
// factor-type filtering, source entity resolution, and bulk creation.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ConfidenceFactor,
  CreateConfidenceFactor,
  FactorType,
} from '@kadarn/types'

// `confidence_factors` is the canonical row shape; BaseRepository is
// parameterised over the row type so inherited CRUD returns properly typed data.
export class ConfidenceFactorRepository extends BaseRepository<ConfidenceFactor> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ConfidenceFactor>>[1]) {
    super('confidence_factors', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single confidence factor by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: ConfidenceFactor | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ConfidenceFactor, error: null }
  }

  /**
   * List all factors for a given assessment, oldest-first by created_at.
   */
  async findByAssessment(
    assessmentId: string,
  ): Promise<{ data: ConfidenceFactor[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceFactor[]) ?? [], error: null }
  }

  /**
   * List factors for an assessment filtered by factor type.
   */
  async findByFactorType(
    assessmentId: string,
    factorType: FactorType,
  ): Promise<{ data: ConfidenceFactor[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('assessment_id', assessmentId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('factor_type', factorType)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceFactor[]) ?? [], error: null }
  }

  /**
   * Find all factors associated with a specific source entity
   * (e.g., all factors derived from a particular evidence record).
   */
  async findBySource(
    sourceEntityType: string,
    sourceEntityId: string,
  ): Promise<{ data: ConfidenceFactor[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('source_entity_type', sourceEntityType)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('source_entity_id', sourceEntityId)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceFactor[]) ?? [], error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  /**
   * Bulk create factors for an assessment.
   * All factors in the array should belong to the same assessment.
   * Returns the created rows on success.
   */
  async bulkCreate(
    factors: CreateConfidenceFactor[],
  ): Promise<{ data: ConfidenceFactor[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .insert(factors as unknown as Record<string, unknown>[])
      .select('*') as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceFactor[]) ?? [], error: null }
  }
}