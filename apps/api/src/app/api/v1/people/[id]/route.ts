// ==========================================================================
// KAD-002E — Single Person API (refactored with PersonRepository)
// ==========================================================================
// GET    /api/v1/people/[id] — Get a Person by ID
// PATCH  /api/v1/people/[id] — Update a Person
// DELETE /api/v1/people/[id] — Soft-delete a Person
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdatePersonSchema } from '@kadarn/types';
import { PersonRepository } from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new PersonRepository(supabase);

    const { data, error } = await repository.findById(id);
    if (!data && !error) throw new ApiError(404, 'Person not found');
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new PersonRepository(supabase);
    const body = await request.json() as Record<string, unknown>;

    const parsed = UpdatePersonSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await repository.update(id, parsed.data as any);
    if (error) {
      if (error.code === 'CONFLICT') throw new ApiError(409, error.message);
      if (error.code === 'NOT_FOUND') throw new ApiError(404, 'Person not found');
      throw new ApiError(500, error.message);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const repository = new PersonRepository(supabase);

    const { data, error } = await repository.softDelete(id);
    if (!data && !error) throw new ApiError(404, 'Person not found');
    if (error) throw new ApiError(500, error.message);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
