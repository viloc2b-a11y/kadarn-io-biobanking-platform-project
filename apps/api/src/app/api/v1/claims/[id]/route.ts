// ==========================================================================
// KAD-LOOP-003 — Single Claim API (Phase 9)
// ==========================================================================
// GET   /api/v1/claims/[id]  — Get a single claim
// PATCH /api/v1/claims/[id]  — Update a claim (versioned)
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { UpdateClaimSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — single claim ───────────────────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', error.message);
    }
    if (!data) throw new ApiError(404, 'Claim not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── PATCH — update claim (versioned) ─────────────────────────────────────
export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateClaimSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // 1. Read the current claim row.
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

    // 2. Approved claims are immutable — must use supersede instead.
    if (current.lifecycle_status === 'approved') {
      throw new ApiError(
        409,
        'Claim is approved and immutable; use the supersede endpoint to create a new version',
      );
    }

    // 3. Snapshot the current state into claim_versions (version = current.version).
    const snapshotVersion = current.version;
    await supabase.from('claim_versions').insert({
      claim_id: current.id,
      version: snapshotVersion,
      claim_type_id: current.claim_type_id,
      name: current.name,
      description: current.description ?? null,
      organization_id: current.organization_id,
      location_id: current.location_id ?? null,
      person_id: current.person_id ?? null,
      claim_category: current.claim_category ?? null,
      claim_scope: current.claim_scope ?? null,
      priority: current.priority ?? 'medium',
      owner_id: current.owner_id ?? null,
      source_event_id: current.source_event_id ?? null,
      workflow_state: current.workflow_state,
      lifecycle_status: current.lifecycle_status,
      review_status: current.review_status,
      verification_status: current.verification_status ?? null,
      evidence_count: current.evidence_count ?? 0,
      expires_at: current.expires_at ?? null,
      tags: current.tags ?? null,
      created_by_actor_id: current.created_by_actor_id ?? null,
    });

    // 4. Apply the patch + bump version.
    const { data: updated, error: updErr } = await supabase
      .from('claims')
      .update({
        ...parsed.data,
        version: snapshotVersion + 1,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to update claim', updErr.message);
    if (!updated) throw new ApiError(404, 'Claim not found');

    return Response.json({ data: updated, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
