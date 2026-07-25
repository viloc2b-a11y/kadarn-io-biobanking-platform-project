// ─── KAD-002D — Location Repository ──────────────────────────────────────
// Authority: KADARN Foundation Library — Entity Completion Standard

import { PersonRecord } from './person-repository'

// Re-export — Location shares the same record structure pattern
// but with different fields. We define LocationRecord separately
// to keep repository boundaries clean.

export interface LocationRecord {
  id: string
  name: string
  location_type: string
  institution_id: string
  address_line1: string
  address_line2: string | null
  city: string
  state_province: string
  postal_code: string
  country: string
  phone: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  status: string
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
  if (error.code === 'PGRST116') return null
  if (error.code === '23505') return { code: 'CONFLICT', message: 'A location with this name already exists for this institution', details: error.details }
  if (error.code === '42501') return { code: 'FORBIDDEN', message: 'Insufficient permissions' }
  return { code: 'INTERNAL_ERROR', message: error.message ?? 'An unexpected error occurred', details: error.details }
}

export class LocationRepository {
  constructor(private readonly db: { from: (table: string) => any }) {}

  async findById(id: string): Promise<{ data: LocationRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('locations').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as LocationRecord, error: null }
  }

  async findByInstitution(institutionId: string): Promise<{ data: LocationRecord[]; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('locations').select('*').eq('institution_id', institutionId).order('name', { ascending: true })
    if (error) return { data: [], error: mapError(error) }
    return { data: data as unknown as LocationRecord[], error: null }
  }

  async create(values: Partial<LocationRecord>): Promise<{ data: LocationRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('locations').insert(values).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as LocationRecord, error: null }
  }

  async update(id: string, values: Partial<LocationRecord>): Promise<{ data: LocationRecord | null; error: RepositoryError | null }> {
    const { data, error } = await this.db.from('locations').update(values).eq('id', id).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as LocationRecord, error: null }
  }

  async softDelete(id: string): Promise<{ data: LocationRecord | null; error: RepositoryError | null }> {
    return this.update(id, { status: 'decommissioned' } as Partial<LocationRecord>)
  }
}
