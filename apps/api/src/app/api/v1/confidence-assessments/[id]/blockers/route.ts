// ==========================================================================
// KAD-LOOP-004 — Assessment Blockers API (Phase 10)
// ==========================================================================
// GET /api/v1/confidence-assessments/[id]/blockers — List blockers for an assessment
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — list blockers for a confidence assessment ──────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Verify the assessment exists.
    const { data: assessment, error: asmErr } = await supabase
      .from('confidence_assessments')
      .select('id')
      .eq('id', id)
      .single();

    if (asmErr) {
      if (asmErr.code === 'PGRST116') throw new ApiError(404, 'Confidence assessment not found');
      throw new ApiError(500, 'Failed to fetch confidence assessment', asmErr.message);
    }
    if (!assessment) throw new ApiError(404, 'Confidence assessment not found');

    const { data, error } = await supabase
      .from('confidence_blockers')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true });

    if (error) throw new ApiError(500, 'Failed to fetch confidence blockers', error.message);

    return Response.json({
      data: {
        assessment_id: id,
        blockers: data ?? [],
        total_count: data?.length ?? 0,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
