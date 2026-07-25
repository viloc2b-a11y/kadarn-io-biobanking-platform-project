// ==========================================================================
// KAD-LOOP-003 — Claim Version Lineage API (Phase 9)
// ==========================================================================
// GET /api/v1/claims/[id]/versions — Full version lineage for a claim
// Returns all immutable ClaimVersion snapshots (ascending by version) plus
// the id of the current (non-superseded) version.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // 1. Verify the claim exists.
    const { data: claim, error: claimErr } = await supabase
      .from('claims')
      .select('id')
      .eq('id', id)
      .single();

    if (claimErr) {
      if (claimErr.code === 'PGRST116') throw new ApiError(404, 'Claim not found');
      throw new ApiError(500, 'Failed to fetch claim', claimErr.message);
    }
    if (!claim) throw new ApiError(404, 'Claim not found');

    // 2. Fetch all version summaries, ascending by version number.
    const { data: versions, error: verErr } = await supabase
      .from('claim_versions')
      .select(
        'id, claim_id, version, lifecycle_status, review_status, superseded_by, created_by_actor_id, created_at',
      )
      .eq('claim_id', id)
      .order('version', { ascending: true });

    if (verErr) {
      throw new ApiError(500, 'Failed to fetch claim versions', verErr.message);
    }

    const allVersions = versions ?? [];
    // The current version is the last one whose superseded_by is null.
    const current =
      allVersions.find((v) => v.superseded_by === null || v.superseded_by === undefined) ?? null;

    return Response.json({
      data: {
        claim_id: id,
        versions: allVersions,
        current_version_id: current?.id ?? null,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
