// ==========================================================================
// KAD-LOOP-004 — Single Confidence Rule API (Phase 10)
// ==========================================================================
// GET   /api/v1/confidence-rules/[id] — Get a single confidence rule
// PATCH /api/v1/confidence-rules/[id] — Update a confidence rule
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { UpdateConfidenceRuleSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — single confidence rule ──────────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('confidence_rules')
      .select('*, confidence_model:confidence_model_id(id, name, status)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Confidence rule not found');
      throw new ApiError(500, 'Failed to fetch confidence rule', error.message);
    }
    if (!data) throw new ApiError(404, 'Confidence rule not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── PATCH — update confidence rule ────────────────────────────────────────
export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateConfidenceRuleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Check the rule exists and is not retired.
    const { data: current, error: fetchErr } = await supabase
      .from('confidence_rules')
      .select('id, status, version')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Confidence rule not found');
      throw new ApiError(500, 'Failed to fetch confidence rule', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Confidence rule not found');

    if (current.status === 'retired') {
      throw new ApiError(409, 'Retired confidence rule cannot be updated');
    }

    if (current.status === 'active' && parsed.data.status && parsed.data.status !== 'deprecated') {
      throw new ApiError(
        409,
        'Active confidence rule is immutable; deprecate it instead of updating',
      );
    }

    const { data: updated, error: updErr } = await supabase
      .from('confidence_rules')
      .update({
        ...parsed.data,
        version: current.version + 1,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to update confidence rule', updErr.message);

    return Response.json({ data: updated, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
