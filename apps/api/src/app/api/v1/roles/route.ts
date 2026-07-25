// ==========================================================================
// KAD-002E — Roles API (refactored with MembershipRepository)
// ==========================================================================
// GET /api/v1/roles — List all governed roles, optionally by scope
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { MembershipRepository } from '@kadarn/platform-services';

export const GET = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') ?? undefined;

    const { data, error } = await repository.listRoles(scope);
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
