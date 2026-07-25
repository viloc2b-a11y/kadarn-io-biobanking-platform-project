// ==========================================================================
// KAD-010 — Share Grant Management API
// ==========================================================================
// POST   /api/v1/passport-entries/[id]/shares — Grant access
// GET    /api/v1/passport-entries/[id]/shares — List shares
// DELETE /api/v1/shares/[id] — Revoke access
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { GrantPassportAccessSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('passport_shares').select('*').eq('passport_entry_id', id).order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'Failed to fetch shares');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = GrantPassportAccessSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase.from('passport_shares').insert({
      passport_entry_id: id,
      sponsor_organization_id: parsed.data.sponsor_organization_id,
      access_level: parsed.data.access_level,
      expires_at: parsed.data.expires_at ?? null,
      granted_by: user.id,
    }).select().single();
    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Access already granted to this sponsor');
      throw new ApiError(500, 'Failed to grant access');
    }
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
