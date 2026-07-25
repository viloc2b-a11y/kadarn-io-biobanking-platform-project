// ─── KAD-LOOP-004 — Confidence Rule Repository ──────────────────────────
// Authority: KADARN Engineering Playbook — Confidence Engine Foundation
// DB-backed repository for the `confidence_rules` table.
// Extends BaseRepository for shared CRUD; adds model-scoped lookups
// and activation/deactivation lifecycle management.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ConfidenceRule,
  CreateConfidenceRule,
  UpdateConfidenceRule,
  ConfidenceRuleCategory,
} from '@kadarn/types'

// `confidence_rules` is the canonical row shape; BaseRepository is parameterised
// over the row type so inherited CRUD returns properly typed data.
export class ConfidenceRuleRepository extends BaseRepository<ConfidenceRule> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ConfidenceRule>>[1]) {
    super('confidence_rules', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single confidence rule by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: ConfidenceRule | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ConfidenceRule, error: null }
  }

  /**
   * Paginated list of rules belonging to a given confidence model,
   * ordered by priority ascending then created_at ascending.
   */
  async findByModel(
    modelId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: ConfidenceRule[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    let query: unknown = this.db.from(this.tableName).select('*').eq('confidence_model_id', modelId)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('priority', { ascending: true })
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(limit)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as ConfidenceRule[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * List rules for a model filtered by category, ordered by priority ascending.
   */
  async findByCategory(
    modelId: string,
    category: ConfidenceRuleCategory,
  ): Promise<{ data: ConfidenceRule[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('confidence_model_id', modelId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('category', category)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('priority', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceRule[]) ?? [], error: null }
  }

  /**
   * List active rules for a model (status = 'active'), ordered by priority ascending.
   * This is the primary query used by the confidence calculator engine.
   */
  async findActiveByModel(
    modelId: string,
  ): Promise<{ data: ConfidenceRule[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('confidence_model_id', modelId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('status', 'active')
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('priority', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceRule[]) ?? [], error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateConfidenceRule,
  ): Promise<{ data: ConfidenceRule | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<ConfidenceRule>)
  }

  async update(
    id: string,
    input: UpdateConfidenceRule,
  ): Promise<{ data: ConfidenceRule | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<ConfidenceRule>)
  }

  // ─── Status Lifecycle ────────────────────────────────────────────────────

  /**
   * Activate a confidence rule — sets status to 'active'.
   * Active rules are included in confidence calculations.
   */
  async activate(
    id: string,
  ): Promise<{ data: ConfidenceRule | null; error: RepositoryError | null }> {
    const patch: UpdateConfidenceRule = { status: 'active' }
    return super.update(id, patch as unknown as Partial<ConfidenceRule>)
  }

  /**
   * Deactivate a confidence rule — sets status to 'deprecated'.
   * Deactivated rules are excluded from confidence calculations.
   */
  async deactivate(
    id: string,
  ): Promise<{ data: ConfidenceRule | null; error: RepositoryError | null }> {
    const patch: UpdateConfidenceRule = { status: 'deprecated' }
    return super.update(id, patch as unknown as Partial<ConfidenceRule>)
  }
}