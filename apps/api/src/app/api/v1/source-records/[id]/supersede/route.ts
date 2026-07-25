// ==========================================================================
// KAD-LOOP-002 — Source Record Actions API
// ==========================================================================
// POST /api/v1/source-records/[id]/supersede   — Supersede a source record
// POST /api/v1/source-records/[id]/invalidate  — Invalidate a source record
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const supersedeSchema = z.object({
  superseded_by: z.string().uuid(),
  supersession_reason: z.string().min(1).max(500),
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = supersedeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('source_records')
      .update({
        superseded_by: parsed.data.superseded_by,
        supersession_reason: parsed.data.supersession_reason,
        invalidation_status: 'superseded',
        acquisition_status: 'superseded',
      })
      .eq('id', id)
      .select()
      .single();

    if (!data) throw new ApiError(404, 'Source record not found');
    if (error) throw new ApiError(500, `Failed to supersede: ${error.message}`);
    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
