// ─── KAD-LOOP-004 — Confidence Model Repository ─────────────────────────
// Authority: KADARN Engineering Playbook — Confidence Engine Foundation
// DB-backed repository for the `confidence_models` table.
// Extends BaseRepository for shared CRUD; adds status lifecycle management
// and tenant-scoped lookups.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ConfidenceModel,
  CreateConfidenceModel,
  UpdateConfidenceModel,
  ConfidenceModelStatus,
} from '@kadarn/types'

// `confidence_models` is the canonical row shape; BaseRepository is parameterised
// over the row type so inherited CRUD returns properly typed data.
export class ConfidenceModelRepository extends BaseRepository<ConfidenceModel> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ConfidenceModel>>[1]) {
    super('confidence_models', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single confidence model by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ConfidenceModel, error: null }
  }

  /**
   * Paginated list of confidence models belonging to a given tenant,
   * newest-first by created_at.
   */
  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: ConfidenceModel[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as ConfidenceModel[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * List confidence models by status for a given tenant, newest-first.
   */
  async findByStatus(
    tenantId: string,
    status: ConfidenceModelStatus,
  ): Promise<{ data: ConfidenceModel[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('tenant_id', tenantId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('status', status)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: false })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceModel[]) ?? [], error: null }
  }

  /**
   * Find the currently active model for a tenant (status = 'active').
   * Returns a single model or null if none is active.
   */
  async findActive(
    tenantId: string,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('tenant_id', tenantId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('status', 'active')
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: false })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: null, error: mapError(error) }
    const rows = (data as unknown as ConfidenceModel[]) ?? []
    return { data: rows[0] ?? null, error: null }
  }

  /**
   * Find models with a specific version number for the given tenant.
   */
  async findByVersion(
    tenantId: string,
    version: number,
  ): Promise<{ data: ConfidenceModel[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('tenant_id', tenantId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('version', version)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('created_at', { ascending: false })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceModel[]) ?? [], error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateConfidenceModel,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<ConfidenceModel>)
  }

  async update(
    id: string,
    input: UpdateConfidenceModel,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<ConfidenceModel>)
  }

  // ─── Status Lifecycle ────────────────────────────────────────────────────

  /**
   * Activate a confidence model — sets status to 'active'.
   * Models are expected to be active before assessments can use them.
   */
  async activate(
    id: string,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    const patch: UpdateConfidenceModel = { status: 'active' }
    return super.update(id, patch as unknown as Partial<ConfidenceModel>)
  }

  /**
   * Deprecate a confidence model — sets status to 'deprecated'.
   * Existing assessments referencing this model are preserved.
   */
  async deprecate(
    id: string,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    const patch: UpdateConfidenceModel = { status: 'deprecated' }
    return super.update(id, patch as unknown as Partial<ConfidenceModel>)
  }

  /**
   * Retire a confidence model — sets status to 'retired'.
   * Terminal lifecycle state; model is no longer valid.
   */
  async retire(
    id: string,
  ): Promise<{ data: ConfidenceModel | null; error: RepositoryError | null }> {
    const patch: UpdateConfidenceModel = { status: 'retired' }
    return super.update(id, patch as unknown as Partial<ConfidenceModel>)
  }
}