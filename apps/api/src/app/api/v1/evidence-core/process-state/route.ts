// ==========================================================================
// Evidence Core API — Process State
// ==========================================================================
// Baseline AF-1.0.
// POST /api/v1/evidence-core/process-state — Update lifecycle state of a claim, evidence node, or right of response
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { apiUpdateProcessState } from '@kadarn/evidence-core';

const VALID_ENTITY_TYPES = ['claim', 'evidence_node', 'right_of_response'] as const;

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!body.entityType || !body.entityId || !body.newStatus) {
      return Response.json(
        { data: null, error: 'Missing required fields: entityType, entityId, newStatus' },
        { status: 400 },
      );
    }

    const entityType = body.entityType as string;
    if (!VALID_ENTITY_TYPES.includes(entityType as any)) {
      return Response.json(
        { data: null, error: `entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const organizationId = await requireValidatedActiveOrg(user);

    const correlationId = crypto.randomUUID();
    const ctx = {
      actorId: user.id,
      organizationId,
      correlationId,
    };

    const result = await apiUpdateProcessState(supabase as any, ctx, {
      entityType: entityType as typeof VALID_ENTITY_TYPES[number],
      entityId: body.entityId as string,
      newStatus: body.newStatus as string,
      reason: (body.reason as string) ?? '',
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});
