// ─── KAD-LOOP-004 — Confidence Assessment Repository ────────────────────
// Authority: KADARN Engineering Playbook — Confidence Engine Foundation
// DB-backed repository for the `confidence_assessments` table.
// Extends BaseRepository for shared CRUD; adds capability-scoped lookups,
// staleness detection, and a joined query against confidence_models.

import { BaseRepository, RepositoryError, mapError } from './base'
import type {
  ConfidenceAssessment,
  CreateConfidenceAssessment,
  AssessmentStatus,
} from '@kadarn/types'

// `confidence_assessments` is the canonical row shape; BaseRepository is
// parameterised over the row type so inherited CRUD returns properly typed data.
export class ConfidenceAssessmentRepository extends BaseRepository<ConfidenceAssessment> {
  constructor(db: ConstructorParameters<typeof BaseRepository<ConfidenceAssessment>>[1]) {
    super('confidence_assessments', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single confidence assessment by its primary key.
   * Returns { data: null, error: null } when the row does not exist
   * (PGRST116 is treated as not-found, not an error — matches siblings).
   */
  async findById(id: string): Promise<{ data: ConfidenceAssessment | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as ConfidenceAssessment, error: null }
  }

  /**
   * Paginated list of assessments for a given capability, newest-first
   * by calculated_at.
   */
  async findByCapability(
    capabilityId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: ConfidenceAssessment[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('capability_id', capabilityId)
      .order('calculated_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as ConfidenceAssessment[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Find the most recent assessment for a capability.
   * Returns the latest row or null if none exist.
   */
  async findLatestByCapability(
    capabilityId: string,
  ): Promise<{ data: ConfidenceAssessment | null; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('capability_id', capabilityId)
      .order('calculated_at', { ascending: false })
      .limit(1) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: null, error: mapError(error) }
    const rows = (data as unknown as ConfidenceAssessment[]) ?? []
    return { data: rows[0] ?? null, error: null }
  }

  /**
   * Paginated list of assessments for a given tenant, newest-first.
   */
  async findByTenant(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: ConfidenceAssessment[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('calculated_at', { ascending: false })
      .limit(limit) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as ConfidenceAssessment[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * List assessments for a given tenant filtered by assessment status, newest-first.
   */
  async findByStatus(
    tenantId: string,
    status: AssessmentStatus,
  ): Promise<{ data: ConfidenceAssessment[]; error: RepositoryError | null }> {
    let query: unknown = this.db.from(this.tableName).select('*').eq('tenant_id', tenantId)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('assessment_status', status)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('calculated_at', { ascending: false })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceAssessment[]) ?? [], error: null }
  }

  /**
   * Find assessments that have gone stale for a given tenant.
   * Stale assessments are those where stale_at is before the current time.
   */
  async findStale(
    tenantId: string,
  ): Promise<{ data: ConfidenceAssessment[]; error: RepositoryError | null }> {
    const now = new Date().toISOString()
    let query: unknown = this.db.from(this.tableName).select('*').eq('tenant_id', tenantId)
    query = (query as { lt: (c: string, v: unknown) => unknown }).lt('stale_at', now)
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('stale_at', { ascending: true })
    query = (query as { limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }> }).limit(1000)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }
    return { data: (data as unknown as ConfidenceAssessment[]) ?? [], error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  /**
   * Create a new confidence assessment.
   * Assessments are immutable once created — no update method is exposed.
   */
  async create(
    input: CreateConfidenceAssessment,
  ): Promise<{ data: ConfidenceAssessment | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<ConfidenceAssessment>)
  }

  // ─── Joined Queries ─────────────────────────────────────────────────────

  /**
   * Find assessments by tenant status with the associated confidence model
   * name and version joined in. Returns assessment rows with additional
   * `model_name` and `model_version` fields via a select projection.
   *
   * NOTE: The return type is a raw object with the additional fields since
   * the ConfidenceAssessment schema does not include model metadata.
   * Consumers should cast or project as needed.
   */
  async findByStatusWithModels(
    tenantId: string,
  ): Promise<{ data: (ConfidenceAssessment & { model_name: string; model_version: number })[]; error: RepositoryError | null }> {
    const { data, error } = await (this.db
      .from(this.tableName)
      .select('*, confidence_models!inner(name, version)')
      .eq('tenant_id', tenantId)
      .order('calculated_at', { ascending: false })
      .limit(1000) as unknown as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)

    if (error) return { data: [], error: mapError(error) }

    const rows = (data as unknown as (ConfidenceAssessment & {
      confidence_models?: { name: string; version: number }
    })[]) ?? []

    const mapped = rows.map((row) => ({
      ...row,
      model_name: row.confidence_models?.name ?? '',
      model_version: row.confidence_models?.version ?? 0,
    }))

    return { data: mapped, error: null }
  }
}