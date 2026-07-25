// ==========================================================================
// KADARN v2 — Sprint 1: Source Records API
// ==========================================================================
// GET  /api/v1/evidence-sources/[id]/records — List records for a source
// POST /api/v1/evidence-sources/[id]/records — Create a record
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateSourceRecordSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('source_records')
      .select('*')
      .eq('evidence_source_id', id)
      .order('acquired_at', { ascending: false });
    if (error) throw new ApiError(500, 'Failed to fetch records');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateSourceRecordSchema.safeParse({ ...body, evidence_source_id: id });
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase.from('source_records').insert(parsed.data).select().single();
    if (error) throw new ApiError(500, 'Failed to create source record');
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
