// ==========================================================================
// KAD-LOOP-004 — Single Confidence Model API (Phase 10)
// ==========================================================================
// GET   /api/v1/confidence-models/[id] — Get a single confidence model
// PATCH /api/v1/confidence-models/[id] — Update a confidence model
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { UpdateConfidenceModelSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — single confidence model ─────────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('confidence_models')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Confidence model not found');
      throw new ApiError(500, 'Failed to fetch confidence model', error.message);
    }
    if (!data) throw new ApiError(404, 'Confidence model not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── PATCH — update confidence model ───────────────────────────────────────
export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateConfidenceModelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Check the model exists and its current status.
    const { data: current, error: fetchErr } = await supabase
      .from('confidence_models')
      .select('id, status, version')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Confidence model not found');
      throw new ApiError(500, 'Failed to fetch confidence model', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Confidence model not found');

    // Active models are immutable — must use deprecate workflow instead.
    if (current.status === 'active' && parsed.data.status !== 'deprecated') {
      throw new ApiError(
        409,
        'Active confidence model is immutable; use the deprecate endpoint to change status',
      );
    }

    // Retired models cannot be updated.
    if (current.status === 'retired') {
      throw new ApiError(409, 'Retired confidence model cannot be updated');
    }

    const { data: updated, error: updErr } = await supabase
      .from('confidence_models')
      .update({
        ...parsed.data,
        version: current.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) {
      if (updErr.code === 'PGRST116') throw new ApiError(404, 'Confidence model not found');
      throw new ApiError(500, 'Failed to update confidence model', updErr.message);
    }

    return Response.json({ data: updated, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
