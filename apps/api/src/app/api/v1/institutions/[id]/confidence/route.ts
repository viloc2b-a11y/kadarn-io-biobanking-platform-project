// ==========================================================================
// KAD-LOOP-004 — Institution Confidence Summary API (Phase 10)
// ==========================================================================
// GET /api/v1/institutions/[id]/confidence — Get confidence summary for an institution
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — institution confidence summary ──────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: institutionId } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // Verify the institution exists.
    const { data: institution, error: instErr } = await supabase
      .from('institutions')
      .select('id, organization_id, name')
      .eq('id', institutionId)
      .single();

    if (instErr) {
      if (instErr.code === 'PGRST116') throw new ApiError(404, 'Institution not found');
      throw new ApiError(500, 'Failed to fetch institution', instErr.message);
    }
    if (!institution) throw new ApiError(404, 'Institution not found');

    // Fetch all completed assessments for capabilities belonging to this institution.
    const { data: assessments, error: asmErr } = await supabase
      .from('confidence_assessments')
      .select(`
        *,
        capability:capability_id(id, name, status)
      `)
      .eq('institution_id', institutionId)
      .eq('assessment_status', 'completed')
      .order('calculated_at', { ascending: false });

    if (asmErr) throw new ApiError(500, 'Failed to fetch confidence assessments', asmErr.message);

    // Count distinct capabilities.
    const uniqueCapabilities = new Set(assessments?.map(a => a.capability_id) ?? []);

    // Band distribution.
    const bandDistribution: Record<string, number> = {};
    let readyCount = 0;
    let blockedCount = 0;
    let staleCount = 0;
    let manualReviewCount = 0;

    for (const assessment of assessments ?? []) {
      const band = assessment.confidence_band;
      bandDistribution[band] = (bandDistribution[band] ?? 0) + 1;

      if (assessment.readiness_state === 'ready' || assessment.readiness_state === 'conditionally_ready') {
        readyCount++;
      }

      if (assessment.requires_manual_review) {
        manualReviewCount++;
      }

      // Check staleness.
      if (assessment.stale_at && new Date(assessment.stale_at) < new Date()) {
        staleCount++;
      }

      // Check for blockers.
      if (!blockedCount) {
        const { count: blockerCount } = await supabase
          .from('confidence_blockers')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assessment.id)
          .eq('blocks_scoring', true);

        if ((blockerCount ?? 0) > 0) {
          blockedCount += blockerCount ?? 0;
        }
      }
    }

    // Get total capabilities for this institution.
    const { count: totalCapabilities } = await supabase
      .from('capabilities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', institution.organization_id);

    const now = new Date().toISOString();

    return Response.json({
      data: {
        institution_id: institutionId,
        institution_name: institution.name,
        total_capabilities: totalCapabilities ?? 0,
        assessed_capabilities: uniqueCapabilities.size,
        unassessed_capabilities: (totalCapabilities ?? 0) - uniqueCapabilities.size,
        band_distribution: bandDistribution,
        ready_count: readyCount,
        blocked_count: blockedCount,
        stale_count: staleCount,
        manual_review_count: manualReviewCount,
        generated_at: now,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
