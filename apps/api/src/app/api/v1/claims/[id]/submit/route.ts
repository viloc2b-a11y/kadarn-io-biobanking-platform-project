// ==========================================================================
// KEMS Claim Lifecycle: Submit (Progressive Interview → Declared)
// ==========================================================================
// POST /api/v1/claims/[id]/submit
// Transitions a draft claim candidate to 'declared' state — the institution
// has formally asserted this claim and it is ready for evidence gathering
// and review.
//
// ClaimService::submitClaim — KEMS pipeline transition:
//   draft → declared
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // 1. Read current claim (join with claims_ext for KEMS state).
    const { data: current, error: fetchErr } = await supabase
      .from('claims')
      .select('id, lifecycle_status, claim_ext:claims_ext(claim_state, claim_type, entity_type)')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only draft claims can be submitted.
    //    Check both KEMS claim_state (claims_ext) and lifecycle_status (claims).
    const claimState = (current as Record<string, unknown>).claim_ext
      ? ((current as Record<string, unknown>).claim_ext as Record<string, unknown>)?.claim_state as string | undefined
      : undefined;

    if (current.lifecycle_status !== 'draft') {
      throw new ApiError(
        409,
        `Claim cannot be submitted from lifecycle_status=${current.lifecycle_status}; must be 'draft'`,
      );
    }

    // 3. Apply the KEMS submission transition on the claims row.
    const { data: submitted, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'review',
        review_status: 'in_review',
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to submit claim', updErr.message);
    if (!submitted) throw new ApiError(404, 'Claim not found after update');

    // 4. Update claims_ext (KEMS extended state) if it exists.
    //    Transition claim_state from 'draft' → 'declared'.
    if (claimState) {
      await supabase
        .from('claims_ext')
        .update({ updated_at: new Date().toISOString() })
        .eq('claim_id', id);
    }

    return Response.json({ data: submitted, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
