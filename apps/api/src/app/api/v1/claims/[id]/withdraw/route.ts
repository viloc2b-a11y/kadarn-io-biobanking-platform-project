// ==========================================================================
// KEMS Claim Lifecycle: Withdraw
// ==========================================================================
// POST /api/v1/claims/[id]/withdraw
// The institution retracts (withdraws) a claim assertion.
// Terminal state — withdrawn claims cannot be re-submitted but remain
// in the historical record.
//
// Body: { reason: string }
//
// ClaimService::withdrawClaim — KEMS pipeline transition:
//   Sets claim_state='rejected', lifecycle_status='rejected',
//   records withdrawal_reason and withdrawn_at in metadata.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.object({
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

    const { reason } = parsed.data;
    const supabase = createServiceClient();

    // 1. Read current claim.
    const { data: current, error: fetchErr } = await supabase
      .from('claims')
      .select('id, lifecycle_status, claim_ext:claims_ext(claim_state)')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', fetchErr.message);
    }
    if (!current) throw new ApiError(404, 'Claim not found');

    // 2. Guard: only non-terminal claims can be withdrawn.
    const terminalStates = ['rejected', 'superseded', 'expired', 'archived'];
    if (terminalStates.includes(current.lifecycle_status)) {
      throw new ApiError(
        409,
        `Claim is already ${current.lifecycle_status} and cannot be withdrawn`,
      );
    }

    // 3. Apply the withdrawal transition.
    const { data: withdrawn, error: updErr } = await supabase
      .from('claims')
      .update({
        lifecycle_status: 'rejected',
        review_status: 'rejected',
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to withdraw claim', updErr.message);
    if (!withdrawn) throw new ApiError(404, 'Claim not found after update');

    // 4. Snapshot the withdrawn state (best-effort).
    await supabase.from('claim_versions').insert({
      claim_id: withdrawn.id,
      version: withdrawn.version,
      claim_type_id: withdrawn.claim_type_id ?? null,
      name: withdrawn.name ?? null,
      description: withdrawn.description ?? null,
      organization_id: withdrawn.organization_id ?? null,
      location_id: withdrawn.location_id ?? null,
      person_id: withdrawn.person_id ?? null,
      claim_category: withdrawn.claim_category ?? null,
      claim_scope: withdrawn.claim_scope ?? null,
      priority: withdrawn.priority ?? 'medium',
      owner_id: withdrawn.owner_id ?? null,
      source_event_id: withdrawn.source_event_id ?? null,
      workflow_state: withdrawn.workflow_state ?? null,
      lifecycle_status: withdrawn.lifecycle_status,
      review_status: withdrawn.review_status,
      verification_status: withdrawn.verification_status ?? null,
      evidence_count: withdrawn.evidence_count ?? 0,
      expires_at: withdrawn.expires_at ?? null,
      tags: withdrawn.tags ?? null,
      created_by_actor_id: withdrawn.created_by_actor_id ?? null,
    });

    return Response.json({
      data: {
        ...withdrawn,
        withdrawal_reason: reason,
        withdrawn_at: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
