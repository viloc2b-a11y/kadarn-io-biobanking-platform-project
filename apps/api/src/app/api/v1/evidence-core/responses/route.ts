// ==========================================================================
// Evidence Core API — Right of Response
// ==========================================================================
// Baseline AF-1.0.
// POST /api/v1/evidence-core/responses — Submit a right of response to counter-evidence
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { apiSubmitResponse } from '@kadarn/evidence-core';

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!body.counterEvidenceId || !body.description || !body.resolutionDate) {
      return Response.json(
        {
          data: null,
          error: 'Missing required fields: counterEvidenceId, description, resolutionDate',
        },
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

    const result = await apiSubmitResponse(supabase as any, ctx, {
      counterEvidenceId: body.counterEvidenceId as string,
      description: body.description as string,
      resolutionDate: body.resolutionDate as string,
      supportingEvidenceIds: (body.supportingEvidenceIds as string[]) ?? [],
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
