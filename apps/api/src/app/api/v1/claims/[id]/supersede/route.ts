// ==========================================================================
// KAD-LOOP-003 — Claim Lifecycle: Supersede (Phase 9)
// ==========================================================================
// POST /api/v1/claims/[id]/supersede
// Marks a claim as superseded by a newer claim. Terminal state.
// Sets lifecycle_status='superseded', superseded_by=newClaimId,
//     supersession_reason=reason. Snapshots the superseded state.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.object({
  newClaimId: z.string().uuid(),
  reason: z.string().min(1).max(1000),
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

    const { newClaimId, reason } = parsed.data;
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

    // 2. Refuse to supersede an already-terminal claim.
    if (
      current.lifecycle_status === 'superseded' ||
      current.lifecycle_status === 'expired'
    ) {
      throw new ApiError(
        409,
        `Claim is already terminal (${current.lifecycle_status}); cannot supersede`,
      );
    }

    // 3. Verify the successor claim exists.
    const { data: successor, error: succErr } = await supabase
      .from('claims')
      .select('id')
      .eq('id', newClaimId)
      .single();

    if (succErr || !successor) {
      throw new ApiError(404, `Successor claim ${newClaimId} not found`);
    }

    // 4. Apply the supersession.
    const { data: superseded, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'superseded',
        superseded_by: newClaimId,
        supersession_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to supersede claim', updErr.message);
    if (!superseded) throw new ApiError(404, 'Claim not found');

    // 5. Snapshot the superseded state (best-effort).
    await supabase.from('claim_versions').insert({
      claim_id: superseded.id,
      version: superseded.version,
      claim_type_id: superseded.claim_type_id,
      name: superseded.name,
      description: superseded.description ?? null,
      organization_id: superseded.organization_id,
      location_id: superseded.location_id ?? null,
      person_id: superseded.person_id ?? null,
      claim_category: superseded.claim_category ?? null,
      claim_scope: superseded.claim_scope ?? null,
      priority: superseded.priority ?? 'medium',
      owner_id: superseded.owner_id ?? null,
      source_event_id: superseded.source_event_id ?? null,
      workflow_state: superseded.workflow_state,
      lifecycle_status: superseded.lifecycle_status,
      review_status: superseded.review_status,
      verification_status: superseded.verification_status ?? null,
      evidence_count: superseded.evidence_count ?? 0,
      expires_at: superseded.expires_at ?? null,
      superseded_by: superseded.superseded_by,
      supersession_reason: superseded.supersession_reason,
      tags: superseded.tags ?? null,
      created_by_actor_id: superseded.created_by_actor_id ?? null,
    });

    return Response.json({ data: superseded, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
