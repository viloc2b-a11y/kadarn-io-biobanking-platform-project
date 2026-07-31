// ==========================================================================
// KAD-GC-001 — Assessment Results API
// ==========================================================================
// POST /api/v1/assessments/[id]/results — Add result to assessment
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateAssessmentResultSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateAssessmentResultSchema.safeParse({ ...body, assessment_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify the assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, status')
      .eq('id', id)
      .single();

    if (assessmentError) {
      if (assessmentError.code === 'PGRST116') {
        throw new ApiError(404, 'Assessment not found');
      }
      return handleApiError(assessmentError);
    }

    const insert = {
      assessment_id: parsed.data.assessment_id,
      capability_id: parsed.data.capability_id ?? null,
      score: parsed.data.score ?? null,
      confidence_level: parsed.data.confidence_level ?? null,
      gaps_summary: parsed.data.gaps_summary ?? {},
    };

    const { data, error } = await supabase
      .from('assessment_results')
      .insert(insert)
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
