// ─── KAD-002E — Membership Repository ────────────────────────────────────
// Authority: KADARN Foundation Library — Entity Completion Standard

export interface MembershipRecord {
  id: string
  user_id: string
  person_id: string | null
  organization_id: string
  title: string | null
  department: string | null
  status: string
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  started_at: string | null
  ended_at: string | null
  deactivated_at: string | null
  deactivated_by: string | null
  deactivated_reason: string | null
  suspension_reason: string | null
  termination_reason: string | null
  metadata: unknown | null
  valid_from: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

export interface RoleRecord {
  id: string
  key: string
  name: string
  description: string | null
  scope: string
  is_system_role: boolean
  priority: number
}

export interface RoleAssignmentRecord {
  id: string
  membership_id: string
  role_id: string
  assigned_by: string | null
  assigned_at: string
  expires_at: string | null
  valid_from: string | null
  valid_until: string | null
}

function mapError(error: { code?: string; message?: string; details?: unknown }): { code: string; message: string; details?: unknown } | null {
  if (!error) return null
  if (error.code === 'PGRST116') return null
  if (error.code === '23505') return { code: 'CONFLICT', message: 'Resource already exists', details: error.details }
  if (error.code === '42501') return { code: 'FORBIDDEN', message: 'Insufficient permissions' }
  return { code: 'INTERNAL_ERROR', message: error.message ?? 'An unexpected error occurred', details: error.details }
}

export class MembershipRepository {
  constructor(private readonly db: { from: (table: string) => any }) {}

  async findById(id: string): Promise<{ data: MembershipRecord | null; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db.from('organization_memberships').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return { data: null, error: null }
      return { data: null, error: mapError(error) }
    }
    return { data: data as unknown as MembershipRecord, error: null }
  }

  async findByOrganization(organizationId: string): Promise<{ data: MembershipRecord[]; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db
      .from('organization_memberships')
      .select('*')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false, nullsFirst: false })
    if (error) return { data: [], error: mapError(error) }
    return { data: data as unknown as MembershipRecord[], error: null }
  }

  async create(values: Partial<MembershipRecord>): Promise<{ data: MembershipRecord | null; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db.from('organization_memberships').insert(values).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as MembershipRecord, error: null }
  }

  async update(id: string, values: Partial<MembershipRecord>): Promise<{ data: MembershipRecord | null; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db.from('organization_memberships').update(values).eq('id', id).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as MembershipRecord, error: null }
  }

  async terminate(id: string): Promise<{ data: MembershipRecord | null; error: { code: string; message: string; details?: unknown } | null }> {
    return this.update(id, {
      status: 'terminated',
      ended_at: new Date().toISOString(),
      deactivated_at: new Date().toISOString(),
    } as Partial<MembershipRecord>)
  }

  // ─── Role Assignments ──────────────────────────────────────────────────

  async getRoles(membershipId: string): Promise<{ data: RoleAssignmentRecord[]; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db.from('membership_roles').select('*').eq('membership_id', membershipId)
    if (error) return { data: [], error: mapError(error) }
    return { data: data as unknown as RoleAssignmentRecord[], error: null }
  }

  async assignRole(membershipId: string, roleId: string, assignedBy: string): Promise<{ data: RoleAssignmentRecord | null; error: { code: string; message: string; details?: unknown } | null }> {
    const { data, error } = await this.db.from('membership_roles').insert({
      membership_id: membershipId,
      role_id: roleId,
      assigned_by: assignedBy,
    }).select('*').single()
    if (error) return { data: null, error: mapError(error) }
    return { data: data as unknown as RoleAssignmentRecord, error: null }
  }

  async removeRole(membershipId: string, roleId: string): Promise<{ error: { code: string; message: string; details?: unknown } | null }> {
    const { error } = await this.db.from('membership_roles').delete().eq('membership_id', membershipId).eq('role_id', roleId)
    if (error) return { error: mapError(error) }
    return { error: null }
  }

  // ─── Role Catalog ──────────────────────────────────────────────────────

  async listRoles(scope?: string): Promise<{ data: RoleRecord[]; error: { code: string; message: string; details?: unknown } | null }> {
    let query = this.db.from('organization_roles').select('*').order('priority', { ascending: false })
    if (scope) query = query.eq('scope', scope)
    const { data, error } = await query
    if (error) return { data: [], error: mapError(error) }
    return { data: data as unknown as RoleRecord[], error: null }
  }
}
