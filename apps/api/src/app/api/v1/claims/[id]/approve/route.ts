// ==========================================================================
// KAD-LOOP-003 — Claim Lifecycle: Approve (Phase 9)
// ==========================================================================
// POST /api/v1/claims/[id]/approve
// Approves a claim that is currently under review.
// Sets lifecycle_status='approved', review_status='approved',
//     workflow_state='published', and creates a new immutable version
//     snapshot to freeze the approved content.
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

    // 2. Guard: only claims under review can be approved.
    if (current.lifecycle_status !== 'review') {
      throw new ApiError(
        409,
        `Claim cannot be approved from lifecycle_status=${current.lifecycle_status}; must be 'review'`,
      );
    }

    // 3. Apply the approval transition on the mutable row.
    const { data: approved, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'approved',
        review_status: 'approved',
        workflow_state: 'published',
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to approve claim', updErr.message);
    if (!approved) throw new ApiError(404, 'Claim not found');

    // 4. Create an immutable version snapshot capturing the approved state.
    await supabase.from('claim_versions').insert({
      claim_id: approved.id,
      version: approved.version,
      claim_type_id: approved.claim_type_id,
      name: approved.name,
      description: approved.description ?? null,
      organization_id: approved.organization_id,
      location_id: approved.location_id ?? null,
      person_id: approved.person_id ?? null,
      claim_category: approved.claim_category ?? null,
      claim_scope: approved.claim_scope ?? null,
      priority: approved.priority ?? 'medium',
      owner_id: approved.owner_id ?? null,
      source_event_id: approved.source_event_id ?? null,
      workflow_state: approved.workflow_state,
      lifecycle_status: approved.lifecycle_status,
      review_status: approved.review_status,
      verification_status: approved.verification_status ?? null,
      evidence_count: approved.evidence_count ?? 0,
      expires_at: approved.expires_at ?? null,
      tags: approved.tags ?? null,
      created_by_actor_id: approved.created_by_actor_id ?? null,
    });

    return Response.json({ data: approved, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
