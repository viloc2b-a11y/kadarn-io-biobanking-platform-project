import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { createCorrelationId } from '@/lib/exchange-helper'
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator'

/**
 * POST /api/v1/marketplace/feasibility
 * Create a new feasibility assessment request.
 */
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const orgId = user.user_metadata?.active_org_id as string | null
    const correlationId = createCorrelationId()

    if (!orgId) {
      throw new ApiError(400, 'No active organization selected')
    }

    const body = (await request.json()) as Record<string, unknown>
    const programName = typeof body.program_name === 'string' ? body.program_name : ''

    const payload = {
      created_by: user.id,
      organization_id: orgId,
      program_name: programName,
      program_description: body.program_description ?? null,
      program_type: body.program_type ?? null,
      therapeutic_area: body.therapeutic_area ?? null,
      disease_icd10: body.disease_icd10 ?? null,
      disease_label: body.disease_label ?? null,
      required_sample_types: body.required_sample_types ?? [],
      required_capabilities: body.required_capabilities ?? [],
      target_countries: body.target_countries ?? [],
      estimated_sample_count: body.estimated_sample_count ?? null,
      urgency: body.urgency ?? 'standard',
      dimensions: body.dimensions ?? ['capacity', 'quality', 'regulatory', 'cost', 'risk', 'timeline'],
      status: 'draft',
    }

    if (!programName.trim()) {
      throw new ApiError(400, 'Program name is required')
    }

    const { data, error } = await supabase
      .from('feasibility_assessments')
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to create feasibility assessment', error.message)
    }

    runPipeline(
      'feasibility',
      createPipelineContext({
        correlationId,
        actorId: user.id,
        organizationId: orgId,
      }),
      {
        assessmentId: data.id,
        programName,
        score: 0,
        title: programName,
        route: 'marketplace.feasibility',
      },
    )

    return Response.json({ data, error: null }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'marketplace.feasibility', 'kadarn.api.method': 'POST' } },
)

/**
 * GET /api/v1/marketplace/feasibility
 * List feasibility assessments for the current user's organization.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()
    const orgId = user.user_metadata?.active_org_id as string | null

    if (!orgId) {
      return Response.json({ data: [], error: null })
    }

    const { data, error } = await supabase
      .from('feasibility_assessments')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new ApiError(500, 'Failed to fetch feasibility assessments', error.message)
    }

    return Response.json({ data: data ?? [], error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
