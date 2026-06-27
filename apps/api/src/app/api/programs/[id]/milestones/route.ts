// ==========================================================================
// Program Engine API — Milestones
// ==========================================================================

import { withAuth, ApiError, createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';

const createMilestoneSchema = z.object({
  milestone_type: z.enum(['program_definition', 'site_selection', 'irb_submission', 'irb_approval', 'mta_execution', 'collection_start', 'collection_complete', 'processing_start', 'processing_complete', 'qc_review', 'data_delivery', 'program_close']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  assigned_org_id: z.string().uuid().optional(),
});

// GET /api/programs/:id/milestones
export const GET = withAuth(async (_request, _user, params) => {
  const supabase = await createRouteClient();
  const { id } = params!;

  const { data, error } = await supabase
    .from('program_milestones')
    .select('*')
    .eq('program_id', id);

  if (error) throw new ApiError(500, 'Failed to fetch milestones', error.message);
  return Response.json({ data: data ?? [] });
});

// POST /api/programs/:id/milestones
export const POST = withAuth(async (request, user, params) => {
  const supabase = await createRouteClient();
  const { id } = params!;
  const body = await request.json();
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);

  const { data, error } = await supabase
    .from('program_milestones')
    .insert({
      program_id: id,
      milestone_type: parsed.data.milestone_type,
      title: parsed.data.title,
      description: parsed.data.description,
      planned_start_date: parsed.data.planned_start_date,
      planned_end_date: parsed.data.planned_end_date,
      assigned_org_id: parsed.data.assigned_org_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Failed to create milestone', error.message);
  return Response.json({ data }, { status: 201 });
});
