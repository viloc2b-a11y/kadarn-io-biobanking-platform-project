// ==========================================================================
// KAD-LOOP-004 — Single Confidence Assessment API (Phase 10)
// ==========================================================================
// GET /api/v1/confidence-assessments/[id] — Get a single assessment
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — single confidence assessment ────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('confidence_assessments')
      .select(`
        *,
        confidence_model:confidence_model_id(id, name, version, methodology, status),
        capability:capability_id(id, name, status)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Confidence assessment not found');
      throw new ApiError(500, 'Failed to fetch confidence assessment', error.message);
    }
    if (!data) throw new ApiError(404, 'Confidence assessment not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
