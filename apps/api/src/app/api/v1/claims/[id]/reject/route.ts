// ==========================================================================
// KAD-LOOP-003 — Claim Lifecycle: Reject (Phase 9)
// ==========================================================================
// POST /api/v1/claims/[id]/reject
// Rejects a claim that is currently under review. Terminal state.
// Sets lifecycle_status='rejected', review_status='rejected', and creates
// a new immutable version snapshot recording the rejection.
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
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only claims under review can be rejected.
    if (current.lifecycle_status !== 'review') {
      throw new ApiError(
        409,
        `Claim cannot be rejected from lifecycle_status=${current.lifecycle_status}; must be 'review'`,
      );
    }

    // 3. Apply the rejection transition.
    const { data: rejected, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'rejected',
        review_status: 'rejected',
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to reject claim', updErr.message);
    if (!rejected) throw new ApiError(404, 'Claim not found');

    // 4. Snapshot the rejected state.
    await supabase.from('claim_versions').insert({
      claim_id: rejected.id,
      version: rejected.version,
      claim_type_id: rejected.claim_type_id,
      name: rejected.name,
      description: rejected.description ?? null,
      organization_id: rejected.organization_id,
      location_id: rejected.location_id ?? null,
      person_id: rejected.person_id ?? null,
      claim_category: rejected.claim_category ?? null,
      claim_scope: rejected.claim_scope ?? null,
      priority: rejected.priority ?? 'medium',
      owner_id: rejected.owner_id ?? null,
      source_event_id: rejected.source_event_id ?? null,
      workflow_state: rejected.workflow_state,
      lifecycle_status: rejected.lifecycle_status,
      review_status: rejected.review_status,
      verification_status: rejected.verification_status ?? null,
      evidence_count: rejected.evidence_count ?? 0,
      expires_at: rejected.expires_at ?? null,
      tags: rejected.tags ?? null,
      created_by_actor_id: rejected.created_by_actor_id ?? null,
    });

    return Response.json({ data: rejected, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
