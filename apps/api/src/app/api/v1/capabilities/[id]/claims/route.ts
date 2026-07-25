// ==========================================================================
// KAD-LOOP-003 — Capability Linked Claims API (Phase 9)
// ==========================================================================
// GET /api/v1/capabilities/[id]/claims — Get a capability with its linked
//                                         claims (M2M via capability_claims)
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ─── GET — capability with linked claims ──────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // 1. Fetch the capability.
    const { data: capability, error: capErr } = await supabase
      .from('capabilities')
      .select('*')
      .eq('id', id)
      .single();

    if (capErr) {
      if (capErr.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to fetch capability', capErr.message);
    }
    if (!capability) throw new ApiError(404, 'Capability not found');

    // 2. Fetch the M2M claim links (join rows in capability_claims).
    const { data: claimLinks, error: linkErr } = await supabase
      .from('capability_claims')
      .select('*, claim:claim_id(*)')
      .eq('capability_id', id)
      .order('created_at', { ascending: true });

    if (linkErr) {
      throw new ApiError(500, 'Failed to fetch claim links', linkErr.message);
    }

    return Response.json({
      data: {
        capability,
        claimLinks: claimLinks ?? [],
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
