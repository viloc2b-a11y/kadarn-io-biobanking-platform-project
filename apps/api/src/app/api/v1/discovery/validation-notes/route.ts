// ==========================================================================
// Discovery Dashboard API — Validation Notes
// ==========================================================================
// GET  /api/v1/discovery/validation-notes?sessionId=xxx — List notes
// POST /api/v1/discovery/validation-notes — Record a validation note
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';

const VALID_CATEGORIES = [
  'GOT_RIGHT', 'MISSED', 'FALSE_POSITIVE', 'FALSE_NEGATIVE',
  'SURPRISING', 'DOCUMENT_TO_REQUEST', 'USER_REACTION', 'TTFV', 'GENERAL',
] as const;

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { data: null, error: 'sessionId query parameter is required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('discovery_validation_notes')
      .select('*')
      .eq('discovery_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return Response.json({ data: data ?? [], error: null });
  } catch (err) {
    return handleApiError(err);
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    await requireValidatedActiveOrg(user);
    const body = await request.json() as {
      discoverySessionId: string;
      discoveryRunId?: string;
      category: string;
      note: string;
      targetType?: string;
      targetId?: string;
    };

    if (!body.discoverySessionId || !body.category || !body.note) {
      return Response.json(
        { data: null, error: 'Missing required fields: discoverySessionId, category, note' },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
      return Response.json(
        { data: null, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('discovery_validation_notes')
      .insert({
        discovery_session_id: body.discoverySessionId,
        discovery_run_id: body.discoveryRunId ?? null,
        author_id: user.id,
        category: body.category,
        note: body.note,
        target_type: body.targetType ?? null,
        target_id: body.targetId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data, error: null }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
