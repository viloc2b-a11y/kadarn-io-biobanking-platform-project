// ==========================================================================
// KAD-007 — Confidence API
// ==========================================================================
// GET /api/v1/claims/[id]/confidence — Compute and return confidence score
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';
import type { ConfidenceScore } from '@kadarn/types';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // 1. Get evidence for this claim with class info
    const { data: evidence, error: evError } = await supabase
      .from('evidence_nodes')
      .select('id, evidence_class, created_at')
      .eq('claim_id', id);
    if (evError) throw new ApiError(500, 'Failed to fetch evidence');

    // 2. Get evidence class weights
    const { data: classWeights, error: cwError } = await supabase
      .from('evidence_class_ref')
      .select('id, default_weight, decay_months');
    if (cwError) throw new ApiError(500, 'Failed to fetch class weights');

    // 3. Get review outcomes for this claim
    const { data: reviews, error: rvError } = await supabase
      .from('review_tasks')
      .select('id, decision')
      .eq('claim_id', id);
    if (rvError) throw new ApiError(500, 'Failed to fetch reviews');

    // 4. Compute confidence
    const weightMap = new Map((classWeights ?? []).map((cw: any) => [cw.id, cw]));
    const classBreakdown = new Map<string, { count: number; totalWeight: number; evidenceItems: any[] }>();

    for (const ev of evidence ?? []) {
      const cls = ev.evidence_class as string;
      if (!classBreakdown.has(cls)) classBreakdown.set(cls, { count: 0, totalWeight: 0, evidenceItems: [] });
      const entry = classBreakdown.get(cls)!;
      entry.count++;
      entry.evidenceItems.push(ev);
      const weightInfo = weightMap.get(cls);
      entry.totalWeight += weightInfo?.default_weight ?? 0.5;
    }

    const reviewedCount = (reviews ?? []).filter((r: any) => r.decision === 'approved' || r.decision === 'rejected_with_modifications').length;
    const totalEvidence = evidence?.length ?? 0;
    const evidenceScore = totalEvidence > 0
      ? Array.from(classBreakdown.values()).reduce((sum, e) => sum + (e.totalWeight / e.count), 0) / classBreakdown.size
      : 0;
    const reviewScore = totalEvidence > 0 ? Math.min(reviewedCount / Math.max(totalEvidence, 1), 1) : 0;
    const overallScore = Math.round((evidenceScore * 0.6 + reviewScore * 0.4) * 100) / 100;

    const level: string = overallScore >= 0.9 ? 'very_high' : overallScore >= 0.75 ? 'high' : overallScore >= 0.5 ? 'medium' : 'low';

    const result: ConfidenceScore = {
      claim_id: id,
      overall_score: overallScore,
      level: level as any,
      evidence_count: totalEvidence,
      reviewed_count: reviewedCount,
      weighted_score: evidenceScore,
      decay_adjusted_score: evidenceScore,
      breakdown: Array.from(classBreakdown.entries()).map(([cls, e]) => ({
        evidence_class: cls,
        weight: weightMap.get(cls)?.default_weight ?? 0.5,
        count: e.count,
        score: e.count > 0 ? Math.round((e.totalWeight / e.count) * 100) / 100 : 0,
      })),
      computed_at: new Date().toISOString(),
    };

    // 5. Store snapshot
    await supabase.from('confidence_state_snapshots').insert({
      claim_id: id,
      overall_score: result.overall_score,
      level: result.level,
      breakdown: result.breakdown,
      computed_at: result.computed_at,
    }).maybeSingle();

    return Response.json({ data: result, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
