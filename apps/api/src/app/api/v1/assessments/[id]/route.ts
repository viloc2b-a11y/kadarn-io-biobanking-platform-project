// ==========================================================================
// KAD-GC-001 — Assessment Detail API
// ==========================================================================
// GET /api/v1/assessments/[id] — Get single assessment with results, gaps, mitigations
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (assessmentError) {
      if (assessmentError.code === 'PGRST116') {
        throw new ApiError(404, 'Assessment not found');
      }
      return handleApiError(assessmentError);
    }

    // Fetch assessment results
    const { data: results, error: resultsError } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true });

    if (resultsError) {
      return handleApiError(resultsError);
    }

    // Fetch gaps for all results
    const resultIds = (results ?? []).map((r) => r.id);
    let gaps: any[] = [];
    let mitigations: any[] = [];

    if (resultIds.length > 0) {
      const { data: gapsData, error: gapsError } = await supabase
        .from('gaps')
        .select('*')
        .in('assessment_result_id', resultIds)
        .order('created_at', { ascending: true });

      if (gapsError) {
        return handleApiError(gapsError);
      }
      gaps = gapsData ?? [];

      // Fetch mitigations for all gaps
      const gapIds = gaps.map((g) => g.id);
      if (gapIds.length > 0) {
        const { data: mitigationsData, error: mitigationsError } = await supabase
          .from('mitigations')
          .select('*')
          .in('gap_id', gapIds)
          .order('created_at', { ascending: true });

        if (mitigationsError) {
          return handleApiError(mitigationsError);
        }
        mitigations = mitigationsData ?? [];
      }
    }

    // Nest gaps under results, mitigations under gaps
    const gapMap = new Map<string, any[]>();
    for (const g of gaps) {
      const list = gapMap.get(g.assessment_result_id) ?? [];
      list.push(g);
      gapMap.set(g.assessment_result_id, list);
    }

    const mitigationMap = new Map<string, any[]>();
    for (const m of mitigations) {
      const list = mitigationMap.get(m.gap_id) ?? [];
      list.push(m);
      mitigationMap.set(m.gap_id, list);
    }

    const resultsWithGaps = (results ?? []).map((r) => {
      const resultGaps = (gapMap.get(r.id) ?? []).map((g) => ({
        ...g,
        mitigations: mitigationMap.get(g.id) ?? [],
      }));
      return { ...r, gaps: resultGaps };
    });

    return Response.json({
      data: {
        ...assessment,
        results: resultsWithGaps,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
