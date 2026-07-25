// ─── KAD-LOOP-002 — Generation Rule Repository ────────────────────────────
// Authority: KADARN Engineering Playbook — Evidence Generation Foundation
// DB-backed repository for the `evidence_generation_rules` table.
// Extends BaseRepository for shared CRUD; adds active-rule and (name,version) lookups.

import { BaseRepository, RepositoryError, mapError } from './base'
import type { GenerationRule, CreateGenerationRule, UpdateGenerationRule } from '@kadarn/types'

export class GenerationRuleRepository extends BaseRepository<GenerationRule> {
  constructor(db: ConstructorParameters<typeof BaseRepository<GenerationRule>>[1]) {
    super('evidence_generation_rules', db)
  }

  // ─── Lookup ──────────────────────────────────────────────────────────────

  /**
   * Fetch a single generation rule by its primary key.
   * Returns { data: null, error: null } when the row does not exist.
   */
  async findById(id: string): Promise<{ data: GenerationRule | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as GenerationRule, error: null }
  }

  /**
   * Paginated list of active generation rules (active = true AND
   * rule_status = 'active'), newest-first by effective_from.
   */
  async findActive(
    page = 1,
    limit = 50,
  ): Promise<{ data: GenerationRule[]; error: RepositoryError | null }> {
    const offset = Math.max(0, (page - 1) * limit)
    // Two eq filters; DbClient's structural type models one, so cast at the
    // query boundary (same pattern BaseRepository.findAll uses).
    let query: unknown = this.db
      .from(this.tableName)
      .select('*')
      .eq('active', true)
    query = (query as { eq: (c: string, v: unknown) => unknown }).eq('rule_status', 'active')
    query = (query as { order: (c: string, o?: { ascending?: boolean }) => unknown }).order('effective_from', { ascending: false })
    query = (query as { limit: (n: number) => unknown }).limit(limit)

    const { data, error } = await (query as Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>)
    if (error) return { data: [], error: mapError(error) }
    const rows = (data as unknown as GenerationRule[]) ?? []
    return { data: rows.slice(offset, offset + limit), error: null }
  }

  /**
   * Look up a rule by the unique (rule_name, rule_version) pair.
   * Returns { data: null, error: null } if no such rule exists.
   */
  async findByNameAndVersion(
    name: string,
    version: number,
  ): Promise<{ data: GenerationRule | null; error: RepositoryError | null }> {
    let query: unknown = this.db
      .from(this.tableName)
      .select('*')
      .eq('rule_name', name)
    query = (query as { eq: (c: string, v: unknown) => { single: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }> } }).eq('rule_version', version)
    const { data, error } = await (query as { single: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }> }).single()

    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as GenerationRule, error: null }
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  async create(
    input: CreateGenerationRule,
  ): Promise<{ data: GenerationRule | null; error: RepositoryError | null }> {
    return super.create(input as unknown as Partial<GenerationRule>)
  }

  async update(
    id: string,
    input: UpdateGenerationRule,
  ): Promise<{ data: GenerationRule | null; error: RepositoryError | null }> {
    return super.update(id, input as unknown as Partial<GenerationRule>)
  }

  /**
   * Deprecate a rule: set rule_status='deprecated' and effective_until to the
   * provided timestamp. The rule is preserved for historical traceability.
   */
  async deprecate(
    id: string,
    effectiveUntil: string,
  ): Promise<{ data: GenerationRule | null; error: RepositoryError | null }> {
    const patch: UpdateGenerationRule = {
      rule_status: 'deprecated',
      effective_until: effectiveUntil,
    }
    return super.update(id, patch as unknown as Partial<GenerationRule>)
  }
}
