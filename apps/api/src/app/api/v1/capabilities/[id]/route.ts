// ==========================================================================
// KAD-LOOP-003 — Single Capability API (Phase 9)
// ==========================================================================
// GET   /api/v1/capabilities/[id] — Get a single capability
// PATCH /api/v1/capabilities/[id] — Update a capability
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { UpdateInstitutionCapabilitySchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — single capability ──────────────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('capabilities')
      .select('*, primary_claim:primary_claim_id(id, name, claim_type_id, workflow_state)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to fetch capability', error.message);
    }
    if (!data) throw new ApiError(404, 'Capability not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── PATCH — update capability ────────────────────────────────────────────
export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateInstitutionCapabilitySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Check the capability exists and is not deprecated.
    const { data: current, error: fetchErr } = await supabase
      .from('capabilities')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to fetch capability', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Capability not found');

    if (current.status === 'deprecated') {
      throw new ApiError(409, 'Capability is deprecated and cannot be updated');
    }

    const { data, error } = await supabase
      .from('capabilities')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to update capability', error.message);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
