// ==========================================================================
// KAD-010 — Share Revocation + Public Access
// ==========================================================================
// DELETE /api/v1/shares/[id] — Revoke access
// GET    /api/v1/public/passport/[token] — Sponsor public access
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const DELETE = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('passport_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!data) throw new ApiError(404, 'Share not found');
    if (error) throw new ApiError(500, 'Failed to revoke access');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});
