// ==========================================================================
// Feasibility Engine API
// ==========================================================================

import { withAuth, ApiError, createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { paginationSchema } from '@/lib/validation';

const createAssessmentSchema = z.object({
  program_name: z.string().min(1).max(200),
  program_description: z.string().max(5000).optional(),
  program_type: z.string().optional(),
  therapeutic_area: z.string().optional(),
  disease_icd10: z.string().optional(),
  disease_label: z.string().optional(),
  required_sample_types: z.array(z.string()).optional(),
  required_capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  target_countries: z.array(z.string()).optional(),
  estimated_sample_count: z.number().int().positive().optional(),
  urgency: z.enum(['standard', 'fast', 'flexible']).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/feasibility — Create and run an assessment
// ---------------------------------------------------------------------------
export const POST = withAuth(async (request, user) => {
  const supabase = await createRouteClient();
  const body = (await request.json()) as Record<string, unknown>;

  const parsed = createAssessmentSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);
  }

  // Get user's active organization
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  if (!memberships || memberships.length === 0) {
    throw new ApiError(400, 'You must belong to an active organization to run feasibility assessments');
  }

  const organizationId = memberships[0].organization_id;

  // Create the assessment
  const { data: assessment, error: createError } = await supabase
    .from('feasibility_assessments')
    .insert({
      created_by: user.id,
      organization_id: organizationId,
      program_name: parsed.data.program_name,
      program_description: parsed.data.program_description,
      program_type: parsed.data.program_type,
      therapeutic_area: parsed.data.therapeutic_area,
      disease_icd10: parsed.data.disease_icd10,
      disease_label: parsed.data.disease_label,
      required_sample_types: parsed.data.required_sample_types ?? [],
      required_capabilities: parsed.data.required_capabilities,
      target_countries: parsed.data.target_countries ?? [],
      estimated_sample_count: parsed.data.estimated_sample_count,
      urgency: parsed.data.urgency ?? 'standard',
      status: 'pending',
    })
    .select()
    .single();

  if (createError) throw new ApiError(500, 'Failed to create assessment', createError.message);

  // Run the scoring
  const { error: runError } = await supabase.rpc('run_feasibility_assessment', {
    p_assessment_id: assessment.id,
  });

  if (runError) {
    // Mark as failed
    await supabase.from('feasibility_assessments')
      .update({ status: 'failed', summary: runError.message })
      .eq('id', assessment.id);
    throw new ApiError(500, 'Assessment scoring failed', runError.message);
  }

  // Fetch completed assessment with scores
  const { data: completed } = await supabase
    .from('feasibility_assessments')
    .select('*')
    .eq('id', assessment.id)
    .single();

  const { data: scores } = await supabase
    .from('feasibility_scores')
    .select('*')
    .eq('assessment_id', assessment.id)
    .order('overall_score', { ascending: false });

  return Response.json({
    data: {
      assessment: completed,
      scores: scores ?? [],
    },
  }, { status: 201 });
});

// ---------------------------------------------------------------------------
// GET /api/feasibility — List assessments
// ---------------------------------------------------------------------------
export const GET = withAuth(async (request, user) => {
  const supabase = await createRouteClient();
  const url = new URL(request.url);
  const { limit, offset } = paginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  });

  const { data, error, count } = await supabase
    .from('feasibility_assessments')
    .select('*', { count: 'exact' })
    .eq('created_by', user.id)
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, 'Failed to fetch assessments', error.message);

  return Response.json({
    data: data ?? [],
    pagination: { total: count ?? 0, limit, offset },
  });
});
