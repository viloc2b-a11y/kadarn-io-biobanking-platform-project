// ==========================================================================
// KAD-002E — Membership API (refactored with MembershipRepository)
// ==========================================================================
// GET    /api/v1/institutions/[id]/members — List members
// POST   /api/v1/institutions/[id]/members — Add a member
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateMembershipSchema } from '@kadarn/types';
import { MembershipRepository } from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);

    const { data, error } = await repository.findByOrganization(id);
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new MembershipRepository(supabase);
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateMembershipSchema.safeParse({ ...body, organization_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await repository.create({
      user_id: parsed.data.user_id,
      person_id: parsed.data.person_id ?? null,
      organization_id: parsed.data.organization_id,
      title: parsed.data.title ?? null,
      department: parsed.data.department ?? null,
      status: 'active',
      joined_at: new Date().toISOString(),
    } as any);

    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
