// ==========================================================================
// KAD-002E — Single Membership API (refactored with MembershipRepository)
// ==========================================================================
// GET    /api/v1/memberships/[id] — Get a membership with roles
// PATCH  /api/v1/memberships/[id] — Update membership
// DELETE /api/v1/memberships/[id] — Terminate membership (soft)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdateMembershipSchema } from '@kadarn/types';
import { MembershipRepository } from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);

    const { data, error } = await repository.findById(id);
    if (!data && !error) throw new ApiError(404, 'Membership not found');
    if (error) throw new ApiError(500, error.message);

    // Get roles for this membership
    const { data: roles } = await repository.getRoles(id);

    return Response.json({ data: { ...data, roles: roles ?? [] }, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);
    const body = await request.json() as Record<string, unknown>;

    const parsed = UpdateMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.department !== undefined) updateData.department = parsed.data.department;
    if (parsed.data.person_id !== undefined) updateData.person_id = parsed.data.person_id;

    if (parsed.data.status === 'terminated' || parsed.data.status === 'suspended') {
      updateData.deactivated_at = new Date().toISOString();
    }

    const { data, error } = await repository.update(id, updateData as any);
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);

    const { data, error } = await repository.terminate(id);
    if (!data && !error) throw new ApiError(404, 'Membership not found');
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
