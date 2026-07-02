// ==========================================================================
// Evidence Core API — Claims
// ==========================================================================
// Baseline AF-1.0. Sprint 17.5.
// POST /api/v1/evidence-core/claims — Create a new Claim
// GET  /api/v1/evidence-core/claims — Query a Claim by ID
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { apiCreateClaim, apiGetClaim } from '@kadarn/evidence-core';

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    // Validate required fields
    if (!body.claimTypeId || !body.name || !body.description || !body.domain) {
      return Response.json(
        { data: null, error: 'Missing required fields: claimTypeId, name, description, domain' },
        { status: 400 },
      );
    }

    const validClasses = body.validEvidenceClasses as string[];
    if (!Array.isArray(validClasses) || validClasses.length === 0) {
      return Response.json(
        { data: null, error: 'At least one validEvidenceClass is required' },
        { status: 400 },
      );
    }

    // Organization ownership ALWAYS comes from the authenticated session,
    // never from client-supplied body fields (prevents cross-org IDOR).
    // requireValidatedActiveOrg confirms an active organization_memberships
    // row exists for this user, not just the JWT-cached active_org_id claim.
    const organizationId = await requireValidatedActiveOrg(user);

    const correlationId = crypto.randomUUID();
    const ctx = {
      actorId: user.id,
      organizationId,
      correlationId,
    };

    const result = await apiCreateClaim(supabase as any, ctx, {
      claimTypeId: body.claimTypeId as string,
      name: body.name as string,
      description: body.description as string,
      domain: body.domain as string,
      validEvidenceClasses: validClasses,
      requiredEvidenceClasses: (body.requiredEvidenceClasses as string[]) ?? [],
      decays: (body as any).decays ?? true,
      decayPeriodMonths: (body as any).decayPeriodMonths ?? null,
      visibilityScope: (body as any).visibilityScope ?? 'site',
      authorizedSponsorIds: (body as any).authorizedSponsorIds ?? [],
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
      return Response.json({ data: null, error: 'claimId query parameter is required' }, { status: 400 });
    }

    const organizationId = await requireValidatedActiveOrg(user);

    const ctx = {
      actorId: user.id,
      organizationId,
      correlationId: crypto.randomUUID(),
    };

    const result = await apiGetClaim(supabase as any, ctx, { claimId });

    if (result.error) {
      return Response.json(result, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
