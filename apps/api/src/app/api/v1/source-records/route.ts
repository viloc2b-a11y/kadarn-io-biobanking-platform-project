// ==========================================================================
// KADARN v2 — Block 01-S: Source Intelligence — Source Records API
// ==========================================================================
// POST /api/v1/source-records — Create a new source record
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateSourceRecordSchema } from '@kadarn/types';

export const POST = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateSourceRecordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from('source_records')
      .insert(parsed.data)
      .select()
      .single();
    if (error) throw new ApiError(500, 'Failed to create source record');
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
