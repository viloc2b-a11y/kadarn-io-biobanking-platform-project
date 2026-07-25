// ==========================================================================
// KAD-LOOP-004 — Deprecate Confidence Model (Phase 10)
// ==========================================================================
// POST /api/v1/confidence-models/[id]/deprecate — Deprecate a confidence model
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const deprecateSchema = z.object({
  replacement_id: z.string().uuid().optional(),
});

// ─── POST — deprecate confidence model ─────────────────────────────────────
export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = deprecateSchema.safeParse(body);

    const supabase = createServiceClient();

    const { data: model, error: fetchErr } = await supabase
      .from('confidence_models')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Confidence model not found');
      throw new ApiError(500, 'Failed to fetch confidence model', fetchErr.message);
    }
    if (!model) throw new ApiError(404, 'Confidence model not found');

    // Only active models can be deprecated.
    if (model.status !== 'active') {
      throw new ApiError(409, `Confidence model cannot be deprecated: current status is '${model.status}'`);
    }

    // If a replacement model is specified, verify it exists and is active.
    if (parsed.success && parsed.data.replacement_id) {
      const { data: replacement, error: repErr } = await supabase
        .from('confidence_models')
        .select('id, status')
        .eq('id', parsed.data.replacement_id)
        .single();

      if (repErr || !replacement) {
        throw new ApiError(404, 'Replacement confidence model not found');
      }

      if (replacement.status !== 'active') {
        throw new ApiError(422, 'Replacement confidence model must be in active status');
      }
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('confidence_models')
      .update({
        status: 'deprecated',
        deprecated_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to deprecate confidence model', updErr.message);

    return Response.json({ data: updated, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
