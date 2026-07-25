// ==========================================================================
// KAD-LOOP-004 — Capability Confidence (Phase 10)
// ==========================================================================
// GET /api/v1/capabilities/[id]/confidence — Get the latest confidence assessment
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — latest confidence assessment for a capability ───────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: capabilityId } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Verify the capability exists.
    const { data: capability, error: capErr } = await supabase
      .from('capabilities')
      .select('id, organization_id')
      .eq('id', capabilityId)
      .single();

    if (capErr || !capability) throw new ApiError(404, 'Capability not found');

    // Fetch the latest completed assessment with associated data.
    const { data: assessment, error: asmErr } = await supabase
      .from('confidence_assessments')
      .select(`
        *,
        confidence_model:confidence_model_id(id, name, version, status),
        factors:confidence_factors(*),
        blockers:confidence_blockers(*)
      `)
      .eq('capability_id', capabilityId)
      .eq('assessment_status', 'completed')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (asmErr) {
      if (asmErr.code === 'PGRST116') {
        return Response.json({
          data: {
            capability_id: capabilityId,
            assessment: null,
            message: 'No completed confidence assessment found for this capability',
          },
          error: null,
        });
      }
      throw new ApiError(500, 'Failed to fetch confidence assessment', asmErr.message);
    }

    if (!assessment) {
      return Response.json({
        data: {
          capability_id: capabilityId,
          assessment: null,
          message: 'No completed confidence assessment found for this capability',
        },
        error: null,
      });
    }

    return Response.json({
      data: {
        capability_id: capabilityId,
        assessment,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
