// ─── KAD-002D — Person Repository ────────────────────────────────────────
// Authority: KADARN Foundation Library — Entity Completion Standard
// Provides typed CRUD operations for the Person entity.

export interface PersonRecord {
  id: string
  email: string
  first_name: string
  last_name: string
  middle_name: string | null
  suffix: string | null
  phone: string | null
  orcid: string | null
  npi: string | null
  profile_photo_url: string | null
  status: string
  auth_user_id: string | null
  created_at: string
  updated_at: string
}

export interface RepositoryError {
  code: string
  message: string
  details?: unknown
}

function mapError(error: { code?: string; message?: string; details?: unknown }): RepositoryError | null {
  if (!error) return null
  if (error.code === 'PGRST116') return null // not found is not an error for findById
  if (error.code === '23505') return { code: 'CONFLICT', message: 'A person with this email already exists', details: error.details }
  if (error.code === '42501') return { code: 'FORBIDDEN', message: 'Insufficient permissions' }
  return { code: 'INTERNAL_ERROR', message: error.message ?? 'An unexpected error occurred', details: error.details }
}

export class PersonRepository {
  constructor(private readonly db: { from: (table: string) => any }) {}

  async findById(id: string): Promise<{ data: PersonRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('people').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as PersonRecord, error: null }
  }

  async findByEmail(email: string): Promise<{ data: PersonRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('people').select('*').eq('email', email.toLowerCase()).maybeSingle()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as PersonRecord | null, error: null }
  }

  async findAll(): Promise<{ data: PersonRecord[]; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('people').select('*').order('last_name', { ascending: true })
    if (error) return { data: [], error: mapError(error) }
    return { data: data as unknown as PersonRecord[], error: null }
  }

  async create(values: Partial<PersonRecord>): Promise<{ data: PersonRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('people').insert(values).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as PersonRecord, error: null }
  }

  async update(id: string, values: Partial<PersonRecord>): Promise<{ data: PersonRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('people').update(values).eq('id', id).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as PersonRecord, error: null }
  }

  async softDelete(id: string): Promise<{ data: PersonRecord | null; error: RepositoryError | null }> {
    return this.update(id, { status: 'suspended' } as Partial<PersonRecord>)
  }
}
