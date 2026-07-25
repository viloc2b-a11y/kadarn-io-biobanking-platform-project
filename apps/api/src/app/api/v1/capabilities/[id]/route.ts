// ==========================================================================
// KAD-003 — Single Capability API
// ==========================================================================
// GET    /api/v1/capabilities/[id] — Get a Capability
// PATCH  /api/v1/capabilities/[id] — Update a Capability
// DELETE /api/v1/capabilities/[id] — Deprecate a Capability
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdateInstitutionCapabilitySchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    const { data, error } = await supabase
      .from('capabilities')
      .select('*, primary_claim:primary_claim_id(id, name, claim_type_id, workflow_state)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to fetch capability', error.message);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    const parsed = UpdateInstitutionCapabilitySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('capabilities')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A capability with this type already exists');
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      return handleApiError(error);
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

    const { data, error } = await supabase
      .from('capabilities')
      .update({ status: 'deprecated' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      return handleApiError(error);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
