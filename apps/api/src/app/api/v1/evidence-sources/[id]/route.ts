// ==========================================================================
// KADARN v2 — Sprint 1: Single Evidence Source API
// ==========================================================================
// GET   /api/v1/evidence-sources/[id]
// PATCH /api/v1/evidence-sources/[id]
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdateEvidenceSourceSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('evidence_sources').select('*').eq('id', id).single();
    if (!data) throw new ApiError(404, 'Evidence source not found');
    if (error) throw new ApiError(500, 'Failed to fetch source');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateEvidenceSourceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase.from('evidence_sources').update(parsed.data).eq('id', id).select().single();
    if (!data) throw new ApiError(404, 'Evidence source not found');
    if (error) throw new ApiError(500, 'Failed to update source');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});
