// ==========================================================================
// Discovery Dashboard API — Session
// ==========================================================================
// GET  /api/v1/discovery/session?sessionId=xxx — Get or list sessions
// POST /api/v1/discovery/session — Open a discovery session
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      const { data, error } = await supabase
        .from('discovery_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return Response.json({ data, error: null });
    }

    const { data, error } = await supabase
      .from('discovery_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return Response.json({ data: data ?? [], error: null });
  } catch (err) {
    return handleApiError(err);
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);

    const { data, error } = await supabase
      .from('discovery_sessions')
      .insert({
        organization_id: organizationId,
        status: 'active',
        created_by: user.id,
        correlation_id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data, error: null }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
