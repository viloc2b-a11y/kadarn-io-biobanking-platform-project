// ==========================================================================
// KAD-LOOP-004 — Assessment Recalculate API
// ==========================================================================
// POST /api/v1/confidence-assessments/[id]/recalculate
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import {
  ConfidenceAssessmentRepository,
  ConfidenceFactorRepository,
  ConfidenceBlockerRepository,
  ConfidenceRuleRepository,
  ConfidenceCalculationService,
} from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Verify the assessment exists
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

    const db = supabase as any;
    const assessmentRepo = new ConfidenceAssessmentRepository(db);
    const factorRepo = new ConfidenceFactorRepository(db);
    const blockerRepo = new ConfidenceBlockerRepository(db);
    const ruleRepo = new ConfidenceRuleRepository(db);

    const calculationService = new ConfidenceCalculationService(
      assessmentRepo, factorRepo, blockerRepo, ruleRepo, db,
    );

    // Mark the prior assessment as superseded
    await supabase
      .from('confidence_assessments')
      .update({ assessment_status: 'superseded' })
      .eq('id', id);

    // Run a new calculation
    const newAssessment = await calculationService.calculate(
      assessment.capability_id,
      assessment.confidence_model_id,
    );

    return Response.json({ data: newAssessment, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});