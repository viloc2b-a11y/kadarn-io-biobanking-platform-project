import { z } from 'zod'
import type { User } from '@supabase/supabase-js'
import { ApiError, createRouteClient } from '@/lib/supabase-server'

export const workspacePaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type WorkspacePagination = z.infer<typeof workspacePaginationSchema>

export function getActiveOrgId(user: User): string | null {
  const orgId = user.user_metadata?.active_org_id
  return typeof orgId === 'string' && orgId.length > 0 ? orgId : null
}

/** Requires authenticated user with active_org_id in JWT metadata. */
export function requireActiveOrg(user: User): string {
  const orgId = getActiveOrgId(user)
  if (!orgId) {
    throw new ApiError(
      422,
      'Active organization required. POST /api/v1/workspace/active-org first.',
    )
  }
  return orgId
}

/**
 * Resolve active org with membership validation.
 * Queries organization_memberships to confirm the user belongs to the org.
 * Use this in security-sensitive routes where client-set metadata is insufficient.
 *
 * WARNING: user.user_metadata.active_org_id is client-settable via Supabase Auth.
 * A compromised client could set any org ID. Always validate against actual memberships
 * before authorizing org-scoped operations.
 */
export async function requireValidatedActiveOrg(user: User): Promise<string> {
  const orgId = requireActiveOrg(user)
  const supabase = await createRouteClient()
  const { data: membership, error } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new ApiError(500, 'Failed to verify organization membership', error.message)
  }
  if (!membership) {
    throw new ApiError(403, 'You are not an active member of this organization')
  }
  return orgId
}

export function parseWorkspacePagination(request: Request): WorkspacePagination {
  const url = new URL(request.url)
  return workspacePaginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  })
}

export function workspaceListResponse(orgId: string, items: unknown[]) {
  return Response.json({
    data: { organization_id: orgId, items },
    error: null,
  })
}
