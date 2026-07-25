// ==========================================================================
// KAD-009 — Passport API
// ==========================================================================
// GET  /api/v1/institutions/[id]/passport-entries — List passport entries
// POST /api/v1/institutions/[id]/passport-entries — Create entry
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreatePassportEntrySchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('passport_entries')
      .select('*, claim:claim_id(id, name, claim_type_id), shares:passport_shares(*)')
      .eq('organization_id', id)
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'Failed to fetch passport entries');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreatePassportEntrySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('passport_entries')
      .insert({ ...parsed.data, organization_id: id, title: parsed.data.title ?? 'Passport Entry' })
      .select('*, claim:claim_id(id, name, claim_type_id)')
      .single();
    if (error) throw new ApiError(500, 'Failed to create passport entry');
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
