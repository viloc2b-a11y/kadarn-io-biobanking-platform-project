// ==========================================================================
// KEMS Claim Lifecycle: Reconfirmation
// ==========================================================================
// POST /api/v1/claims/[id]/reconfirm
// Respond to a scheduled reconfirmation requirement for a claim.
// The responsible actor confirms the claim is still valid, updating
// review_due_at and recording the reconfirmation in the audit trail
// (claim_reconfirmations table).
//
// Body: { response: string }
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.object({
  response: z.string().min(1).max(2000),
});

export const POST = withAuth(async (request, user, params) => {
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

    const { response } = parsed.data;
    const supabase = createServiceClient();

    // 1. Read current claim.
    const { data: current, error: fetchErr } = await supabase
      .from('claims')
      .select('id, lifecycle_status, claim_ext:claims_ext(claim_id, review_due_at, claim_state)')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only non-terminal claims can be reconfirmed.
    const terminalStates = ['rejected', 'superseded', 'expired', 'archived'];
    if (terminalStates.includes(current.lifecycle_status)) {
      throw new ApiError(
        409,
        `Claim is ${current.lifecycle_status} and cannot be reconfirmed`,
      );
    }

    // 3. Create a reconfirmation record (audit trail).
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 12);

    const { error: recErr } = await supabase
      .from('claim_reconfirmations')
      .insert({
        claim_id: id,
        response: 'confirmed',
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        next_review_due: nextDue.toISOString(),
        notes: response,
      });

    if (recErr) {
      throw new ApiError(500, 'Failed to record reconfirmation', recErr.message);
    }

    // 4. Update claims_ext review_due_at if the extension exists.
    const claimExt = (current as Record<string, unknown>).claim_ext;
    if (claimExt) {
      await supabase
        .from('claims_ext')
        .update({
          review_due_at: nextDue.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('claim_id', id);
    }

    return Response.json({
      data: {
        claimId: id,
        reconfirmedBy: user.id,
        reconfirmedAt: new Date().toISOString(),
        nextReviewDue: nextDue.toISOString(),
        response,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
