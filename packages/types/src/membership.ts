// ─── KAD-002C — Institution Participation Model ──────────────────────────
// Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS
// Membership, Role Catalog, Role Assignment

import { z } from 'zod'

// ─── Membership ──────────────────────────────────────────────────────────

export const MembershipStatus = z.enum([
  'invited',
  'active',
  'suspended',
  'terminated',
  'expired',
])
export type MembershipStatus = z.infer<typeof MembershipStatus>

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  person_id: z.string().uuid().optional().nullable(),
  organization_id: z.string().uuid(),
  title: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  status: MembershipStatus.default('active'),
  invited_by: z.string().uuid().optional().nullable(),
  invited_at: z.string().datetime({ offset: true }).optional().nullable(),
  joined_at: z.string().datetime({ offset: true }).optional().nullable(),
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  ended_at: z.string().datetime({ offset: true }).optional().nullable(),
  deactivated_at: z.string().datetime({ offset: true }).optional().nullable(),
  deactivated_by: z.string().uuid().optional().nullable(),
  deactivated_reason: z.string().optional().nullable(),
  suspension_reason: z.string().optional().nullable(),
  termination_reason: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
  valid_from: z.string().datetime({ offset: true }).optional().nullable(),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type Membership = z.infer<typeof MembershipSchema>

export const CreateMembershipSchema = z.object({
  user_id: z.string().uuid(),
  person_id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  title: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
})

export type CreateMembership = z.infer<typeof CreateMembershipSchema>

export const UpdateMembershipSchema = CreateMembershipSchema.partial().extend({
  status: MembershipStatus.optional(),
})

export type UpdateMembership = z.infer<typeof UpdateMembershipSchema>

// ─── Role ────────────────────────────────────────────────────────────────

export const RoleScope = z.enum(['institution', 'sponsor', 'system'])
export type RoleScope = z.infer<typeof RoleScope>

// ─── KadarnRole — system-level role for auth guards ───────────────────────
// KAD-TYPECHECK-001: type-only addition. No schema, no migration.
// Used by auth-guards.ts and operations/phase8-cutover/route.ts.
export type KadarnRole =
  | 'marketplace_user'
  | 'org_admin'
  | 'kadarn_internal'
  | 'sponsor_user'
  | 'reviewer'
  | 'viewer'

export const RoleSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  scope: RoleScope.default('institution'),
})

export type Role = z.infer<typeof RoleSchema>

// ─── Role Assignment ─────────────────────────────────────────────────────

export const RoleAssignmentSchema = z.object({
  id: z.string().uuid(),
  membership_id: z.string().uuid(),
  role_id: z.string().uuid(),
  assigned_by: z.string().uuid().optional().nullable(),
  assigned_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  valid_from: z.string().datetime({ offset: true }).optional().nullable(),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
})

export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>

export const CreateRoleAssignmentSchema = z.object({
  membership_id: z.string().uuid(),
  role_id: z.string().uuid(),
})

export type CreateRoleAssignment = z.infer<typeof CreateRoleAssignmentSchema>

// ─── Permission Resolution ───────────────────────────────────────────────

export const ResolvedPermissionsSchema = z.object({
  memberships: z.array(z.object({
    organization_id: z.string().uuid(),
    organization_name: z.string(),
    status: MembershipStatus,
    roles: z.array(z.string()),
  })),
  global_role: z.string().optional().nullable(),
})

export type ResolvedPermissions = z.infer<typeof ResolvedPermissionsSchema>
