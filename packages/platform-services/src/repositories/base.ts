// ─── KAD-002D — Base Repository ──────────────────────────────────────────
// Authority: KADARN Engineering Playbook
// Base class providing common CRUD operations for domain entities.
// Accepts a Supabase client as a dependency — does not import from apps/api.

export interface RepositoryError {
  code: string
  message: string
  details?: unknown
}

export function mapError(error: { code?: string; message?: string; details?: unknown }): RepositoryError {
  if (error.code === 'PGRST116') return { code: 'NOT_FOUND', message: 'Resource not found' }
  if (error.code === '23505') return { code: 'CONFLICT', message: 'Resource already exists', details: error.details }
  if (error.code === '42501') return { code: 'FORBIDDEN', message: 'Insufficient permissions' }
  return { code: 'INTERNAL_ERROR', message: error.message ?? 'An unexpected error occurred', details: error.details }
}

export interface DbClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
        order: (column: string, opts?: { ascending?: boolean }) => {
          limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
        }
      }
      order: (column: string, opts?: { ascending?: boolean }) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
      limit: (n: number) => Promise<{ data: unknown[]; error: { code?: string; message?: string } | null }>
    }
    insert: (values: unknown) => {
      select: (columns: string) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
    }
    update: (values: unknown) => {
      eq: (column: string, value: unknown) => {
        select: (columns: string) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
      }
    }
  }
}

export class BaseRepository<T extends Record<string, unknown>> {
  constructor(
    protected readonly tableName: string,
    protected readonly db: DbClient,
  ) {}

  async findById(id: string, select = '*'): Promise<{ data: T | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single()

    if (error) {
      return { data: null, error: mapError(error) }
    }

    return { data: data as unknown as T, error: null }
  }

  async findAll(options?: {
    select?: string
    orderBy?: { column: string; ascending?: boolean }
    filters?: Record<string, unknown>
    limit?: number
  }): Promise<{ data: T[]; error: RepositoryError | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.db.from(this.tableName).select(options?.select ?? '*')

    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      }
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query as { data: unknown[]; error: { code?: string; message?: string } | null }

    if (error) return { data: [], error: mapError(error) }

    return { data: data as unknown as T[], error: null }
  }

  async create(values: Partial<T>, select = '*'): Promise<{ data: T | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(values)
      .select(select)

    if (error) return { data: null, error: mapError(error) }

    // insert returns an array — take the first element
    const rows = data as unknown as T[]
    return { data: rows[0] ?? null, error: null }
  }

  async update(id: string, values: Partial<T>, select = '*'): Promise<{ data: T | null; error: RepositoryError | null }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update(values)
      .eq('id', id)
      .select(select)

    if (error) return { data: null, error: mapError(error) }

    const rows = data as unknown as T[]
    return { data: rows[0] ?? null, error: null }
  }

  async softDelete(id: string, statusField = 'status', statusValue = 'decommissioned'): Promise<{ data: T | null; error: RepositoryError | null }> {
    return this.update(id, { [statusField]: statusValue } as unknown as Partial<T>)
  }
}
