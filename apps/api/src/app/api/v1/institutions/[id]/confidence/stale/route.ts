// ==========================================================================
// KAD-LOOP-004 — Institution Stale Assessments API (Phase 10)
// ==========================================================================
// GET /api/v1/institutions/[id]/confidence/stale — Get stale assessments for an institution
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const staleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── GET — stale assessments for an institution ────────────────────────────
export const GET = withAuth(async (request, _user, params) => {
  try {
    const { id: institutionId } = paramsSchema.parse(params);
    const url = new URL(request.url);
    const qp = Object.fromEntries(url.searchParams.entries());
    const parsed = staleQuerySchema.safeParse(qp);

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Verify the institution exists.
    const { data: institution, error: instErr } = await supabase
      .from('institutions')
      .select('id')
      .eq('id', institutionId)
      .single();

    if (instErr) {
      if (instErr.code === 'PGRST116') throw new ApiError(404, 'Institution not found');
      throw new ApiError(500, 'Failed to fetch institution', instErr.message);
    }
    if (!institution) throw new ApiError(404, 'Institution not found');

    const { page, limit } = parsed.data;
    const now = new Date().toISOString();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('confidence_assessments')
      .select(`
        *,
        capability:capability_id(id, name, status)
      `, { count: 'exact' })
      .eq('institution_id', institutionId)
      .eq('assessment_status', 'completed')
      .lt('stale_at', now)
      .order('stale_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, 'Failed to fetch stale assessments', error.message);

    return Response.json({
      data: {
        items: data ?? [],
        page,
        limit,
        total: count ?? 0,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
