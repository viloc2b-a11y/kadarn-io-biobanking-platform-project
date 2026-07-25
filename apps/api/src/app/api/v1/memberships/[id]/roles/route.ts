// ==========================================================================
// KAD-002E — Role Assignment API (refactored with MembershipRepository)
// ==========================================================================
// POST   /api/v1/memberships/[id]/roles — Assign a role
// GET    /api/v1/memberships/[id]/roles — List role assignments
// DELETE /api/v1/memberships/[id]/roles — Remove a role (query: ?roleId=)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateRoleAssignmentSchema } from '@kadarn/types';
import { MembershipRepository } from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);

    const { data, error } = await repository.getRoles(id);
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateRoleAssignmentSchema.safeParse({ ...body, membership_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await repository.assignRole(id, parsed.data.role_id, user.id);
    if (error) {
      if (error.code === 'CONFLICT') throw new ApiError(409, 'Role already assigned to this membership');
      throw new ApiError(500, error.message);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
