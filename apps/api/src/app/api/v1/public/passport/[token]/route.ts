// ==========================================================================
// KAD-010 — Public Passport Access (no auth required)
// ==========================================================================
// GET /api/v1/public/passport/[token] — View shared passport entry
// No auth required — access is gated by valid access token
// ==========================================================================

import { createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ token: z.string().uuid() });

export const GET = async (request: Request, { params }: { params: Promise<Record<string, string>> }) => {
  try {
    const { token } = paramsSchema.parse(await params);
    const supabase = await createRouteClient();

    const { data: share, error: shareError } = await supabase
      .from('passport_shares')
      .select('*, passport_entry:passport_entry_id(*)')
      .eq('access_token', token)
      .is('revoked_at', null)
      .single();

    if (shareError || !share) {
      return Response.json({ data: null, error: 'Access token invalid or revoked' }, { status: 404 });
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return Response.json({ data: null, error: 'Access has expired' }, { status: 410 });
    }

    return Response.json({
      data: {
        passport_entry: share.passport_entry,
        sponsor_organization_id: share.sponsor_organization_id,
        access_level: share.access_level,
        granted_at: share.granted_at,
        expires_at: share.expires_at,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return Response.json({ data: null, error: message }, { status: 500 });
  }
};
