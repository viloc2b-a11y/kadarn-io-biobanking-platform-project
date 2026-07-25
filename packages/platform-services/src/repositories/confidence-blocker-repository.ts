// ─── KAD-LOOP-004 — Confidence Blocker Repository ───────────────────────
// Authority: KADARN Engineering Playbook — Confidence Engine Foundation
// DB-backed repository for the `confidence_blockers` table.
// Extends BaseRepository for shared CRUD; adds assessment-scoped lookups,
// blocker-type filtering, scoring-blocker resolution, and bulk creation.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ConfidenceBlocker,
  CreateConfidenceBlocker,
  BlockerType,
} from '@kadarn/types'

// `confidence_blockers` is the canonical row shape; BaseRepository is
// parameterised over the row type so inherited CRUD returns properly typed data.
export class ConfidenceBlockerRepository extends BaseRepository<ConfidenceBlocker> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ConfidenceBlocker>>[1]) {
    super('confidence_blockers', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single confidence blocker by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: ConfidenceBlocker | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ConfidenceBlocker, error: null }
  }

  /**
   * List all blockers for a given assessment, oldest-first by created_at.
   */
  async findByAssessment(
    assessmentId: string,
  ): Promise<{ data: ConfidenceBlocker[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceBlocker[]) ?? [], error: null }
  }

  /**
   * List blockers for an assessment filtered by blocker type.
   */
  async findByType(
    assessmentId: string,
    blockerType: BlockerType,
  ): Promise<{ data: ConfidenceBlocker[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('assessment_id', assessmentId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('blocker_type', blockerType)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceBlocker[]) ?? [], error: null }
  }

  /**
   * Find all blockers that prevent scoring for a given assessment
   * (blocks_scoring = true).
   */
  async findScoringBlockers(
    assessmentId: string,
  ): Promise<{ data: ConfidenceBlocker[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('assessment_id', assessmentId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('blocks_scoring', true)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceBlocker[]) ?? [], error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  /**
   * Bulk create blockers for an assessment.
   * All blockers in the array should belong to the same assessment.
   * Returns the created rows on success.
   */
  async bulkCreate(
    blockers: CreateConfidenceBlocker[],
  ): Promise<{ data: ConfidenceBlocker[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .insert(blockers as unknown as Record<string, unknown>[])
      .select('*') as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceBlocker[]) ?? [], error: null }
  }
}