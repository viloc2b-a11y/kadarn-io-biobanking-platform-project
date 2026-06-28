import { withAuth, ApiError } from '@/lib/supabase-server';
import { createOrganizationSchema, paginationSchema } from '@/lib/validation';
import {
  withPolicyShadow,
  createOpaClient,
  loadConfig,
  DEFAULT_POLICIES,
} from '@kadarn/policy-engine';
import {
  withAsyncTracing,
  SPAN_API_REQUEST,
  SPAN_POLICY_EVALUATION,
} from '@kadarn/telemetry';
import {
  emitOrganizationCreated,
  recordOrganizationProvenance,
  evaluateCreateOrgPolicy,
  createCorrelationId,
} from '@/lib/onboarding';

const _opaConfig = loadConfig();
const _opaClient = createOpaClient(_opaConfig.opaShadowMode ? DEFAULT_POLICIES : []);

export const GET = withPolicyShadow(
  withAsyncTracing(
    withAuth(async (request, user) => {
      const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
      const url = new URL(request.url);
      const { limit, offset } = paginationSchema.parse({
        limit: url.searchParams.get('limit'),
        offset: url.searchParams.get('offset'),
      });

      const { data, error, count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);

      if (error) throw new ApiError(500, 'Failed to fetch organizations', error.message);

      return Response.json({
        data: data ?? [],
        pagination: { total: count ?? 0, limit, offset },
      });
    }),
    SPAN_API_REQUEST,
    {
      attributes: {
        'kadarn.api.route': 'organizations',
        'kadarn.api.method': 'GET',
      },
    },
  ),
  {
    config: _opaConfig,
    opaClient: _opaClient,
    policies: DEFAULT_POLICIES,
  },
);

export const POST = withAuth(async (request, user) => {
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const body = (await request.json()) as Record<string, unknown>;
  const correlationId = createCorrelationId();

  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation
    if (error.code === '23505') {
      throw new ApiError(409, 'An organization with this name already exists in this country');
    }
    throw new ApiError(500, 'Failed to create organization', error.message);
  }

  // Auto-create organization membership for the creator as admin
  const now = new Date().toISOString()
  const { error: membershipError } = await supabase
    .from('organization_memberships')
    .insert({
      organization_id: data.id,
      user_id: user.id,
      status: 'active',
      invited_by: user.id,
      invited_at: now,
      joined_at: now,
    })

  if (membershipError) {
    // Log but don't fail — org was created, membership can be retried
    console.error('Failed to create membership for org creator:', membershipError.message)
  }

  // ── Cross-engine hooks (fire-and-forget — never block response) ────────
  // Policy shadow check
  evaluateCreateOrgPolicy(
    user.id,
    (user.user_metadata?.kadarn_role as string) ?? 'marketplace_user',
    data.id,
    correlationId,
  ).catch((err: unknown) => {
    console.error('[ONBOARDING] Policy check failed:', err);
  });

  // Provenance recording
  recordOrganizationProvenance({
    id: data.id,
    name: data.name,
    country: data.country,
    created_at: data.created_at,
  }, correlationId).catch((err: unknown) => {
    console.error('[ONBOARDING] Provenance recording failed:', err);
  });

  // Domain event emission
  emitOrganizationCreated(
    { id: data.id, name: data.name, country: data.country },
    user.id,
    correlationId,
  );

  return Response.json({ data }, { status: 201 });
});
