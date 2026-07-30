// ==========================================================================
// KAD-GC-002 — Institution Gaps API
// ==========================================================================
// GET /api/v1/institutions/[id]/gaps — List all gaps for an institution
// Joins gaps → assessment_results → assessments to scope by institution.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    const gapType = url.searchParams.get('gap_type');

    // Step 1: Get all assessment IDs for this institution
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id')
      .eq('institution_id', id);

    if (assessmentError) {
      return handleApiError(assessmentError);
    }

    const assessmentIds = (assessments ?? []).map((a) => a.id);

    if (assessmentIds.length === 0) {
      return Response.json({ data: [], error: null });
    }

    // Step 2: Get all result IDs for those assessments
    const { data: results, error: resultsError } = await supabase
      .from('assessment_results')
      .select('id, assessment_id')
      .in('assessment_id', assessmentIds);

    if (resultsError) {
      return handleApiError(resultsError);
    }

    const resultIds = (results ?? []).map((r) => r.id);

    if (resultIds.length === 0) {
      return Response.json({ data: [], error: null });
    }

    // Step 3: Get gaps for those results
    let query = supabase
      .from('gaps')
      .select('*')
      .in('assessment_result_id', resultIds)
      .order('created_at', { ascending: false });

    if (severity) query = query.eq('severity', severity);
    if (gapType) query = query.eq('gap_type', gapType);

    const { data: gaps, error: gapsError } = await query;

    if (gapsError) {
      return handleApiError(gapsError);
    }

    // Enrich gaps with assessment_result and assessment context
    const resultMap = new Map((results ?? []).map((r) => [r.id, r]));
    const assessmentMap = new Map((assessments ?? []).map((a) => [a.id, a]));

    const enriched = (gaps ?? []).map((gap) => {
      const result = resultMap.get(gap.assessment_result_id);
      const assessment = result ? assessmentMap.get(result.assessment_id) : null;
      return {
        ...gap,
        assessment_result: result ?? null,
        assessment: assessment ?? null,
      };
    });

    return Response.json({ data: enriched, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
