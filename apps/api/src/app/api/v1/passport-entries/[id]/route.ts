// ==========================================================================
// KAD-009 — Passport Entry + Share API
// ==========================================================================
// GET    /api/v1/passport-entries/[id] — Get entry with shares
// PATCH  /api/v1/passport-entries/[id] — Update/publish/archive
// POST   /api/v1/passport-entries/[id]/shares — Grant sponsor access
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { GrantPassportAccessSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('passport_entries').select('*, shares:passport_shares(*)').eq('id', id).single();
    if (!data) throw new ApiError(404, 'Passport entry not found');
    if (error) throw new ApiError(500, 'Failed to fetch');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (body.status === 'published') update.published_at = new Date().toISOString();
    if (body.status !== undefined) update.status = body.status;
    if (body.metadata !== undefined) update.metadata = body.metadata;
    if (body.title !== undefined) update.title = body.title;
    // Version bump on publish
    if (body.status === 'published') {
      const { data: current } = await supabase.from('passport_entries').select('version').eq('id', id).single();
      update.version = (current?.version ?? 0) + 1;
    }
    const { data, error } = await supabase.from('passport_entries').update(update).eq('id', id).select('*, shares:passport_shares(*)').single();
    if (!data) throw new ApiError(404, 'Passport entry not found');
    if (error) throw new ApiError(500, 'Failed to update');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user, params) => {
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
      expires_at: parsed.data.expires_at ?? null,
    }).select().single();
    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Access already granted to this sponsor');
      throw new ApiError(500, 'Failed to grant access');
    }
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
