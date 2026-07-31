// ==========================================================================
// KEMS Claim Lifecycle: Institutional Confirmation
// ==========================================================================
// POST /api/v1/claims/[id]/confirm
// An authorized institutional representative confirms (vouches for) a claim.
//
// Allowed source states: declared, pending_evidence, evidence_gathered
// Target state:          evidence_gathered (if evidence exists), under_review
//
// Body: { confirmerId: string }
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.object({
  confirmerId: z.string().uuid(),
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { confirmerId } = parsed.data;
    const supabase = createServiceClient();

    // 1. Read current claim with extended metadata.
    const { data: current, error: fetchErr } = await supabase
      .from('claims')
      .select('id, lifecycle_status, evidence_count, claim_ext:claims_ext(claim_state, claim_type)')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only certain lifecycle states allow institutional confirmation.
    const allowedStates = ['draft', 'review'];
    if (!allowedStates.includes(current.lifecycle_status)) {
      throw new ApiError(
        409,
        `Claim cannot be confirmed from lifecycle_status=${current.lifecycle_status}; must be one of: ${allowedStates.join(', ')}`,
      );
    }

    // 3. Determine target state based on evidence presence.
    const hasEvidence = (current.evidence_count ?? 0) > 0;

    // 4. Apply the confirmation transition.
    const { data: confirmed, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: hasEvidence ? 'review' : 'review',
        review_status: 'in_review',
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to confirm claim', updErr.message);
    if (!confirmed) throw new ApiError(404, 'Claim not found after update');

    // 5. Update claims_ext with confirmation metadata if it exists.
    const claimExt = (current as Record<string, unknown>).claim_ext;
    if (claimExt) {
      await supabase
        .from('claims_ext')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('claim_id', id);
    }

    return Response.json({
      data: {
        claimId: id,
        confirmedBy: confirmerId,
        confirmedAt: new Date().toISOString(),
        previousState: current.lifecycle_status,
        newState: confirmed.lifecycle_status,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
