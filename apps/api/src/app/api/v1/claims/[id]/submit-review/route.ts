// ==========================================================================
// KAD-LOOP-003 — Claim Lifecycle: Submit for Review (Phase 9)
// ==========================================================================
// POST /api/v1/claims/[id]/submit-review
// Transitions a draft claim into the review state.
// Sets lifecycle_status='review', review_status='in_review',
//     workflow_state='under_review'.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // 1. Read current claim.
    const { data: current, error: fetchErr } = await supabase
      .from('claims')
      .select('id, lifecycle_status, version')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only draft claims can be submitted for review.
    if (current.lifecycle_status !== 'draft') {
      throw new ApiError(
        409,
        `Claim cannot be submitted for review from lifecycle_status=${current.lifecycle_status}; must be 'draft'`,
      );
    }

    // 3. Apply the transition (status-only, no content freeze).
    const { data, error } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'review',
        review_status: 'in_review',
        workflow_state: 'under_review',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, 'Failed to submit claim for review', error.message);
    if (!data) throw new ApiError(404, 'Claim not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
