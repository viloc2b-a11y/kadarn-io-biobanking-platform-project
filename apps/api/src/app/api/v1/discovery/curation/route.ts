// ==========================================================================
// Discovery Dashboard API — Curation
// ==========================================================================
// POST /api/v1/discovery/curation — Record a curation action
// GET  /api/v1/discovery/curation?runId=xxx — List curation events
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';

const VALID_ACTIONS = [
  'ACCEPT', 'REJECT', 'ENRICH', 'DEFER',
  'NEEDS_MORE_EVIDENCE', 'MERGE', 'SPLIT', 'ARCHIVE',
] as const;

const VALID_TARGET_TYPES = [
  'EVIDENCE_CANDIDATE', 'CLASSIFICATION', 'ENTITY',
  'RELATIONSHIP', 'SNAPSHOT_ITEM',
] as const;

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const runId = url.searchParams.get('runId');
    const targetType = url.searchParams.get('targetType');
    const targetId = url.searchParams.get('targetId');

    let query = supabase.from('discovery_curation_events').select('*');

    if (runId) query = query.eq('discovery_run_id', runId);
    if (targetType) query = query.eq('target_type', targetType);
    if (targetId) query = query.eq('target_id', targetId);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

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
      targetType: string;
      targetId: string;
      action: string;
      reason?: string;
      discoveryRunId: string;
      enrichmentPayload?: Record<string, unknown>;
    };

    if (!body.targetType || !body.targetId || !body.action || !body.discoveryRunId) {
      return Response.json(
        { data: null, error: 'Missing required fields: targetType, targetId, action, discoveryRunId' },
        { status: 400 },
      );
    }

    if (!VALID_ACTIONS.includes(body.action as typeof VALID_ACTIONS[number])) {
      return Response.json(
        { data: null, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_TARGET_TYPES.includes(body.targetType as typeof VALID_TARGET_TYPES[number])) {
      return Response.json(
        { data: null, error: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('discovery_curation_events')
      .insert({
        target_type: body.targetType,
        target_id: body.targetId,
        action: body.action,
        actor_id: user.id,
        actor_role: user.user_metadata?.kadarn_role ?? 'reviewer',
        reason: body.reason ?? null,
        enrichment_payload: body.enrichmentPayload ?? null,
        provenance_ref: `curation-${crypto.randomUUID()}`,
        discovery_run_id: body.discoveryRunId,
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data, error: null }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
