// ==========================================================================
// Delivery Roles — RBAC role definitions and permission matrices
// ==========================================================================

import type { DeliveryAction } from './types.js';

/** Roles available in the Delivery Domain authorization model. */
export type DeliveryRole = 'admin' | 'sponsor' | 'institution' | 'researcher' | 'auditor' | 'system';

export const DELIVERY_ROLES: DeliveryRole[] = [
  'admin',
  'sponsor',
  'institution',
  'researcher',
  'auditor',
  'system',
];

/**
 * Permission matrix — maps each role to the set of allowed actions.
 * Admin has full access. System can auto-deliver and expire.
 * Sponsor, institution, researcher have progressively narrower access.
 */
export const ROLE_PERMISSIONS: Record<DeliveryRole, DeliveryAction[]> = {
  admin: [
    'artifact:read',
    'artifact:deliver',
    'artifact:revoke',
    'artifact:expire',
    'policy:manage',
    'channel:manage',
    'lineage:view',
  ],
  sponsor: ['artifact:read', 'artifact:deliver'],
  institution: ['artifact:read', 'artifact:deliver', 'lineage:view'],
  researcher: ['artifact:read'],
  auditor: ['artifact:read', 'lineage:view'],
  system: ['artifact:read', 'artifact:deliver', 'artifact:expire'],
};

/**
 * Get the set of actions permitted for a given role.
 * Returns empty array for unknown roles.
 */
export function getRolePermissions(role: DeliveryRole): DeliveryAction[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check whether a role grants a specific action.
 */
export function hasPermission(role: DeliveryRole, action: DeliveryAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/**
 * Type guard — check if a string is a valid DeliveryRole.
 */
export function isValidRole(value: string): value is DeliveryRole {
  return DELIVERY_ROLES.includes(value as DeliveryRole);
}
