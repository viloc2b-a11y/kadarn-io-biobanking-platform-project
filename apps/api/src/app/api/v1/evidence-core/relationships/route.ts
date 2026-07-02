// ==========================================================================
// Evidence Core API — Evidence Relationships (Graph)
// ==========================================================================
// Baseline AF-1.0.
// POST /api/v1/evidence-core/relationships — Create relationship between evidence nodes
// GET  /api/v1/evidence-core/relationships — Query relationships for a claim or node
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { apiCreateRelationship } from '@kadarn/evidence-core';

const VALID_RELATIONSHIP_TYPES = ['supports', 'contradicts', 'corroborates', 'responds_to', 'supersedes'] as const;

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!body.sourceNodeId || !body.targetNodeId || !body.relationshipType) {
      return Response.json(
        { data: null, error: 'Missing required fields: sourceNodeId, targetNodeId, relationshipType' },
        { status: 400 },
      );
    }

    const relationshipType = body.relationshipType as string;
    if (!VALID_RELATIONSHIP_TYPES.includes(relationshipType as any)) {
      return Response.json(
        { data: null, error: `relationshipType must be one of: ${VALID_RELATIONSHIP_TYPES.join(', ')}` },
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

    const result = await apiCreateRelationship(supabase as any, ctx, {
      sourceNodeId: body.sourceNodeId as string,
      targetNodeId: body.targetNodeId as string,
      relationshipType: relationshipType as typeof VALID_RELATIONSHIP_TYPES[number],
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * GET /api/v1/evidence-core/relationships
 * Query relationships by claimId or evidenceNodeId.
 * Returns all relationships where the given claim or node participates.
 */
export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const claimId = url.searchParams.get('claimId');
    const evidenceNodeId = url.searchParams.get('evidenceNodeId');

    if (!claimId && !evidenceNodeId) {
      return Response.json(
        { data: null, error: 'Either claimId or evidenceNodeId query parameter is required' },
        { status: 400 },
      );
    }

    const organizationId = await requireValidatedActiveOrg(user);

    // For claimId: find all evidence nodes for the claim, then get relationships for those nodes.
    // For evidenceNodeId: get relationships where this node participates.
    let query = supabase
      .from('evidence_relationships')
      .select(`
        *,
        source_node:source_node_id(id, claim_id, evidence_class, status),
        target_node:target_node_id(id, claim_id, evidence_class, status)
      `);

    if (evidenceNodeId) {
      query = query.or(`source_node_id.eq.${evidenceNodeId},target_node_id.eq.${evidenceNodeId}`);
    } else if (claimId) {
      // First get evidence nodes for this claim, then get their relationships
      const { data: nodes } = await supabase
        .from('evidence_nodes')
        .select('id')
        .eq('claim_id', claimId);

      const nodeIds = (nodes ?? []).map((n: any) => n.id);
      if (nodeIds.length > 0) {
        query = query.or(nodeIds.map((id: string) => `source_node_id.eq.${id}`).join(','));
      } else {
        return Response.json({ data: [], error: null });
      }
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({ data: data ?? [], error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
