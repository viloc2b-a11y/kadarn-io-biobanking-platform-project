// ==========================================================================
// Evidence Core API — Evidence Nodes
// ==========================================================================
// Baseline AF-1.0.
// POST /api/v1/evidence-core/evidence — Submit evidence to a Claim
// GET  /api/v1/evidence-core/evidence — List evidence for a Claim
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { apiSubmitEvidence, apiGetClaimEvidence } from '@kadarn/evidence-core';

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!body.claimId || !body.content || !body.source || !body.date) {
      return Response.json(
        { data: null, error: 'Missing required fields: claimId, content, source, date' },
        { status: 400 },
      );
    }

    const evidenceClass = body.evidenceClass as string;
    const VALID_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (!evidenceClass || !VALID_CLASSES.includes(evidenceClass)) {
      return Response.json(
        { data: null, error: `evidenceClass must be one of: ${VALID_CLASSES.join(', ')}` },
        { status: 400 },
      );
    }

    const weight = Number(body.weight ?? 1);
    if (isNaN(weight) || weight < 0) {
      return Response.json(
        { data: null, error: 'weight must be a non-negative number' },
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

    const result = await apiSubmitEvidence(supabase as any, ctx, {
      claimId: body.claimId as string,
      evidenceClass,
      content: body.content as string,
      source: body.source as string,
      date: body.date as string,
      weight,
      authorizedSponsorIds: (body.authorizedSponsorIds as string[]) ?? [],
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const claimId = url.searchParams.get('claimId');

    if (!claimId) {
      return Response.json(
        { data: null, error: 'claimId query parameter is required' },
        { status: 400 },
      );
    }

    const organizationId = await requireValidatedActiveOrg(user);

    const ctx = {
      actorId: user.id,
      organizationId,
      correlationId: crypto.randomUUID(),
    };

    const result = await apiGetClaimEvidence(supabase as any, ctx, { claimId });

    if (result.error) {
      return Response.json(result, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
