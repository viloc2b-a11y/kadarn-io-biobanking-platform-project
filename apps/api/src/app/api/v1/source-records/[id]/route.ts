// ==========================================================================
// KADARN v2 — Sprint 1: Single Source Record API
// ==========================================================================
// GET /api/v1/source-records/[id]
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('source_records')
      .select('*, evidence_source:evidence_source_id(id, canonical_name, authority_level, source_type)')
      .eq('id', id)
      .single();
    if (!data) throw new ApiError(404, 'Source record not found');
    if (error) throw new ApiError(500, 'Failed to fetch record');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});
