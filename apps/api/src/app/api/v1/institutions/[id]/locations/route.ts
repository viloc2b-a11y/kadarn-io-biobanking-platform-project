// ==========================================================================
// KAD-002E — Location API (refactored with LocationRepository)
// ==========================================================================
// POST /api/v1/institutions/[id]/locations — Create a Location
// GET  /api/v1/institutions/[id]/locations  — List Locations for an Institution
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateLocationSchema } from '@kadarn/types';
import { LocationRepository } from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new LocationRepository(supabase);
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateLocationSchema.safeParse({ ...body, institution_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await repository.create(parsed.data as any);
    if (error) {
      if (error.code === 'CONFLICT') throw new ApiError(409, error.message);
      throw new ApiError(500, error.message);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new LocationRepository(supabase);

    const { data, error } = await repository.findByInstitution(id);
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
