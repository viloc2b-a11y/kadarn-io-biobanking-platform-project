// ==========================================================================
// KAD-LOOP-004 — Assessment Comparison API (Phase 10)
// ==========================================================================
// GET /api/v1/confidence-assessments/[id]/compare/[otherId] — Compare two assessments
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
  otherId: z.string().uuid(),
});

// ─── GET — compare two confidence assessments ─────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id, otherId } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Fetch both assessments in parallel.
    const [assessmentA, assessmentB] = await Promise.all([
      supabase
        .from('confidence_assessments')
        .select(`
          *,
          factors:confidence_factors(*),
          blockers:confidence_blockers(*)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('confidence_assessments')
        .select(`
          *,
          factors:confidence_factors(*),
          blockers:confidence_blockers(*)
        `)
        .eq('id', otherId)
        .single(),
    ]);

    if (assessmentA.error) {
      if (assessmentA.error.code === 'PGRST116') throw new ApiError(404, 'First confidence assessment not found');
      throw new ApiError(500, 'Failed to fetch first assessment', assessmentA.error.message);
    }
    if (!assessmentA.data) throw new ApiError(404, 'First confidence assessment not found');

    if (assessmentB.error) {
      if (assessmentB.error.code === 'PGRST116') throw new ApiError(404, 'Second confidence assessment not found');
      throw new ApiError(500, 'Failed to fetch second assessment', assessmentB.error.message);
    }
    if (!assessmentB.data) throw new ApiError(404, 'Second confidence assessment not found');

    // Verify both assessments are for the same capability.
    if (assessmentA.data.capability_id !== assessmentB.data.capability_id) {
      throw new ApiError(422, 'Assessments must belong to the same capability to be compared');
    }

    // Compute difference summary.
    const diff = {
      score_delta: assessmentA.data.score - assessmentB.data.score,
      band_changed: assessmentA.data.confidence_band !== assessmentB.data.confidence_band,
      readiness_changed: assessmentA.data.readiness_state !== assessmentB.data.readiness_state,
      factor_count_delta: (assessmentA.data.factors?.length ?? 0) - (assessmentB.data.factors?.length ?? 0),
      blocker_count_delta: (assessmentA.data.blockers?.length ?? 0) - (assessmentB.data.blockers?.length ?? 0),
    };

    return Response.json({
      data: {
        assessment_a: assessmentA.data,
        assessment_b: assessmentB.data,
        comparison: diff,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
