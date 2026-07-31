// ==========================================================================
// KADARN v2 — Block 01-S: Source Intelligence — Sources API
// ==========================================================================
// GET  /api/v1/sources — List all evidence sources (with filters)
// POST /api/v1/sources — Create a new evidence source
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateEvidenceSourceSchema } from '@kadarn/types';

export const GET = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const authority = url.searchParams.get('authority');
    const active = url.searchParams.get('active');
    const institution = url.searchParams.get('institution_id');

    let query = supabase.from('evidence_sources').select('*').order('canonical_name');
    if (type) query = query.eq('source_type', type);
    if (authority) query = query.eq('authority_level', authority);
    if (active === 'true') query = query.eq('active', true);
    else if (active === 'false') query = query.eq('active', false);
    if (institution) query = query.eq('institution_id', institution);

    const { data, error } = await query;
    if (error) throw new ApiError(500, 'Failed to fetch sources');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateEvidenceSourceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from('evidence_sources')
      .insert(parsed.data)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A source with this name already exists');
      throw new ApiError(500, 'Failed to create source');
    }
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
