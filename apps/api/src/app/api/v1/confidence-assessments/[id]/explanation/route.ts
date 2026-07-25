// ==========================================================================
// KAD-LOOP-004 — Assessment Explanation API (Phase 10)
// ==========================================================================
// GET /api/v1/confidence-assessments/[id]/explanation — Get the explanation for an assessment
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import {
  ConfidenceModelRepository,
  ConfidenceAssessmentRepository,
  ConfidenceFactorRepository,
  ConfidenceBlockerRepository,
  ConfidenceExplanationService,
} from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — explanation for a confidence assessment ─────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Verify the assessment exists.
    const { data: assessment, error: asmErr } = await supabase
      .from('confidence_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (asmErr) {
      if (asmErr.code === 'PGRST116') throw new ApiError(404, 'Confidence assessment not found');
      throw new ApiError(500, 'Failed to fetch confidence assessment', asmErr.message);
    }
    if (!assessment) throw new ApiError(404, 'Confidence assessment not found');

    // Build the explanation service and generate the explanation.
    const db = supabase as any;
    const modelRepo = new ConfidenceModelRepository(db);
    const assessmentRepo = new ConfidenceAssessmentRepository(db);
    const factorRepo = new ConfidenceFactorRepository(db);
    const blockerRepo = new ConfidenceBlockerRepository(db);

    const explanationService = new ConfidenceExplanationService(
      assessmentRepo, factorRepo, blockerRepo, modelRepo,
    );

    const explanation = await explanationService.explainAssessment(id);

    return Response.json({
      data: {
        assessment_id: id,
        explanation,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
