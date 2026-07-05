// ==========================================================================
// Kadarn API — Authorization Guards
// ==========================================================================
// RC-0.3 — Centralized auth + role enforcement for all API routes.
//
// Usage:
//   import { withAuth, requireRole, requireOrgMembership } from '@/lib/auth-guards'
//
//   export const GET = withAuth(requireRole('kadarn_internal', handler))
//   export const POST = withAuth(requireOrgMembership(handler))
// ==========================================================================

import { getAuthUser, createRouteClient, ApiError, handleApiError } from './supabase-server'
import type { KadarnRole } from '@kadarn/types'

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { createRouteClient, handleApiError, ApiError } from './supabase-server'
export { withAuth, withErrorHandling } from './supabase-server'

// ---------------------------------------------------------------------------
// Role enforcement
// ---------------------------------------------------------------------------

/**
 * Require a specific Kadarn role for this endpoint.
 *
 * @param role  — the minimum role required
 * @param handler — the route handler
 */
export function requireRole(
  role: KadarnRole,
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) => Promise<Response>,
) {
  return async (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>): Promise<Response> => {
    const userRole = (user.user_metadata?.kadarn_role as KadarnRole) ?? 'marketplace_user'

    // KOC access requires kadarn_internal
    if (role === 'kadarn_internal' && userRole !== 'kadarn_internal') {
      throw new ApiError(403, 'Access restricted to Kadarn Operations Center')
    }

    // Admin — can be kadarn_internal or org_admin
    if (role === 'org_admin') {
      if (userRole !== 'org_admin' && userRole !== 'kadarn_internal') {
        throw new ApiError(403, 'Administrator access required')
      }
    }

    return handler(request, user)
  }
}

// ---------------------------------------------------------------------------
// Organization membership enforcement
// ---------------------------------------------------------------------------

/**
 * Require active organization membership for this endpoint.
 *
 * Checks that the user has an active_org_id in their metadata, and
 * optionally verifies it against the active-org lookup.
 */
export function requireOrgMembership(
  handler: (
    request: Request,
    user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
    orgId: string,
    params?: Record<string, string>,
  ) => Promise<Response>,
) {
  return async (
    request: Request,
    user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
    params?: Record<string, string>,
  ): Promise<Response> => {
    const activeOrgId = (user.user_metadata?.active_org_id as string) || null

    if (!activeOrgId) {
      throw new ApiError(403, 'Organization membership required. Select an active organization.')
    }

    // Optional: verify the membership is still valid
    const supabase = await createRouteClient()
    const { data: membership, error } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', activeOrgId)
      .single()

    if (error || !membership) {
      throw new ApiError(403, 'You are not a member of this organization.')
    }

    return handler(request, user, activeOrgId, params)
  }
}

// ---------------------------------------------------------------------------
// Consent enforcement
// ---------------------------------------------------------------------------

/**
 * Verify that the institution has granted consent for this consumer.
 *
 * Checks the institutional_consent table for an active, unrevoked consent
 * record between the requesting organization (from user metadata) and the
 * target institution (from params or body).
 */
export function requireConsent(
  targetOrgIdExtractor: (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) => string,
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) => Promise<Response>,
) {
  return async (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>): Promise<Response> => {
    const targetOrgId = targetOrgIdExtractor(request, user)
    const consumerOrgId = (user.user_metadata?.active_org_id as string) || null

    if (!consumerOrgId) {
      throw new ApiError(403, 'Organization membership required. Select an active organization.')
    }

    // Kadarn internal bypasses consent gates (operational access)
    const userRole = user.user_metadata?.kadarn_role as KadarnRole | undefined
    if (userRole === 'kadarn_internal') {
      return handler(request, user)
    }

    // Check consent exists and is active
    const supabase = await createRouteClient()
    const { data: consent, error } = await supabase
      .from('institutional_consent')
      .select('id, status')
      .eq('target_org_id', targetOrgId)
      .eq('consumer_org_id', consumerOrgId)
      .eq('status', 'active')
      .maybeSingle()

    if (error || !consent) {
      throw new ApiError(403, 'Consent required. The institution has not authorized this access.')
    }

    return handler(request, user)
  }
}

// ---------------------------------------------------------------------------
// Visibility policy enforcement
// ---------------------------------------------------------------------------

/**
 * Enforce visibility policy on response data.
 *
 * After the handler returns, filter the response body to remove any data
 * that exceeds the requester's visibility authorization.
 */
export function enforceVisibility(
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>) => Promise<Response>,
) {
  return async (request: Request, user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>): Promise<Response> => {
    const response = await handler(request, user)

    // Only filter JSON responses
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return response
    }

    const body = await response.json()

    // Strip private fields from any organization object in the response
    const sanitized = stripPrivateFields(body)

    return Response.json(sanitized, { status: response.status })
  }
}

// ---------------------------------------------------------------------------
// Private field stripper
// ---------------------------------------------------------------------------

const PRIVATE_FIELDS = new Set([
  'email',
  'phone',
  'contact_email',
  'contact_phone',
  'contact_name',
  'address',
  'internal_notes',
  'admin_notes',
  'private_evidence',
  'restricted_claims',
  'financial_data',
  'pricing',
])

function stripPrivateFields(data: unknown): unknown {
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(stripPrivateFields)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (PRIVATE_FIELDS.has(key)) continue
    if (key.startsWith('_') || key.startsWith('private_')) continue
    result[key] = stripPrivateFields(value)
  }
  return result
}
